import React, { useEffect, useState } from 'react';
import { useClients, useLeads, type Client, type ClientHistory } from '../hooks/useFirestore';
import Modal from '../components/Modal';
import { LeadChat } from '../components/LeadChat';
import { AuditAndScreenshotsPanel } from '../components/AuditAndScreenshotsPanel';
import { auth } from '../../lib/firebase';
import {
  IconEdit, IconTrash, IconPlay, IconChat, IconBot, IconShield, IconFolder,
  IconNote, IconHourglass, IconRocket, IconCheck,
} from '../components/icons';

async function getIdToken(): Promise<string> {
  return auth.currentUser?.getIdToken(false) ?? '';
}

interface ClientsListProps {
  onNavigate: (page: string, id?: string) => void;
}

const stageLabels: Record<number, string> = {
  1: 'GEO Start — Diagnóstico Técnico',
  2: 'Planejamento de Intenções',
  3: 'GEO Growth — Infraestrutura',
  4: 'GEO Authority — Conteúdo',
  5: 'Monitoramento Contínuo',
};

const stageAgentMap: Record<number, AgentName> = {
  1: 'gatekeeper',
  2: 'intent',
  3: 'metadata',
  4: 'content',
  5: 'orchestrator',
};

const planConfig = {
  premium: { label: 'Implantação Premium', color: 'text-zinc-700 bg-zinc-100 border-zinc-200/80 shadow-xs' },
  enterprise: { label: 'Enterprise', color: 'text-zinc-950 bg-zinc-200/80 border-zinc-300 shadow-xs' },
};

type AgentName = 'orchestrator' | 'gatekeeper' | 'metadata' | 'content' | 'seo_optimizer' | 'semantic_explorer' | 'offpage' | 'intent' | 'checklist_architect';

const agents: Array<{ id: AgentName; icon: React.ReactNode; name: string; description: string; stage: number }> = [
  { id: 'orchestrator', icon: <IconBot className="w-4 h-4" />, name: 'Orquestrador Master', description: 'Gerencia o pipeline completo e consolida o relatório final', stage: 5 },
  { id: 'gatekeeper', icon: <IconShield className="w-4 h-4" />, name: 'Technical Gatekeeper', description: 'Gera robots.txt otimizado e audita SSR/robots.txt', stage: 1 },
  { id: 'metadata', icon: <IconFolder className="w-4 h-4" />, name: 'Metadata Entity', description: 'Gera códigos JSON-LD Schema e arquivo /llms.txt', stage: 3 },
  { id: 'content', icon: <IconNote className="w-4 h-4" />, name: 'Content Absorption', description: 'Gera bloco AEO (<60 palavras) e tabelas HTML', stage: 4 },
  { id: 'seo_optimizer', icon: <IconEdit className="w-4 h-4" />, name: 'SEO Optimizer', description: 'Otimiza Title/Meta tags, Alt tags e links internos', stage: 1 },
  { id: 'semantic_explorer', icon: <IconFolder className="w-4 h-4" />, name: 'Semantic Explorer', description: 'Mapeia Content Gaps e Topic Clusters semânticos', stage: 2 },
  { id: 'offpage', icon: <IconShield className="w-4 h-4" />, name: 'Off-Page Entity Monitor', description: 'Audita menções externas, Wikidata e pautas de RP', stage: 4 },
  { id: 'intent', icon: <IconChat className="w-4 h-4" />, name: 'Intent Prompt', description: 'Mapeia Citation Share e 20 prompts em 4 LLMs', stage: 2 },
  { id: 'checklist_architect', icon: <IconCheck className="w-4 h-4" />, name: 'Checklist Architect', description: 'QA técnico, código compilado e tutoriais CMS para devs', stage: 5 },
];

// ─── HELPER COMPONENTS: COPY & DOWNLOAD ──────────────────────────────────────
function CopyButton({ text, label = 'Copiar Código' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
    >
      {copied ? <><IconCheck className="w-3.5 h-3.5 text-emerald-400" /> Copiado!</> : label}
    </button>
  );
}

function DownloadButton({ content, filename, label = 'Baixar Arquivo', mimeType = 'text/plain' }: {
  content: string; filename: string; label?: string; mimeType?: string;
}) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      type="button"
      className="text-xs bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 font-semibold px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
    >
      📥 {label}
    </button>
  );
}

