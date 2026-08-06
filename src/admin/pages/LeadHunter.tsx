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
  IconClipboard,
  IconX 
} from '../components/icons';
import { getAuth } from 'firebase/auth';

export type LeadTemperature = 'cold' | 'warm' | 'hot' | 'converted' | 'lost';

export interface SentHistoryItem {
  copyKey: string;
  sentAt: string;
  channel: 'email' | 'linkedin';
  subject?: string;
  attachPdf?: boolean;
}

export interface HunterLead {
  id: string;
  domain: string;
  company: string;
  contactName: string;
  contactRole: string;
  linkedinUrl: string;
  email: string;
  phone?: string;
  address?: string;
  photoUrl?: string;
  niche: string;
  location: string;
  companySize?: string;
  source?: 'linkedin' | 'google' | 'auto';
  status: 'unscanned' | 'audited' | 'outreach_ready' | 'contacted' | 'converted';
  temperature?: LeadTemperature;
  sequenceStage?: number; // 1: Abordagem Inicial, 2: Follow-up Impacto, 3: Urgência, 4: Fechamento
  responded?: boolean;
  sentHistory?: SentHistoryItem[];
  aiCrawlersBlocked?: boolean;
  hasBlog?: boolean;
  hasAnswerFirst?: boolean;
  citedCompetitor?: string;
  geoScoreEstimado?: number;
  diagnosticId?: string;
  outreachCopies?: Record<string, string>;
  createdAt: string;
}

