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
  premium: { label: 'Implantação Premium', color: 'text-zinc-700 bg-zinc-100 border-zinc-200/80 shadow-xs' },
  enterprise: { label: 'Enterprise', color: 'text-zinc-950 bg-zinc-200/80 border-zinc-300 shadow-xs' },
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
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-auto">
      <div className="tactile-raised bg-[#f4f5f8] w-full max-w-4xl shadow-2xl mt-4 mb-4 flex flex-col p-6 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 transition-colors font-bold text-sm cursor-pointer">← Voltar</button>
            <div>
              <h2 className="text-zinc-900 font-display font-bold text-lg">{client.company || client.url}</h2>
              <p className="text-zinc-500 text-xs font-medium">Workspace de Agentes GEO — Etapa {client.currentStage}: {stageLabels[client.currentStage]}</p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-xl border font-bold ${planConfig[client.plan].color}`}>
            {planConfig[client.plan].label}
          </span>
        </div>

        <div className="flex divide-x divide-zinc-200/60 flex-1 min-h-[450px]">
          {/* Agent tabs */}
          <div className="w-60 flex-shrink-0 pr-4 space-y-2">
            {agents.map(agent => (
              <button
                key={agent.id}
                id={`agent-tab-${agent.id}`}
                onClick={() => { setActiveAgent(agent.id); setResult(null); setLogs([]); }}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                  activeAgent === agent.id
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/40'
                }`}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{agent.icon}</span>
                <div>
                  <p className="text-xs font-semibold font-display leading-tight">{agent.name}</p>
                  <p className={`text-[10px] leading-tight mt-0.5 ${activeAgent === agent.id ? 'text-zinc-300' : 'text-zinc-400'}`}>{agent.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Agent workspace */}
          <div className="flex-1 pl-6 space-y-4 flex flex-col">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentAgent.icon}</span>
              <div>
                <h3 className="text-zinc-900 font-display font-bold text-base">{currentAgent.name}</h3>
                <p className="text-zinc-500 text-xs font-medium">{currentAgent.description}</p>
              </div>
            </div>

            {/* URL input */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">URL do cliente</label>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900 shadow-inner"
                placeholder="https://www.cliente.com.br"
              />
            </div>

            {/* Run button */}
            <button
              id={`run-agent-${activeAgent}`}
              onClick={handleRunAgent}
              disabled={running}
              className="w-fit flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl transition-all text-sm shadow-md cursor-pointer"
            >
              {running ? '⏳ Executando agente...' : `▶ Executar ${currentAgent.name}`}
            </button>

            {/* Logs */}
            {logs.length > 0 && (
              <div className="tactile-sunken rounded-xl p-3 font-mono text-[10px] space-y-1 bg-zinc-50 text-zinc-600">
                {logs.map((log, i) => (
                  <p key={i}>{log}</p>
                ))}
                {running && <p className="text-zinc-900 animate-pulse font-bold">▌ aguardando resposta...</p>}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-2 flex-1 flex flex-col">
                <h4 className="text-zinc-800 font-bold font-display text-sm">Resultado do Agente</h4>
                <div className="tactile-sunken rounded-xl p-4 bg-white/70 overflow-auto max-h-60 flex-1 font-mono text-xs text-zinc-700">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>

                {/* Specific outputs per agent */}
                {activeAgent === 'metadata' && (result as any).llmsTxt && (
                  <div className="mt-3">
                    <h5 className="text-zinc-400 font-bold text-[10px] uppercase block mb-1">📄 /llms.txt Gerado</h5>
                    <div className="tactile-sunken rounded-xl p-3 bg-white/60">
                      <pre className="text-xs text-zinc-800 font-mono whitespace-pre-wrap">{(result as any).llmsTxt}</pre>
                    </div>
                    <button className="mt-2 text-xs bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer">
                      📋 Copiar llms.txt
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* GEO Stage progress */}
        <div className="border-t border-zinc-200 pt-4 mt-auto">
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
          <p className="text-xs text-zinc-500 font-medium mt-2 text-center">
            Fase atual: <span className="text-zinc-950 font-bold">{stageLabels[client.currentStage]}</span>
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
        <h1 className="text-3xl font-display font-bold text-zinc-900">Clientes</h1>
        <p className="text-zinc-500 text-sm mt-1 font-medium">Gestão GEO completa com workspace de 5 agentes</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400 text-sm font-mono">Carregando clientes...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 text-sm font-medium">{error}</div>
      ) : clients.length === 0 ? (
        <div className="tactile-raised p-12 text-center bg-white/60">
          <p className="text-4xl mb-4">🚀</p>
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
              className="tactile-raised p-6 bg-white/60 hover:scale-[1.01] transition-all duration-200 cursor-pointer group"
              onClick={() => setSelectedClient(client)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-zinc-900 font-display font-bold text-base">{client.company || client.url}</h3>
                  <p className="text-zinc-400 text-xs font-mono mt-0.5">{client.url}</p>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${planConfig[client.plan].color}`}>
                  {planConfig[client.plan].label}
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

              {/* GEO score trend */}
              {client.geoScoreHistory.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 font-medium">GEO Score atual:</span>
                    <span className="text-emerald-600 font-mono font-bold text-sm">
                      {client.geoScoreHistory[client.geoScoreHistory.length - 1]?.score}%
                    </span>
                  </div>
                  <button
                    id={`open-workspace-${client.id}`}
                    className="text-xs bg-zinc-100 hover:bg-zinc-950 hover:text-white border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-xl font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Abrir Workspace →
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-200/50">
                <div className="flex -space-x-1.5">
                  {agents.map(a => (
                    <div key={a.id} className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center text-xs border border-white shadow-xs">
                      {a.icon}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-zinc-400 font-medium">5 agentes ativos</span>
                <span className="text-[10px] text-zinc-400 font-mono font-medium ml-auto">
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