// ─── EDITABLE DELIVERABLE CARD ──────────────────────────────────────────────
function DeliverableCard({ title, description, content: initialContent, filename, onSave }: {
  title: string; description: string; content: string; filename: string; onSave?: (updated: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(initialContent);

  useEffect(() => {
    setEditableContent(initialContent);
  }, [initialContent]);

  const hasUnfilledPlaceholder = /\[PREENCHER|\[INSTRUÇÃO|\[Dado real|\[Critério relevante|\[Nome real da fonte/i.test(editableContent);

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
      {hasUnfilledPlaceholder && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-xl px-3 py-2">
          ⚠️ Este template contém instruções entre [colchetes] — substitua por informação real antes de publicar.
        </div>
      )}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h4 className="font-display font-bold text-zinc-900 text-sm flex items-center gap-1.5">⚡ {title}</h4>
          <p className="text-zinc-500 text-xs mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(e => !e)}
            className="text-xs bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
          >
            {isEditing ? '✓ Concluir Edição' : '✏️ Editar'}
          </button>
          <CopyButton text={editableContent} label="Copiar" />
          <DownloadButton content={editableContent} filename={filename} label="Baixar" />
        </div>
      </div>
      {isEditing ? (
        <textarea
          value={editableContent}
          onChange={e => {
            setEditableContent(e.target.value);
            if (onSave) onSave(e.target.value);
          }}
          rows={10}
          className="w-full bg-zinc-950 text-emerald-400 font-mono text-[11px] p-4 rounded-xl border border-zinc-800 focus:outline-none focus:border-emerald-500"
        />
      ) : (
        <div className="bg-zinc-950 text-zinc-200 font-mono text-[11px] p-4 rounded-xl overflow-x-auto max-h-72 whitespace-pre-wrap leading-relaxed border border-zinc-800">
          {editableContent}
        </div>
      )}
    </div>
  );
}

// ─── PANEL: HISTORY & EVOLUTION (Antes vs. Depois) ───────────────────────────
function ClientHistoryPanel({ client }: { client: Client }) {
  const { fetchClientHistory } = useClients();
  const { downloadHtmlReport } = useLeads();
  const [historyData, setHistoryData] = useState<ClientHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetchClientHistory(client.id);
        if (res.success) setHistoryData(res.clientHistory);
      } catch (e) {
        console.error('Erro ao buscar histórico do cliente:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [client.id]);

  if (loading) {
    return <div className="p-8 text-center text-zinc-400 font-mono text-xs">Carregando histórico e evolução do cliente...</div>;
  }

  if (!historyData || historyData.diagnosticsCount === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center space-y-3">
        <IconRocket className="w-8 h-8 text-zinc-300 mx-auto" />
        <p className="text-zinc-800 font-bold text-sm">Nenhum histórico acumulado ainda</p>
        <p className="text-zinc-500 text-xs max-w-md mx-auto">
          Execute os diagnósticos dos Agentes no Workspace para registrar cada marco e acompanhar a evolução temporal do GEO Score.
        </p>
      </div>
    );
  }

  const { initialScore, latestScore, scoreDiff, evolutionPercentage, diagnostics } = historyData;
  const firstDiag = diagnostics[0];
  const lastDiag = diagnostics[diagnostics.length - 1];

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">GEO Score Inicial</span>
          <span className="text-3xl font-mono font-bold text-zinc-700 block mt-1">{initialScore}%</span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">{new Date(firstDiag.generatedAt).toLocaleDateString('pt-BR')}</span>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">GEO Score Atual</span>
          <span className={`text-3xl font-mono font-bold block mt-1 ${latestScore >= 70 ? 'text-emerald-600' : latestScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
            {latestScore}%
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">{new Date(lastDiag.generatedAt).toLocaleDateString('pt-BR')}</span>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Variação de Pontos</span>
          <span className={`text-3xl font-mono font-bold block mt-1 ${scoreDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff} pts
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">diferença total</span>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Ganho de Evolução</span>
          <span className="text-3xl font-mono font-bold text-emerald-600 block mt-1">+{evolutionPercentage}%</span>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">melhoria acumulada</span>
        </div>
      </div>

      {/* Comparative Before vs After Matrix */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h4 className="font-display font-bold text-zinc-900 text-sm flex items-center justify-between">
          <span>🔄 Comparativo: Antes vs. Depois da Implantação</span>
          <span className="text-xs font-mono text-zinc-400">{diagnostics.length} auditoria(s) registrada(s)</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200 font-mono text-[10px] text-zinc-400 uppercase">
              <tr>
                <th className="p-3">Indicador GEO</th>
                <th className="p-3">Antes (Diagnóstico Inicial)</th>
                <th className="p-3">Depois (Status Atual)</th>
                <th className="p-3">Status da Evolução</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150">
              <tr>
                <td className="p-3 font-semibold text-zinc-900">robots.txt para IAs</td>
                <td className="p-3 text-zinc-600">{firstDiag.gatekeeperStatus.robotsTxtAllowAiBots ? '✓ Liberado' : '✗ Bloqueado'}</td>
                <td className="p-3 font-semibold text-zinc-900">{lastDiag.gatekeeperStatus.robotsTxtAllowAiBots ? '✓ Liberado' : '✗ Bloqueado'}</td>
                <td className="p-3">{lastDiag.gatekeeperStatus.robotsTxtAllowAiBots ? <span className="text-emerald-600 font-bold">✓ Otimizado</span> : <span className="text-amber-600 font-bold">Pendente</span>}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-zinc-900">Schema Organization</td>
                <td className="p-3 text-zinc-600">{firstDiag.metadataAnalysis.organizationSchemaPresent ? '✓ Presente' : '✗ Ausente'}</td>
                <td className="p-3 font-semibold text-zinc-900">{lastDiag.metadataAnalysis.organizationSchemaPresent ? '✓ Presente' : '✗ Ausente'}</td>
                <td className="p-3">{lastDiag.metadataAnalysis.organizationSchemaPresent ? <span className="text-emerald-600 font-bold">✓ Otimizado</span> : <span className="text-red-600 font-bold">Crítico</span>}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-zinc-900">Arquivo /llms.txt</td>
                <td className="p-3 text-zinc-600">{firstDiag.metadataAnalysis.llmsTxtPublished ? '✓ Publicado' : '✗ Ausente'}</td>
                <td className="p-3 font-semibold text-zinc-900">{lastDiag.metadataAnalysis.llmsTxtPublished ? '✓ Publicado' : '✗ Ausente'}</td>
                <td className="p-3">{lastDiag.metadataAnalysis.llmsTxtPublished ? <span className="text-emerald-600 font-bold">✓ Otimizado</span> : <span className="text-amber-600 font-bold">Pendente</span>}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-zinc-900">Resposta AEO (&lt;60 palavras)</td>
                <td className="p-3 text-zinc-600">{firstDiag.contentReview.factorsDetected.hasTldrAnswerFirstParagraph ? '✓ Sim' : '✗ Não'}</td>
                <td className="p-3 font-semibold text-zinc-900">{lastDiag.contentReview.factorsDetected.hasTldrAnswerFirstParagraph ? '✓ Sim' : '✗ Não'}</td>
                <td className="p-3">{lastDiag.contentReview.factorsDetected.hasTldrAnswerFirstParagraph ? <span className="text-emerald-600 font-bold">✓ Otimizado</span> : <span className="text-amber-600 font-bold">Pendente</span>}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-zinc-900">Citation Share nas IAs</td>
                <td className="p-3 text-zinc-600">{Math.round((firstDiag.visibilityBenchmarking.citationSharePercentage || 0) * 100)}%</td>
                <td className="p-3 font-semibold text-zinc-900">{Math.round((lastDiag.visibilityBenchmarking.citationSharePercentage || 0) * 100)}%</td>
                <td className="p-3"><span className="text-emerald-600 font-bold">✓ Medido</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h4 className="font-display font-bold text-zinc-900 text-sm">📅 Linha do Tempo de Relatórios Salvos no Firestore</h4>
        <div className="space-y-3">
          {diagnostics.map((diag, index) => (
            <div key={diag.id || index} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
              <div>
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Relatório #{index + 1}</span>
                <span className="text-xs font-semibold text-zinc-900">{new Date(diag.generatedAt).toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold text-sm ${diag.overallGeoScore >= 70 ? 'text-emerald-600' : diag.overallGeoScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                  Score: {diag.overallGeoScore}%
                </span>
                <button
                  onClick={() => downloadHtmlReport(client.leadId || client.id, client.company || 'Cliente')}
                  className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  🌐 Baixar Relatório HTML
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FULL PAGE: CLIENT WORKSPACE VIEW ─────────────────────────────────────────
function ClientWorkspacePage({ client, onBack, onEdit, onDelete }: {
  client: Client; onBack: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const { runAgentForClient, fetchClientHistory, editClient } = useClients();
  const [activeAgent, setActiveAgent] = useState<AgentName>('orchestrator');
  const [mainView, setMainView] = useState<'deliverables' | 'stages' | 'history' | 'audit' | 'chat'>('deliverables');
  const [running, setRunning] = useState(false);
  const [url, setUrl] = useState(client.url);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState<number>(client.currentStage || 1);

  // Persistent outputs per agent
  const [agentOutputs, setAgentOutputs] = useState<Record<AgentName, any>>({
    orchestrator: null,
    gatekeeper: null,
    metadata: null,
    content: null,
    seo_optimizer: null,
    semantic_explorer: null,
    offpage: null,
    intent: null,
    checklist_architect: null,
  });

  // Pre-populate deliverables on mount from Firestore
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchClientHistory(client.id);
        if (res.success && res.clientHistory.diagnosticsCount > 0) {
          const latest = res.clientHistory.diagnostics[res.clientHistory.diagnosticsCount - 1];
          if (latest) {
            setAgentOutputs(prev => ({
              ...prev,
              orchestrator: {
                overallGeoScore: latest.overallGeoScore,
                actionItemsPriorityList: latest.actionItemsPriorityList,
                deliverables: (latest as any).deliverables || {
                  robotsTxt: `# robots.txt recomendado\nUser-agent: GPTBot\nAllow: /`,
                  jsonLdSchema: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", "name": client.company || client.url }, null, 2),
                  llmsTxt: `# ${client.company}\n> llms.txt`,
                },
                actionPlanMarkdown: (latest as any).actionPlanMarkdown || `# Plano Estratégico GEO`,
              },
              gatekeeper: latest.gatekeeperStatus ? {
                ...latest.gatekeeperStatus,
                recommendedRobotsTxt: (latest as any).deliverables?.robotsTxt || `# robots.txt recomendado para ${client.url}\nUser-agent: GPTBot\nAllow: /`,
              } : prev.gatekeeper,
              metadata: latest.metadataAnalysis ? {
                ...latest.metadataAnalysis,
                generatedJsonLd: (latest as any).deliverables?.jsonLdSchema || JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", "name": client.company }, null, 2),
                llmsTxt: (latest as any).deliverables?.llmsTxt || `# ${client.company}\n> /llms.txt`,
              } : prev.metadata,
              content: latest.contentReview ? {
                ...latest.contentReview,
                aeoTemplates: (latest as any).deliverables?.aeoTemplates || {
                  tldrAnswerFirstBlock: `<div class="geo-aeo-tldr">Resumo AEO</div>`,
                  htmlComparisonTable: `<table><tr><th>Critério</th><th>${client.url}</th></tr></table>`,
                },
              } : prev.content,
              seo_optimizer: (latest as any).seoAnalysis || prev.seo_optimizer,
              semantic_explorer: (latest as any).semanticAnalysis || prev.semantic_explorer,
              offpage: (latest as any).offpageAnalysis || prev.offpage,
              intent: latest.visibilityBenchmarking || prev.intent,
              checklist_architect: (latest as any).checklist || prev.checklist_architect,
            }));
          }
        }
      } catch (e) {
        console.error('Erro ao preencher entregáveis salvos:', e);
      }
    })();
  }, [client.id]);

  const handleRunAgent = async (targetAgent: AgentName = activeAgent) => {
    setRunning(true);
    setLogs([`[${new Date().toLocaleTimeString()}] Executando ${targetAgent}...`]);
    try {
      const res = await runAgentForClient(client.id, targetAgent, { url });
      setAgentOutputs(prev => ({
        ...prev,
        [targetAgent]: res.result,
      }));
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Concluído com sucesso! Entregáveis gravados.`]);
    } catch (e: any) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Erro: ${e.message}`]);
    } finally {
      setRunning(false);
    }
  };

  const handleStageSelect = async (stageNumber: number) => {
    setCurrentStage(stageNumber);
    const mappedAgent = stageAgentMap[stageNumber];
    if (mappedAgent) {
      setActiveAgent(mappedAgent);
    }
    try {
      await editClient(client.id, { currentStage: stageNumber as any });
    } catch (e) {
      console.error('Erro ao atualizar etapa no Firestore:', e);
    }
  };

  const currentAgent = agents.find(a => a.id === activeAgent)!;
  const currentOutput = agentOutputs[activeAgent];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold px-3.5 py-2 rounded-xl border border-zinc-300 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            ← Voltar para Clientes
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-bold text-zinc-900 truncate">{client.company || client.url}</h1>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${planConfig[client.plan]?.color || ''}`}>
                {planConfig[client.plan]?.label || client.plan}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate">{client.url} • Etapa #{currentStage}: {stageLabels[currentStage]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="text-xs bg-zinc-100 hover:bg-zinc-200 font-bold px-3 py-2 rounded-xl border border-zinc-300 transition-all cursor-pointer flex items-center gap-1.5">
            <IconEdit className="w-3.5 h-3.5" /> Editar Cliente
          </button>
          <button onClick={onDelete} className="text-xs bg-red-50 hover:bg-red-100 text-red-650 font-bold px-3 py-2 rounded-xl border border-red-200 transition-all cursor-pointer flex items-center gap-1.5">
            <IconTrash className="w-3.5 h-3.5" /> Excluir
          </button>
        </div>
      </div>

      {/* Main View Navigation Tabs */}
      <div className="flex overflow-x-auto max-w-full scrollbar-none bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-xs text-xs font-semibold gap-1">
        <button
          onClick={() => setMainView('deliverables')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${mainView === 'deliverables' ? 'bg-zinc-950 text-white shadow-sm font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          ⚡ Agentes & Entregáveis Práticos
        </button>
        <button
          onClick={() => setMainView('stages')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${mainView === 'stages' ? 'bg-zinc-950 text-white shadow-sm font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          🗺️ Controle das 5 Etapas
        </button>
        <button
          onClick={() => setMainView('history')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${mainView === 'history' ? 'bg-zinc-950 text-white shadow-sm font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          📊 Histórico & Evolução (Antes vs. Depois)
        </button>
        <button
          onClick={() => setMainView('audit')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${mainView === 'audit' ? 'bg-zinc-950 text-white shadow-sm font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          🔬 Auditoria LLM & Prints
        </button>
        <button
          onClick={() => setMainView('chat')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${mainView === 'chat' ? 'bg-zinc-950 text-white shadow-sm font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          💬 Chat 360° (IA)
        </button>
      </div>

      {/* VIEW 1: AGENTS & DELIVERABLES */}
      {mainView === 'deliverables' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Agent Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block px-1 mb-2">5 Agentes Especialistas GEO</span>
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(agent.id)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-2xl text-left transition-all cursor-pointer border ${
                  activeAgent === agent.id
                    ? 'bg-zinc-950 text-white border-zinc-950 shadow-md'
                    : 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border-zinc-200'
                }`}
              >
                <span className="shrink-0 mt-0.5">{agent.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold font-display leading-tight truncate">{agent.name}</p>
                    {agentOutputs[agent.id] && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Possui entregável gravado" />}
                  </div>
                  <p className={`text-[10px] leading-tight mt-1 ${activeAgent === agent.id ? 'text-zinc-300' : 'text-zinc-400'}`}>{agent.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Deliverables Content Panel */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-zinc-200 rounded-2xl shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-zinc-700">{currentAgent.icon}</span>
                <div>
                  <h3 className="text-zinc-900 font-display font-bold text-sm">{currentAgent.name}</h3>
                  <p className="text-zinc-500 text-xs">{currentAgent.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleRunAgent(activeAgent)}
                disabled={running}
                className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {running ? <><IconHourglass className="w-3.5 h-3.5" /> Gerando entregáveis...</> : <><IconPlay className="w-3.5 h-3.5" /> Executar {currentAgent.name}</>}
              </button>
            </div>

            {logs.length > 0 && (
              <div className="tactile-sunken rounded-xl p-3.5 font-mono text-[10px] space-y-1 bg-zinc-50 text-zinc-600">
                {logs.map((log, i) => <p key={i}>{log}</p>)}
              </div>
            )}

            {!currentOutput ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-3">
                <IconBot className="w-10 h-10 text-zinc-300 mx-auto" />
                <p className="text-zinc-800 font-bold text-sm">Nenhum entregável gerado para {currentAgent.name} ainda</p>
                <p className="text-zinc-500 text-xs max-w-md mx-auto">
                  Clique no botão acima para executar a análise e gerar códigos de implementação prontos para editar, copiar e baixar.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Orquestrador Deliverables */}
                {activeAgent === 'orchestrator' && (
                  <>
                    {currentOutput.actionPlanMarkdown && (
                      <DeliverableCard
                        title="Roteiro Estratégico de Implantação GEO (5 Etapas)"
                        description="Plano de ação completo para apresentar e implantar junto com o cliente."
                        content={currentOutput.actionPlanMarkdown}
                        filename={`Plano_Acao_GEO_${client.company || 'Cliente'}.md`}
                        onSave={updated => {
                          setAgentOutputs(prev => ({
                            ...prev,
                            orchestrator: { ...prev.orchestrator, actionPlanMarkdown: updated }
                          }));
                        }}
                      />
                    )}
                    {currentOutput.deliverables?.jsonLdSchema && (
                      <DeliverableCard
                        title="Códigos JSON-LD Schema (Organization, Person, WebSite)"
                        description="Código pronto para copiar e colar na tag <head> do site do cliente."
                        content={currentOutput.deliverables.jsonLdSchema}
                        filename="schema.jsonld"
                        onSave={updated => {
                          setAgentOutputs(prev => ({
                            ...prev,
                            orchestrator: { ...prev.orchestrator, deliverables: { ...prev.orchestrator.deliverables, jsonLdSchema: updated } }
                          }));
                        }}
                      />
                    )}
                    {currentOutput.deliverables?.llmsTxt && (
                      <DeliverableCard
                        title="Arquivo /llms.txt (Mapa Semântico em Markdown para IAs)"
                        description="Arquivo pronto para salvar e publicar na raiz do servidor web do cliente."
                        content={currentOutput.deliverables.llmsTxt}
                        filename="llms.txt"
                        onSave={updated => {
                          setAgentOutputs(prev => ({
                            ...prev,
                            orchestrator: { ...prev.orchestrator, deliverables: { ...prev.orchestrator.deliverables, llmsTxt: updated } }
                          }));
                        }}
                      />
                    )}
                  </>
                )}

                {/* Technical Gatekeeper Deliverable */}
                {activeAgent === 'gatekeeper' && (
                  <DeliverableCard
                    title="Arquivo robots.txt Otimizado para Robôs de IA"
                    description="Configuração de permissões explícitas para GPTBot, ClaudeBot, PerplexityBot e Bytespider."
                    content={currentOutput.recommendedRobotsTxt || `# robots.txt recomendado para ${client.url}\nUser-agent: GPTBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /`}
                    filename="robots.txt"
                    onSave={updated => {
                      setAgentOutputs(prev => ({
                        ...prev,
                        gatekeeper: { ...prev.gatekeeper, recommendedRobotsTxt: updated }
                      }));
                    }}
                  />
                )}

                {/* Metadata Entity Deliverables */}
                {activeAgent === 'metadata' && (
                  <>
                    <DeliverableCard
                      title="Código JSON-LD Schema Completo"
                      description="Estrutura de dados com sameAs apontando para LinkedIn, Crunchbase e Wikipedia."
                      content={currentOutput.generatedJsonLd || JSON.stringify(currentOutput, null, 2)}
                      filename="schema.jsonld"
                      onSave={updated => {
                        setAgentOutputs(prev => ({
                          ...prev,
                          metadata: { ...prev.metadata, generatedJsonLd: updated }
                        }));
                      }}
                    />
                    <DeliverableCard
                      title="Arquivo /llms.txt para Publicação"
                      description="Mapa de autoridades e links canônicos para consumo nativo por LLMs."
                      content={currentOutput.llmsTxt || `# /llms.txt para ${client.url}`}
                      filename="llms.txt"
                      onSave={updated => {
                        setAgentOutputs(prev => ({
                          ...prev,
                          metadata: { ...prev.metadata, llmsTxt: updated }
                        }));
                      }}
                    />
                  </>
                )}

                {/* Content Absorption Deliverables */}
                {activeAgent === 'content' && (
                  <>
                    {currentOutput.aeoTemplates?.tldrAnswerFirstBlock && (
                      <DeliverableCard
                        title="Bloco de Resposta Direta AEO (<60 palavras)"
                        description="Trecho otimizado para inserção no topo de páginas H2."
                        content={currentOutput.aeoTemplates.tldrAnswerFirstBlock}
                        filename="aeo_tldr_block.html"
                        onSave={updated => {
                          setAgentOutputs(prev => ({
                            ...prev,
                            content: { ...prev.content, aeoTemplates: { ...prev.content.aeoTemplates, tldrAnswerFirstBlock: updated } }
                          }));
                        }}
                      />
                    )}
                    {currentOutput.aeoTemplates?.htmlComparisonTable && (
                      <DeliverableCard
                        title="Tabela Comparativa em HTML Nativo (Princeton Factor)"
                        description="Tabela HTML otimizada para aumentar em até 47% a citabilidade nas LLMs."
                        content={currentOutput.aeoTemplates.htmlComparisonTable}
                        filename="tabela_comparativa.html"
                        onSave={updated => {
                          setAgentOutputs(prev => ({
                            ...prev,
                            content: { ...prev.content, aeoTemplates: { ...prev.content.aeoTemplates, htmlComparisonTable: updated } }
                          }));
                        }}
                      />
                    )}
                  </>
                )}

                {/* SEO Optimizer Deliverable */}
                {activeAgent === 'seo_optimizer' && (
                  <DeliverableCard
                    title="Relatório de Otimização de SEO Clássico (Title/Meta, Alt Tags, PageRank)"
                    description="Diagnóstico de trechos, atributos de imagens e links internos."
                    content={JSON.stringify(currentOutput, null, 2)}
                    filename="relatorio_seo_optimizer.json"
                  />
                )}

                {/* Semantic Explorer Deliverable */}
                {activeAgent === 'semantic_explorer' && (
                  <DeliverableCard
                    title="Mapeamento de Content Gaps e Topic Clusters"
                    description="Ideação de lacunas de conteúdo e briefings estruturados."
                    content={JSON.stringify(currentOutput, null, 2)}
                    filename="topic_clusters_briefing.json"
                  />
                )}

                {/* Off-Page Entity Monitor Deliverable */}
                {activeAgent === 'offpage' && (
                  <DeliverableCard
                    title="Auditoria de Entidade Externa, Wikidata e Pautas de PR Digital"
                    description="Co-ocorrência semântica e oportunidades de imprensa."
                    content={JSON.stringify(currentOutput, null, 2)}
                    filename="relatorio_offpage_pr.json"
                  />
                )}

                {/* Intent Prompt Deliverable */}
                {activeAgent === 'intent' && (
                  <DeliverableCard
                    title="Relatório de Visibilidade e Prompts de Teste nas IAs"
                    description="Mapeamento de Citation Share e perguntas de intenção testadas."
                    content={JSON.stringify(currentOutput, null, 2)}
                    filename="citation_share_report.json"
                  />
                )}

                {/* Checklist Architect Deliverable */}
                {activeAgent === 'checklist_architect' && (
                  <DeliverableCard
                    title="Checklist Interativo de QA & Instruções CMS para Devs"
                    description="Snippets de código compilados, tutoriais de instalação e checklist de validação."
                    content={JSON.stringify(currentOutput, null, 2)}
                    filename="checklist_qa_devs.json"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: STAGES CONTROL */}
      {mainView === 'stages' && (
        <div className="space-y-5">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-150 pb-4">
              <div>
                <h4 className="font-display font-bold text-zinc-900 text-base">🗺️ Controle e Navegação das 5 Etapas GEO</h4>
                <p className="text-zinc-500 text-xs mt-0.5">Selecione uma etapa para avançar a esteira do cliente e executar seu agente correspondente.</p>
              </div>
              <span className="text-xs font-mono font-bold bg-zinc-100 text-zinc-800 px-3.5 py-1.5 rounded-xl border border-zinc-200 self-start">
                Etapa Atual no Projeto: #{currentStage}
              </span>
            </div>

            {/* Stage Cards Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map(stage => {
                const isCurrent = currentStage === stage;
                const agentForStage = agents.find(a => a.stage === stage)!;
                return (
                  <button
                    key={stage}
                    onClick={() => handleStageSelect(stage)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                      isCurrent
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-md scale-[1.02]'
                        : stage < currentStage
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/60'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold uppercase ${isCurrent ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        Etapa #{stage}
                      </span>
                      {stage < currentStage && <IconCheck className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs leading-tight line-clamp-2">{stageLabels[stage].split(' — ')[1] || stageLabels[stage]}</p>
                      <p className={`text-[10px] font-mono mt-1 ${isCurrent ? 'text-zinc-400' : 'text-zinc-500'}`}>🤖 {agentForStage.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stage Action Box */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h5 className="font-bold text-zinc-900 text-sm">Etapa Selecionada: #{currentStage} — {stageLabels[currentStage]}</h5>
                <p className="text-zinc-500 text-xs mt-1">
                  Agente Responsável: <span className="font-bold text-zinc-800">{agents.find(a => a.stage === currentStage)?.name}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  const mappedAgent = stageAgentMap[currentStage];
                  if (mappedAgent) {
                    setActiveAgent(mappedAgent);
                    setMainView('deliverables');
                    handleRunAgent(mappedAgent);
                  }
                }}
                disabled={running}
                className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-3 px-5 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap"
              >
                {running ? <><IconHourglass className="w-3.5 h-3.5" /> Executando...</> : <><IconPlay className="w-3.5 h-3.5" /> ⚡ Executar Agente da Etapa #{currentStage}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: HISTORY & EVOLUTION */}
      {mainView === 'history' && (
        <ClientHistoryPanel client={client} />
      )}

      {/* VIEW 4: AUDITORIA LLM & PRINTS */}
      {mainView === 'audit' && (
        <AuditAndScreenshotsPanel entityType="client" entityId={client.id} leadUrl={client.url} />
      )}

      {/* VIEW 5: CHAT 360 */}
      {mainView === 'chat' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-4 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-700 shadow-xs">
            <span>Agente Ativo no Chat 360°:</span>
            <select
              value={activeAgent}
              onChange={e => setActiveAgent(e.target.value as AgentName)}
              className="bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
            >
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs min-h-[480px]">
            <LeadChat leadId={client.id} agentName={activeAgent} leadUrl={client.url} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CLIENT EDIT MODAL ──────────────────────────────────────────────────────
function ClientEditModal({ client, onSave, onCancel }: { client: Client; onSave: (updated: Partial<Client>) => void; onCancel: () => void }) {
  const [name, setName] = useState(client.name);
  const [company, setCompany] = useState(client.company);
  const [url, setUrl] = useState(client.url);
  const [email, setEmail] = useState(client.email);
  const [plan, setPlan] = useState(client.plan);
  const [currentStage, setCurrentStage] = useState(client.currentStage);
  const [notes, setNotes] = useState(client.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, company, url, email, plan, currentStage, notes });
  };

  return (
    <Modal onClose={onCancel} title="Editar Cliente" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">Nome do Responsável</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2" />
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
            <label className="text-zinc-400 font-bold block">Empresa</label>
            <input required value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2" />
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">Plano</label>
            <select value={plan} onChange={e => setPlan(e.target.value as any)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">Estágio GEO</label>
            <select value={currentStage} onChange={e => setCurrentStage(parseInt(e.target.value) as any)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
              {[1, 2, 3, 4, 5].map(s => (
                <option key={s} value={s}>Etapa {s} — {stageLabels[s]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-zinc-400 font-bold block">Notas / Observações</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2" placeholder="Notas sobre o onboarding e andamento..." />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t border-zinc-100">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-zinc-200 rounded-xl font-bold cursor-pointer hover:bg-zinc-50">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-zinc-950 text-white rounded-xl font-bold cursor-pointer hover:bg-zinc-800">Salvar Alterações</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── CLIENTS LIST MAIN PAGE ──────────────────────────────────────────────────
export default function ClientsList({ onNavigate }: ClientsListProps) {
  const { clients, loading, error, fetchClients, editClient, deleteClient } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSaveClient = async (updatedFields: Partial<Client>) => {
    if (!editingClient) return;
    try {
      const res = await editClient(editingClient.id, updatedFields);
      if (res.success) {
        setEditingClient(null);
        if (selectedClient && selectedClient.id === editingClient.id) {
          setSelectedClient(prev => prev ? { ...prev, ...updatedFields } : null);
        }
      }
    } catch (err: any) {
      alert(`Erro ao salvar cliente: ${err.message}`);
    }
  };

  const handleDeleteClient = async (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza absoluta que deseja excluir este Cliente? Todo o histórico dele será removido.')) return;
    try {
      await deleteClient(clientId);
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient(null);
      }
    } catch (err: any) {
      alert(`Erro ao excluir cliente: ${err.message}`);
    }
  };

  // If a client is selected, render the dedicated Full-Page Workspace View!
  if (selectedClient) {
    return (
      <ClientWorkspacePage
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
        onEdit={() => setEditingClient(selectedClient)}
        onDelete={() => {
          if (window.confirm('Tem certeza que deseja excluir este Cliente?')) {
            deleteClient(selectedClient.id);
            setSelectedClient(null);
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-zinc-900">Clientes</h1>
        <p className="text-zinc-500 text-sm mt-1 font-medium">Gestão GEO completa com entregáveis acionáveis e histórico de evolução</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400 text-sm font-mono">Carregando clientes...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 text-sm font-medium">{error}</div>
      ) : clients.length === 0 ? (
        <div className="tactile-raised p-12 text-center bg-white/60">
          <IconRocket className="w-10 h-10 mx-auto mb-4 text-zinc-300" />
          <p className="text-zinc-800 font-display font-bold text-base mb-1">Nenhum cliente ainda</p>
          <p className="text-zinc-500 text-sm mb-4 font-medium">Converta um lead em cliente para acessar o workspace completo de agentes GEO</p>
          <button
            onClick={() => onNavigate('leads')}
            className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
          >
            Ver Leads →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clients.map(client => (
            <div
              key={client.id}
              className="tactile-raised p-6 bg-white/60 hover:scale-[1.01] transition-all duration-200 cursor-pointer group flex flex-col justify-between"
              onClick={() => setSelectedClient(client)}
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
                  <div className="min-w-0">
                    <h3 className="text-zinc-900 font-display font-bold text-base break-all">{client.company || client.url}</h3>
                    <p className="text-zinc-450 text-xs font-mono mt-0.5 break-all">{client.url}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold self-start ${planConfig[client.plan]?.color || ''}`}>
                    {planConfig[client.plan]?.label || client.plan}
                  </span>
                </div>

                {/* Stage progress */}
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-400 font-mono">Etapa {client.currentStage}/5</span>
                    <span className="text-zinc-700 font-bold">{stageLabels[client.currentStage]}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= client.currentStage ? 'bg-zinc-950' : 'bg-zinc-200'}`} />
                    ))}
                  </div>
                </div>

                {/* Notes summary */}
                {client.notes && (
                  <div className="text-[11px] text-zinc-500 italic bg-zinc-50 border border-zinc-150 p-2.5 rounded-xl mb-4 font-light leading-relaxed flex items-start gap-1.5">
                    <IconNote className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {client.notes.length > 80 ? `${client.notes.slice(0, 80)}...` : client.notes}
                  </div>
                )}
              </div>

              <div>
                {/* GEO score trend */}
                {client.geoScoreHistory && client.geoScoreHistory.length > 0 && (
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 font-medium">GEO Score atual:</span>
                      <span className="text-emerald-600 font-mono font-bold text-sm">
                        {client.geoScoreHistory[client.geoScoreHistory.length - 1]?.score}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Card footer actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingClient(client)}
                      className="flex-1 sm:flex-initial text-[10px] bg-zinc-100 hover:bg-zinc-200 border border-zinc-250 text-zinc-700 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <IconEdit className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={e => handleDeleteClient(e, client.id)}
                      className="flex-1 sm:flex-initial text-[10px] bg-red-50 hover:bg-red-105 border border-red-200 text-red-650 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <IconTrash className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedClient(client)}
                    className="text-[10px] bg-zinc-950 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg font-bold transition-all shadow-xs cursor-pointer text-center sm:ml-auto w-full sm:w-auto"
                  >
                    Abrir Workspace GEO →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <ClientEditModal
          client={editingClient}
          onSave={handleSaveClient}
          onCancel={() => setEditingClient(null)}
        />
      )}
    </div>
  );
}
