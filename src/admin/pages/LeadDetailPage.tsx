import React, { useState, useEffect } from 'react';
import { useLeads, useDiagnostic, type Lead, type SentHistoryItem } from '../hooks/useFirestore';
import GeoScoreGauge from '../components/GeoScoreGauge';
import { AuditAndScreenshotsPanel } from '../components/AuditAndScreenshotsPanel';
import StatusBadge from '../components/StatusBadge';
import {
  IconCheck, IconX, IconWarning, IconEdit, IconTrash, IconPlay, IconStar,
  IconShield, IconFolder, IconClipboard, IconChat, IconBot, IconHourglass,
  IconSend, IconChevron, IconSparkles, IconLock, IconTarget, IconMail
} from '../components/icons';
import { getAuth } from 'firebase/auth';

interface LeadDetailPageProps {
  leadId: string;
  onNavigate: (page: string, id?: string) => void;
}

type TabType = 'search_terms' | 'diagnostic' | 'outreach' | 'contact_notes';
type CopyFramework = 'PAS' | 'BAB' | 'PASTOR' | 'QUEST' | '4Ps' | 'FAB' | 'ACCA' | '4Us' | 'Falsa Lógica';

export default function LeadDetailPage({ leadId, onNavigate }: LeadDetailPageProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('search_terms');

  // Search terms management state
  const [terms, setTerms] = useState<string[]>(Array(14).fill(''));
  const [analyzingTerms, setAnalyzingTerms] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  // Diagnostic hooks & state
  const { runDiagnostic: triggerDiagnostic } = useLeads();
  const { diagnostic: hookDiagnostic, fetchDiagnostic } = useDiagnostic(leadId);
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [htmlPreviewUrl, setHtmlPreviewUrl] = useState<string | null>(null);

  // Outreach state
  const [copyTab, setCopyTab] = useState<CopyFramework>('PAS');
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [editedEmailText, setEditedEmailText] = useState('');
  const [editedLinkedinText, setEditedLinkedinText] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [attachReportLink, setAttachReportLink] = useState(true);

  // Toast state
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const getAdminToken = async () => {
    const auth = getAuth();
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  const fetchLeadDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAdminToken();
      const res = await fetch('/api/admin/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Falha ao carregar lista de leads');
      const data = await res.json();
      const found = (data.leads || []).find((l: Lead) => l.id === leadId);
      if (found) {
        setLead(found);
        if (found.searchTerms && found.searchTerms.length > 0) {
          const filled = [...found.searchTerms];
          while (filled.length < 14) filled.push('');
          setTerms(filled.slice(0, 14));
        }
        if (found.outreachCopies && found.outreachCopies[copyTab]) {
          setEditedEmailText(found.outreachCopies[copyTab]);
        }
      } else {
        setError('Lead não encontrado.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch diagnostic details if available
  const fetchDiagnosticReport = async (diagId: string) => {
    try {
      const token = await getAdminToken();
      const res = await fetch(`/api/admin/diagnostic/${diagId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnosticData(data.report || data);
      }
    } catch (e) {
      console.error('Erro ao carregar relatório de diagnóstico:', e);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [leadId]);

  useEffect(() => {
    if (lead?.diagnosticId) {
      fetchDiagnosticReport(lead.diagnosticId);
    }
  }, [lead?.diagnosticId]);

  // Sync copy texts when framework changes
  useEffect(() => {
    if (lead?.outreachCopies) {
      setEditedEmailText(lead.outreachCopies[copyTab] || '');
      setEditedLinkedinText(lead.outreachCopies[`${copyTab}_linkedin`] || lead.outreachCopies[copyTab] || '');
    }
  }, [copyTab, lead?.outreachCopies]);

  // Analyze Search Terms via AI
  const handleAnalyzeTerms = async () => {
    if (!lead) return;
    setAnalyzingTerms(true);
    setTermsError(null);
    try {
      const token = await getAdminToken();
      const res = await fetch(`/api/admin/leads/${lead.id}/analyze-search-terms`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao analisar termos');
      
      const newTerms = data.searchTerms || [];
      while (newTerms.length < 14) newTerms.push('');
      setTerms(newTerms.slice(0, 14));
      
      setLead(prev => prev ? {
        ...prev,
        searchTerms: data.searchTerms,
        searchTermsStatus: 'generated',
        companyOverview: data.companyOverview,
        searchTermsAnalyzedAt: data.searchTermsAnalyzedAt,
      } : null);

      showToast('✨ 14 Termos de Pesquisa gerados com sucesso!');
    } catch (err: any) {
      setTermsError(err.message);
    } finally {
      setAnalyzingTerms(false);
    }
  };

  // Save & Approve Search Terms
  const handleSaveTerms = async () => {
    if (!lead) return;
    const cleanTerms = terms.map(t => t.trim()).filter(Boolean);
    if (cleanTerms.length < 10) {
      setTermsError('Preencha ao menos 10 termos de pesquisa antes de aprovar.');
      return;
    }
    setSavingTerms(true);
    setTermsError(null);
    try {
      const token = await getAdminToken();
      const res = await fetch(`/api/admin/leads/${lead.id}/save-search-terms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ searchTerms: cleanTerms })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar termos');

      setLead(prev => prev ? {
        ...prev,
        searchTerms: cleanTerms,
        searchTermsStatus: 'approved',
      } : null);

      showToast('✅ Termos de Pesquisa APROVADOS! Diagnóstico destravado.');
    } catch (err: any) {
      setTermsError(err.message);
    } finally {
      setSavingTerms(false);
    }
  };

  // Run Full Diagnostic Engine
  const handleRunDiagnostic = async () => {
    if (!lead) return;
    if (lead.searchTermsStatus !== 'approved') {
      showToast('⚠️ É necessário aprovar os Termos de Pesquisa antes de rodar o diagnóstico!');
      setActiveTab('search_terms');
      return;
    }

    setRunningDiagnostic(true);
    try {
      await triggerDiagnostic(lead.id);
      showToast('🚀 Diagnóstico de 8 Agentes iniciado em segundo plano!');
      setTimeout(() => {
        fetchLeadDetails();
        fetchDiagnostic();
        setRunningDiagnostic(false);
      }, 3000);
    } catch (err: any) {
      showToast(`Erro ao rodar diagnóstico: ${err.message}`);
      setRunningDiagnostic(false);
    }
  };

  // Update Lead Temperature
  const handleUpdateTemperature = async (temp: 'cold' | 'warm' | 'hot' | 'converted' | 'lost') => {
    if (!lead) return;
    try {
      const token = await getAdminToken();
      await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ temperature: temp })
      });
      setLead(prev => prev ? { ...prev, temperature: temp } : null);
      showToast(`Temperatura do lead atualizada para ${temp.toUpperCase()}`);
    } catch (err: any) {
      showToast(`Erro ao atualizar temperatura: ${err.message}`);
    }
  };

  // Generate Outreach Copy
  const handleGenerateCopy = async () => {
    if (!lead) return;
    setGeneratingCopy(true);
    try {
      const token = await getAdminToken();
      const res = await fetch('/api/admin/lead-hunter/outreach', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId: lead.id,
          framework: copyTab,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar copy');

      setEditedEmailText(data.emailText || '');
      setEditedLinkedinText(data.linkedinText || '');
      
      setLead(prev => prev ? {
        ...prev,
        outreachCopies: {
          ...(prev.outreachCopies || {}),
          [copyTab]: data.emailText,
          [`${copyTab}_linkedin`]: data.linkedinText
        }
      } : null);

      showToast(`✨ Copy no framework ${copyTab} gerada com sucesso!`);
    } catch (err: any) {
      showToast(`Erro ao gerar copy: ${err.message}`);
    } finally {
      setGeneratingCopy(false);
    }
  };

  // Send Email with Attachments
  const handleSendEmail = async () => {
    if (!lead || !lead.email) {
      showToast('O lead precisa ter um e-mail cadastrado.');
      return;
    }
    setSendingEmail(true);
    try {
      const token = await getAdminToken();
      const res = await fetch('/api/admin/lead-hunter/send-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId: lead.id,
          email: lead.email,
          subject: `Diagnóstico GEO // Otimização de Inteligência Artificial para ${lead.company || lead.domain}`,
          bodyHtml: editedEmailText,
          attachPdf: attachReportLink
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar e-mail');

      showToast('📧 E-mail com proposta e relatório enviado com sucesso!');
      fetchLeadDetails();
    } catch (err: any) {
      showToast(`Erro ao enviar e-mail: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500 font-mono text-xs">Carregando detalhes do lead...</span>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4">
        <IconX className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="font-display font-bold text-red-950 text-lg">Lead Não Encontrado</h3>
        <p className="text-red-700 text-sm">{error || 'Não foi possível carregar os dados deste lead.'}</p>
        <button
          onClick={() => onNavigate('leads')}
          className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors"
        >
          ← Voltar para Todos os Leads
        </button>
      </div>
    );
  }

  // Get lead source badge configuration
  const getSourceBadge = () => {
    const src = lead.source || 'lp';
    if (src === 'lp') {
      return { label: '🟢 Landing Page (LP)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (src === 'mining_google' || src === 'google') {
      return { label: '🔵 Mineração (Google Search / Maps)', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (src === 'mining_linkedin' || src === 'linkedin') {
      return { label: '🟣 Mineração (LinkedIn)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    if (src === 'mining_import' || src === 'import') {
      return { label: '🟧 Mineração (Importação CSV/URLs)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: '⚡ Mineração (IA Autônoma)', color: 'bg-purple-50 text-purple-700 border-purple-200' };
  };

  const sourceBadge = getSourceBadge();

  return (
    <div className="space-y-6 pb-12">
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white text-xs font-mono px-4 py-3 rounded-2xl shadow-2xl border border-zinc-800 animate-bounce">
          {toast}
        </div>
      )}

      {/* Top Header / Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('leads')}
            className="p-2 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Voltar para Lista"
          >
            <IconChevron direction="left" className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-black text-xl text-zinc-950 tracking-tight">
                {lead.company || lead.domain || lead.url}
              </h1>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${sourceBadge.color}`}>
                {sourceBadge.label}
              </span>
              <StatusBadge status={lead.status} />
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{lead.url}</span>
              {lead.email && <span className="text-zinc-400">• {lead.email}</span>}
              {lead.niche && <span className="text-zinc-400">• Nicho: {lead.niche}</span>}
            </p>
          </div>
        </div>

        {/* Temperature & Diagnostic trigger */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Temperature Dropdown */}
          <select
            value={lead.temperature || 'cold'}
            onChange={(e) => handleUpdateTemperature(e.target.value as any)}
            className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 cursor-pointer hover:bg-zinc-100 transition-colors"
          >
            <option value="cold">❄️ Frio (Cold)</option>
            <option value="warm">🔥 Morno (Warm)</option>
            <option value="hot">⚡ Quente (Hot)</option>
            <option value="converted">💎 Convertido</option>
            <option value="lost">❌ Perdido</option>
          </select>

          {/* Diagnostic Button */}
          <button
            onClick={handleRunDiagnostic}
            disabled={runningDiagnostic}
            className={`px-4 py-2 rounded-xl font-display font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
              lead.searchTermsStatus === 'approved'
                ? 'bg-zinc-950 text-white hover:bg-zinc-800'
                : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
            }`}
          >
            {runningDiagnostic ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processando Agentes...</span>
              </>
            ) : (
              <>
                <IconPlay className="w-3.5 h-3.5" />
                <span>{lead.diagnosticId ? 'Refazer Diagnóstico GEO' : 'Iniciar Diagnóstico GEO'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="border-b border-zinc-200 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-6 min-w-max">
          <button
            onClick={() => setActiveTab('search_terms')}
            className={`py-3 px-1 border-b-2 font-display text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'search_terms'
                ? 'border-zinc-950 text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <IconSparkles className="w-4 h-4" />
            <span>1. Termos de Pesquisa Estratégicos</span>
            {lead.searchTermsStatus === 'approved' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Aprovados" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="Pendente de Aprovação" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`py-3 px-1 border-b-2 font-display text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'diagnostic'
                ? 'border-zinc-950 text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <IconShield className="w-4 h-4" />
            <span>2. Diagnóstico GEO & Auditorias</span>
            {lead.geoScore !== undefined && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-800 font-bold">
                {lead.geoScore}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('outreach')}
            className={`py-3 px-1 border-b-2 font-display text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'outreach'
                ? 'border-zinc-950 text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <IconSend className="w-4 h-4" />
            <span>3. Outreach & Copys (9 Frameworks)</span>
          </button>

          <button
            onClick={() => setActiveTab('contact_notes')}
            className={`py-3 px-1 border-b-2 font-display text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'contact_notes'
                ? 'border-zinc-950 text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <IconChat className="w-4 h-4" />
            <span>4. Contato & Notas</span>
          </button>
        </nav>
      </div>

      {/* TAB CONTENT AREA */}
      <div>
        {/* TAB 1: STRATEGIC SEARCH TERMS */}
        {activeTab === 'search_terms' && (
          <div className="space-y-6">
            {/* Status card */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="font-display font-bold text-zinc-950 text-base flex items-center gap-2">
                    <IconSparkles className="w-5 h-5 text-amber-500" />
                    Gerenciador de 14 Termos de Pesquisa Estratégicos (GEO Intent)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Antes de rodar o diagnóstico por IA para este lead (minerado ou de LP), revise e ajuste as 14 pesquisas/perguntas que as IAs (ChatGPT, Perplexity, Claude, Gemini, DeepSeek) vão consultar sobre a empresa e seu nicho.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleAnalyzeTerms}
                    disabled={analyzingTerms}
                    className="px-4 py-2 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {analyzingTerms ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        <span>Analisando com IA...</span>
                      </>
                    ) : (
                      <>
                        <IconSparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>{terms.some(t => t) ? 'Regerar Termos via IA' : 'Analisar & Gerar via IA'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {lead.companyOverview && (
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 text-xs text-zinc-700 space-y-1">
                  <span className="font-mono font-bold text-[10px] text-zinc-500 uppercase tracking-wider block">Síntese do Perfil da Empresa:</span>
                  <p className="leading-relaxed">{lead.companyOverview}</p>
                </div>
              )}

              {termsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                  {termsError}
                </div>
              )}

              {/* 14 Terms Inputs Grid */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs font-mono font-bold text-zinc-500">
                  <span>LISTA DOS 14 TERMOS DE PESQUISA (GEO BENCHMARK)</span>
                  <span>{terms.filter(t => t.trim()).length} / 14 PREENCHIDOS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {terms.map((term, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-2 focus-within:border-zinc-950 focus-within:bg-white transition-all">
                      <span className="w-6 h-6 bg-zinc-200 text-zinc-700 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={term}
                        onChange={(e) => {
                          const updated = [...terms];
                          updated[idx] = e.target.value;
                          setTerms(updated);
                        }}
                        placeholder={`Termo/Pergunta de pesquisa #${idx + 1}...`}
                        className="w-full bg-transparent text-xs text-zinc-900 focus:outline-none font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Approve & Save Footer */}
              <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs">
                  {lead.searchTermsStatus === 'approved' ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                      <IconCheck className="w-4 h-4" /> Termos de Pesquisa Aprovados (Diagnóstico Liberado)
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold flex items-center gap-1.5">
                      <IconLock className="w-4 h-4" /> Aprovação necessária para travar a auditoria oficial
                    </span>
                  )}
                </div>

                <button
                  onClick={handleSaveTerms}
                  disabled={savingTerms}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-display rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savingTerms ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <IconCheck className="w-4 h-4" />
                      <span>Salvar e Aprovar Termos de Pesquisa</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DIAGNOSTIC & AUDITS */}
        {activeTab === 'diagnostic' && (
          <div className="space-y-6">
            {!diagnosticData ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
                <IconShield className="w-12 h-12 text-zinc-400 mx-auto" />
                <h3 className="font-display font-bold text-zinc-900 text-lg">Nenhum Diagnóstico Executado Ainda</h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Para gerar o relatório completo com GeoScore, auditoria técnica de robots.txt, schema.org e visibilidade nos modelos de IA, certifique-se de aprovar os Termos de Pesquisa na aba 1 e clique em "Iniciar Diagnóstico GEO".
                </p>
                <button
                  onClick={handleRunDiagnostic}
                  disabled={runningDiagnostic}
                  className="px-6 py-3 bg-zinc-950 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
                >
                  <IconPlay className="w-4 h-4" />
                  <span>Executar Diagnóstico GEO Agora</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Score Header */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <GeoScoreGauge score={diagnosticData.overallGeoScore || lead.geoScore || 0} size="lg" />
                    <div>
                      <h3 className="font-display font-bold text-zinc-950 text-lg">Score GEO Geral: {diagnosticData.overallGeoScore}%</h3>
                      <p className="text-xs text-zinc-500 font-mono mt-1">
                        Gerado em: {new Date(diagnosticData.generatedAt || Date.now()).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {diagnosticData.htmlReportPath && (
                    <button
                      onClick={() => setHtmlPreviewUrl(diagnosticData.htmlReportPath)}
                      className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-zinc-300 shadow-xs"
                    >
                      <IconFolder className="w-4 h-4 text-blue-600" />
                      <span>Visualizar Relatório HTML Completo</span>
                    </button>
                  )}
                </div>

                {/* Audit & Screenshots Panel */}
                <AuditAndScreenshotsPanel
                  entityType="lead"
                  entityId={lead.id}
                  diagnostic={diagnosticData || hookDiagnostic}
                  leadUrl={lead.url}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: OUTREACH & COPIES */}
        {activeTab === 'outreach' && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="font-display font-bold text-zinc-950 text-base flex items-center gap-2">
                    <IconSend className="w-5 h-5 text-blue-600" />
                    Gerador de Abordagens (9 Frameworks de Copywriting)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Copys calibradas dinamicamente com as falhas técnicas encontradas no diagnóstico do lead.
                  </p>
                </div>
                <button
                  onClick={handleGenerateCopy}
                  disabled={generatingCopy}
                  className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold font-display flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  {generatingCopy ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Gerando com IA...</span>
                    </>
                  ) : (
                    <>
                      <IconSparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Gerar Copy ({copyTab})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Framework Selector Tabs */}
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
                {(['PAS', 'BAB', 'PASTOR', 'QUEST', '4Ps', 'FAB', 'ACCA', '4Us', 'Falsa Lógica'] as CopyFramework[]).map(fw => (
                  <button
                    key={fw}
                    onClick={() => setCopyTab(fw)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                      copyTab === fw
                        ? 'bg-zinc-950 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {fw}
                  </button>
                ))}
              </div>

              {/* Email Text Box */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono font-bold text-zinc-600">
                  <span>TEXTO DO E-MAIL (PROPOSTA & ABORDAGEM)</span>
                  <button
                    onClick={() => copyToClipboard(editedEmailText, 'email')}
                    className="text-zinc-500 hover:text-zinc-950 flex items-center gap-1 cursor-pointer"
                  >
                    <IconClipboard className="w-3.5 h-3.5" />
                    <span>{copiedField === 'email' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <textarea
                  value={editedEmailText}
                  onChange={(e) => setEditedEmailText(e.target.value)}
                  rows={8}
                  placeholder="Selecione um framework e clique em Gerar Copy..."
                  className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono leading-relaxed focus:outline-none focus:border-zinc-950 focus:bg-white"
                />
              </div>

              {/* Send Email Action Bar */}
              <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachReportLink}
                    onChange={(e) => setAttachReportLink(e.target.checked)}
                    className="rounded text-zinc-950 focus:ring-zinc-950"
                  />
                  <span>Anexar Relatório de Diagnóstico no e-mail</span>
                </label>

                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail || !editedEmailText}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-display shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {sendingEmail ? (
                    <span>Disparando...</span>
                  ) : (
                    <>
                      <IconMail className="w-4 h-4" />
                      <span>Disparar E-mail para {lead.email || lead.domain}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CONTACT & NOTES */}
        {activeTab === 'contact_notes' && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-zinc-950 text-base">Informações Cadastrais do Lead</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <span className="text-zinc-400 block text-[10px]">EMPRESA / DOMÍNIO</span>
                  <span className="font-bold text-zinc-900">{lead.company || lead.domain || 'N/A'}</span>
                </div>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <span className="text-zinc-400 block text-[10px]">E-MAIL DE CONTATO</span>
                  <span className="font-bold text-zinc-900">{lead.email || 'Não informado'}</span>
                </div>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <span className="text-zinc-400 block text-[10px]">NOME DO DECISOR / CONTATO</span>
                  <span className="font-bold text-zinc-900">{lead.contactName || lead.name || 'Não informado'}</span>
                </div>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <span className="text-zinc-400 block text-[10px]">CARGO DO DECISOR</span>
                  <span className="font-bold text-zinc-900">{lead.contactRole || 'CEO / Diretor'}</span>
                </div>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <span className="text-zinc-400 block text-[10px]">LINKEDIN</span>
                  {lead.linkedinUrl ? (
                    <a href={lead.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">
                      {lead.linkedinUrl}
                    </a>
                  ) : (
                    <span className="text-zinc-400">Não cadastrado</span>
                  )}
                </div>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <span className="text-zinc-400 block text-[10px]">CRIADO EM</span>
                  <span className="font-bold text-zinc-900">{new Date(lead.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* HTML Report Preview Modal */}
      {htmlPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <span className="font-display font-bold text-sm text-zinc-900">Relatório de Diagnóstico GEO HTML</span>
              <button
                onClick={() => setHtmlPreviewUrl(null)}
                className="text-zinc-400 hover:text-zinc-950 cursor-pointer p-1"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <iframe
              src={htmlPreviewUrl}
              className="w-full flex-1 border-none"
              title="Relatório Diagnóstico HTML"
            />
          </div>
        </div>
      )}
    </div>
  );
}
