import React, { useState, useEffect } from 'react';
import { useLeads, useClients, useDiagnostic, type Lead, type Client, type SentHistoryItem } from '../hooks/useFirestore';
import GeoScoreGauge from '../components/GeoScoreGauge';
import { AuditAndScreenshotsPanel } from '../components/AuditAndScreenshotsPanel';
import { NotepadPanel } from '../components/NotepadPanel';
import Modal from '../components/Modal';
import ManageLeadModal from '../components/ManageLeadModal';
import LeadCommercialPipelinePanel from '../components/LeadCommercialPipelinePanel';
import { getPipelineStage, formatFollowupLabel, PIPELINE_STAGE_LABELS, PIPELINE_STAGE_COLORS, COMMERCIAL_STAGES, COMMERCIAL_STAGE_MAP, getCommercialStageConfig, calculateLeadMetrics } from '../lib/pipeline';
import {
  IconCheck, IconX, IconWarning, IconEdit, IconTrash, IconPlay, IconStar,
  IconShield, IconFolder, IconClipboard, IconChat, IconBot, IconHourglass,
  IconSend, IconChevron, IconSparkles, IconLock, IconTarget, IconMail
} from '../components/icons';
import { getAuth } from 'firebase/auth';

interface ConvertToClientModalProps {
  lead: Lead;
  converting: boolean;
  onConfirm: (data: { name: string; company: string; plan: Client['plan']; currentStage: number }) => void;
  onCancel: () => void;
}

