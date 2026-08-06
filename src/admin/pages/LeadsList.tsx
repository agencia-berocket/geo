import React, { useEffect, useState, useRef } from 'react';
import { useLeads, useDiagnostic, type Lead } from '../hooks/useFirestore';
import StatusBadge from '../components/StatusBadge';
import GeoScoreGauge from '../components/GeoScoreGauge';
import Modal from '../components/Modal';
import { AuditAndScreenshotsPanel } from '../components/AuditAndScreenshotsPanel';
import {
  IconCheck, IconX, IconWarning, IconEdit, IconTrash, IconPlay, IconStar,
  IconShield, IconFolder, IconClipboard, IconChat, IconBot, IconHourglass,
  IconSend, IconChevron, IconNote, IconRefresh,
} from '../components/icons';

// ─── Download icon ──────────────────────────────────────────────────────
function IconDownload({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

interface LeadsListProps {
  onNavigate: (page: string, id?: string) => void;
  selectedLeadId?: string;
}

// ─── Agent Report Accordion ─────────────────────────────────────────────────
function AgentReport({ title, icon, status, children }: {
  title: string; icon: React.ReactNode; status: 'ok' | 'warning' | 'critical'; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const statusColor = status === 'ok' ? 'text-emerald-600 font-bold' : status === 'warning' ? 'text-amber-600 font-bold' : 'text-red-600 font-bold';
  return (
    <div className="tactile-raised overflow-hidden bg-white/80 p-2 border border-zinc-200/50 rounded-xl">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer"
      >
        <span className="text-zinc-500">{icon}</span>
        <span className="flex-1 font-display font-semibold text-zinc-900 text-sm">{title}</span>
        <span className={`text-xs font-mono ${statusColor}`}>{status.toUpperCase()}</span>
        <IconChevron direction={open ? 'up' : 'down'} className="w-3.5 h-3.5 text-zinc-400 ml-2" />
      </button>
      {open && (
        <div className="px-3 pb-3 text-sm text-zinc-600 border-t border-zinc-100 mt-2 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Visual Dashboard Tab ───────────────────────────────────────────────────
function DiagnosticDashboard({ diagnostic }: { diagnostic: any }) {
  const d = diagnostic;
  if (!d) return null;

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="font-mono text-[9px] text-zinc-400 uppercase font-black">LATÊNCIA DO SERVIDOR</span>
          <span className={`font-mono font-bold text-base mt-2 ${d.gatekeeperStatus.serverLatencyMs < 800 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {d.gatekeeperStatus.serverLatencyMs} ms
          </span>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="font-mono text-[9px] text-zinc-400 uppercase font-black">SENTIMENTO NAS IAs</span>
          <span className={`font-bold text-base mt-2 ${d.visibilityBenchmarking.brandSentimentScore === 'Positivo' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {d.visibilityBenchmarking.brandSentimentScore}
          </span>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm col-span-2 sm:col-span-1">
          <span className="font-mono text-[9px] text-zinc-400 uppercase font-black">CITATION SHARE</span>
          <span className="font-mono font-bold text-base mt-2 text-zinc-900">
            {(d.visibilityBenchmarking.citationSharePercentage * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Citations Share per LLM */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="font-display font-bold text-zinc-900 text-sm border-b border-zinc-100 pb-2">Presença por Modelo de IA</h4>
        <div className="space-y-3">
          {Object.entries(d.visibilityBenchmarking.citationsByModel || {}).map(([model, count]: [string, any]) => {
            const maxCitations = Math.max(...Object.values(d.visibilityBenchmarking.citationsByModel).map(Number), 1);
            const percentage = (count / maxCitations) * 100;
            return (
              <div key={model} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-600 font-bold uppercase">{model}</span>
                  <span className="text-zinc-950 font-bold">{count} menções</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200/50 shadow-inner">
                  <div className="bg-zinc-950 h-full rounded-full" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical bottlenecks timeline */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="font-display font-bold text-zinc-900 text-sm border-b border-zinc-100 pb-2">Recomendações e Correções</h4>
        <div className="space-y-3">
          {(d.actionItemsPriorityList || []).map((item: any, i: number) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 bg-zinc-50 border border-zinc-150 rounded-xl">
              <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full self-start ${
                item.impact.includes('Crítico') ? 'bg-red-50 text-red-650 border border-red-200' :
                item.impact.includes('Alto') ? 'bg-amber-50 text-amber-650 border border-amber-200' :
                'bg-blue-50 text-blue-650 border border-blue-200'
              }`}>{item.impact}</span>
              <div className="text-xs text-zinc-700 font-medium leading-relaxed flex-1">
                <span className="text-zinc-400 font-mono block text-[8px] uppercase tracking-wider mb-0.5 break-all">Agente: {item.agentOwner}</span>
                {item.task}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { LeadChat } from '../components/LeadChat';

// ─── Lead Edit Form ─────────────────────────────────────────────────────────
function LeadEditPanel({ lead, onSave, onCancel }: { lead: Lead, onSave: (updated: Partial<Lead>) => void, onCancel: () => void }) {
  const [name, setName] = useState(lead.name || '');
  const [email, setEmail] = useState(lead.email || '');
  const [url, setUrl] = useState(lead.url || '');
  const [company, setCompany] = useState(lead.company || '');
  const [phone, setPhone] = useState((lead as any).phone || '');
  const [architecture, setArchitecture] = useState((lead as any).architecture || 'no_rag');
  const [scale, setScale] = useState((lead as any).scale || 'small');
  const [geoScore, setGeoScore] = useState(lead.geoScore ?? 0);
  const [status, setStatus] = useState(lead.status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, email, url, company, phone, architecture, scale, geoScore, status });
  };

  return (
    <div className="space-y-4 bg-white border border-zinc-200 p-5 rounded-2xl shadow-sm text-xs">
      <h3 className="font-display font-bold text-zinc-900 text-sm border-b border-zinc-100 pb-2">Editar Lead</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2" />
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">E-mail</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2" />
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">Website URL</label>
            <input required value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2" />
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">Empresa / Rótulo</label>
            <input value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2" />
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">WhatsApp</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2" placeholder="Ex: (11) 99999-9999" />
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">GEO Score</label>
            <input type="number" min="0" max="100" value={geoScore} onChange={e => setGeoScore(parseInt(e.target.value) || 0)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2" />
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">Desafio RAG</label>
            <select value={architecture} onChange={e => setArchitecture(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
              <option value="no_rag">Sem RAG</option>
              <option value="keyword">Busca por palavra-chave</option>
              <option value="hybrid_hallucination">Busca Híbrida / Alucinações</option>
              <option value="llm_indexing">Indexação de Marca em LLMs</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">Escala da Base</label>
            <select value={scale} onChange={e => setScale(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
              <option value="small">Pequena (até 100 docs)</option>
              <option value="medium">Média (100 a 1.000 docs)</option>
              <option value="large">Grande (+1.000 docs)</option>
              <option value="unmeasured">Não mensurado</option>
            </select>
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-zinc-400 font-bold block">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
              <option value="new">Novo</option>
              <option value="processing">Processando</option>
              <option value="completed">Concluído</option>
              <option value="converted">Convertido (Cliente)</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t border-zinc-150">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-zinc-200 rounded-xl font-bold cursor-pointer hover:bg-zinc-50">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-zinc-950 text-white rounded-xl font-bold cursor-pointer hover:bg-zinc-800">Salvar Alterações</button>
        </div>
      </form>
    </div>
  );
}

// ─── Diagnostic Field Editor ───────────────────────────────────────────────
function DiagnosticEditor({ diagnostic, leadId, onSaved }: {
  diagnostic: any; leadId: string; onSaved: () => void;
}) {
  const { updateDiagnostic } = useLeads();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Local editable state mirrors the diagnostic
  const [gk, setGk] = useState({
    robotsTxtAllowAiBots: diagnostic.gatekeeperStatus.robotsTxtAllowAiBots,
    ssrActive: diagnostic.gatekeeperStatus.ssrActive,
    hasPriceGatekeeperIssue: diagnostic.gatekeeperStatus.hasPriceGatekeeperIssue,
  });
  const [meta, setMeta] = useState({
    organizationSchemaPresent: diagnostic.metadataAnalysis.organizationSchemaPresent,
    personSchemaPresent: diagnostic.metadataAnalysis.personSchemaPresent,
    llmsTxtPublished: diagnostic.metadataAnalysis.llmsTxtPublished,
  });
  const [content, setContent] = useState({
    hasTldrAnswerFirstParagraph: diagnostic.contentReview.factorsDetected.hasTldrAnswerFirstParagraph,
    hasStatisticsPer150Words: diagnostic.contentReview.factorsDetected.hasStatisticsPer150Words,
    hasExpertQuotes: diagnostic.contentReview.factorsDetected.hasExpertQuotes,
    hasHtmlComparisonTables: diagnostic.contentReview.factorsDetected.hasHtmlComparisonTables,
  });
  const [geoScore, setGeoScore] = useState<number>(diagnostic.overallGeoScore ?? 0);

  const Toggle = ({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) => (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-zinc-100 last:border-0">
      <div>
        <span className="text-zinc-800 font-medium text-xs">{label}</span>
        {hint && <span className="block text-[10px] text-zinc-400 font-mono mt-0.5">{hint}</span>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
          value ? 'bg-emerald-500' : 'bg-zinc-300'
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          value ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await updateDiagnostic(leadId, {
        overallGeoScore: geoScore,
        gatekeeperStatus: {
          ...diagnostic.gatekeeperStatus,
          ...gk,
        },
        metadataAnalysis: {
          ...diagnostic.metadataAnalysis,
          ...meta,
        },
        contentReview: {
          ...diagnostic.contentReview,
          factorsDetected: {
            ...diagnostic.contentReview.factorsDetected,
            ...content,
          },
        },
      });
      setMsg('✅ Diagnóstico atualizado com sucesso!');
      onSaved();
    } catch (e: any) {
      setMsg(`❌ Erro: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5">
      <h4 className="font-display font-bold text-zinc-900 text-sm border-b border-zinc-100 pb-2 flex items-center gap-2">
        <IconEdit className="w-4 h-4 text-zinc-400" /> Editar Dados do Diagnóstico
      </h4>

      {/* GEO Score */}
      <div>
        <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">GEO Score Geral</label>
        <input
          type="number" min={0} max={100} value={geoScore}
          onChange={e => setGeoScore(parseInt(e.target.value) || 0)}
          className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm font-mono font-bold"
        />
        <span className="text-zinc-400 text-xs ml-2">/ 100</span>
      </div>

      {/* Gatekeeper */}
      <div>
        <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase mb-2">⚙️ Technical Gatekeeper</p>
        <Toggle label="Bots de IA liberados no robots.txt" value={gk.robotsTxtAllowAiBots} onChange={v => setGk(s => ({...s, robotsTxtAllowAiBots: v}))} hint="DETERMINÍSTICO" />
        <Toggle label="SSR ativo (conteúdo sem JS)" value={gk.ssrActive} onChange={v => setGk(s => ({...s, ssrActive: v}))} hint="DETERMINÍSTICO" />
        <Toggle label="Preços NÃO visíveis (issue)" value={gk.hasPriceGatekeeperIssue} onChange={v => setGk(s => ({...s, hasPriceGatekeeperIssue: v}))} hint="HEURÍSTICO — true = preço ausente" />
      </div>

      {/* Metadata */}
      <div>
        <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase mb-2">🗂 Metadata Entity</p>
        <Toggle label="Schema Organization presente" value={meta.organizationSchemaPresent} onChange={v => setMeta(s => ({...s, organizationSchemaPresent: v}))} hint="DETERMINÍSTICO" />
        <Toggle label="Schema Person presente" value={meta.personSchemaPresent} onChange={v => setMeta(s => ({...s, personSchemaPresent: v}))} hint="DETERMINÍSTICO" />
        <Toggle label="/llms.txt publicado" value={meta.llmsTxtPublished} onChange={v => setMeta(s => ({...s, llmsTxtPublished: v}))} hint="DETERMINÍSTICO" />
      </div>

      {/* Content */}
      <div>
        <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase mb-2">📝 Content Absorption</p>
        <Toggle label="AEO: resposta nas primeiras 60 palavras" value={content.hasTldrAnswerFirstParagraph} onChange={v => setContent(s => ({...s, hasTldrAnswerFirstParagraph: v}))} hint="HEURÍSTICO" />
        <Toggle label="Estatísticas a cada 150 palavras" value={content.hasStatisticsPer150Words} onChange={v => setContent(s => ({...s, hasStatisticsPer150Words: v}))} hint="HEURÍSTICO" />
        <Toggle label="Citações de especialistas" value={content.hasExpertQuotes} onChange={v => setContent(s => ({...s, hasExpertQuotes: v}))} hint="HEURÍSTICO — 'Segundo McKinsey...', blockquote" />
        <Toggle label="Tabelas comparativas HTML" value={content.hasHtmlComparisonTables} onChange={v => setContent(s => ({...s, hasHtmlComparisonTables: v}))} hint="DETERMINÍSTICO — exige <td>" />
      </div>

      {msg && (
        <p className="text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">{msg}</p>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-60 text-white font-semibold py-2 px-4 rounded-xl text-xs cursor-pointer transition-all"
        >
          {saving ? <><IconHourglass className="w-3.5 h-3.5" /> Salvando...</> : <><IconCheck className="w-3.5 h-3.5" /> Salvar Correções</>}
        </button>
      </div>
    </div>
  );
}

// ─── FULL PAGE: LEAD WORKSPACE VIEW ──────────────────────────────────────────
function LeadWorkspacePage({ lead, onBack, onNavigate, onLeadUpdated }: {
  lead: Lead; onBack: () => void; onNavigate: (page: string, id?: string) => void; onLeadUpdated: () => void;
}) {
  const { diagnostic, loading: diagLoading, fetchDiagnostic } = useDiagnostic(lead.id);
  const { runDiagnostic, sendReport, sendFollowup, convertToClient, editLead, deleteLead, downloadHtmlReport } = useLeads();
  const [running, setRunning] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingFollowup, setSendingFollowup] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showDiagEditor, setShowDiagEditor] = useState(false);

  // Tab switcher
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agents' | 'audit' | 'chat'>('dashboard');
  const [isEditing, setIsEditing] = useState(false);

  // Polling para atualizar o lead e buscar o diagnóstico enquanto estiver processando ou recém-disparado
  useEffect(() => {
    fetchDiagnostic();

    // Se o lead está em 'processing' ou rodando, cria um polling a cada 3 segundos
    if (lead.status === 'processing' || running) {
      const interval = setInterval(() => {
        onLeadUpdated();
        fetchDiagnostic();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [lead.id, lead.status, running, fetchDiagnostic, onLeadUpdated]);

  const handleRunDiagnostic = async () => {
    setRunning(true);
    setMessage('Iniciando diagnóstico...');
    try {
      await runDiagnostic(lead.id);
      setMessage('Diagnóstico em execução pelos 7 agentes de IA. Aguarde a conclusão...');
      onLeadUpdated();
      fetchDiagnostic();
    } catch (e: any) {
      setMessage(`Erro: ${e.message}`);
      setRunning(false);
    }
  };

  const handleSendReport = async () => {
    setSending(true);
    setMessage(null);
    try {
      await sendReport(lead.id);
      setMessage('Relatório HTML enviado por e-mail com sucesso!');
    } catch (e: any) {
      setMessage(`Erro: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleRerunDiagnostic = async () => {
    if (!window.confirm('Refazer o diagnóstico irá substituir os dados atuais. Continuar?')) return;
    setRunning(true);
    setMessage('Reiniciando diagnóstico...');
    setShowDiagEditor(false);
    try {
      await runDiagnostic(lead.id);
      setMessage('Diagnóstico em execução pelos 7 agentes de IA. Aguarde a conclusão...');
      onLeadUpdated();
      fetchDiagnostic();
    } catch (e: any) {
      setMessage(`Erro: ${e.message}`);
      setRunning(false);
    }
  };

  const handleSendFollowup = async () => {
    setSendingFollowup(true);
    setMessage(null);
    try {
      const res = await sendFollowup(lead.id);
      setMessage(res.message || 'E-mail de follow-up enviado com sucesso!');
    } catch (e: any) {
      setMessage(`Erro no follow-up: ${e.message}`);
    } finally {
      setSendingFollowup(false);
    }
  };

  const handleDownloadHtml = async () => {
    setDownloading(true);
    setMessage(null);
    try {
      await downloadHtmlReport(lead.id, lead.company || lead.url);
      setMessage('Relatório HTML baixado com sucesso!');
    } catch (e: any) {
      setMessage(`Erro ao baixar: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleConvert = async () => {
    try {
      const result = await convertToClient(lead.id, {
        name: lead.name || lead.email.split('@')[0],
        company: lead.company || lead.url,
        plan: 'premium',
        currentStage: 1,
      });
      if (result.success) {
        setMessage('Lead convertido em cliente!');
        setTimeout(() => {
          onLeadUpdated();
          onNavigate('clients');
        }, 1500);
      }
    } catch (e: any) {
      setMessage(`Erro: ${e.message}`);
    }
  };

  const handleSaveEdit = async (updatedFields: Partial<Lead>) => {
    try {
      const res = await editLead(lead.id, updatedFields);
      if (res.success) {
        setMessage('Lead atualizado com sucesso!');
        setIsEditing(false);
        onLeadUpdated();
      }
    } catch (e: any) {
      setMessage(`Erro ao salvar: ${e.message}`);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza absoluta que deseja excluir este Lead?')) return;
    try {
      const res = await deleteLead(lead.id);
      if (res.success) {
        onBack();
      }
    } catch (e: any) {
      setMessage(`Erro ao excluir: ${e.message}`);
    }
  };

  const d = diagnostic;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold px-3.5 py-2 rounded-xl border border-zinc-300 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            ← Voltar para Leads
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-bold text-zinc-900 truncate">{lead.company || lead.url}</h1>
              <StatusBadge status={lead.status} />
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate">{lead.url} • {lead.email} • Captado em {new Date(lead.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(e => !e)}
            className="text-xs bg-zinc-100 hover:bg-zinc-200 font-bold px-3.5 py-2 rounded-xl border border-zinc-300 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <IconEdit className="w-3.5 h-3.5" /> {isEditing ? 'Fechar Edição' : 'Editar Lead'}
          </button>
          <button
            onClick={handleDelete}
            className="text-xs bg-red-50 hover:bg-red-100 text-red-650 font-bold px-3.5 py-2 rounded-xl border border-red-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <IconTrash className="w-3.5 h-3.5" /> Excluir
          </button>
        </div>
      </div>

      {/* Inline Lead Edit Form */}
      {isEditing ? (
        <LeadEditPanel lead={lead} onSave={handleSaveEdit} onCancel={() => setIsEditing(false)} />
      ) : (
        <>
          {/* GEO Score & Quick Actions Banner */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
            <GeoScoreGauge score={lead.geoScore ?? 0} size="lg" />
            <div className="w-full sm:flex-1 space-y-3">
              {lead.status === 'new' && (
                <button
                  id={`run-diag-${lead.id}`}
                  onClick={handleRunDiagnostic}
                  disabled={running}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm shadow-md cursor-pointer"
                >
                  {running ? (
                    <span className="flex items-center gap-2"><IconHourglass className="w-4 h-4" /> Executando...</span>
                  ) : (
                    <span className="flex items-center gap-2"><IconPlay className="w-4 h-4" /> Iniciar Diagnóstico</span>
                  )}
                </button>
              )}
              {lead.status !== 'new' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    id={`send-report-${lead.id}`}
                    onClick={handleSendReport}
                    disabled={sending}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-2.5 px-3 rounded-xl transition-all text-xs shadow-sm cursor-pointer"
                  >
                    {sending ? (
                      <span className="flex items-center gap-1.5"><IconHourglass className="w-3.5 h-3.5" /> Enviando...</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><IconSend className="w-3.5 h-3.5" /> Enviar HTML</span>
                    )}
                  </button>
                  <button
                    id={`download-html-${lead.id}`}
                    onClick={handleDownloadHtml}
                    disabled={downloading}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 px-3 rounded-xl transition-all text-xs shadow-sm cursor-pointer"
                    title="Baixar relatório HTML completo com trilha de auditoria dos agentes"
                  >
                    {downloading ? (
                      <span className="flex items-center gap-1.5"><IconHourglass className="w-3.5 h-3.5" /> Baixando...</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><IconDownload className="w-3.5 h-3.5" /> Baixar HTML</span>
                    )}
                  </button>
                  <button
                    id={`rerun-diag-${lead.id}`}
                    onClick={handleRerunDiagnostic}
                    disabled={running}
                    className="flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-60 text-white font-semibold py-2.5 px-3 rounded-xl transition-all text-xs shadow-sm cursor-pointer"
                  >
                    {running ? (
                      <span className="flex items-center gap-1.5"><IconHourglass className="w-3.5 h-3.5" /> Executando...</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><IconRefresh className="w-3.5 h-3.5" /> Refazer Diagnóstico</span>
                    )}
                  </button>
                  <button
                    id={`followup-${lead.id}`}
                    onClick={handleSendFollowup}
                    disabled={sendingFollowup}
                    className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold py-2.5 px-3 rounded-xl transition-all text-xs shadow-sm cursor-pointer"
                  >
                    {sendingFollowup ? (
                      <span className="flex items-center gap-1.5"><IconHourglass className="w-3.5 h-3.5" /> Enviando...</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><IconSend className="w-3.5 h-3.5" /> Enviar Follow-up</span>
                    )}
                  </button>
                  <button
                    id={`convert-${lead.id}`}
                    onClick={handleConvert}
                    className="flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-2.5 px-3 rounded-xl transition-all text-xs shadow-sm cursor-pointer"
                  >
                    <IconStar className="w-3.5 h-3.5" /> Converter Cliente
                  </button>
                </div>
              )}
              {message && (
                <p className="text-xs text-zinc-700 font-medium bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5">{message}</p>
              )}
            </div>
          </div>

          {/* Outbound Data Captured Card */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs space-y-3 text-xs">
            <h4 className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-widest border-b border-zinc-150 pb-2 flex items-center gap-1.5">
              <IconClipboard className="w-3.5 h-3.5" /> Dados Capturados para Outbound
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-150">
                <span className="text-zinc-400 block uppercase font-bold text-[9px] mb-0.5">Nome do Contato</span>
                <span className="text-zinc-900 text-sm font-semibold break-words">{lead.name || '—'}</span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-150">
                <span className="text-zinc-400 block uppercase font-bold text-[9px] mb-0.5">Empresa</span>
                <span className="text-zinc-900 text-sm font-semibold break-all">{lead.company || '—'}</span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-150">
                <span className="text-zinc-400 block uppercase font-bold text-[9px] mb-0.5">WhatsApp / Celular</span>
                <span className="text-zinc-900 text-sm font-mono font-semibold break-all">{(lead as any).phone || '—'}</span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-150">
                <span className="text-zinc-400 block uppercase font-bold text-[9px] mb-0.5">E-mail</span>
                <span className="text-zinc-900 text-sm font-mono font-semibold break-all">{lead.email}</span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-150">
                <span className="text-zinc-400 block uppercase font-bold text-[9px] mb-0.5">Desafio RAG Declarado</span>
                <span className="text-zinc-900 text-sm font-semibold">
                  {(lead as any).architecture === 'no_rag' ? 'Sem RAG' :
                   (lead as any).architecture === 'keyword' ? 'Palavras-Chave tradicional' :
                   (lead as any).architecture === 'hybrid_hallucination' ? 'RAG Híbrido com Alucinação' :
                   (lead as any).architecture === 'llm_indexing' ? 'Indexar Marca em IAs' : '—'}
                </span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-150">
                <span className="text-zinc-400 block uppercase font-bold text-[9px] mb-0.5">Escala da Base</span>
                <span className="text-zinc-900 text-sm font-semibold">
                  {(lead as any).scale === 'small' ? 'Até 100 documentos' :
                   (lead as any).scale === 'medium' ? '100 a 1.000 documentos' :
                   (lead as any).scale === 'large' ? 'Mais de 1.000 documentos' :
                   (lead as any).scale === 'unmeasured' ? 'Não mensurado' : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic & Chat Tab Navigation */}
          {lead.status !== 'new' && (
            <div className="space-y-4">
              <div className="flex overflow-x-auto max-w-full scrollbar-none bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-xs text-xs font-semibold gap-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-zinc-950 text-white shadow-sm font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
                >
                  <IconClipboard className="w-3.5 h-3.5" /> Dashboard Visual
                </button>
                <button
                  onClick={() => setActiveTab('agents')}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === 'agents' ? 'bg-zinc-950 text-white shadow-sm font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
                >
                  <IconShield className="w-3.5 h-3.5" /> Detalhes dos Agentes
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === 'audit' ? 'bg-zinc-950 text-white shadow-sm font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
                >
                  🔬 Auditoria LLM & Prints
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === 'chat' ? 'bg-zinc-950 text-white shadow-sm font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
                >
                  <IconChat className="w-3.5 h-3.5" /> Chat Orquestrador IA
                </button>
              </div>

              {diagLoading && (
                <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center text-zinc-400 text-sm font-mono">
                  Carregando dados do diagnóstico...
                </div>
              )}

              {!diagLoading && d && (
                <>
                  {activeTab === 'dashboard' && (
                    <DiagnosticDashboard diagnostic={d} />
                  )}

                  {activeTab === 'agents' && (
                    <div className="space-y-4">
                      <AgentReport
                        title="Technical Gatekeeper"
                        icon={<IconShield className="w-4 h-4" />}
                        status={d.gatekeeperStatus?.robotsTxtAllowAiBots && d.gatekeeperStatus?.ssrActive ? 'ok' : !d.gatekeeperStatus?.robotsTxtAllowAiBots ? 'critical' : 'warning'}
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-zinc-700 font-medium">
                            {d.gatekeeperStatus?.robotsTxtAllowAiBots ? <IconCheck className="w-4 h-4 text-emerald-600" /> : <IconX className="w-4 h-4 text-red-600" />}
                            <span>Bots de IA no robots.txt</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-700 font-medium">
                            {d.gatekeeperStatus?.ssrActive ? <IconCheck className="w-4 h-4 text-emerald-600" /> : <IconWarning className="w-4 h-4 text-amber-600" />}
                            <span>SSR/conteúdo acessível</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-700 font-medium">
                            {!d.gatekeeperStatus?.hasPriceGatekeeperIssue ? <IconCheck className="w-4 h-4 text-emerald-600" /> : <IconWarning className="w-4 h-4 text-amber-600" />}
                            <span>Preços visíveis</span>
                          </div>
                          <div className="text-zinc-700 font-medium">
                            <span className="text-zinc-400">Latência:</span>{' '}
                            <span className={`font-mono font-bold ${d.gatekeeperStatus?.serverLatencyMs < 800 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {d.gatekeeperStatus?.serverLatencyMs}ms
                            </span>
                          </div>
                        </div>
                      </AgentReport>

                      <AgentReport
                        title="Metadata Entity"
                        icon={<IconFolder className="w-4 h-4" />}
                        status={d.metadataAnalysis?.organizationSchemaPresent && d.metadataAnalysis?.llmsTxtPublished ? 'ok' : d.metadataAnalysis?.organizationSchemaPresent ? 'warning' : 'critical'}
                      >
                        <div className="space-y-2 text-zinc-700 font-medium">
                          {[
                            { label: 'Schema Organization', ok: d.metadataAnalysis?.organizationSchemaPresent },
                            { label: 'Schema Person (autor)', ok: d.metadataAnalysis?.personSchemaPresent },
                            { label: '/llms.txt publicado', ok: d.metadataAnalysis?.llmsTxtPublished },
                          ].map(item => (
                            <div key={item.label} className="flex items-center gap-2">
                              {item.ok ? <IconCheck className="w-4 h-4 text-emerald-600" /> : <IconX className="w-4 h-4 text-red-600" />}
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </AgentReport>

                      <AgentReport
                        title="SEO Optimizer (Tráfego de Transição)"
                        icon={<IconEdit className="w-4 h-4" />}
                        status={(d.seoAnalysis?.score ?? 70) >= 70 ? 'ok' : (d.seoAnalysis?.score ?? 70) >= 40 ? 'warning' : 'critical'}
                      >
                        <div className="space-y-2 text-zinc-700 font-medium">
                          <div className="flex items-center justify-between text-xs border-b border-zinc-100 pb-1">
                            <span className="text-zinc-500 font-mono">Score de SEO Tradicional:</span>
                            <span className="font-mono font-bold text-emerald-600">{d.seoAnalysis?.score ?? 70}%</span>
                          </div>
                          {[
                            { label: 'Title Tag otimizada', ok: d.seoAnalysis?.titlePresent !== false },
                            { label: 'Meta Description adequada', ok: d.seoAnalysis?.metaDescriptionPresent !== false },
                            { label: 'Imagens com atributo Alt', ok: d.seoAnalysis?.imagesWithAlt !== false },
                            { label: 'Links internos sem textos genéricos', ok: d.seoAnalysis?.genericAnchorsCount === 0 },
                          ].map(item => (
                            <div key={item.label} className="flex items-center gap-2">
                              {item.ok ? <IconCheck className="w-4 h-4 text-emerald-600" /> : <IconWarning className="w-4 h-4 text-amber-600" />}
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </AgentReport>

                      <AgentReport
                        title="Semantic Explorer (Ideação & Gaps)"
                        icon={<IconFolder className="w-4 h-4" />}
                        status={d.semanticAnalysis?.contentGaps?.length === 0 ? 'ok' : 'warning'}
                      >
                        <div className="space-y-2 text-zinc-700 font-medium">
                          <p className="text-xs text-zinc-500 font-mono">Content Gaps Identificados: {d.semanticAnalysis?.contentGaps?.length || 0}</p>
                          {(d.semanticAnalysis?.contentGaps || []).slice(0, 3).map((gap: any, idx: number) => (
                            <div key={idx} className="bg-zinc-50 border border-zinc-200 p-2 rounded-lg text-xs">
                              <span className="font-bold text-zinc-900 block">{gap.topic || gap}</span>
                              {gap.searchIntent && <span className="text-[10px] text-zinc-400 font-mono">Intenção: {gap.searchIntent}</span>}
                            </div>
                          ))}
                        </div>
                      </AgentReport>

                      <AgentReport
                        title="Off-Page Entity Monitor (RP & Wikidata)"
                        icon={<IconShield className="w-4 h-4" />}
                        status={(d.offpageAnalysis?.externalEntityScore ?? 50) >= 60 ? 'ok' : 'warning'}
                      >
                        <div className="space-y-2 text-zinc-700 font-medium">
                          <div className="flex items-center justify-between text-xs border-b border-zinc-100 pb-1">
                            <span className="text-zinc-500 font-mono">Score de Entidade Externa:</span>
                            <span className="font-mono font-bold text-emerald-600">{d.offpageAnalysis?.externalEntityScore ?? 50}%</span>
                          </div>
                          <div className="text-xs text-zinc-600">
                            Presença em Wikipédia/Wikidata: {d.offpageAnalysis?.hasWikidata ? '✓ Presente' : '✗ Ausente'}
                          </div>
                        </div>
                      </AgentReport>

                      <AgentReport
                        title="Intent Prompt (Citation Share nas LLMs)"
                        icon={<IconChat className="w-4 h-4" />}
                        status={(d.visibilityBenchmarking?.citationSharePercentage ?? 0) > 0.3 ? 'ok' : (d.visibilityBenchmarking?.citationSharePercentage ?? 0) > 0 ? 'warning' : 'critical'}
                      >
                        <div className="space-y-2 text-zinc-700 font-medium">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500 font-mono">Citation Share Total:</span>
                            <span className="font-mono font-bold text-zinc-900">{Math.round((d.visibilityBenchmarking?.citationSharePercentage || 0) * 100)}%</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500 font-mono">Sentimento de Marca:</span>
                            <span className="font-bold text-emerald-600">{d.visibilityBenchmarking?.brandSentimentScore || 'Positivo'}</span>
                          </div>
                        </div>
                      </AgentReport>

                      <AgentReport
                        title="Checklist Architect (QA & Código para Devs)"
                        icon={<IconCheck className="w-4 h-4" />}
                        status="ok"
                      >
                        <div className="space-y-2 text-zinc-700 font-medium text-xs">
                          <p className="text-zinc-600 font-semibold">✓ Checklist Interativo e Código JSON-LD/robots.txt gerado com sucesso no Relatório Final.</p>
                        </div>
                      </AgentReport>

                      <div className="mt-4">
                        <button
                          onClick={() => setShowDiagEditor(v => !v)}
                          className="flex items-center gap-2 text-xs font-semibold text-zinc-700 hover:text-zinc-950 border border-zinc-300 hover:border-zinc-400 px-4 py-2.5 rounded-xl transition-all cursor-pointer bg-white shadow-xs"
                        >
                          <IconEdit className="w-3.5 h-3.5" />
                          {showDiagEditor ? 'Fechar Editor Manual' : 'Editar Dados do Diagnóstico Manualmente'}
                        </button>
                        {showDiagEditor && (
                          <div className="mt-3">
                            <DiagnosticEditor
                              diagnostic={d}
                              leadId={lead.id}
                              onSaved={() => { fetchDiagnostic(); setShowDiagEditor(false); }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'audit' && (
                    <AuditAndScreenshotsPanel
                      entityType="lead"
                      entityId={lead.id}
                      diagnostic={d}
                      leadUrl={lead.url}
                    />
                  )}

                  {activeTab === 'chat' && (
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs min-h-[480px]">
                      <LeadChat leadId={lead.id} agentName="orchestrator" leadUrl={lead.url} />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Leads List Page ──────────────────────────────────────────────────────────
export default function LeadsList({ onNavigate, selectedLeadId }: LeadsListProps) {
  const { leads, loading, error, fetchLeads, runDiagnostic, deleteLead } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [runningId, setRunningId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (selectedLeadId) {
      const lead = leads.find(l => l.id === selectedLeadId);
      if (lead) setSelectedLead(lead);
    }
  }, [selectedLeadId, leads]);

  useEffect(() => {
    if (selectedLead) {
      const updated = leads.find(l => l.id === selectedLead.id);
      if (updated) {
        setSelectedLead(updated);
      }
    }
  }, [leads]);

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);

  const handleQuickRun = async (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setRunningId(lead.id);
    try {
      await runDiagnostic(lead.id);
      await fetchLeads();
    } catch {}
    setRunningId(null);
  };

  const handleDeleteLead = async (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    if (!window.confirm('Excluir este Lead definitivamente?')) return;
    try {
      await deleteLead(leadId);
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  // If a lead is selected, render the dedicated Full-Page Workspace View!
  if (selectedLead) {
    return (
      <LeadWorkspacePage
        lead={selectedLead}
        onBack={() => setSelectedLead(null)}
        onNavigate={onNavigate}
        onLeadUpdated={fetchLeads}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900">Leads</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Diagnóstico gratuito Raio-X de GEO</p>
        </div>
        <span className="text-xs text-zinc-400 font-mono font-bold bg-white border border-zinc-200/60 px-3 py-1 rounded-full shadow-xs">{leads.length} leads totais</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'new', 'processing', 'completed', 'converted'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === s ? 'bg-zinc-950 text-white shadow-md' : 'bg-white text-zinc-500 hover:text-zinc-900 border border-zinc-200/60 hover:bg-zinc-50'
            }`}
          >
            {s === 'all' ? 'Todos' : s === 'new' ? 'Novos' : s === 'processing' ? 'Processando' : s === 'completed' ? 'Concluídos' : 'Clientes'}
            {' '}({s === 'all' ? leads.length : leads.filter(l => l.status === s).length})
          </button>
        ))}
      </div>

      {/* Table with Neumorphic Container */}
      <div className="tactile-raised overflow-hidden bg-white/70 backdrop-blur-md">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-sm font-mono">Carregando leads...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 font-medium text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm font-semibold mb-1">Nenhum lead encontrado</p>
            <p className="text-zinc-400 text-xs">Os leads são capturados automaticamente pelo widget do site</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-zinc-50/70 border-b border-zinc-200/50">
                <tr>
                  {['Contato / Empresa', 'E-mail / Fone', 'Captado em', 'GEO Score', 'Status', 'Ações'].map(col => (
                    <th key={col} className="text-left px-5 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/40">
                {filtered.map(lead => (
                  <tr
                    key={lead.id}
                    className="hover:bg-zinc-100/40 cursor-pointer transition-colors"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-5 py-4">
                      <p className="text-zinc-900 font-semibold truncate max-w-[200px]">{lead.name || lead.url}</p>
                      <p className="text-zinc-450 text-xs mt-0.5 truncate">{lead.company || lead.url}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-zinc-700 font-mono truncate max-w-[160px]">{lead.email}</p>
                      {(lead as any).phone && <p className="text-zinc-400 text-xs font-mono mt-0.5">{(lead as any).phone}</p>}
                    </td>
                    <td className="px-5 py-4 text-zinc-550 text-xs font-mono">
                      {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-4">
                      {lead.geoScore !== undefined && lead.status !== 'new' && lead.status !== 'processing' ? (
                        <span className={`font-mono font-bold ${lead.geoScore >= 70 ? 'text-emerald-600' : lead.geoScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                          {lead.geoScore}%
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {lead.status === 'new' && (
                          <button
                            id={`quick-run-${lead.id}`}
                            onClick={e => handleQuickRun(e, lead)}
                            disabled={runningId === lead.id}
                            className="text-xs bg-zinc-950 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                          >
                            {runningId === lead.id ? <IconHourglass className="w-3.5 h-3.5" /> : <><IconPlay className="w-3 h-3" /> Diagnóstico</>}
                          </button>
                        )}
                        {lead.status !== 'new' && (
                          <button
                            id={`view-diag-${lead.id}`}
                            onClick={e => { e.stopPropagation(); setSelectedLead(lead); }}
                            className="text-xs bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <IconClipboard className="w-3.5 h-3.5" /> Dashboard
                          </button>
                        )}
                        <button
                          onClick={e => handleDeleteLead(e, lead.id)}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-650 p-1.5 rounded-lg transition-all cursor-pointer"
                          title="Excluir Lead"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
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
    </div>
  );
}