type CopyFramework = 'PAS' | 'BAB' | 'PASTOR' | 'QUEST' | '4Ps' | 'FAB' | 'ACCA' | '4Us' | 'Falsa Lógica';

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
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [savingCopy, setSavingCopy] = useState(false);

  // Mining parameters
  const [miningSource, setMiningSource] = useState<'google' | 'linkedin' | 'auto'>('google');
  const [niche, setNiche] = useState('SaaS B2B');
  const [location, setLocation] = useState('Brasil');
  const [targetRole, setTargetRole] = useState('CEO / CMO / Founder');
  const [companySize, setCompanySize] = useState('20-200 funcionários');
  const [limit, setLimit] = useState(5);

  // Copy View & Pipeline Modal
  const [selectedLeadForCopy, setSelectedLeadForCopy] = useState<HunterLead | null>(null);
  const [copyTab, setCopyTab] = useState<CopyFramework>('PAS');
  const [editedLinkedinText, setEditedLinkedinText] = useState('');
  const [editedEmailText, setEditedEmailText] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [attachReportLink, setAttachReportLink] = useState(true);
  const [attachPdfReport, setAttachPdfReport] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // HTML Report Preview Modal
  const [htmlPreviewModal, setHtmlPreviewModal] = useState<{ url: string; title: string } | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
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
          source: miningSource,
          niche,
          location,
          targetRole,
          companySize,
          limit
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToastMsg(`Mineração concluída! ${data.count || 0} novos leads reais capturados via ${miningSource.toUpperCase()}.`);
        fetchLeads();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToastMsg(`⚠️ erro na mineração: ${errData.error || 'Falha ao conectar na Apify API'}`);
      }
    } catch (err: any) {
      showToastMsg(`Erro ao disparar mineração: ${err.message}`);
    } finally {
      setMining(false);
    }
  };

  // Run Full 8-Agent Diagnostic
  const handleRunQuickAudit = async (lead: HunterLead) => {
    setAuditingId(lead.id);
    showToastMsg(`Iniciando Diagnóstico Completo de 8 Agentes para ${lead.domain}...`);
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
        showToastMsg(`Diagnóstico GEO concluído! Score real: ${data.updatedLead.geoScoreEstimado}%`);
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
        showToastMsg(`9 Copys de alto impacto geradas com sucesso para ${lead.company}!`);
        const updated = { 
          ...lead, 
          outreachCopies: data.outreachCopies, 
          status: 'outreach_ready' as const,
          temperature: (lead.temperature || 'cold') as LeadTemperature,
          sequenceStage: lead.sequenceStage || 1
        };
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

  // Update Lead Temperature / Responded / Sequence
  const handleUpdateLeadState = async (leadId: string, updates: Partial<HunterLead>) => {
    try {
      const token = await getAdminToken();
      const res = await fetch(`/api/admin/lead-hunter/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
        if (selectedLeadForCopy && selectedLeadForCopy.id === leadId) {
          setSelectedLeadForCopy(prev => prev ? { ...prev, ...updates } : null);
        }
        showToastMsg('Status do lead atualizado!');
      }
    } catch (err: any) {
      console.error('Error updating lead state:', err);
    }
  };

  // Preview HTML Report Modal
  const handleViewHtmlReport = async (lead: HunterLead) => {
    try {
      const token = await getAdminToken();
      const res = await fetch(`/api/admin/lead-hunter/html/${lead.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const html = await res.text();
        const blob = new Blob([html], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        setHtmlPreviewModal({ url: blobUrl, title: `Relatório GEO Didático — ${lead.company}` });
      } else {
        showToastMsg('Relatório HTML não encontrado. Clique em Audit para gerar primeiro.');
      }
    } catch (err: any) {
      showToastMsg(`Erro ao carregar relatório: ${err.message}`);
    }
  };

  // Download PDF Report (Single Page)
  const handleDownloadPdfReport = async (lead: HunterLead) => {
    setDownloadingPdfId(lead.id);
    showToastMsg(`Gerando PDF idêntico ao HTML para ${lead.domain}...`);
    try {
      const token = await getAdminToken();
      const res = await fetch(`/api/admin/lead-hunter/pdf/${lead.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Relatorio_GEO_${lead.domain}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToastMsg('Download do PDF concluído!');
      } else {
        showToastMsg('Erro ao gerar PDF do relatório. Execute o Audit primeiro.');
      }
    } catch (err: any) {
      showToastMsg(`Erro no download PDF: ${err.message}`);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // Helper functions to retrieve copy text for current tab
  const getLinkedinCopyKey = (tab: CopyFramework) => {
    switch (tab) {
      case 'PAS': return 'pasLinkedin';
      case 'BAB': return 'babLinkedin';
      case 'PASTOR': return 'pastorLinkedin';
      case 'QUEST': return 'questLinkedin';
      case '4Ps': return 'ps4Linkedin';
      case 'FAB': return 'fabLinkedin';
      case 'ACCA': return 'accaLinkedin';
      case '4Us': return 'us4Linkedin';
      case 'Falsa Lógica': return 'falsaLogicaLinkedin';
    }
  };

  const getEmailCopyKey = (tab: CopyFramework) => {
    switch (tab) {
      case 'PAS': return 'pasEmail';
      case 'BAB': return 'babEmail';
      case 'PASTOR': return 'pastorEmail';
      case 'QUEST': return 'questEmail';
      case '4Ps': return 'ps4Email';
      case 'FAB': return 'fabEmail';
      case 'ACCA': return 'accaEmail';
      case '4Us': return 'us4Email';
      case 'Falsa Lógica': return 'falsaLogicaEmail';
    }
  };

  const getLinkedinCopyText = (lead: HunterLead, tab: CopyFramework) => {
    const key = getLinkedinCopyKey(tab);
    return lead.outreachCopies?.[key] || 'Gerando copy de LinkedIn...';
  };

  const getEmailCopyText = (lead: HunterLead, tab: CopyFramework) => {
    const key = getEmailCopyKey(tab);
    return lead.outreachCopies?.[key] || 'Gerando e-mail de abordagem...';
  };

  // Sync active copy tab into local editable text state
  useEffect(() => {
    if (selectedLeadForCopy) {
      setEditedLinkedinText(getLinkedinCopyText(selectedLeadForCopy, copyTab));
      setEditedEmailText(getEmailCopyText(selectedLeadForCopy, copyTab));
    }
  }, [selectedLeadForCopy, copyTab]);

  // Save edited copy back to Firestore
  const handleSaveEditedCopy = async () => {
    if (!selectedLeadForCopy) return;
    setSavingCopy(true);

    const lKey = getLinkedinCopyKey(copyTab);
    const eKey = getEmailCopyKey(copyTab);

    const updatedCopies = {
      ...(selectedLeadForCopy.outreachCopies || {}),
      [lKey]: editedLinkedinText,
      [eKey]: editedEmailText
    };

    try {
      const token = await getAdminToken();
      const res = await fetch(`/api/admin/lead-hunter/leads/${selectedLeadForCopy.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ outreachCopies: updatedCopies })
      });

      if (res.ok) {
        showToastMsg(`💾 Copy (${copyTab}) salva com sucesso!`);
        const updatedLead = { ...selectedLeadForCopy, outreachCopies: updatedCopies };
        setSelectedLeadForCopy(updatedLead);
        setLeads(prev => prev.map(l => l.id === selectedLeadForCopy.id ? updatedLead : l));
      } else {
        showToastMsg('Erro ao salvar copy editada.');
      }
    } catch (err: any) {
      showToastMsg(`Erro ao salvar: ${err.message}`);
    } finally {
      setSavingCopy(false);
    }
  };

  const handleSendDirectEmail = async () => {
    if (!selectedLeadForCopy) return;
    const recipientEmail = selectedLeadForCopy.email;
    let currentEmailBody = editedEmailText;

    if (!currentEmailBody) {
      showToastMsg('Gere primeiro a copy antes de enviar o e-mail');
      return;
    }

    if (attachReportLink) {
      currentEmailBody += `\n\n📌 Acesse a auditoria completa de visibilidade do seu domínio: https://geo.berocket.com.br`;
    }

    // Extract subject line from copy text if present
    const lines = currentEmailBody.split('\n');
    let subject = `Ponto cego na visibilidade IA da ${selectedLeadForCopy.company}`;
    let body = currentEmailBody;

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
          emailBody: body,
          attachPdf: attachPdfReport
        })
      });

      if (res.ok) {
        showToastMsg(`🚀 E-mail enviado com sucesso para ${recipientEmail}!`);
        setCopiedField('sent');

        const newHistoryItem: SentHistoryItem = {
          copyKey: getEmailCopyKey(copyTab),
          sentAt: new Date().toISOString(),
          channel: 'email',
          subject,
          attachPdf: attachPdfReport
        };

        const updatedHistory = [...(selectedLeadForCopy.sentHistory || []), newHistoryItem];
        const nextStage = Math.min((selectedLeadForCopy.sequenceStage || 1) + 1, 4);

        handleUpdateLeadState(selectedLeadForCopy.id, {
          status: 'contacted',
          temperature: 'warm',
          sequenceStage: nextStage,
          sentHistory: updatedHistory
        });
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

  // Format WhatsApp Link
  const formatWhatsappLink = (phoneStr?: string) => {
    if (!phoneStr) return null;
    const cleanDigits = phoneStr.replace(/\D/g, '');
    if (!cleanDigits) return null;
    const fullNumber = cleanDigits.startsWith('55') ? cleanDigits : `55${cleanDigits}`;
    return `https://wa.me/${fullNumber}`;
  };

  // Metrics summary
  const totalLeads = leads.length;
  const auditedLeads = leads.filter(l => l.status !== 'unscanned').length;
  const readyLeads = leads.filter(l => l.status === 'outreach_ready' || l.outreachCopies).length;
  const hotLeadsCount = leads.filter(l => l.temperature === 'hot' || l.responded).length;

  const frameworksList: { key: CopyFramework; label: string; desc: string; stage: string }[] = [
    { key: 'PAS', label: 'PAS (Abordagem 1)', desc: 'Problema-Agitação-Solução', stage: 'Etapa 1: Contato Inicial' },
    { key: 'BAB', label: 'BAB (Abordagem 2)', desc: 'Before-After-Bridge', stage: 'Etapa 1: Contato Inicial' },
    { key: 'PASTOR', label: 'PASTOR (Abordagem 3)', desc: 'Problema-Amplificação-Solução', stage: 'Etapa 1: Contato Inicial' },
    { key: '4Ps', label: '4Ps (Follow-up 1)', desc: 'Picture-Promessa-Prova-Push', stage: 'Etapa 2: Follow-up de Prova' },
    { key: 'FAB', label: 'FAB (Follow-up 2)', desc: 'Features-Advantages-Benefits', stage: 'Etapa 2: Follow-up de Prova' },
    { key: 'ACCA', label: 'ACCA (Follow-up 3)', desc: 'Alerta-Compreensão-Convicção', stage: 'Etapa 2: Follow-up de Prova' },
    { key: '4Us', label: '4Us (Urgência 1)', desc: 'Útil-Urgente-Único-Ultraespecífico', stage: 'Etapa 3: Urgência & Fechamento' },
    { key: 'QUEST', label: 'QUEST (Urgência 2)', desc: 'Qualificar-Educar-Transição', stage: 'Etapa 3: Urgência & Fechamento' },
    { key: 'Falsa Lógica', label: 'Falsa Lógica (Incontestável)', desc: 'Persuasão por Lógica Incontestável', stage: 'Etapa 3: Urgência & Fechamento' },
  ];

  const getTemperatureBadge = (lead: HunterLead) => {
    const temp = lead.temperature || (lead.responded ? 'hot' : lead.status === 'contacted' ? 'warm' : 'cold');
    switch (temp) {
      case 'hot':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold bg-red-100 text-red-700 border border-red-300 flex items-center gap-1">🚀 QUENTE (Respondeu)</span>;
      case 'warm':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">🔥 MORNO (Em Cadência)</span>;
      case 'converted':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">✅ CONVERTIDO</span>;
      case 'lost':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold bg-zinc-200 text-zinc-600 border border-zinc-300 flex items-center gap-1">❌ INATIVO</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">❄️ FRIO (Minerado)</span>;
    }
  };

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
                ESTEIRA DE OUTBOUND // LINKEDIN VS GOOGLE MEU NEGÓCIO
              </span>
              <span className="text-[10px] font-mono text-zinc-400">lead_hunter_v10</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight font-display text-white flex items-center gap-3">
              <IconTarget className="w-7 h-7 text-emerald-400" />
              Lead Hunter — Inteligência Comercial Outbound
            </h1>
            <p className="text-zinc-400 text-xs mt-1 max-w-2xl leading-relaxed">
              Mineração autônoma por fonte (LinkedIn Decisores B2B ou Google Meu Negócio / Maps), captação de Telefone/WhatsApp, E-mail e Endereço, com esteira de 9 copys e controle de temperatura.
            </p>
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
            <p className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Micro-Auditados (8 Agentes)</p>
            <p className="text-2xl font-extrabold text-emerald-600 font-display mt-0.5">{auditedLeads}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <IconActivity className="w-5 h-5" />
          </div>
        </div>

        <div className="tactile-raised p-4 bg-white rounded-2xl border border-zinc-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Copys & Sequência Pronta</p>
            <p className="text-2xl font-extrabold text-blue-600 font-display mt-0.5">{readyLeads}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <IconSend className="w-5 h-5" />
          </div>
        </div>

        <div className="tactile-raised p-4 bg-white rounded-2xl border border-zinc-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Leads Quentes (Responderam)</p>
            <p className="text-2xl font-extrabold text-red-600 font-display mt-0.5">{hotLeadsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <IconRocket className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Mining Control Panel */}
      <div className="tactile-card p-6 bg-white rounded-2xl border border-zinc-200/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <IconBot className="w-5 h-5 text-zinc-800" />
            <h2 className="font-bold text-sm font-display text-zinc-900">Parâmetros de Mineração Autônoma</h2>
          </div>
          <span className="text-xs font-mono text-zinc-400">Fase 1: Captação de Decisores por Fonte</span>
        </div>

        <form onSubmit={handleStartMining} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
            {/* Mining Data Source Selector */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Fonte de Mineração / Dados</label>
              <select
                value={miningSource}
                onChange={e => setMiningSource(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-semibold"
              >
                <option value="google">📍 Google (Business / Maps + Orgânico)</option>
                <option value="linkedin">💼 LinkedIn (Decisores B2B via Apify)</option>
                <option value="auto">⚡ Automático (Inteligência Combinada)</option>
              </select>
            </div>

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
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Qtd. Leads</label>
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
          </div>

        </form>
      </div>

      {/* Redesigned Harmonious Card-Based Leads List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-bold text-base font-display text-zinc-900 flex items-center gap-2">
            <span>Esteira Comercial — Leads Capturados</span>
            <span className="text-xs font-mono font-normal text-zinc-400">({leads.length})</span>
          </h2>
          <span className="text-xs font-mono text-zinc-400">Ordenado por recente</span>
        </div>

        {loading ? (
          <div className="p-12 bg-white rounded-2xl border border-zinc-200 text-center text-zinc-500 text-xs font-mono flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            <span>Carregando esteira de prospecção do Firestore...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-zinc-200 text-center text-zinc-400 text-xs space-y-2">
            <IconTarget className="w-10 h-10 mx-auto text-zinc-300" />
            <p className="font-semibold text-zinc-700">Nenhum lead nesta lista</p>
            <p>Preencha os parâmetros acima e clique em Minerar para trazer novas empresas qualificadas.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {leads.map(lead => {
              const waLink = formatWhatsappLink(lead.phone);
              return (
                <div 
                  key={lead.id}
                  className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  {/* Top Header Bar: Company, Decisor & Temperature Controls */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-100 pb-3.5">
                    
                    {/* Left Info: Company & Source Badge */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase tracking-wide ${
                          lead.source === 'google' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {lead.source === 'google' ? '📍 Google Business' : '💼 LinkedIn'}
                        </span>
                        <h3 className="font-bold text-base text-zinc-950 font-display">{lead.company}</h3>
                        <a 
                          href={`https://${lead.domain}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs text-blue-600 hover:underline font-mono"
                        >
                          {lead.domain} ↗
                        </a>
                        {lead.niche && (
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-mono">
                            {lead.niche}
                          </span>
                        )}
                      </div>

                      {/* Decisor & Contacts */}
                      <div className="flex items-center gap-3 text-xs text-zinc-600 flex-wrap pt-0.5">
                        <span className="inline-flex items-center gap-1.5">
                          {lead.photoUrl ? (
                            <img src={lead.photoUrl} alt={lead.contactName} className="w-5 h-5 rounded-full object-cover border border-zinc-200" />
                          ) : (
                            <span>👤</span>
                          )}
                          <strong>{lead.contactName || 'Contato a confirmar'}</strong> ({lead.contactRole || 'CEO'})
                        </span>
                        <span className="text-zinc-300">•</span>
                        <span>✉️ <span className="font-mono text-zinc-800">{lead.email || <em className="text-zinc-400 font-sans">E-mail a confirmar</em>}</span></span>
                        
                        {/* Phone & WhatsApp 1-Click Link */}
                        {lead.phone && (
                          <>
                            <span className="text-zinc-300">•</span>
                            <span className="font-mono text-zinc-800">📞 {lead.phone}</span>
                            {waLink && (
                              <a 
                                href={waLink} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] font-bold hover:bg-emerald-200 transition-all inline-flex items-center gap-1"
                              >
                                💬 WhatsApp ↗
                              </a>
                            )}
                          </>
                        )}

                        {lead.address && (
                          <>
                            <span className="text-zinc-300">•</span>
                            <span className="text-zinc-500 font-mono text-[11px]">📍 {lead.address}</span>
                          </>
                        )}

                        {lead.linkedinUrl && (
                          <>
                            <span className="text-zinc-300">•</span>
                            <a 
                              href={lead.linkedinUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-blue-600 hover:underline font-mono text-[11px] font-bold"
                            >
                              LinkedIn Profile →
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Info: Temperature Dropdown & Responded Status */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Temperature Dropdown */}
                      <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1">
                        <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">TEMP:</span>
                        <select
                          value={lead.temperature || (lead.responded ? 'hot' : lead.status === 'contacted' ? 'warm' : 'cold')}
                          onChange={e => handleUpdateLeadState(lead.id, { temperature: e.target.value as LeadTemperature })}
                          className="bg-transparent text-xs font-mono font-bold text-zinc-900 focus:outline-none cursor-pointer"
                        >
                          <option value="cold">❄️ Frio (Não Abordado)</option>
                          <option value="warm">🔥 Morno (Em Cadência)</option>
                          <option value="hot">🚀 Quente (Respondeu!)</option>
                          <option value="converted">✅ Convertido (Cliente)</option>
                          <option value="lost">❌ Inativo / Perdido</option>
                        </select>
                      </div>

                      {/* Responded Toggle */}
                      <button
                        onClick={() => {
                          const newResponded = !lead.responded;
                          handleUpdateLeadState(lead.id, { 
                            responded: newResponded,
                            temperature: newResponded ? 'hot' : (lead.temperature || 'warm')
                          });
                        }}
                        title="Marcar se o lead respondeu à abordagem"
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                          lead.responded 
                            ? 'bg-red-500 text-white border-red-600 shadow-xs' 
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                        }`}
                      >
                        <span>💬 {lead.responded ? 'Respondeu ✓' : 'Aguardando Resposta'}</span>
                      </button>
                    </div>

                  </div>

                  {/* Middle Section: GEO Score & IA Diagnostic Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/70 p-3 rounded-xl border border-zinc-150 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-zinc-700">Score GEO Real:</span>
                      <span className={`font-bold font-mono px-2.5 py-1 rounded-lg text-xs ${
                        (lead.geoScoreEstimado || 0) < 40 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {lead.geoScoreEstimado || 0}%
                      </span>
                      <span className={`text-[11px] font-semibold ${lead.aiCrawlersBlocked ? 'text-red-600' : 'text-emerald-600'}`}>
                        {lead.aiCrawlersBlocked ? '⚠️ Bloqueia Robôs no robots.txt' : '✓ Robôs IA permitidos'}
                      </span>
                    </div>

                    {lead.citedCompetitor && (
                      <div className="text-[11px] text-zinc-500 font-mono">
                        Concorrente Citado nas IAs: <strong className="text-zinc-800">{lead.citedCompetitor}</strong>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Bar: Unified Height (h-9), Clean Alignment & Cohesive Styling */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    
                    {/* Left Subgroup: Client Deliverables */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase mr-1 hidden sm:inline">Entregáveis:</span>
                      <button
                        onClick={() => handleViewHtmlReport(lead)}
                        className="h-9 px-3.5 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <span>👁️ Ver HTML</span>
                      </button>
                      <button
                        onClick={() => handleDownloadPdfReport(lead)}
                        disabled={downloadingPdfId === lead.id}
                        className="h-9 px-3.5 bg-white hover:bg-red-50 text-red-700 border border-zinc-300 hover:border-red-200 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        {downloadingPdfId === lead.id ? 'Baixando...' : '📕 Baixar PDF'}
                      </button>
                    </div>

                    {/* Right Subgroup: Agent Pipeline Actions */}
                    <div className="flex items-center gap-2">
                      
                      {/* Audit 8 Agents */}
                      <button
                        onClick={() => handleRunQuickAudit(lead)}
                        disabled={auditingId === lead.id}
                        title="Rodar diagnóstico completo com os 8 Agentes Especialistas"
                        className="h-9 px-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200/90 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <IconActivity className={`w-3.5 h-3.5 ${auditingId === lead.id ? 'animate-spin' : ''}`} />
                        <span>Audit 8 Agentes</span>
                      </button>

                      {/* Copy Pipeline */}
                      <button
                        onClick={() => {
                          if (lead.outreachCopies) {
                            setSelectedLeadForCopy(lead);
                          } else {
                            handleGenerateOutreach(lead);
                          }
                        }}
                        disabled={generatingCopyId === lead.id}
                        className="h-9 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-mono font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                      >
                        <IconSend className={`w-3.5 h-3.5 text-emerald-400 ${generatingCopyId === lead.id ? 'animate-bounce' : ''}`} />
                        <span>{lead.outreachCopies ? 'Ver Copys (Pipeline)' : 'Gerar 9 Copys'}</span>
                      </button>

                      {/* Promote to Main Lead Workspace */}
                      <button
                        onClick={() => handlePromoteToMainPipeline(lead)}
                        disabled={promotingId === lead.id}
                        title="Promover lead e transferir para a aba Leads principal"
                        className="h-9 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <IconRocket className={`w-3.5 h-3.5 ${promotingId === lead.id ? 'animate-spin' : ''}`} />
                        <span>Promover GEO</span>
                      </button>

                      {/* Delete Lead */}
                      <button
                        onClick={() => handleDeleteLead(lead.id, lead.company)}
                        disabled={deletingId === lead.id}
                        title="Excluir este lead da lista"
                        className="h-9 w-9 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/90 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
                      >
                        <IconTrash className={`w-3.5 h-3.5 ${deletingId === lead.id ? 'animate-spin' : ''}`} />
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Copy Pipeline & Email Dispatcher Modal (With Edit & Save Support) */}
      {selectedLeadForCopy && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    ESTEIRA DE COPYS & FOLLOW-UP (9 FRAMEWORKS)
                  </span>
                  {getTemperatureBadge(selectedLeadForCopy)}
                </div>
                <h3 className="text-lg font-bold text-zinc-900 font-display mt-1">
                  Cadência para {selectedLeadForCopy.contactName || selectedLeadForCopy.company} ({selectedLeadForCopy.company})
                </h3>
              </div>
              <button 
                onClick={() => setSelectedLeadForCopy(null)}
                className="text-zinc-400 hover:text-zinc-800 p-1.5 rounded-lg cursor-pointer"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Framework Switcher Tabs Grouped by Sequence Stage */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Selecione o Framework / Estágio da Cadência:</span>
              <div className="flex flex-wrap gap-1.5 border-b border-zinc-100 pb-3">
                {frameworksList.map(fw => (
                  <button
                    key={fw.key}
                    onClick={() => setCopyTab(fw.key)}
                    title={`${fw.desc} (${fw.stage})`}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer font-mono ${
                      copyTab === fw.key 
                        ? 'bg-zinc-950 text-white shadow-sm' 
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {fw.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Framework Banner */}
            <div className="px-3 py-2 bg-zinc-100 rounded-xl text-xs font-mono text-zinc-700 border border-zinc-200/80 flex items-center justify-between">
              <span><strong>Fase:</strong> {frameworksList.find(f => f.key === copyTab)?.stage} — <strong>Estrutura:</strong> {frameworksList.find(f => f.key === copyTab)?.desc}</span>
            </div>

            {/* Copy Content Editors */}
            <div className="space-y-4">
              
              {/* LinkedIn Direct Message Editor */}
              <div className="tactile-raised p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 font-display flex items-center gap-1.5">
                    <span>💬 Message Direct LinkedIn ({copyTab}) — Editable</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(editedLinkedinText, 'linkedin')}
                    className="px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    {copiedField === 'linkedin' ? <IconCheck className="w-3.5 h-3.5 text-emerald-600" /> : <IconCopy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'linkedin' ? 'Copiado!' : 'Copiar para LinkedIn'}</span>
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={editedLinkedinText}
                  onChange={e => setEditedLinkedinText(e.target.value)}
                  className="w-full p-3 bg-white rounded-lg border border-zinc-300 text-xs text-zinc-800 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  placeholder="Edite a copy do LinkedIn aqui..."
                />
              </div>

              {/* Email Cold Outreach Editor + Send Controls */}
              <div className="tactile-raised p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-zinc-800 font-display flex items-center gap-1.5">
                    <span>✉️ Cold E-mail Corporativo ({copyTab}) — Editable</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(editedEmailText, 'email')}
                      className="px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      {copiedField === 'email' ? <IconCheck className="w-3.5 h-3.5 text-emerald-600" /> : <IconCopy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'email' ? 'Copiado!' : 'Copiar Texto'}</span>
                    </button>

                    {/* Direct Email Dispatch Button */}
                    <button
                      onClick={handleSendDirectEmail}
                      disabled={sendingEmail}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
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

                {/* Attachment options */}
                <div className="flex flex-wrap items-center gap-4 px-1 text-xs">
                  <label className="font-semibold text-zinc-700 flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={attachPdfReport} 
                      onChange={e => setAttachPdfReport(e.target.checked)} 
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Anexar Relatório PDF no E-mail</span>
                  </label>
                  <label className="font-semibold text-zinc-700 flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={attachReportLink} 
                      onChange={e => setAttachReportLink(e.target.checked)} 
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Anexar link do Relatório GEO ao final</span>
                  </label>
                </div>

                <textarea
                  rows={8}
                  value={editedEmailText}
                  onChange={e => setEditedEmailText(e.target.value)}
                  className="w-full p-3 bg-white rounded-lg border border-zinc-300 text-xs text-zinc-800 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  placeholder="Edite a copy do e-mail aqui..."
                />
              </div>

            </div>

            {/* Bottom Actions: Save Edited Copy & Close */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
              <button
                onClick={handleSaveEditedCopy}
                disabled={savingCopy}
                className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {savingCopy ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <span>💾 Salvar Alterações na Copy</span>
                  </>
                )}
              </button>

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

      {/* HTML Report Preview Modal */}
      {htmlPreviewModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 bg-zinc-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <IconShield className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm font-display">{htmlPreviewModal.title}</h3>
              </div>
              <button 
                onClick={() => setHtmlPreviewModal(null)}
                className="text-zinc-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <iframe 
              src={htmlPreviewModal.url} 
              className="w-full flex-1 border-none bg-[#f4f5f8]" 
              title="GEO Report Preview"
            />
          </div>
        </div>
      )}

    </div>
  );
}
