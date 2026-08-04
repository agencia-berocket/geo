import React, { useEffect, useState, useRef } from 'react';
import { useClients, useLeads, type Client, type ClientHistory, type DiagnosticReport } from '../hooks/useFirestore';
import Modal from '../components/Modal';
import { LeadChat } from '../components/LeadChat';
import { auth } from '../../lib/firebase';
import {
  IconEdit, IconTrash, IconPlay, IconChat, IconBot, IconShield, IconFolder,
  IconNote, IconHourglass, IconRocket, IconCheck, IconWarning, IconSend, IconStar,
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

const planConfig = {
  premium: { label: 'Implantação Premium', color: 'text-zinc-700 bg-zinc-100 border-zinc-200/80 shadow-xs' },
  enterprise: { label: 'Enterprise', color: 'text-zinc-950 bg-zinc-200/80 border-zinc-300 shadow-xs' },
};

type AgentName = 'orchestrator' | 'gatekeeper' | 'metadata' | 'content' | 'intent';

const agents: Array<{ id: AgentName; icon: React.ReactNode; name: string; description: string }> = [
  { id: 'orchestrator', icon: <IconBot className="w-4 h-4" />, name: 'Orquestrador', description: 'Gerencia o pipeline completo e gera o Roteiro GEO' },
  { id: 'gatekeeper', icon: <IconShield className="w-4 h-4" />, name: 'Technical Gatekeeper', description: 'Gera robots.txt otimizado e audita SSR' },
  { id: 'metadata', icon: <IconFolder className="w-4 h-4" />, name: 'Metadata Entity', description: 'Gera códigos JSON-LD Schema e arquivo /llms.txt' },
  { id: 'content', icon: <IconNote className="w-4 h-4" />, name: 'Content Absorption', description: 'Gera bloco AEO (<60 palavras) e tabelas HTML' },
  { id: 'intent', icon: <IconChat className="w-4 h-4" />, name: 'Intent Prompt', description: 'Mapeia prompts de teste e Citation Share' },
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

function DeliverableCard({ title, description, content, filename }: {
  title: string; description: string; content: string; filename: string;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-display font-bold text-zinc-900 text-sm flex items-center gap-1.5">⚡ {title}</h4>
          <p className="text-zinc-500 text-xs mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={content} label="Copiar" />
          <DownloadButton content={content} filename={filename} label="Baixar" />
        </div>
      </div>
      <div className="bg-zinc-950 text-zinc-200 font-mono text-[11px] p-3.5 rounded-xl overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed border border-zinc-800">
        {content}
      </div>
    </div>
  );
}

// ─── PANEL: HISTORY & EVOLUTION (Antes vs. Depois) ───────────────────────────
function ClientHistoryPanel({ client }: { client: Client }) {
  const { fetchClientHistory } = useClients();
  const { downloadPdfReport } = useLeads();
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
          Execute os diagnósticos do Orquestrador no Workspace para registrar cada marco e acompanhar a evolução temporal do GEO Score.
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
        <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">GEO Score Inicial</span>
          <span className="text-2xl font-mono font-bold text-zinc-700 block mt-1">{initialScore}%</span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">{new Date(firstDiag.generatedAt).toLocaleDateString('pt-BR')}</span>
        </div>
        <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">GEO Score Atual</span>
          <span className={`text-2xl font-mono font-bold block mt-1 ${latestScore >= 70 ? 'text-emerald-600' : latestScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
            {latestScore}%
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">{new Date(lastDiag.generatedAt).toLocaleDateString('pt-BR')}</span>
        </div>
        <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Variação de Pontos</span>
          <span className={`text-2xl font-mono font-bold block mt-1 ${scoreDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff} pts
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">diferença total</span>
        </div>
        <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Ganho de Evolução</span>
          <span className="text-2xl font-mono font-bold text-emerald-600 block mt-1">+{evolutionPercentage}%</span>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">melhoria acumulada</span>
        </div>
      </div>

      {/* Comparative Before vs After Matrix */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
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
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="font-display font-bold text-zinc-900 text-sm">📅 Linha do Tempo de Relatórios Salvos no Firestore</h4>
        <div className="space-y-3">
          {diagnostics.map((diag, index) => (
            <div key={diag.id || index} className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
              <div>
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Relatório #{index + 1}</span>
                <span className="text-xs font-semibold text-zinc-900">{new Date(diag.generatedAt).toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold text-sm ${diag.overallGeoScore >= 70 ? 'text-emerald-600' : diag.overallGeoScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                  Score: {diag.overallGeoScore}%
                </span>
                <button
                  onClick={() => downloadPdfReport(client.leadId || client.id, `Relatorio_GEO_${client.company || 'Cliente'}_${index + 1}.pdf`)}
                  className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  📄 Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN AGENT WORKSPACE PANEL ─────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function AgentWorkspacePanel({ client, onClose }: { client: Client; onClose: () => void }) {
  const { runAgentForClient } = useClients();
  const [activeAgent, setActiveAgent] = useState<AgentName>('orchestrator');
  const [mainView, setMainView] = useState<'deliverables' | 'history' | 'chat' | 'stages'>('deliverables');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [url, setUrl] = useState(client.url);
  const [logs, setLogs] = useState<string[]>([]);

  // Default agent execution on mount or agent switch
  const handleRunAgent = async () => {
    setRunning(true);
    setResult(null);
    setLogs([`[${new Date().toLocaleTimeString()}] Executando ${activeAgent}...`]);
    try {
      const res = await runAgentForClient(client.id, activeAgent, { url });
      setResult(res.result);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Executado com sucesso! Entregáveis gerados.`]);
    } catch (e: any) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Erro: ${e.message}`]);
    } finally {
      setRunning(false);
    }
  };

  const currentAgent = agents.find(a => a.id === activeAgent)!;

  return (
    <Modal
      onClose={onClose}
      title={client.company || client.url}
      subtitle={`Workspace GEO do Cliente — Etapa ${client.currentStage}: ${stageLabels[client.currentStage]}`}
      headerRight={
        <span className={`text-xs px-3 py-1 rounded-xl border font-bold ${planConfig[client.plan]?.color || ''}`}>
          {planConfig[client.plan]?.label || client.plan}
        </span>
      }
    >
      <div className="space-y-5 flex-1 flex flex-col min-h-[520px]">
        {/* Navigation Tabs (Top) */}
        <div className="flex overflow-x-auto max-w-full scrollbar-none bg-zinc-200/70 p-1.5 rounded-2xl text-xs font-semibold gap-1">
          <button
            onClick={() => setMainView('deliverables')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${mainView === 'deliverables' ? 'bg-white text-zinc-950 shadow-xs font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
          >
            ⚡ Agentes & Entregáveis Práticos
          </button>
          <button
            onClick={() => setMainView('history')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${mainView === 'history' ? 'bg-white text-zinc-950 shadow-xs font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
          >
            📊 Histórico & Evolução (Antes vs. Depois)
          </button>
          <button
            onClick={() => setMainView('chat')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${mainView === 'chat' ? 'bg-white text-zinc-950 shadow-xs font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
          >
            💬 Chat 360° (IA)
          </button>
          <button
            onClick={() => setMainView('stages')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${mainView === 'stages' ? 'bg-white text-zinc-950 shadow-xs font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
          >
            🗺️ Roteiro de 5 Etapas
          </button>
        </div>

        {/* VIEW 1: DELIVERABLES & AGENT EXECUTION */}
        {mainView === 'deliverables' && (
          <div className="flex flex-col lg:flex-row lg:divide-x divide-zinc-200/60 flex-1 gap-6 lg:gap-0">
            {/* Agent Sidebar */}
            <div className="w-full lg:w-60 flex-shrink-0 lg:pr-4 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-2 lg:pb-0 scrollbar-none">
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => { setActiveAgent(agent.id); setResult(null); setLogs([]); }}
                  className={`flex-shrink-0 w-48 lg:w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                    activeAgent === agent.id
                      ? 'bg-zinc-950 text-white shadow-md'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/40 border border-zinc-200 lg:border-transparent'
                  }`}
                >
                  <span className="flex-shrink-0 mt-0.5">{agent.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold font-display leading-tight truncate">{agent.name}</p>
                    <p className={`hidden lg:block text-[10px] leading-tight mt-0.5 ${activeAgent === agent.id ? 'text-zinc-300' : 'text-zinc-400'}`}>{agent.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Agent Workspace Output */}
            <div className="flex-1 lg:pl-6 space-y-4 flex flex-col min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-zinc-200 rounded-2xl shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-700">{currentAgent.icon}</span>
                  <div>
                    <h3 className="text-zinc-900 font-display font-bold text-sm">{currentAgent.name}</h3>
                    <p className="text-zinc-500 text-xs">{currentAgent.description}</p>
                  </div>
                </div>
                <button
                  onClick={handleRunAgent}
                  disabled={running}
                  className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {running ? <><IconHourglass className="w-3.5 h-3.5" /> Gerando entregáveis...</> : <><IconPlay className="w-3.5 h-3.5" /> Executar Agente</>}
                </button>
              </div>

              {logs.length > 0 && (
                <div className="tactile-sunken rounded-xl p-3 font-mono text-[10px] space-y-1 bg-zinc-50 text-zinc-600">
                  {logs.map((log, i) => <p key={i}>{log}</p>)}
                </div>
              )}

              {/* DELIVERABLES CARDS PER AGENT */}
              {result && (
                <div className="space-y-4 flex-1">
                  {/* Orquestrador Deliverable */}
                  {activeAgent === 'orchestrator' && (
                    <>
                      {result.actionPlanMarkdown && (
                        <DeliverableCard
                          title="Roteiro Estratégico de Implantação GEO (5 Etapas)"
                          description="Plano de ação completo para apresentar e implantar junto com o cliente."
                          content={result.actionPlanMarkdown}
                          filename={`Plano_Acao_GEO_${client.company || 'Cliente'}.md`}
                        />
                      )}
                      {result.deliverables?.jsonLdSchema && (
                        <DeliverableCard
                          title="Códigos JSON-LD Schema (Organization, Person, WebSite)"
                          description="Código pronto para copiar e colar na tag <head> do site do cliente."
                          content={result.deliverables.jsonLdSchema}
                          filename="schema.jsonld"
                        />
                      )}
                      {result.deliverables?.llmsTxt && (
                        <DeliverableCard
                          title="Arquivo /llms.txt (Mapa Semântico em Markdown para IAs)"
                          description="Arquivo pronto para salvar e publicar na raiz do servidor web do cliente."
                          content={result.deliverables.llmsTxt}
                          filename="llms.txt"
                        />
                      )}
                    </>
                  )}

                  {/* Technical Gatekeeper Deliverable */}
                  {activeAgent === 'gatekeeper' && (
                    <DeliverableCard
                      title="Arquivo robots.txt Recomendado"
                      description="Configuração de permissões explícitas para GPTBot, ClaudeBot, PerplexityBot e Bytespider."
                      content={result.recommendedRobotsTxt || `# robots.txt recomendado para ${client.url}\nUser-agent: GPTBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /`}
                      filename="robots.txt"
                    />
                  )}

                  {/* Metadata Entity Deliverable */}
                  {activeAgent === 'metadata' && (
                    <>
                      <DeliverableCard
                        title="Código JSON-LD Schema Completo"
                        description="Estrutura de dados com sameAs apontando para LinkedIn, Crunchbase e Wikipedia."
                        content={result.generatedJsonLd || JSON.stringify(result, null, 2)}
                        filename="schema.jsonld"
                      />
                      <DeliverableCard
                        title="Arquivo /llms.txt para Publicação"
                        description="Mapa de autoridades e links canônicos para consumo nativo por LLMs."
                        content={result.llmsTxt || `# /llms.txt para ${client.url}`}
                        filename="llms.txt"
                      />
                    </>
                  )}

                  {/* Content Absorption Deliverable */}
                  {activeAgent === 'content' && (
                    <>
                      {result.aeoTemplates?.tldrAnswerFirstBlock && (
                        <DeliverableCard
                          title="Bloco de Resposta Direta AEO (<60 palavras)"
                          description="Trecho otimizado para inserção no topo de páginas H2."
                          content={result.aeoTemplates.tldrAnswerFirstBlock}
                          filename="aeo_tldr_block.html"
                        />
                      )}
                      {result.aeoTemplates?.htmlComparisonTable && (
                        <DeliverableCard
                          title="Tabela Comparativa em HTML Nativo (Princeto Factor)"
                          description="Tabela HTML otimizada para aumentar em até 47% a citabilidade nas LLMs."
                          content={result.aeoTemplates.htmlComparisonTable}
                          filename="tabela_comparativa.html"
                        />
                      )}
                    </>
                  )}

                  {/* Intent Prompt Deliverable */}
                  {activeAgent === 'intent' && (
                    <DeliverableCard
                      title="Relatório de Visibilidade e Prompts de Teste nas IAs"
                      description="Mapeamento de Citation Share e perguntas de intenção testadas."
                      content={JSON.stringify(result, null, 2)}
                      filename="citation_share_report.json"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: HISTORY & EVOLUTION */}
        {mainView === 'history' && (
          <ClientHistoryPanel client={client} />
        )}

        {/* VIEW 3: CHAT 360 */}
        {mainView === 'chat' && (
          <div className="flex-1 flex flex-col min-h-[420px]">
            <div className="flex items-center gap-2 mb-3 bg-white p-3 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700">
              <span>Agente Ativo no Chat:</span>
              <select
                value={activeAgent}
                onChange={e => setActiveAgent(e.target.value as AgentName)}
                className="bg-zinc-100 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-bold"
              >
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <LeadChat leadId={client.id} agentName={activeAgent} leadUrl={client.url} />
          </div>
        )}

        {/* VIEW 4: STAGES ROADMAP */}
        {mainView === 'stages' && (
          <div className="space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="font-display font-bold text-zinc-900 text-sm">🗺️ Roteiro de Implantação pelas 5 Etapas GEO</h4>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(stage => (
                  <div
                    key={stage}
                    className={`p-4 rounded-xl border transition-all ${
                      stage <= client.currentStage ? 'bg-emerald-50/50 border-emerald-200' : 'bg-zinc-50 border-zinc-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Etapa {stage}</span>
                      <span className={`text-xs font-bold ${stage <= client.currentStage ? 'text-emerald-700' : 'text-zinc-400'}`}>
                        {stage <= client.currentStage ? '✓ Em Andamento / Concluída' : 'Pendente'}
                      </span>
                    </div>
                    <h5 className="font-bold text-zinc-900 text-xs">{stageLabels[stage]}</h5>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GEO Stage Progress Footer */}
        <div className="border-t border-zinc-200 pt-3 mt-auto">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(stage => (
              <div key={stage} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-full h-2 rounded-full ${stage <= client.currentStage ? 'bg-zinc-950' : 'bg-zinc-200'}`} />
                <span className={`text-[9px] font-mono font-bold ${stage <= client.currentStage ? 'text-zinc-800' : 'text-zinc-400'}`}>
                  ETAPA {stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
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
    } catch (err: any) {
      alert(`Erro ao excluir cliente: ${err.message}`);
    }
  };

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

      {/* Workspace Panel */}
      {selectedClient && (
        <AgentWorkspacePanel client={selectedClient} onClose={() => setSelectedClient(null)} />
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
