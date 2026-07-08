import { useEffect, useState } from 'react';
import { useClients, type Client } from '../hooks/useFirestore';

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
  premium: { label: 'Implantação Premium', color: 'text-blue-400 bg-blue-900/30 border-blue-800' },
  enterprise: { label: 'Enterprise', color: 'text-violet-400 bg-violet-900/30 border-violet-800' },
};

// ─── Agent Workspace Panel ──────────────────────────────────────────────────
type AgentName = 'orchestrator' | 'gatekeeper' | 'metadata' | 'content' | 'intent';

const agents: Array<{ id: AgentName; icon: string; name: string; description: string }> = [
  { id: 'orchestrator', icon: '⚡', name: 'Orquestrador', description: 'Gerencia o pipeline completo de GEO' },
  { id: 'gatekeeper', icon: '🛡️', name: 'Technical Gatekeeper', description: 'Audita robots.txt, SSR e latência' },
  { id: 'metadata', icon: '🗂️', name: 'Metadata Entity', description: 'Schemas JSON-LD e geração de llms.txt' },
  { id: 'content', icon: '📝', name: 'Content Absorption', description: 'Chunking semântico e fatores Princeton' },
  { id: 'intent', icon: '🔍', name: 'Intent Prompt', description: 'Citation Share via OpenRouter' },
];