function ConvertToClientModal({ lead, converting, onConfirm, onCancel }: ConvertToClientModalProps) {
  const [name, setName] = useState(lead.contactName || lead.name || '');
  const [company, setCompany] = useState(lead.company || lead.domain || '');
  const [plan, setPlan] = useState<Client['plan']>('premium');
  const [currentStage, setCurrentStage] = useState(1);

  return (
    <Modal onClose={onCancel} title="Converter Lead em Cliente" maxWidth="max-w-lg">
      <form onSubmit={(e) => { e.preventDefault(); onConfirm({ name, company, plan, currentStage }); }} className="space-y-4 text-xs">
        <p className="text-zinc-500 text-xs leading-relaxed">
          Este lead sairá da lista ativa de Leads e um novo Cliente será criado, herdando contato, termos de pesquisa aprovados, copies de prospecção e o diagnóstico inicial (Score GEO: <b>{lead.geoScore || lead.geoScoreEstimado || 0}%</b>).
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">Nome do Responsável</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2" />
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">Empresa</label>
            <input required value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2" />
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">Plano</label>
            <select value={plan} onChange={e => setPlan(e.target.value as Client['plan'])} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">Etapa Inicial</label>
            <select value={currentStage} onChange={e => setCurrentStage(parseInt(e.target.value))} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
              {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>Etapa {s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t border-zinc-100">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-zinc-200 rounded-xl font-bold cursor-pointer hover:bg-zinc-50">Cancelar</button>
          <button type="submit" disabled={converting} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer hover:bg-emerald-700 disabled:opacity-50">
            {converting ? 'Convertendo...' : '💎 Confirmar Conversão'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface LeadDetailPageProps {
  leadId: string;
  onNavigate: (page: string, id?: string) => void;
}

type TabType = 'contact' | 'search_terms' | 'diagnostic' | 'pipeline';
type CopyFramework = 'PAS' | 'BAB' | 'PASTOR' | 'QUEST' | '4Ps' | 'FAB' | 'ACCA' | '4Us' | 'Falsa Lógica';

// Espelha server.cjs OUTREACH_FRAMEWORK_KEYS — as chaves persistidas em outreachCopies não são o label da UI
const OUTREACH_FRAMEWORK_KEYS: Record<CopyFramework, string> = {
  PAS: 'pas',
  BAB: 'bab',
  PASTOR: 'pastor',
  QUEST: 'quest',
  '4Ps': 'ps4',
  FAB: 'fab',
  ACCA: 'acca',
  '4Us': 'us4',
  'Falsa Lógica': 'falsaLogica',
};

export default function LeadDetailPage({ leadId, onNavigate }: LeadDetailPageProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('contact');

  // Contact tab — editable fields
  const [contactForm, setContactForm] = useState({
    company: '', email: '', url: '', contactName: '', contactRole: '', linkedinUrl: '', phone: '', niche: '',
  });
  const [savingContact, setSavingContact] = useState(false);
  const [contactDirty, setContactDirty] = useState(false);

  // Search terms management state
  const [terms, setTerms] = useState<string[]>(Array(14).fill(''));
  const [analyzingTerms, setAnalyzingTerms] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  // Diagnostic hooks & state
  const { runDiagnostic: triggerDiagnostic, editLead } = useLeads();
  const { convertLeadToClient } = useClients();
  const { diagnostic: hookDiagnostic, fetchDiagnostic } = useDiagnostic(leadId);
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [diagnosticErrorMsg, setDiagnosticErrorMsg] = useState<string | null>(null);
  const [htmlPreviewUrl, setHtmlPreviewUrl] = useState<string | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [converting, setConverting] = useState(false);

  const handleSaveManageModal = async (leadId: string, patch: Partial<Lead>) => {
    await editLead(leadId, patch);
    setLead(prev => prev ? { ...prev, ...patch } : null);
    showToast('✅ Pipeline comercial atualizado com sucesso!');
  };

  // Pipeline / Outreach state
  const [copyTab, setCopyTab] = useState<CopyFramework>('PAS');
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedEmailText, setEditedEmailText] = useState('');
  const [editedLinkedinText, setEditedLinkedinText] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [attachReportLink, setAttachReportLink] = useState(true);
  const [markingSent, setMarkingSent] = useState(false);

  // A copy gerada traz "Assunto: ..." na 1ª linha do corpo — separa isso em um campo próprio editável
  const splitSubjectFromBody = (text: string): { subject: string; body: string } => {
    const match = text.match(/^Assunto:\s*(.+?)\n+([\s\S]*)$/i);
    if (match) {
      return { subject: match[1].trim(), body: match[2].trim() };
    }
    return { subject: '', body: text };
  };

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
        setContactForm({
          company: found.company || '',
          email: found.email || '',
          url: found.url || '',
          contactName: found.contactName || found.name || '',
          contactRole: found.contactRole || '',
          linkedinUrl: found.linkedinUrl || '',
          phone: found.phone || '',
          niche: found.niche || '',
        });
        setContactDirty(false);
        if (found.searchTerms && found.searchTerms.length > 0) {
          const filled = [...found.searchTerms];
          while (filled.length < 14) filled.push('');
          setTerms(filled.slice(0, 14));
        }
        const frameworkKey = OUTREACH_FRAMEWORK_KEYS[copyTab];
        if (found.outreachCopies && found.outreachCopies[`${frameworkKey}Email`]) {
          const { subject, body } = splitSubjectFromBody(found.outreachCopies[`${frameworkKey}Email`]);
          setEditedSubject(subject || `Diagnóstico GEO // Otimização de Inteligência Artificial para ${found.company || found.domain}`);
          setEditedEmailText(body);
          setEditedLinkedinText(found.outreachCopies[`${frameworkKey}Linkedin`] || '');
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
    // A rota GET /api/admin/diagnostic/:leadId busca pelo leadId (não pelo id do documento de diagnóstico)
    if (lead?.diagnosticId) {
      fetchDiagnosticReport(lead.id);
    }
  }, [lead?.diagnosticId]);

  // Sync copy texts when framework changes
  useEffect(() => {
    if (lead?.outreachCopies) {
      const frameworkKey = OUTREACH_FRAMEWORK_KEYS[copyTab];
      const rawEmail = lead.outreachCopies[`${frameworkKey}Email`] || '';
      const { subject, body } = splitSubjectFromBody(rawEmail);
      setEditedSubject(subject || `Diagnóstico GEO // Otimização de Inteligência Artificial para ${lead.company || lead.domain}`);
      setEditedEmailText(body);
      setEditedLinkedinText(lead.outreachCopies[`${frameworkKey}Linkedin`] || '');
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

    setDiagnosticErrorMsg(null);
    setRunningDiagnostic(true);
    try {
      await triggerDiagnostic(lead.id);
      showToast('🚀 Diagnóstico de 8 Agentes iniciado em segundo plano. Isso pode levar de 1 a 3 minutos...');

      // Faz polling do status do lead até os agentes terminarem (status muda de 'processing' para 'completed')
      // em vez de assumir um tempo fixo, já que o diagnóstico real roda em background no servidor.
      const startedAt = Date.now();
      const maxWaitMs = 5 * 60 * 1000;
      const poll = async () => {
        const token = await getAdminToken();
        const res = await fetch('/api/admin/leads', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const updated = (data.leads || []).find((l: Lead) => l.id === lead.id);

        if (updated?.status === 'completed' && updated?.diagnosticId) {
          setLead(updated);
          await Promise.all([fetchDiagnostic(), fetchDiagnosticReport(updated.id)]);
          setRunningDiagnostic(false);
          showToast('✅ Diagnóstico GEO concluído com sucesso!');
          return;
        }

        if (updated?.status === 'failed') {
          setRunningDiagnostic(false);
          setDiagnosticErrorMsg('O diagnóstico falhou no servidor. Tente executar novamente.');
          return;
        }

        if (Date.now() - startedAt > maxWaitMs) {
          setRunningDiagnostic(false);
          setDiagnosticErrorMsg('O diagnóstico está demorando mais que o esperado. Atualize a página em alguns instantes para verificar o resultado.');
          return;
        }

        setTimeout(poll, 5000);
      };
      setTimeout(poll, 5000);
    } catch (err: any) {
      setDiagnosticErrorMsg(err.message);
      showToast(`Erro ao rodar diagnóstico: ${err.message}`);
      setRunningDiagnostic(false);
    }
  };

  // Save Contact Info
  const handleSaveContact = async () => {
    if (!lead) return;
    setSavingContact(true);
    try {
      await editLead(lead.id, contactForm);
      setLead(prev => prev ? { ...prev, ...contactForm } : null);
      setContactDirty(false);
      showToast('✅ Dados de contato salvos com sucesso!');
    } catch (err: any) {
      showToast(`Erro ao salvar contato: ${err.message}`);
    } finally {
      setSavingContact(false);
    }
  };

  const updateContactField = (field: keyof typeof contactForm, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
    setContactDirty(true);
  };

  // Convert Lead to Client
  const handleConvertToClient = async (data: { name: string; company: string; plan: Client['plan']; currentStage: number }) => {
    if (!lead) return;
    setConverting(true);
    try {
      const res = await convertLeadToClient(lead.id, data);
      if (res.success) {
        showToast('💎 Lead convertido em Cliente com sucesso!');
        setShowConvertModal(false);
        onNavigate('clients', res.clientId);
      }
    } catch (err: any) {
      showToast(`Erro ao converter lead: ${err.message}`);
    } finally {
      setConverting(false);
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

    if (lead.searchTermsStatus !== 'approved') {
      showToast('⚠️ Geração de copy travada! É necessário analisar e aprovar os 14 Termos de Pesquisa Estratégicos (Etapa 2) antes de gerar as copys.');
      setActiveTab('search_terms');
      return;
    }

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

      const { subject, body } = splitSubjectFromBody(data.emailText || '');
      setEditedSubject(subject || `Diagnóstico GEO // Otimização de Inteligência Artificial para ${lead.company || lead.domain}`);
      setEditedEmailText(body);
      setEditedLinkedinText(data.linkedinText || '');

      setLead(prev => prev ? {
        ...prev,
        outreachCopies: data.outreachCopies || prev.outreachCopies,
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
          subject: editedSubject || `Diagnóstico GEO // Otimização de Inteligência Artificial para ${lead.company || lead.domain}`,
          bodyHtml: editedEmailText,
          attachPdf: attachReportLink,
          framework: copyTab,
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

  // Marcação manual de envio (ex.: copy enviada por fora, como LinkedIn) — alimenta o Status do Pipeline.
  // A marcação é por framework (copyKey): enviar/desmarcar o PAS não afeta o histórico do BAB, PASTOR etc.
  const handleToggleSent = async (checked: boolean) => {
    if (!lead) return;
    setMarkingSent(true);
    try {
      if (checked) {
        const sentAt = new Date().toISOString();
        const sentHistory: SentHistoryItem[] = [
          ...(lead.sentHistory || []).filter(h => h.copyKey !== copyTab),
          { copyKey: copyTab, sentAt, channel: 'linkedin' },
        ];
        await editLead(lead.id, { sentHistory, emailSentAt: sentAt, pipelineStage: 'email_sent', status: 'contacted' } as Partial<Lead>);
        setLead(prev => prev ? { ...prev, sentHistory, emailSentAt: sentAt, pipelineStage: 'email_sent', status: 'contacted' } : null);
        showToast(`✅ Framework ${copyTab} marcado como enviado.`);
      } else {
        // Remove só a marcação deste framework, preservando o histórico dos demais
        const sentHistory: SentHistoryItem[] = (lead.sentHistory || []).filter(h => h.copyKey !== copyTab);
        const lastSent = sentHistory.length > 0
          ? sentHistory.reduce((latest, item) => (item.sentAt > latest.sentAt ? item : latest))
          : null;
        await editLead(lead.id, {
          sentHistory,
          emailSentAt: lastSent?.sentAt || '',
          pipelineStage: sentHistory.length > 0 ? 'email_sent' : '',
        } as unknown as Partial<Lead>);
        setLead(prev => prev ? {
          ...prev,
          sentHistory,
          emailSentAt: lastSent?.sentAt || '',
          pipelineStage: sentHistory.length > 0 ? 'email_sent' : undefined,
        } : null);
        showToast(`Marcação de envio do framework ${copyTab} removida.`);
      }
    } catch (err: any) {
      showToast(`Erro ao atualizar status de envio: ${err.message}`);
    } finally {
      setMarkingSent(false);
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
              {(() => {
                const stage = getPipelineStage(lead);
                return (
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${PIPELINE_STAGE_COLORS[stage]}`}>
                    {PIPELINE_STAGE_LABELS[stage]}
                  </span>
                );
              })()}
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

          {/* Button Gerenciar Pipeline Comercial */}
          <button
            onClick={() => setShowManageModal(true)}
            className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold font-display shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Gerenciar Pipeline Comercial"
          >
            <IconEdit className="w-3.5 h-3.5 text-amber-400" />
            <span>Gerenciar Pipeline</span>
          </button>

          {/* Convert to Client Button — só aparece se ainda não foi convertido */}
          {lead.status !== 'converted' && lead.temperature !== 'converted' && (
            <button
              onClick={() => setShowConvertModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-display font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <IconStar className="w-3.5 h-3.5" />
              <span>Converter em Cliente</span>
            </button>
          )}

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
            onClick={() => setActiveTab('contact')}
            className={`py-3 px-1 border-b-2 font-display text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'contact'
                ? 'border-zinc-950 text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <IconChat className="w-4 h-4" />
            <span>1. Contato</span>
          </button>

          <button
            onClick={() => setActiveTab('search_terms')}
            className={`py-3 px-1 border-b-2 font-display text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'search_terms'
                ? 'border-zinc-950 text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <IconSparkles className="w-4 h-4" />
            <span>2. Termos de Pesquisa Estratégicos</span>
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
            <span>3. Diagnóstico GEO & Auditorias</span>
            {lead.geoScore !== undefined && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-800 font-bold">
                {lead.geoScore}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`py-3 px-1 border-b-2 font-display text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'pipeline'
                ? 'border-zinc-950 text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <IconSend className="w-4 h-4" />
            <span>4. Pipeline</span>
            {(() => {
              const stage = getPipelineStage(lead);
              return (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border font-bold ${PIPELINE_STAGE_COLORS[stage]}`}>
                  {PIPELINE_STAGE_LABELS[stage]}
                </span>
              );
            })()}
          </button>
        </nav>
      </div>

      {/* TAB CONTENT AREA */}
      <div>
        {/* TAB 1: CONTACT (editable) */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="font-display font-bold text-zinc-950 text-base flex items-center gap-2">
                    <IconChat className="w-5 h-5 text-blue-600" />
                    Informações de Contato
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Edite os dados cadastrais do lead e salve as alterações.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">EMPRESA / DOMÍNIO</label>
                  <input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) => updateContactField('company', e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-950 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">E-MAIL DE CONTATO</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => updateContactField('email', e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-950 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">NOME DO DECISOR / CONTATO</label>
                  <input
                    type="text"
                    value={contactForm.contactName}
                    onChange={(e) => updateContactField('contactName', e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-950 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">CARGO DO DECISOR</label>
                  <input
                    type="text"
                    value={contactForm.contactRole}
                    onChange={(e) => updateContactField('contactRole', e.target.value)}
                    placeholder="CEO / Diretor..."
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-950 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">URL DO LEAD (SITE)</label>
                  <input
                    type="text"
                    value={contactForm.url}
                    onChange={(e) => updateContactField('url', e.target.value)}
                    placeholder="https://empresa.com.br"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-950 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">LINKEDIN</label>
                  <input
                    type="text"
                    value={contactForm.linkedinUrl}
                    onChange={(e) => updateContactField('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-950 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">TELEFONE</label>
                  <input
                    type="text"
                    value={contactForm.phone}
                    onChange={(e) => updateContactField('phone', e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-950 focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">NICHO / SETOR</label>
                  <input
                    type="text"
                    value={contactForm.niche}
                    onChange={(e) => updateContactField('niche', e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-950 focus:bg-white"
                  />
                </div>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 sm:col-span-2">
                  <span className="text-zinc-400 block text-[10px] font-mono">CRIADO EM</span>
                  <span className="font-bold text-zinc-900 text-xs">{new Date(lead.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  onClick={handleSaveContact}
                  disabled={savingContact || !contactDirty}
                  className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-bold font-display rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savingContact ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <IconCheck className="w-4 h-4" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bloco de Notas & Anexos do Lead */}
            <NotepadPanel
              entityType="lead"
              entityId={lead.id}
              initialNotes={lead.notes}
              initialAttachments={lead.noteAttachments}
              onNotesSaved={(updatedNotes) => {
                setLead(prev => prev ? { ...prev, notes: updatedNotes } : null);
              }}
            />
          </div>
        )}

        {/* TAB 2: STRATEGIC SEARCH TERMS */}
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
            {runningDiagnostic ? (
              <div className="bg-white border-2 border-zinc-950 rounded-2xl p-8 text-center space-y-5 shadow-md animate-fadeIn">
                <div className="w-14 h-14 border-4 border-zinc-200 border-t-zinc-950 rounded-full animate-spin mx-auto" />
                <div>
                  <h3 className="font-display font-bold text-zinc-950 text-lg">Os 8 Agentes de IA estão trabalhando...</h3>
                  <p className="text-xs text-zinc-500 mt-2 max-w-md mx-auto leading-relaxed">
                    Analisando robots.txt, schema.org, conteúdo, semântica, off-page, SEO e visibilidade nos modelos de IA (ChatGPT, Claude, Gemini, Perplexity). Isso pode levar de 1 a 3 minutos — não é necessário atualizar a página, o resultado aparece automaticamente aqui.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto pt-2">
                  {['Gatekeeper', 'Metadados', 'Conteúdo', 'Semântica', 'Off-page', 'SEO', 'Intent/Visibilidade', 'Checklist'].map(agent => (
                    <span key={agent} className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      {agent}
                    </span>
                  ))}
                </div>
              </div>
            ) : !diagnosticData ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
                <IconShield className="w-12 h-12 text-zinc-400 mx-auto" />
                <h3 className="font-display font-bold text-zinc-900 text-lg">Nenhum Diagnóstico Executado Ainda</h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Para gerar o relatório completo com GeoScore, auditoria técnica de robots.txt, schema.org e visibilidade nos modelos de IA, certifique-se de aprovar os Termos de Pesquisa na aba 2 e clique em "Executar Diagnóstico GEO Agora".
                </p>
                {diagnosticErrorMsg && (
                  <div className="max-w-md mx-auto p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium text-left flex items-start gap-2">
                    <IconWarning className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{diagnosticErrorMsg}</span>
                  </div>
                )}
                <button
                  onClick={handleRunDiagnostic}
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

        {/* TAB 4: PIPELINE */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Painel Navegável de Gestão do Pipeline Comercial (14 Etapas & 3 Perguntas) */}
            <LeadCommercialPipelinePanel
              lead={lead}
              onSave={async (patch) => {
                await editLead(lead.id, patch);
                setLead(prev => prev ? { ...prev, ...patch } : null);
                showToast('✅ Pipeline comercial atualizado com sucesso!');
              }}
            />

            {lead.searchTermsStatus !== 'approved' && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 font-display font-bold text-amber-950 text-sm">
                  <IconLock className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Geração de Copy Travada (Requer Aprovação do GEO Intent)</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Para que o agente de inteligência comercial entenda profundamente o <strong>nicho do lead</strong>, os <strong>produtos/serviços que ele oferece</strong> e as <strong>pesquisas reais de clientes</strong> nas IAs, é necessário primeiro analisar e aprovar os 14 Termos de Pesquisa Estratégicos na <strong>Etapa 2</strong>.
                </p>
                <div>
                  <button
                    onClick={() => setActiveTab('search_terms')}
                    className="px-4 py-2.5 bg-amber-950 hover:bg-amber-900 text-white rounded-xl text-xs font-bold font-display flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <IconSparkles className="w-4 h-4 text-amber-400" />
                    <span>Ir para Etapa 2: Analisar & Aprovar 14 Termos</span>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="font-display font-bold text-zinc-950 text-base flex items-center gap-2">
                    <IconSend className="w-5 h-5 text-blue-600" />
                    Pipeline de Abordagem (9 Frameworks de Copywriting)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Copys calibradas dinamicamente com base no nicho, produtos/serviços e nos 14 termos de pesquisa GEO Intent do lead.
                  </p>
                </div>
                <button
                  onClick={handleGenerateCopy}
                  disabled={generatingCopy || lead.searchTermsStatus !== 'approved'}
                  className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold font-display flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  title={lead.searchTermsStatus !== 'approved' ? 'Aprovação prévia dos 14 Termos de Pesquisa necessária na Etapa 2' : 'Gerar copy com IA'}
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

              {/* Subject Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono font-bold text-zinc-600">
                  <span>ASSUNTO DO E-MAIL</span>
                  <button
                    onClick={() => copyToClipboard(editedSubject, 'subject')}
                    className="text-zinc-500 hover:text-zinc-950 flex items-center gap-1 cursor-pointer"
                  >
                    <IconClipboard className="w-3.5 h-3.5" />
                    <span>{copiedField === 'subject' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  placeholder="Selecione um framework e clique em Gerar Copy..."
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-medium focus:outline-none focus:border-zinc-950 focus:bg-white"
                />
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

              {/* LinkedIn Text Box */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono font-bold text-zinc-600">
                  <span>TEXTO PARA LINKEDIN</span>
                  <button
                    onClick={() => copyToClipboard(editedLinkedinText, 'linkedin')}
                    className="text-zinc-500 hover:text-zinc-950 flex items-center gap-1 cursor-pointer"
                  >
                    <IconClipboard className="w-3.5 h-3.5" />
                    <span>{copiedField === 'linkedin' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <textarea
                  value={editedLinkedinText}
                  onChange={(e) => setEditedLinkedinText(e.target.value)}
                  rows={5}
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
                  <span>Incorporar Relatório de Diagnóstico no e-mail</span>
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

              {/* Manual "sent" checkbox — marcação por framework, independente do botão de disparo (ex.: enviado via LinkedIn copy/paste) */}
              <div className="pt-4 border-t border-zinc-100 space-y-2">
                {(() => {
                  const sentForThisFramework = (lead.sentHistory || []).filter(h => h.copyKey === copyTab);
                  const lastSentForThisFramework = sentForThisFramework.length > 0
                    ? sentForThisFramework.reduce((latest, item) => (item.sentAt > latest.sentAt ? item : latest))
                    : null;
                  return (
                    <>
                      <label className="flex items-center gap-2.5 text-xs text-zinc-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!lastSentForThisFramework}
                          disabled={markingSent}
                          onChange={(e) => handleToggleSent(e.target.checked)}
                          className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950"
                        />
                        <span className="font-bold">Já enviei esta abordagem para o lead ({copyTab})</span>
                      </label>
                      <p className="text-[11px] text-zinc-400 pl-6">
                        Marque manualmente se enviou por fora da plataforma (ex: copiou o texto e mandou pelo LinkedIn). Essa marcação vale apenas para o framework {copyTab} — os demais frameworks têm seu próprio status de envio.
                      </p>
                      {lastSentForThisFramework && (
                        <p className="text-[11px] text-zinc-500 pl-6 font-mono">
                          Enviado em: {new Date(lastSentForThisFramework.sentAt).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manage Lead Commercial Pipeline Modal */}
      {showManageModal && lead && (
        <ManageLeadModal
          lead={lead}
          onClose={() => setShowManageModal(false)}
          onSave={handleSaveManageModal}
        />
      )}

      {/* Convert to Client Modal */}
      {showConvertModal && lead && (
        <ConvertToClientModal
          lead={lead}
          converting={converting}
          onConfirm={handleConvertToClient}
          onCancel={() => setShowConvertModal(false)}
        />
      )}

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
