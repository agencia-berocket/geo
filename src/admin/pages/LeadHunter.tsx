import React, { useState, useEffect } from 'react';
import { 
  IconTarget, 
  IconRefresh, 
  IconSearch, 
  IconCopy, 
  IconCheck, 
  IconBot, 
  IconRocket, 
  IconShield, 
  IconWarning, 
  IconActivity, 
  IconSend, 
  IconTrash,
  IconMail,
  IconX 
} from '../components/icons';
import { getAuth } from 'firebase/auth';

interface HunterLead {
  id: string;
  domain: string;
  company: string;
  contactName: string;
  contactRole: string;
  linkedinUrl: string;
  email: string;
  niche: string;
  location: string;
  companySize?: string;
  status: 'unscanned' | 'audited' | 'outreach_ready' | 'contacted' | 'converted';
  aiCrawlersBlocked?: boolean;
  hasBlog?: boolean;
  hasAnswerFirst?: boolean;
  citedCompetitor?: string;
  geoScoreEstimado?: number;
  outreachCopies?: {
    pasLinkedin?: string;
    pasEmail?: string;
    babLinkedin?: string;
    babEmail?: string;
  };
  createdAt: string;
}

interface LeadHunterProps {
  onNavigate?: (page: string, id?: string) => void;
}

