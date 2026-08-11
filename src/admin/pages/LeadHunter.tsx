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
  IconEdit,
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
  website?: string;
  isSocialOnly?: boolean;
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
  source?: 'linkedin' | 'google' | 'auto' | 'import';
  status: 'unscanned' | 'audited' | 'outreach_ready' | 'contacted' | 'converted';
  temperature?: LeadTemperature;
  sequenceStage?: number; // 0: Não iniciado, 1: Abordagem Inicial, 2: Follow-up Impacto, 3: Urgência, 4: Fechamento
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
  const [sendingEmail, setSendingEmail] = useState(false);
  const [savingCopy, setSavingCopy] = useState(false);

  // Mining parameters
  const [miningSource, setMiningSource] = useState<'google' | 'linkedin' | 'auto' | 'import'>('google');
  const [importUrls, setImportUrls] = useState('');
  const [niche, setNiche] = useState('SaaS B2B');
  const [location, setLocation] = useState('Brasil');
  const [targetRole, setTargetRole] = useState('CEO / CMO / Founder');
  const [companySize, setCompanySize] = useState('20-200 funcionários');
  const [limit, setLimit] = useState(5);

  // Detailed Lead View Drawer / Modal
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<HunterLead | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'copies'>('overview');

  // Copy View & Framework State
  const [copyTab, setCopyTab] = useState<CopyFramework>('PAS');
  const [editedLinkedinText, setEditedLinkedinText] = useState('');
  const [editedEmailText, setEditedEmailText] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [attachReportLink, setAttachReportLink] = useState(true);
  const [attachHtmlReport, setAttachHtmlReport] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // HTML Report Preview Modal & Lead Editing State
  const [htmlPreviewModal, setHtmlPreviewModal] = useState<{ url: string; title: string } | null>(null);
  const [editingLead, setEditingLead] = useState<HunterLead | null>(null);

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
          urls: miningSource === 'import' ? importUrls.split('\n').map(u => u.trim()).filter(Boolean) : undefined,
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
        showToastMsg(`⚠️ Erro na mineração: ${errData.error || 'Falha na conexão'}`);
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
    showToastMsg(`Iniciando Diagnóstico GEO de 8 Agentes para ${lead.domain}...`);
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
        showToastMsg(`Diagnóstico GEO concluído! Score: ${data.updatedLead.geoScoreEstimado}%`);
        const updatedLead = { ...lead, ...data.updatedLead };
        setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
        if (selectedLeadForDetail?.id === lead.id) {
          setSelectedLeadForDetail(updatedLead);
        }
      } else {
        showToastMsg(`Falha no diagnóstico de ${lead.domain}`);
      }
    } catch (err: any) {
      showToastMsg(`Erro no diagnóstico: ${err.message}`);
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
        showToastMsg(`9 Copys geradas com sucesso para ${lead.company}!`);
        const updated = { 
          ...lead, 
          outreachCopies: data.outreachCopies, 
          status: 'outreach_ready' as const,
          temperature: (lead.temperature || 'cold') as LeadTemperature,
          sequenceStage: lead.sequenceStage || 0
        };
        setLeads(prev => prev.map(l => l.id === lead.id ? updated : l));
        if (selectedLeadForDetail?.id === lead.id) {
          setSelectedLeadForDetail(updated);
        }
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
        showToastMsg(`Lead ${lead.company} promovido e transferido para a esteira principal!`);
        setLeads(prev => prev.filter(l => l.id !== lead.id));
        if (selectedLeadForDetail?.id === lead.id) {
          setSelectedLeadForDetail(null);
        }
        if (onNavigate && data.mainLeadId) {
          onNavigate('leads', data.mainLeadId);
        }
      } else {
        showToastMsg('Erro ao promover lead');
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
        if (selectedLeadForDetail?.id === leadId) {
          setSelectedLeadForDetail(null);
        }
      } else {
        showToastMsg('Erro ao excluir lead');
      }
    } catch (err: any) {
      showToastMsg(`Erro ao excluir: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Update Lead Temperature / Responded / Sequence / Pipeline
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
        if (selectedLeadForDetail && selectedLeadForDetail.id === leadId) {
          setSelectedLeadForDetail(prev => prev ? { ...prev, ...updates } : null);
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
        showToastMsg('Relatório HTML não encontrado. Execute o Diagnóstico primeiro.');
      }
    } catch (err: any) {
      showToastMsg(`Erro ao carregar relatório: ${err.message}`);
    }
  };

  // Download HTML Report
  const handleDownloadHtmlReport = async (lead: HunterLead) => {
    showToastMsg(`Baixando relatório HTML para ${lead.domain}...`);
    try {
      const token = await getAdminToken();
      const res = await fetch(`/api/admin/lead-hunter/html/${lead.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const text = await res.text();
        const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Relatorio_GEO_${lead.domain}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToastMsg('Download do Relatório HTML concluído!');
      } else {
        showToastMsg('Erro ao gerar relatório HTML. Execute o Diagnóstico primeiro.');
      }
    } catch (err: any) {
      showToastMsg(`Erro no download: ${err.message}`);
    }
  };

  // Helper functions for Copy Framework keys
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

  // Get framework stage number (1, 2, or 3)
  const getFrameworkStageNumber = (tab: CopyFramework): number => {
    if (['PAS', 'BAB', 'PASTOR'].includes(tab)) return 1;
    if (['4Ps', 'FAB', 'ACCA'].includes(tab)) return 2;
    if (['4Us', 'QUEST', 'Falsa Lógica'].includes(tab)) return 3;
    return 1;
  };

  // Sync active copy tab into local editable text state
  useEffect(() => {
    if (selectedLeadForDetail) {
      setEditedLinkedinText(getLinkedinCopyText(selectedLeadForDetail, copyTab));
      setEditedEmailText(getEmailCopyText(selectedLeadForDetail, copyTab));
    }
  }, [selectedLeadForDetail, copyTab]);

  // Check if a specific copy has been dispatched/sent
  const checkIsCopySent = (lead: HunterLead, tab: CopyFramework) => {
    const emailKey = getEmailCopyKey(tab);
    return lead.sentHistory?.find(item => item.copyKey === emailKey);
  };

  // Toggle Sent Checkbox for Copy (Anti-Duplicidade System)
  const handleToggleCopySent = (lead: HunterLead, tab: CopyFramework) => {
    const emailKey = getEmailCopyKey(tab);
    const existing = checkIsCopySent(lead, tab);

    let updatedHistory: SentHistoryItem[];
    let nextStage = lead.sequenceStage || 0;

    if (existing) {
      // Uncheck / Remove from history
      updatedHistory = (lead.sentHistory || []).filter(item => item.copyKey !== emailKey);
      showToastMsg(`Status da copy ${tab} alterado para NÃO ENVIADO.`);
    } else {
      // Check / Add to history
      const newItem: SentHistoryItem = {
        copyKey: emailKey,
        sentAt: new Date().toISOString(),
        channel: 'email',
        subject: `Ponto cego na visibilidade IA da ${lead.company}`
      };
      updatedHistory = [...(lead.sentHistory || []), newItem];

      const stageNum = getFrameworkStageNumber(tab);
      nextStage = Math.max(lead.sequenceStage || 0, stageNum);
      showToastMsg(`✓ Copy ${tab} marcada como enviada! Pipeline atualizado para Etapa ${nextStage}.`);
    }

    const updates: Partial<HunterLead> = {
      sentHistory: updatedHistory,
      sequenceStage: nextStage,
      status: nextStage > 0 ? 'contacted' : lead.status,
      temperature: lead.temperature === 'cold' && nextStage > 0 ? 'warm' : lead.temperature
    };

    handleUpdateLeadState(lead.id, updates);
  };

  // Save edited copy back to Firestore
  const handleSaveEditedCopy = async () => {
    if (!selectedLeadForDetail) return;
    setSavingCopy(true);

    const lKey = getLinkedinCopyKey(copyTab);
    const eKey = getEmailCopyKey(copyTab);

    const updatedCopies = {
      ...(selectedLeadForDetail.outreachCopies || {}),
      [lKey]: editedLinkedinText,
      [eKey]: editedEmailText
    };

    try {
      const token = await getAdminToken();
      const res = await fetch(`/api/admin/lead-hunter/leads/${selectedLeadForDetail.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ outreachCopies: updatedCopies })
      });

      if (res.ok) {
        showToastMsg(`💾 Copy (${copyTab}) salva com sucesso!`);
        const updatedLead = { ...selectedLeadForDetail, outreachCopies: updatedCopies };
        setSelectedLeadForDetail(updatedLead);
        setLeads(prev => prev.map(l => l.id === selectedLeadForDetail.id ? updatedLead : l));
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
    if (!selectedLeadForDetail) return;
    const recipientEmail = selectedLeadForDetail.email;
    let currentEmailBody = editedEmailText;

    if (!currentEmailBody) {
      showToastMsg('Gere primeiro a copy antes de enviar o e-mail');
      return;
    }

    if (attachReportLink) {
      currentEmailBody += `\n\n📌 Acesse a auditoria completa de visibilidade do seu domínio: https://geo.berocket.com.br`;
    }

    const lines = currentEmailBody.split('\n');
    let subject = `Ponto cego na visibilidade IA da ${selectedLeadForDetail.company}`;
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
          leadId: selectedLeadForDetail.id,
          recipientEmail,
          subject,
          emailBody: body,
          attachPdf: attachHtmlReport
        })
      });

      if (res.ok) {
        showToastMsg(`🚀 E-mail enviado com sucesso para ${recipientEmail}!`);
        setCopiedField('sent');

        const emailKey = getEmailCopyKey(copyTab);
        const newHistoryItem: SentHistoryItem = {
          copyKey: emailKey,
          sentAt: new Date().toISOString(),
          channel: 'email',
          subject,
          attachPdf: attachHtmlReport
        };

        const updatedHistory = [...(selectedLeadForDetail.sentHistory || []).filter(h => h.copyKey !== emailKey), newHistoryItem];
        const stageNum = getFrameworkStageNumber(copyTab);
        const nextStage = Math.max(selectedLeadForDetail.sequenceStage || 0, stageNum);

        handleUpdateLeadState(selectedLeadForDetail.id, {
          status: 'contacted',
          temperature: selectedLeadForDetail.temperature === 'cold' ? 'warm' : selectedLeadForDetail.temperature,
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

  const formatWhatsappLink = (phoneStr?: string) => {
    if (!phoneStr) return null;
    const cleanDigits = phoneStr.replace(/\D/g, '');
    if (!cleanDigits) return null;
    const fullNumber = cleanDigits.startsWith('55') ? cleanDigits : `55${cleanDigits}`;
    return `https://wa.me/${fullNumber}`;
  };

  // Get sequence stage label for table/pipeline
  const getPipelineLabel = (stage?: number) => {
    switch (stage) {
      case 1: return 'Iniciado - Etapa 1 (Abordagem)';
      case 2: return 'Iniciado - Etapa 2 (Follow-up)';
      case 3: return 'Iniciado - Etapa 3 (Urgência)';
      case 4: return 'Iniciado - Etapa 4 (Fechamento)';
      default: return 'Não iniciado';
    }
  };

  // Metrics summary
  const totalLeads = leads.length;
  const auditedLeads = leads.filter(l => l.status !== 'unscanned' || l.geoScoreEstimado !== undefined).length;
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
    { key: 'Falsa Lógica', label: 'Falsa Lógica', desc: 'Persuasão por Lógica Incontestável', stage: 'Etapa 3: Urgência & Fechamento' },
  ];

  const getTemperatureBadge = (lead: HunterLead) => {
    const temp = lead.temperature || (lead.responded ? 'hot' : lead.status === 'contacted' ? 'warm' : 'cold');
    switch (temp) {
      case 'hot':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-200">🚀 Quente</span>;
      case 'warm':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">🔥 Morno</span>;
      case 'converted':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">✅ Convertido</span>;
      case 'lost':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-200 text-zinc-600 border border-zinc-300">❌ Inativo</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">❄️ Frio</span>;
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
                ESTEIRA PIPELINE DE OUTBOUND // GOOGLE & LINKEDIN
              </span>
              <span className="text-[10px] font-mono text-zinc-400">v11_pipeline</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight font-display text-white flex items-center gap-3">
              <IconTarget className="w-7 h-7 text-emerald-400" />
              Lead Hunter — Inteligência Comercial Outbound
            </h1>
            <p className="text-zinc-400 text-xs mt-1 max-w-2xl leading-relaxed">
              Tabela pipeline limpa para qualificação visual de empresas, com diagnóstico GEO instantâneo e gestão de copys anti-duplicidade.
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
            <p className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Diagnóstico GEO (8 Agentes)</p>
            <p className="text-2xl font-extrabold text-emerald-600 font-display mt-0.5">{auditedLeads}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <IconActivity className="w-5 h-5" />
          </div>
        </div>

        <div className="tactile-raised p-4 bg-white rounded-2xl border border-zinc-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Copys Prontas</p>
            <p className="text-2xl font-extrabold text-blue-600 font-display mt-0.5">{readyLeads}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <IconSend className="w-5 h-5" />
          </div>
        </div>

        <div className="tactile-raised p-4 bg-white rounded-2xl border border-zinc-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Leads Quentes</p>
            <p className="text-2xl font-extrabold text-red-600 font-display mt-0.5">{hotLeadsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <IconRocket className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Mining Control Panel */}
      <div className="tactile-card p-5 bg-white rounded-2xl border border-zinc-200/60 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
          <div className="flex items-center gap-2">
            <IconBot className="w-4 h-4 text-zinc-800" />
            <h2 className="font-bold text-xs font-display text-zinc-900 uppercase tracking-wider">Parâmetros de Mineração Autônoma</h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">Apify / Google Maps & LinkedIn</span>
        </div>

        <form onSubmit={handleStartMining} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Fonte de Mineração</label>
              <select
                value={miningSource}
                onChange={e => setMiningSource(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-semibold"
              >
                <option value="google">📍 Google (Business / Maps)</option>
                <option value="linkedin">💼 LinkedIn (Decisores B2B)</option>
                <option value="auto">⚡ Automático (Combinado)</option>
                <option value="import">📥 Importação por Lista de URLs</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Nicho / Segmento</label>
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
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Localização</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Ex: Brasil"
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Qtd. Leads</label>
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
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={mining}
                className="w-full py-2 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 h-9"
              >
                {mining ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{miningSource === 'import' ? 'Varrendo URLs...' : 'Minerando...'}</span>
                  </>
                ) : (
                  <>
                    <IconRocket className="w-4 h-4 text-emerald-400" />
                    <span>{miningSource === 'import' ? 'Importar & Varrer' : 'Minerar'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Se a fonte for Importação por Lista de URLs, exibe campo de texto multilinhas */}
          {miningSource === 'import' && (
            <div className="mt-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2 transition-all">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>📥 Insira a Lista de URLs para Varredura Autônoma</span>
                </label>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md font-semibold">
                  1 URL por linha
                </span>
              </div>
              <p className="text-[11px] text-zinc-600">
                Cole abaixo links de sites de empresas (ex: <code className="bg-white px-1 py-0.5 rounded border border-zinc-200">https://empresa.com.br</code>) ou perfis/páginas do LinkedIn (ex: <code className="bg-white px-1 py-0.5 rounded border border-zinc-200">https://linkedin.com/in/decisor</code>). Nossos agentes de IA farão a varredura, extração dos dados e alimentará o seu Lead Hunter.
              </p>
              <textarea
                value={importUrls}
                onChange={e => setImportUrls(e.target.value)}
                placeholder={"https://empresa1.com.br\nhttps://www.linkedin.com/in/decisor-exemplo\nhttps://www.linkedin.com/company/empresa-exemplo"}
                rows={5}
                className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono shadow-inner"
                required={miningSource === 'import'}
              />
            </div>
          )}
        </form>
      </div>

      {/* Clean Pipeline Table View */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
        
        {/* Table Toolbar / Header */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-base font-display text-zinc-950 flex items-center gap-2">
              <span>Pipeline de Leads</span>
              <span className="text-xs font-mono font-normal text-zinc-400">({leads.length} capturados)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Clique em uma linha para abrir a página completa do lead com copys e entregáveis.</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={fetchLeads}
              className="p-2 hover:bg-zinc-100 text-zinc-600 rounded-lg transition-all cursor-pointer border border-zinc-200"
              title="Atualizar lista"
            >
              <IconRefresh className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-xs font-mono flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            <span>Carregando pipeline de leads do Firestore...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-xs space-y-2">
            <IconTarget className="w-10 h-10 mx-auto text-zinc-300" />
            <p className="font-semibold text-zinc-700">Nenhum lead minerado ainda</p>
            <p>Preencha os parâmetros de mineração acima e clique em Minerar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-mono uppercase text-[10px]">
                  <th className="py-3 px-4 font-bold">Empresa</th>
                  <th className="py-3 px-3 font-bold">URL</th>
                  <th className="py-3 px-3 font-bold">Temperatura</th>
                  <th className="py-3 px-3 font-bold">Score</th>
                  <th className="py-3 px-3 font-bold text-center">Diagnóstico</th>
                  <th className="py-3 px-3 font-bold">Pipeline (Follow-up)</th>
                  <th className="py-3 px-3 font-bold text-center">Promover</th>
                  <th className="py-3 px-4 font-bold text-right">Excluir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {leads.map(lead => {
                  const isAudited = lead.status !== 'unscanned' || lead.geoScoreEstimado !== undefined;
                  const scoreVal = lead.geoScoreEstimado !== undefined ? lead.geoScoreEstimado : 0;
                  const targetUrl = lead.website || `https://${lead.domain}`;

                  return (
                    <tr 
                      key={lead.id}
                      onClick={() => {
                        setSelectedLeadForDetail(lead);
                        setActiveDetailTab('overview');
                      }}
                      className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Empresa */}
                      <td className="py-3.5 px-4 font-medium text-zinc-950">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-950 font-display text-sm group-hover:text-blue-600 transition-colors">
                            {lead.company}
                          </span>
                          <span className={`px-1.5 py-0.2 text-[9px] font-mono rounded font-extrabold uppercase ${
                            lead.source === 'google' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            lead.source === 'import' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {lead.source === 'google' ? 'Google' : lead.source === 'import' ? 'Importação' : 'LinkedIn'}
                          </span>
                        </div>
                      </td>

                      {/* URL (Clicável) */}
                      <td className="py-3.5 px-3" onClick={e => e.stopPropagation()}>
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-mono text-xs flex items-center gap-1 inline-flex"
                          title={`Visitar ${targetUrl}`}
                        >
                          <span className="truncate max-w-[140px]">{lead.domain}</span>
                          <span>↗</span>
                        </a>
                      </td>

                      {/* Temperatura do Lead (Dropdown) */}
                      <td className="py-3.5 px-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={lead.temperature || (lead.responded ? 'hot' : lead.status === 'contacted' ? 'warm' : 'cold')}
                          onChange={e => handleUpdateLeadState(lead.id, { temperature: e.target.value as LeadTemperature })}
                          className="bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-zinc-900 focus:outline-none cursor-pointer"
                        >
                          <option value="cold">❄️ Frio</option>
                          <option value="warm">🔥 Morno</option>
                          <option value="hot">🚀 Quente</option>
                          <option value="converted">✅ Convertido</option>
                          <option value="lost">❌ Inativo</option>
                        </select>
                      </td>

                      {/* Score GEO */}
                      <td className="py-3.5 px-3 font-mono font-bold">
                        {isAudited ? (
                          <span className={`px-2 py-0.5 rounded text-xs inline-block ${
                            scoreVal >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                          }`}>
                            {scoreVal}%
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-normal text-[11px]">Pendente</span>
                        )}
                      </td>

                      {/* Botão Diagnóstico (Mudar para Diagnostico) */}
                      <td className="py-3.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleRunQuickAudit(lead)}
                          disabled={auditingId === lead.id}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300/80 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
                          title="Rodar Diagnóstico de 8 Agentes Especialistas"
                        >
                          <IconActivity className={`w-3.5 h-3.5 ${auditingId === lead.id ? 'animate-spin text-emerald-600' : ''}`} />
                          <span>Diagnóstico</span>
                        </button>
                      </td>

                      {/* Pipeline (Follow up: Não iniciado, Iniciado 1, 2, 3, 4...) */}
                      <td className="py-3.5 px-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={lead.sequenceStage || 0}
                          onChange={e => {
                            const newStage = Number(e.target.value);
                            handleUpdateLeadState(lead.id, { 
                              sequenceStage: newStage,
                              status: newStage > 0 ? 'contacted' : lead.status,
                              temperature: newStage > 0 && lead.temperature === 'cold' ? 'warm' : lead.temperature
                            });
                          }}
                          className="bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-lg px-2 py-1 text-xs font-mono font-medium text-zinc-900 focus:outline-none cursor-pointer max-w-[180px]"
                        >
                          <option value={0}>⚪ Não iniciado</option>
                          <option value={1}>🟡 Iniciado (Etapa 1 - Abordagem)</option>
                          <option value={2}>🟠 Iniciado (Etapa 2 - Follow-up)</option>
                          <option value={3}>🔴 Iniciado (Etapa 3 - Urgência)</option>
                          <option value={4}>🟢 Iniciado (Etapa 4 - Fechamento)</option>
                        </select>
                      </td>

                      {/* Promover GEO */}
                      <td className="py-3.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handlePromoteToMainPipeline(lead)}
                          disabled={promotingId === lead.id}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
                          title="Promover para esteira principal de leads"
                        >
                          <IconRocket className={`w-3.5 h-3.5 ${promotingId === lead.id ? 'animate-spin' : ''}`} />
                          <span>Promover</span>
                        </button>
                      </td>

                      {/* Excluir */}
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteLead(lead.id, lead.company)}
                          disabled={deletingId === lead.id}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition-all cursor-pointer inline-flex items-center justify-center"
                          title="Excluir Lead"
                        >
                          <IconTrash className={`w-3.5 h-3.5 ${deletingId === lead.id ? 'animate-spin' : ''}`} />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* FULL LEAD DETAIL DRAWER / PAGE MODAL (Ao Clicar no Lead) */}
      {selectedLeadForDetail && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-zinc-200 space-y-5 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-mono uppercase bg-zinc-900 text-white font-bold px-2 py-0.5 rounded">
                    GERENCIAMENTO COMPLETO DO LEAD
                  </span>
                  {getTemperatureBadge(selectedLeadForDetail)}
                  <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 font-mono text-[10px] rounded font-bold">
                    Pipeline: {getPipelineLabel(selectedLeadForDetail.sequenceStage)}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-zinc-950 font-display flex items-center gap-2">
                  <span>{selectedLeadForDetail.company}</span>
                  <a
                    href={selectedLeadForDetail.website || `https://${selectedLeadForDetail.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline font-mono font-normal"
                  >
                    {selectedLeadForDetail.domain} ↗
                  </a>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingLead(selectedLeadForDetail)}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-xl text-xs font-bold font-mono flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <IconEdit className="w-3.5 h-3.5" />
                  <span>Editar Dados</span>
                </button>
                <button 
                  onClick={() => setSelectedLeadForDetail(null)}
                  className="text-zinc-400 hover:text-zinc-800 p-1.5 rounded-lg cursor-pointer"
                >
                  <IconX className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs inside Lead Page */}
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 font-mono text-xs">
              <button
                onClick={() => setActiveDetailTab('overview')}
                className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeDetailTab === 'overview'
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                📋 Visão Geral & Entregáveis
              </button>
              <button
                onClick={() => {
                  setActiveDetailTab('copies');
                  if (!selectedLeadForDetail.outreachCopies) {
                    handleGenerateOutreach(selectedLeadForDetail);
                  }
                }}
                className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeDetailTab === 'copies'
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                <IconSend className="w-3.5 h-3.5 text-emerald-400" />
                <span>✍️ Gerenciador de Copys & Disparos</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW & DELIVERABLES */}
            {activeDetailTab === 'overview' && (
              <div className="space-y-5">
                
                {/* Collected Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Contact Info Card */}
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                    <h3 className="font-bold text-xs font-mono uppercase text-zinc-400">Decisor & Contato</h3>
                    <div className="text-xs space-y-1.5">
                      <p><strong>Nome:</strong> {selectedLeadForDetail.contactName || 'Contato a confirmar'}</p>
                      <p><strong>Cargo:</strong> {selectedLeadForDetail.contactRole || 'CEO'}</p>
                      <p><strong>E-mail:</strong> <span className="font-mono text-zinc-800">{selectedLeadForDetail.email || 'N/A'}</span></p>
                      {selectedLeadForDetail.phone && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="font-mono font-bold text-zinc-800">📞 {selectedLeadForDetail.phone}</span>
                          {formatWhatsappLink(selectedLeadForDetail.phone) && (
                            <a
                              href={formatWhatsappLink(selectedLeadForDetail.phone)!}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] font-bold hover:bg-emerald-200"
                            >
                              💬 WhatsApp ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Details Card */}
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                    <h3 className="font-bold text-xs font-mono uppercase text-zinc-400">Dados da Empresa</h3>
                    <div className="text-xs space-y-1.5">
                      <p><strong>Nicho:</strong> {selectedLeadForDetail.niche || 'N/A'}</p>
                      <p><strong>Localização:</strong> {selectedLeadForDetail.location || 'N/A'}</p>
                      <p><strong>Endereço:</strong> <span className="text-zinc-600">{selectedLeadForDetail.address || 'N/A'}</span></p>
                      {selectedLeadForDetail.linkedinUrl && (
                        <p className="pt-1">
                          <a href={selectedLeadForDetail.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-mono font-bold">
                            LinkedIn Profile ↗
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Diagnostic & GEO Deliverables Card */}
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                    <h3 className="font-bold text-xs font-mono uppercase text-zinc-400">Diagnóstico & Entregáveis GEO</h3>
                    <div className="text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Score GEO Real:</span>
                        <span className="font-bold font-mono px-2 py-0.5 bg-zinc-900 text-white rounded">
                          {selectedLeadForDetail.geoScoreEstimado !== undefined ? `${selectedLeadForDetail.geoScoreEstimado}%` : 'Pendente'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200">
                        <button
                          onClick={() => handleRunQuickAudit(selectedLeadForDetail)}
                          disabled={auditingId === selectedLeadForDetail.id}
                          className="w-full py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <IconActivity className={`w-3.5 h-3.5 ${auditingId === selectedLeadForDetail.id ? 'animate-spin' : ''}`} />
                          <span>Rodar Diagnóstico completo (8 Agentes)</span>
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleViewHtmlReport(selectedLeadForDetail)}
                            className="py-1.5 px-3 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>👁️ Ver HTML</span>
                          </button>
                          <button
                            onClick={() => handleDownloadHtmlReport(selectedLeadForDetail)}
                            className="py-1.5 px-3 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>🌐 Baixar HTML</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Sent History Log */}
                {selectedLeadForDetail.sentHistory && selectedLeadForDetail.sentHistory.length > 0 && (
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                    <h3 className="font-bold text-xs font-mono uppercase text-emerald-900 flex items-center gap-1.5">
                      <IconCheck className="w-4 h-4 text-emerald-600" />
                      <span>Histórico de E-mails Disparados ({selectedLeadForDetail.sentHistory.length})</span>
                    </h3>
                    <div className="space-y-1 text-xs font-mono">
                      {selectedLeadForDetail.sentHistory.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-emerald-200/80">
                          <span className="font-bold text-emerald-800">
                            ✓ {item.copyKey} — {item.subject || 'Cold Email'}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {new Date(item.sentAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: COPY MANAGEMENT & DISPATCH (ANTI-DUPLICIDADE) */}
            {activeDetailTab === 'copies' && (
              <div className="space-y-4">
                
                {/* Framework Switcher Tabs */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Selecione o Framework / Estágio:</span>
                  <div className="flex flex-wrap gap-1.5 border-b border-zinc-100 pb-3">
                    {frameworksList.map(fw => {
                      const isSent = !!checkIsCopySent(selectedLeadForDetail, fw.key);
                      return (
                        <button
                          key={fw.key}
                          onClick={() => setCopyTab(fw.key)}
                          title={`${fw.desc} (${fw.stage})`}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer font-mono flex items-center gap-1.5 ${
                            copyTab === fw.key 
                              ? 'bg-zinc-950 text-white shadow-sm' 
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          <span>{fw.label}</span>
                          {isSent && <span className="text-emerald-400 font-bold">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Anti-Duplicidade Checkbox Banner */}
                {(() => {
                  const sentItem = checkIsCopySent(selectedLeadForDetail, copyTab);
                  return (
                    <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      sentItem ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="copySentCheck"
                          checked={!!sentItem}
                          onChange={() => handleToggleCopySent(selectedLeadForDetail, copyTab)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label htmlFor="copySentCheck" className="font-bold cursor-pointer font-mono">
                          {sentItem ? (
                            <span>✓ E-mail do Framework {copyTab} já foi disparado!</span>
                          ) : (
                            <span>Marcar este e-mail ({copyTab}) como DISPARADO para atualizar o Pipeline</span>
                          )}
                        </label>
                      </div>

                      {sentItem && (
                        <div className="text-[11px] font-mono text-emerald-700 bg-white px-2.5 py-1 rounded border border-emerald-200 shrink-0">
                          Disparado em: {new Date(sentItem.sentAt).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Selected Framework Banner */}
                <div className="px-3 py-2 bg-zinc-100 rounded-xl text-xs font-mono text-zinc-700 border border-zinc-200 flex items-center justify-between">
                  <span><strong>Fase:</strong> {frameworksList.find(f => f.key === copyTab)?.stage} — <strong>Estrutura:</strong> {frameworksList.find(f => f.key === copyTab)?.desc}</span>
                </div>

                {/* Copy Content Editors */}
                <div className="space-y-4">
                  
                  {/* LinkedIn Direct Message Editor */}
                  <div className="tactile-raised p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-800 font-display flex items-center gap-1.5">
                        <span>💬 Message Direct LinkedIn ({copyTab})</span>
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

                  {/* Email Cold Outreach Editor + Direct Send */}
                  <div className="tactile-raised p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-zinc-800 font-display flex items-center gap-1.5">
                        <span>✉️ Cold E-mail Corporativo ({copyTab})</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(editedEmailText, 'email')}
                          className="px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          {copiedField === 'email' ? <IconCheck className="w-3.5 h-3.5 text-emerald-600" /> : <IconCopy className="w-3.5 h-3.5" />}
                          <span>{copiedField === 'email' ? 'Copiado!' : 'Copiar Texto'}</span>
                        </button>

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
                          ) : (
                            <>
                              <IconMail className="w-3.5 h-3.5" />
                              <span>🚀 Enviar E-mail pela Plataforma</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 px-1 text-xs">
                      <label className="font-semibold text-zinc-700 flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={attachHtmlReport} 
                          onChange={e => setAttachHtmlReport(e.target.checked)} 
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Anexar Relatório HTML no E-mail</span>
                      </label>
                      <label className="font-semibold text-zinc-700 flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={attachReportLink} 
                          onChange={e => setAttachReportLink(e.target.checked)} 
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Anexar link do Relatório GEO</span>
                      </label>
                    </div>

                    <textarea
                      rows={7}
                      value={editedEmailText}
                      onChange={e => setEditedEmailText(e.target.value)}
                      className="w-full p-3 bg-white rounded-lg border border-zinc-300 text-xs text-zinc-800 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      placeholder="Edite a copy do e-mail aqui..."
                    />
                  </div>

                </div>

                {/* Bottom Save Action */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <button
                    onClick={handleSaveEditedCopy}
                    disabled={savingCopy}
                    className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 font-mono"
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
                    onClick={() => setSelectedLeadForDetail(null)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold cursor-pointer font-mono"
                  >
                    Fechar
                  </button>
                </div>

              </div>
            )}

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

      {/* Modal de Edição de Dados do Lead */}
      {editingLead && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-bold text-base font-display text-zinc-900">Editar Dados do Lead</h3>
                <p className="text-xs text-zinc-400 font-mono">Atualize as informações de contato e localização</p>
              </div>
              <button
                onClick={() => setEditingLead(null)}
                className="text-zinc-400 hover:text-zinc-900 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const { id, ...updatedData } = editingLead;
                await handleUpdateLeadState(id, updatedData);
                setEditingLead(null);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Empresa</label>
                  <input
                    type="text"
                    value={editingLead.company || ''}
                    onChange={e => setEditingLead({ ...editingLead, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Domínio (Site)</label>
                  <input
                    type="text"
                    value={editingLead.domain || ''}
                    onChange={e => setEditingLead({ ...editingLead, domain: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nome do Contato / Decisor</label>
                  <input
                    type="text"
                    value={editingLead.contactName || ''}
                    onChange={e => setEditingLead({ ...editingLead, contactName: e.target.value })}
                    placeholder="Ex: Dra. Ana Paula"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Cargo</label>
                  <input
                    type="text"
                    value={editingLead.contactRole || ''}
                    onChange={e => setEditingLead({ ...editingLead, contactRole: e.target.value })}
                    placeholder="Ex: CEO / Sócio Proprietário"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">E-mail de Contato</label>
                  <input
                    type="email"
                    value={editingLead.email || ''}
                    onChange={e => setEditingLead({ ...editingLead, email: e.target.value })}
                    placeholder="contato@empresa.com.br"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={editingLead.phone || ''}
                    onChange={e => setEditingLead({ ...editingLead, phone: e.target.value })}
                    placeholder="Ex: (11) 99999-8888"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-zinc-700 mb-1">Perfil LinkedIn (URL)</label>
                  <input
                    type="url"
                    value={editingLead.linkedinUrl || ''}
                    onChange={e => setEditingLead({ ...editingLead, linkedinUrl: e.target.value })}
                    placeholder="https://www.linkedin.com/in/nome-perfil"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-zinc-700 mb-1">Endereço Completo / Cidade</label>
                  <input
                    type="text"
                    value={editingLead.address || ''}
                    onChange={e => setEditingLead({ ...editingLead, address: e.target.value })}
                    placeholder="Ex: Av. Ipiranga, 344, São Paulo - SP"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nicho / Segmento</label>
                  <input
                    type="text"
                    value={editingLead.niche || ''}
                    onChange={e => setEditingLead({ ...editingLead, niche: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Localização</label>
                  <input
                    type="text"
                    value={editingLead.location || ''}
                    onChange={e => setEditingLead({ ...editingLead, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold cursor-pointer transition-all font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 font-mono"
                >
                  <span>💾 Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