function AgentWorkspacePanel({ client, onClose }: { client: Client; onClose: () => void }) {
  const { runAgentForClient } = useClients();
  const [activeAgent, setActiveAgent] = useState<AgentName>('orchestrator');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [url, setUrl] = useState(client.url);
  const [logs, setLogs] = useState<string[]>([]);

  const handleRunAgent = async () => {
    setRunning(true);
    setResult(null);
    setLogs([`[${new Date().toLocaleTimeString()}] Iniciando ${activeAgent}...`]);
    try {
      const res = await runAgentForClient(client.id, activeAgent, { url });
      setResult(res.result);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Concluído com sucesso`]);
    } catch (e: any) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ Erro: ${e.message}`]);
    } finally {
      setRunning(false);
    }
  };

  const currentAgent = agents.find(a => a.id === activeAgent)!;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl mt-4 mb-4">
        {/* Header */}
        <div className="border-b border-zinc-800 p-4 flex items-center gap-3">
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-sm">← Voltar</button>
          <div className="flex-1">
            <h2 className="text-white font-bold">{client.company || client.url}</h2>
            <p className="text-zinc-500 text-xs">Workspace de Agentes GEO — Etapa {client.currentStage}: {stageLabels[client.currentStage]}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${planConfig[client.plan].color}`}>
            {planConfig[client.plan].label}
          </span>
        </div>

        <div className="flex divide-x divide-zinc-800">
          {/* Agent tabs */}
          <div className="w-56 flex-shrink-0 p-3 space-y-1">
            {agents.map(agent => (
              <button
                key={agent.id}
                id={`agent-tab-${agent.id}`}
                onClick={() => { setActiveAgent(agent.id); setResult(null); setLogs([]); }}
                className={`w-full flex items-start gap-2 p-3 rounded-lg text-left transition-all ${
                  activeAgent === agent.id
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{agent.icon}</span>
                <div>
                  <p className="text-xs font-medium leading-tight">{agent.name}</p>
                  <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">{agent.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Agent workspace */}
          <div className="flex-1 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentAgent.icon}</span>
              <div>
                <h3 className="text-white font-semibold">{currentAgent.name}</h3>
                <p className="text-zinc-400 text-sm">{currentAgent.description}</p>
              </div>
            </div>

            {/* URL input */}
            <div>
              <label className="text-xs text-zinc-500 block mb-1">URL do cliente</label>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                placeholder="https://www.cliente.com.br"
              />
            </div>

            {/* Run button */}
            <button
              id={`run-agent-${activeAgent}`}
              onClick={handleRunAgent}
              disabled={running}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/50 text-white font-medium py-2 px-4 rounded-lg transition-all text-sm"
            >
              {running ? '⏳ Executando agente...' : `▶ Executar ${currentAgent.name}`}
            </button>

            {/* Logs */}
            {logs.length > 0 && (
              <div className="bg-black/40 border border-zinc-800 rounded-lg p-3 font-mono text-xs space-y-1">
                {logs.map((log, i) => (
                  <p key={i} className="text-zinc-400">{log}</p>
                ))}
                {running && <p className="text-blue-400 animate-pulse">▌ aguardando resposta...</p>}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-2">
                <h4 className="text-zinc-300 font-medium text-sm">Resultado do Agente</h4>
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 overflow-auto max-h-80">
                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>

                {/* Specific outputs per agent */}
                {activeAgent === 'metadata' && (result as any).llmsTxt && (
                  <div>
                    <h5 className="text-zinc-400 text-xs font-medium mb-1">📄 /llms.txt Gerado</h5>
                    <div className="bg-black/40 border border-zinc-800 rounded-lg p-3">
                      <pre className="text-xs text-emerald-400 whitespace-pre-wrap">{(result as any).llmsTxt}</pre>
                    </div>
                    <button className="mt-2 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-3 py-1.5 rounded transition-all">
                      📋 Copiar llms.txt
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* GEO Stage progress */}
        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(stage => (
              <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full h-1.5 rounded-full ${stage <= client.currentStage ? 'bg-blue-500' : 'bg-zinc-700'}`} />
                <span className={`text-[9px] font-mono ${stage <= client.currentStage ? 'text-blue-400' : 'text-zinc-600'}`}>
                  E{stage}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-1 text-center">
            Etapa atual: <span className="text-zinc-300">{stageLabels[client.currentStage]}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Clients List Page ────────────────────────────────────────────────────────
export default function ClientsList({ onNavigate }: ClientsListProps) {
  const { clients, loading, error, fetchClients } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <p className="text-zinc-400 text-sm mt-1">Gestão GEO completa com workspace de 5 agentes</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Carregando clientes...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-400 text-sm">{error}</div>
      ) : clients.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-4xl mb-4">🚀</p>
          <p className="text-zinc-300 font-medium mb-2">Nenhum cliente ainda</p>
          <p className="text-zinc-500 text-sm mb-4">Converta um lead em cliente para acessar o workspace completo de agentes GEO</p>
          <button
            onClick={() => onNavigate('leads')}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
          >
            Ver Leads →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map(client => (
            <div
              key={client.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:shadow-zinc-900/50 group"
              onClick={() => setSelectedClient(client)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold">{client.company || client.url}</h3>
                  <p className="text-zinc-500 text-xs">{client.url}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${planConfig[client.plan].color}`}>
                  {planConfig[client.plan].label}
                </span>
              </div>

              {/* Stage progress */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Etapa {client.currentStage}/5</span>
                  <span className="text-zinc-400">{stageLabels[client.currentStage]}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <div key={s} className={`flex-1 h-1 rounded-full ${s <= client.currentStage ? 'bg-blue-500' : 'bg-zinc-700'}`} />
                  ))}
                </div>
              </div>

              {/* GEO score trend */}
              {client.geoScoreHistory.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">GEO Score atual:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {client.geoScoreHistory[client.geoScoreHistory.length - 1]?.score}%
                    </span>
                  </div>
                  <button
                    id={`open-workspace-${client.id}`}
                    className="text-xs bg-blue-700/30 hover:bg-blue-600 text-blue-300 px-3 py-1 rounded-lg transition-all group-hover:bg-blue-600 group-hover:text-white"
                  >
                    Abrir Workspace →
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800">
                <div className="flex -space-x-1">
                  {agents.map(a => (
                    <div key={a.id} className="w-5 h-5 bg-zinc-700 rounded-full flex items-center justify-center text-[10px] border border-zinc-900">
                      {a.icon}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-zinc-500">5 agentes ativos</span>
                <span className="text-xs text-zinc-600 ml-auto">
                  desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedClient && (
        <AgentWorkspacePanel client={selectedClient} onClose={() => setSelectedClient(null)} />
      )}
    </div>
  );
}
