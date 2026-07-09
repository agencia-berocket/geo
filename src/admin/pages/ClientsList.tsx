import React, { useEffect, useState, useRef } from 'react';
import { useClients, type Client } from '../hooks/useFirestore';
import Modal from '../components/Modal';
import {
  IconEdit, IconTrash, IconPlay, IconChat, IconBot, IconShield, IconFolder,
  IconNote, IconHourglass, IconRocket, IconCheck, IconWarning,
} from '../components/icons';

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

const agents: Array<{ id: AgentName; icon: React.ReactNode; name: string; description: string }> = [
  { id: 'orchestrator', icon: <IconBot className="w-4 h-4" />, name: 'Orquestrador', description: 'Gerencia o pipeline completo de GEO' },
  { id: 'gatekeeper', icon: <IconShield className="w-4 h-4" />, name: 'Technical Gatekeeper', description: 'Audita robots.txt, SSR e latência' },
  { id: 'metadata', icon: <IconFolder className="w-4 h-4" />, name: 'Metadata Entity', description: 'Schemas JSON-LD e geração de llms.txt' },
  { id: 'content', icon: <IconNote className="w-4 h-4" />, name: 'Content Absorption', description: 'Chunking semântico e fatores Princeton' },
  { id: 'intent', icon: <IconChat className="w-4 h-4" />, name: 'Intent Prompt', description: 'Citation Share via OpenRouter' },
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function AgentWorkspacePanel({ client, onClose }: { client: Client; onClose: () => void }) {
  const { runAgentForClient } = useClients();
  const [activeAgent, setActiveAgent] = useState<AgentName>('orchestrator');
  const [activeTab, setActiveTab] = useState<'run' | 'chat'>('run');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [url, setUrl] = useState(client.url);
  const [logs, setLogs] = useState<string[]>([]);

  // Chat states (mapped per agent)
  const [chats, setChats] = useState<Record<AgentName, ChatMessage[]>>({
    orchestrator: [],
    gatekeeper: [],
    metadata: [],
    content: [],
    intent: [],
  });
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, activeAgent, activeTab]);

  const handleRunAgent = async () => {
    setRunning(true);
    setResult(null);
    setLogs([`[${new Date().toLocaleTimeString()}] Iniciando ${activeAgent}...`]);
    try {
      const res = await runAgentForClient(client.id, activeAgent, { url });
      setResult(res.result);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Concluído com sucesso`]);
    } catch (e: any) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Erro: ${e.message}`]);
    } finally {
      setRunning(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!inputMessage.trim() || chatLoading) return;

    const userText = inputMessage;
    setInputMessage('');
    setChatError(null);

    // Append user message immediately
    const userMsg: ChatMessage = { role: 'user', content: userText };
    setChats(prev => ({
      ...prev,
      [activeAgent]: [...prev[activeAgent], userMsg]
    }));

    setChatLoading(true);

    try {
      const currentHistory = chats[activeAgent].map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      const res = await fetch('/api/admin/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
        },
        body: JSON.stringify({
          clientId: client.id,
          agentName: activeAgent,
          message: userText,
          history: currentHistory
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const assistantMsg: ChatMessage = { role: 'assistant', content: data.reply };
        setChats(prev => ({
          ...prev,
          [activeAgent]: [...prev[activeAgent], assistantMsg]
        }));
      } else {
        setChatError(data.error || 'Erro ao obter resposta da LLM.');
      }
    } catch (e: any) {
      setChatError(`Erro de rede: ${e.message}`);
    } finally {
      setChatLoading(false);
    }
  };

  const currentAgent = agents.find(a => a.id === activeAgent)!;
  const currentChatMessages = chats[activeAgent];

  return (
    <Modal
      onClose={onClose}
      title={client.company || client.url}
      subtitle={`Workspace de Agentes GEO — Etapa ${client.currentStage}: ${stageLabels[client.currentStage]}`}
      headerRight={
        <span className={`text-xs px-3 py-1 rounded-xl border font-bold ${planConfig[client.plan]?.color || ''}`}>
          {planConfig[client.plan]?.label || client.plan}
        </span>
      }
    >
        <div className="flex flex-col lg:flex-row lg:divide-x divide-zinc-200/60 flex-1 min-h-[480px] gap-6 lg:gap-0">
          {/* Agent tabs */}
          <div className="w-full lg:w-60 flex-shrink-0 lg:pr-4 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-2 lg:pb-0 scrollbar-none">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => { setActiveAgent(agent.id); setResult(null); setLogs([]); setChatError(null); }}
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

          {/* Agent workspace */}
          <div className="flex-1 lg:pl-6 space-y-4 flex flex-col min-w-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-zinc-700">{currentAgent.icon}</span>
                <div>
                  <h3 className="text-zinc-900 font-display font-bold text-base">{currentAgent.name}</h3>
                  <p className="text-zinc-500 text-xs font-medium">{currentAgent.description}</p>
                </div>
              </div>

              {/* View Switcher */}
              <div className="flex bg-zinc-200/60 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('run')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'run' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-550 hover:text-zinc-800'}`}
                >
                  <IconPlay className="w-3.5 h-3.5" /> Executar Diagnóstico
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'chat' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-550 hover:text-zinc-800'}`}
                >
                  <IconChat className="w-3.5 h-3.5" /> Chat 360 (IA)
                </button>
              </div>
            </div>

            {/* TAB: RUN */}
            {activeTab === 'run' && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">URL do cliente</label>
                  <input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900 shadow-inner"
                    placeholder="https://www.cliente.com.br"
                  />
                </div>

                <button
                  onClick={handleRunAgent}
                  disabled={running}
                  className="w-fit flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl transition-all text-sm shadow-md cursor-pointer"
                >
                  {running ? (
                    <span className="flex items-center gap-2"><IconHourglass className="w-4 h-4" /> Executando agente...</span>
                  ) : (
                    <span className="flex items-center gap-2"><IconPlay className="w-4 h-4" /> Executar {currentAgent.name}</span>
                  )}
                </button>

                {logs.length > 0 && (
                  <div className="tactile-sunken rounded-xl p-3 font-mono text-[10px] space-y-1 bg-zinc-50 text-zinc-600">
                    {logs.map((log, i) => (
                      <p key={i}>{log}</p>
                    ))}
                    {running && <p className="text-zinc-900 animate-pulse font-bold">▌ aguardando resposta...</p>}
                  </div>
                )}

                {result && (
                  <div className="space-y-2 flex-1 flex flex-col">
                    <h4 className="text-zinc-800 font-bold font-display text-sm">Resultado do Agente</h4>
                    <div className="tactile-sunken rounded-xl p-4 bg-white/70 overflow-auto max-h-60 flex-1 font-mono text-xs text-zinc-700">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: CHAT 360 */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col bg-zinc-250/30 rounded-2xl border border-zinc-200 overflow-hidden min-h-[350px]">
                {/* Messages Box */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[360px]">
                  {currentChatMessages.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 space-y-2">
                      <IconBot className="w-6 h-6 mx-auto text-zinc-300" />
                      <p className="text-xs font-bold font-display">Inicie a conversa com o {currentAgent.name}</p>
                      <p className="text-[10px] max-w-sm mx-auto font-medium text-zinc-400 leading-relaxed">
                        Tire dúvidas sobre o diagnóstico do cliente, pergunte sobre estratégias recomendadas ou peça ajuda sobre a implantação GEO neste domínio.
                      </p>
                    </div>
                  ) : (
                    currentChatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-xs border leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-zinc-950 text-white border-zinc-900'
                            : 'bg-white text-zinc-850 border-zinc-250/50'
                        }`}>
                          <p className="font-semibold text-[9px] uppercase tracking-wider mb-1 opacity-70">
                            {msg.role === 'user' ? 'Você' : currentAgent.name}
                          </p>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-zinc-250/50 text-zinc-550 rounded-2xl px-4 py-3 text-xs shadow-xs animate-pulse flex items-center gap-2">
                        <IconHourglass className="w-3.5 h-3.5" /> {currentAgent.name} está analisando o contexto e respondendo...
                      </div>
                    </div>
                  )}
                  {chatError && (
                    <div className="text-center text-[10px] text-red-650 bg-red-50/50 border border-red-200 rounded-xl p-2.5 flex items-center justify-center gap-1.5">
                      <IconWarning className="w-3.5 h-3.5" /> {chatError}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-zinc-250/50 flex gap-2">
                  <input
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSendChatMessage(); }}
                    placeholder={`Pergunte algo sobre este cliente para o ${currentAgent.name}...`}
                    className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-zinc-950 focus:bg-white"
                  />
                  <button
                    onClick={handleSendChatMessage}
                    disabled={chatLoading}
                    className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    Enviar
                  </button>
                </div>
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
    </Modal>
  );
}

// ─── Client Edit Modal ──────────────────────────────────────────────────────
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

// ─── Clients List Page ────────────────────────────────────────────────────────
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
        <p className="text-zinc-500 text-sm mt-1 font-medium">Gestão GEO completa com workspace de 5 agentes</p>
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
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-zinc-900 font-display font-bold text-base">{client.company || client.url}</h3>
                    <p className="text-zinc-450 text-xs font-mono mt-0.5">{client.url}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${planConfig[client.plan]?.color || ''}`}>
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
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingClient(client)}
                    className="text-[10px] bg-zinc-100 hover:bg-zinc-200 border border-zinc-250 text-zinc-700 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <IconEdit className="w-3 h-3" /> Editar
                  </button>
                  <button
                    onClick={e => handleDeleteClient(e, client.id)}
                    className="text-[10px] bg-red-50 hover:bg-red-105 border border-red-200 text-red-650 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <IconTrash className="w-3 h-3" /> Excluir
                  </button>
                  <button
                    onClick={() => setSelectedClient(client)}
                    className="text-[10px] bg-zinc-950 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg font-bold transition-all shadow-xs cursor-pointer ml-auto"
                  >
                    Abrir Workspace →
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