export default function LeadHunter({ onNavigate }: LeadHunterProps) {
  const [leads, setLeads] = useState<HunterLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [mining, setMining] = useState(false);
  const [auditingId, setAuditingId] = useState<string | null>(null);
  const [generatingCopyId, setGeneratingCopyId] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Mining parameters
  const [niche, setNiche] = useState('SaaS B2B');
  const [location, setLocation] = useState('Brasil');
  const [targetRole, setTargetRole] = useState('CEO / CMO / Founder');
  const [companySize, setCompanySize] = useState('20-200 funcionários');
  const [limit, setLimit] = useState(5);

  // Copy View Modal
  const [selectedLeadForCopy, setSelectedLeadForCopy] = useState<HunterLead | null>(null);
  const [copyTab, setCopyTab] = useState<'PAS' | 'BAB'>('PAS');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const getAdminToken = async () => {
    const auth = getAuth();
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = await getAdminToken();
      const res = await fetch('/api/admin/lead-hunter/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Error fetching hunter leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStartMining = async (e: React.FormEvent) => {
    e.preventDefault();
    setMining(true);
    try {
      const token = await getAdminToken();
      const res = await fetch('/api/admin/lead-hunter/mine', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          niche,
          location,
          targetRole,
          companySize,
          limit
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToastMsg(`Mineração concluída! ${data.count || 0} novos leads capturados.`);
        fetchLeads();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToastMsg(`Erro na mineração: ${errData.error || 'Falha ao conectar na API'}`);
      }
    } catch (err: any) {
      showToastMsg(`Erro ao disparar mineração: ${err.message}`);
    } finally {
      setMining(false);
    }
  };

  const handleRunQuickAudit = async (lead: HunterLead) => {
    setAuditingId(lead.id);
    try {
      const token = await getAdminToken();
      const res = await fetch('/api/admin/lead-hunter/audit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId: lead.id,
          domain: lead.domain,
          niche: lead.niche || niche
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToastMsg(`Quick Audit concluído para ${lead.domain}!`);
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...data.updatedLead } : l));
      } else {
        showToastMsg(`Falha na auditoria de ${lead.domain}`);
      }
    } catch (err: any) {
      showToastMsg(`Erro na auditoria: ${err.message}`);
    } finally {
      setAuditingId(null);
    }
  };

  const handleGenerateOutreach = async (lead: HunterLead) => {
    setGeneratingCopyId(lead.id);
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
          leadData: lead
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToastMsg(`Copys PAS & BAB geradas com sucesso para ${lead.company}!`);
        const updated = { ...lead, outreachCopies: data.outreachCopies, status: 'outreach_ready' as const };
        setLeads(prev => prev.map(l => l.id === lead.id ? updated : l));
        setSelectedLeadForCopy(updated);
      } else {
        showToastMsg(`Erro ao gerar copys para ${lead.company}`);
      }
    } catch (err: any) {
      showToastMsg(`Erro: ${err.message}`);
    } finally {
      setGeneratingCopyId(null);
    }
  };

  const handlePromoteToMainPipeline = async (lead: HunterLead) => {
    setPromotingId(lead.id);
    try {
      const token = await getAdminToken();
      const res = await fetch('/api/admin/lead-hunter/push-to-main', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leadId: lead.id })
      });

      if (res.ok) {
        const data = await res.json();
        showToastMsg(`Lead ${lead.company} promovido e transferido para a aba Leads!`);
        // Remove da lista do Lead Hunter para não poluir
        setLeads(prev => prev.filter(l => l.id !== lead.id));
        if (onNavigate && data.mainLeadId) {
          onNavigate('leads', data.mainLeadId);
        }
      } else {
        showToastMsg('Erro ao promover lead para a esteira principal');
      }
    } catch (err: any) {
      showToastMsg(`Erro ao promover lead: ${err.message}`);
    } finally {
      setPromotingId(null);
    }
  };

  const handleDeleteLead = async (leadId: string, companyName: string) => {
    if (!confirm(`Deseja realmente remover o lead "${companyName}" da lista?`)) return;
    setDeletingId(leadId);
    try {
      const token = await getAdminToken();
      const res = await fetch(`/api/admin/lead-hunter/leads/${leadId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToastMsg(`Lead "${companyName}" removido da lista.`);
        setLeads(prev => prev.filter(l => l.id !== leadId));
      } else {
        showToastMsg('Erro ao excluir lead');
      }
    } catch (err: any) {
      showToastMsg(`Erro ao excluir: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendDirectEmail = async () => {
    if (!selectedLeadForCopy) return;
    const recipientEmail = selectedLeadForCopy.email;
    const currentEmailCopy = copyTab === 'PAS' 
      ? selectedLeadForCopy.outreachCopies?.pasEmail 
      : selectedLeadForCopy.outreachCopies?.babEmail;

    if (!currentEmailCopy) {
      showToastMsg('Gere primeiro a copy antes de enviar o e-mail');
      return;
    }

    // Extract subject line from copy text if present
    const lines = currentEmailCopy.split('\n');
    let subject = `Ponto cego na visibilidade IA da ${selectedLeadForCopy.company}`;
    let body = currentEmailCopy;

    if (lines[0].toLowerCase().startsWith('assunto:')) {
      subject = lines[0].replace(/^assunto:\s*/i, '');
      body = lines.slice(1).join('\n').trim();
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
          leadId: selectedLeadForCopy.id,
          recipientEmail,
          subject,
          emailBody: body
        })
      });

      if (res.ok) {
        showToastMsg(`🚀 E-mail enviado com sucesso para ${recipientEmail}!`);
        setCopiedField('sent');
        setLeads(prev => prev.map(l => l.id === selectedLeadForCopy.id ? { ...l, status: 'contacted' } : l));
        setSelectedLeadForCopy(prev => prev ? { ...prev, status: 'contacted' } : null);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToastMsg(`Erro ao enviar e-mail: ${errData.error || 'Falha na conexão SMTP'}`);
      }
    } catch (err: any) {
      showToastMsg(`Erro no envio: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Metrics summary
  const totalLeads = leads.length;
  const auditedLeads = leads.filter(l => l.status !== 'unscanned').length;
  const readyLeads = leads.filter(l => l.status === 'outreach_ready' || l.outreachCopies).length;
  const blockedRobots = leads.filter(l => l.aiCrawlersBlocked).length;

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white text-xs font-mono px-4 py-3 rounded-xl shadow-2xl border border-zinc-700 flex items-center gap-2 animate-bounce">
          <IconRocket className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="tactile-card p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white relative overflow-hidden rounded-2xl border border-zinc-800 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold tracking-wider">
                AGENTE SDR/BDR DIGITAL // CANÔNICO
              </span>
              <span className="text-[10px] font-mono text-zinc-400">lead_hunter_v10</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight font-display text-white flex items-center gap-3">
              <IconTarget className="w-7 h-7 text-emerald-400" />
              Lead Hunter — Inteligência Comercial Outbound
            </h1>
            <p className="text-zinc-400 text-xs mt-1 max-w-2xl leading-relaxed">
              Agente autônomo para mineração de ICPs via Apify & Google, micro-auditoria técnica de robôs (ChatGPT, Gemini, Claude e Perplexity) e envio de abordagens diretas.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-100 transition-all flex items-center gap-2 cursor-pointer shadow-md font-mono"
            >
              <IconRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="tactile-raised p-4 bg-white rounded-2xl border border-zinc-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Total Minerados</p>
            <p className="text-2xl font-extrabold text-zinc-950 font-display mt-0.5">{totalLeads}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
            <IconTarget className="w-5 h-5" />
          </div>
        </div>

        <div className="tactile-raised p-4 bg-white rounded-2xl border border-zinc-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Micro-Auditados</p>
            <p className="text-2xl font-extrabold text-emerald-600 font-display mt-0.5">{auditedLeads}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <IconActivity className="w-5 h-5" />
          </div>
        </div>

        <div className="tactile-raised p-4 bg-white rounded-2xl border border-zinc-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Prontos p/ Abordagem</p>
            <p className="text-2xl font-extrabold text-blue-600 font-display mt-0.5">{readyLeads}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <IconSend className="w-5 h-5" />
          </div>
        </div>

        <div className="tactile-raised p-4 bg-white rounded-2xl border border-zinc-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Bloqueiam IA Bots</p>
            <p className="text-2xl font-extrabold text-amber-600 font-display mt-0.5">{blockedRobots}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <IconWarning className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Mining Control Panel */}
      <div className="tactile-card p-6 bg-white rounded-2xl border border-zinc-200/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <IconBot className="w-5 h-5 text-zinc-800" />
            <h2 className="font-bold text-sm font-display text-zinc-900">Parâmetros de Mineração Autônoma (Apify API)</h2>
          </div>
          <span className="text-xs font-mono text-zinc-400">Fase 1: Inteligência Comercial</span>
        </div>

        <form onSubmit={handleStartMining} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Nicho / Segmento</label>
            <input
              type="text"
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder="Ex: SaaS B2B, Advocacia, Logística"
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Localização</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Ex: São Paulo SP, Brasil"
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Cargo-Alvo (Decisor)</label>
            <input
              type="text"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="Ex: CEO, CMO, Founder"
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Qtd. de Leads</label>
            <select
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium font-mono"
            >
              <option value={5}>5 leads</option>
              <option value={10}>10 leads</option>
              <option value={15}>15 leads</option>
              <option value={20}>20 leads</option>
              <option value={30}>30 leads</option>
              <option value={50}>50 leads</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={mining}
              className="w-full py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {mining ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Minerando...</span>
                </>
              ) : (
                <>
                  <IconRocket className="w-4 h-4 text-emerald-400" />
                  <span>Minerar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Leads Table */}
      <div className="tactile-card bg-white rounded-2xl border border-zinc-200/60 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-bold text-sm font-display text-zinc-900 flex items-center gap-2">
            <span>Leads Capturados pelo Lead Hunter</span>
            <span className="text-xs font-mono font-normal text-zinc-400">({leads.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400">Ordenado por data recente</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-xs font-mono flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            <span>Carregando inteligência comercial do Firestore...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-xs space-y-2">
            <IconTarget className="w-10 h-10 mx-auto text-zinc-300" />
            <p className="font-semibold text-zinc-700">Nenhum lead nesta lista</p>
            <p>Preencha os parâmetros acima e clique em "Minerar" para trazer novas empresas qualificadas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/70 border-b border-zinc-100 text-zinc-500 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Empresa / Dominio</th>
                  <th className="py-3 px-4">Decisor / Cargo</th>
                  <th className="py-3 px-4">Diagnóstico Expresso (IAs)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações do Agente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-zinc-50/50 transition-colors">
                    
                    {/* Empresa / Dominio */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-zinc-900">{lead.company}</p>
                        <a 
                          href={`https://${lead.domain}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[11px] text-blue-600 hover:underline font-mono"
                        >
                          {lead.domain}
                        </a>
                        {lead.niche && (
                          <span className="ml-2 px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[9px] font-mono">
                            {lead.niche}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Decisor */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-zinc-800">{lead.contactName || 'Nome Pendente'}</p>
                        <p className="text-[11px] text-zinc-500">{lead.contactRole || 'Decisor Principal'}</p>
                        {lead.linkedinUrl && (
                          <a 
                            href={lead.linkedinUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-1 font-mono mt-0.5"
                          >
                            LinkedIn Profile →
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Quick Audit Info */}
                    <td className="py-3.5 px-4">
                      {lead.status === 'unscanned' ? (
                        <span className="text-[11px] font-mono text-zinc-400 italic">Auditoria pendente</span>
                      ) : (
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Score GEO:</span>
                            <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${
                              (lead.geoScoreEstimado || 0) < 40 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {lead.geoScoreEstimado || 35}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-600">
                            <span className={lead.aiCrawlersBlocked ? 'text-red-600 font-bold' : 'text-emerald-600'}>
                              {lead.aiCrawlersBlocked ? '⚠️ Bloqueia IAs (ChatGPT/Gemini)' : '✓ Robôs IA permitidos'}
                            </span>
                          </div>
                          {lead.citedCompetitor && (
                            <p className="text-[10px] text-zinc-500">
                              <span className="text-zinc-400 font-mono">Citado nas IAs:</span> <strong className="text-zinc-700">{lead.citedCompetitor}</strong>
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {lead.status === 'unscanned' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-zinc-100 text-zinc-600">
                          Não Auditado
                        </span>
                      )}
                      {lead.status === 'audited' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Micro-Auditado
                        </span>
                      )}
                      {lead.status === 'outreach_ready' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Copy Pronta
                        </span>
                      )}
                      {lead.status === 'contacted' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                          E-mail Enviado
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Audit Button */}
                        <button
                          onClick={() => handleRunQuickAudit(lead)}
                          disabled={auditingId === lead.id}
                          title="Rodar micro-auditoria técnica de robôs (ChatGPT, Gemini, Claude, Perplexity)"
                          className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <IconActivity className={`w-3.5 h-3.5 ${auditingId === lead.id ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">Audit</span>
                        </button>

                        {/* Generate / View Copy Button */}
                        <button
                          onClick={() => {
                            if (lead.outreachCopies) {
                              setSelectedLeadForCopy(lead);
                            } else {
                              handleGenerateOutreach(lead);
                            }
                          }}
                          disabled={generatingCopyId === lead.id}
                          className="p-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <IconSend className={`w-3.5 h-3.5 text-emerald-400 ${generatingCopyId === lead.id ? 'animate-bounce' : ''}`} />
                          <span>{lead.outreachCopies ? 'Ver Copys' : 'Gerar Copy'}</span>
                        </button>

                        {/* Promote to Main Diagnostic */}
                        <button
                          onClick={() => handlePromoteToMainPipeline(lead)}
                          disabled={promotingId === lead.id}
                          title="Promover lead e transferir para a aba de Leads do painel"
                          className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <IconRocket className={`w-3.5 h-3.5 ${promotingId === lead.id ? 'animate-spin' : ''}`} />
                          <span className="hidden md:inline">Promover GEO</span>
                        </button>

                        {/* Delete Lead Button */}
                        <button
                          onClick={() => handleDeleteLead(lead.id, lead.company)}
                          disabled={deletingId === lead.id}
                          title="Excluir este lead da lista"
                          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                        >
                          <IconTrash className={`w-3.5 h-3.5 ${deletingId === lead.id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Copy Viewer & Email Dispatcher Modal */}
      {selectedLeadForCopy && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  Copys Geradas pelo Agente Lead Hunter (ChatGPT, Gemini, Claude & Perplexity)
                </span>
                <h3 className="text-lg font-bold text-zinc-900 font-display mt-1">
                  Abordagem para {selectedLeadForCopy.contactName || selectedLeadForCopy.company} ({selectedLeadForCopy.company})
                </h3>
              </div>
              <button 
                onClick={() => setSelectedLeadForCopy(null)}
                className="text-zinc-400 hover:text-zinc-800 p-1.5 rounded-lg cursor-pointer"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Framework Switcher Tabs */}
            <div className="flex gap-2 border-b border-zinc-100 pb-2">
              <button
                onClick={() => setCopyTab('PAS')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  copyTab === 'PAS' 
                    ? 'bg-zinc-950 text-white shadow-sm' 
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Modelo PAS (Problema-Agitação-Solução)
              </button>
              <button
                onClick={() => setCopyTab('BAB')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  copyTab === 'BAB' 
                    ? 'bg-zinc-950 text-white shadow-sm' 
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Modelo BAB (Before-After-Bridge)
              </button>
            </div>

            {/* Copy Content Sections */}
            <div className="space-y-4">
              
              {/* LinkedIn Direct Message */}
              <div className="tactile-raised p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 font-display flex items-center gap-1.5">
                    <span>💬 Direct LinkedIn (Curto & Provocador)</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(
                      copyTab === 'PAS' 
                        ? selectedLeadForCopy.outreachCopies?.pasLinkedin || '' 
                        : selectedLeadForCopy.outreachCopies?.babLinkedin || '',
                      'linkedin'
                    )}
                    className="px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    {copiedField === 'linkedin' ? <IconCheck className="w-3.5 h-3.5 text-emerald-600" /> : <IconCopy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'linkedin' ? 'Copiado!' : 'Copiar para LinkedIn'}</span>
                  </button>
                </div>
                <div className="p-3 bg-white rounded-lg border border-zinc-200 text-xs text-zinc-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {copyTab === 'PAS' 
                    ? (selectedLeadForCopy.outreachCopies?.pasLinkedin || 'Gerando modelo PAS...')
                    : (selectedLeadForCopy.outreachCopies?.babLinkedin || 'Gerando modelo BAB...')}
                </div>
              </div>

              {/* Email Cold Outreach + Direct Send Button */}
              <div className="tactile-raised p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-zinc-800 font-display flex items-center gap-1.5">
                    <span>✉️ Cold E-mail Corporativo ({copyTab})</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(
                        copyTab === 'PAS' 
                          ? selectedLeadForCopy.outreachCopies?.pasEmail || '' 
                          : selectedLeadForCopy.outreachCopies?.babEmail || '',
                        'email'
                      )}
                      className="px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      {copiedField === 'email' ? <IconCheck className="w-3.5 h-3.5 text-emerald-600" /> : <IconCopy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'email' ? 'Copiado!' : 'Copiar Texto'}</span>
                    </button>

                    {/* Direct Email Dispatch Button */}
                    <button
                      onClick={handleSendDirectEmail}
                      disabled={sendingEmail}
                      className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {sendingEmail ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : copiedField === 'sent' ? (
                        <>
                          <IconCheck className="w-3.5 h-3.5" />
                          <span>✓ Enviado!</span>
                        </>
                      ) : (
                        <>
                          <IconMail className="w-3.5 h-3.5" />
                          <span>🚀 Enviar E-mail pela Plataforma</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-zinc-200 text-xs text-zinc-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {copyTab === 'PAS' 
                    ? (selectedLeadForCopy.outreachCopies?.pasEmail || 'Gerando e-mail PAS...')
                    : (selectedLeadForCopy.outreachCopies?.babEmail || 'Gerando e-mail BAB...')}
                </div>
              </div>

            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedLeadForCopy(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
