import { useEffect, useState } from 'react';

interface AgentConfig {
  id: string;
  name: string;
  soul: string;
  identity: string;
  skills: string;
}

const agentLabels = {
  gatekeeper: '🛡️ Agente 2 — Technical Gatekeeper',
  metadata: '🗂️ Agente 3 — Metadata Entity',
  content: '📝 Agente 4 — Content Absorption',
  intent: '🔍 Agente 5 — Intent Prompt (OpenRouter)',
};

export default function AgentConfig() {
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('gatekeeper');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Field values
  const [soul, setSoul] = useState('');
  const [identity, setIdentity] = useState('');
  const [skills, setSkills] = useState('');

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/agents/configs');
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    const active = configs.find(c => c.id === selectedAgentId);
    if (active) {
      setSoul(active.soul || '');
      setIdentity(active.identity || '');
      setSkills(active.skills || '');
    }
  }, [selectedAgentId, configs]);

  const handleSaveConfig = async () => {
    setSaving(true);
    setMessage(null);
    const active = configs.find(c => c.id === selectedAgentId);
    if (!active) return;

    try {
      const res = await fetch('/api/admin/agents/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAgentId,
          name: active.name,
          soul,
          identity,
          skills
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Configuração salva com sucesso no Firestore.');
        // Update local state
        setConfigs(prev => prev.map(c => c.id === selectedAgentId ? { ...c, soul, identity, skills } : c));
      } else {
        setMessage(`❌ Erro ao salvar: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`❌ Erro de conexão: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedAgent = configs.find(c => c.id === selectedAgentId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-zinc-900">Configurações de Agentes</h1>
        <p className="text-zinc-500 text-sm mt-1 font-medium">Edite as diretrizes, comportamento e prompts dos agentes GEO</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lista de Agentes para Selecionar */}
        <div className="lg:col-span-4 space-y-3">
          <div className="tactile-raised p-4 bg-white/60 space-y-2">
            <h2 className="font-display font-bold text-zinc-950 text-xs uppercase tracking-wider mb-2">
              Selecione o Agente
            </h2>
            {loading ? (
              <p className="text-zinc-400 text-xs font-mono py-4 text-center">Carregando agentes...</p>
            ) : (
              configs.map(config => (
                <button
                  key={config.id}
                  id={`config-select-${config.id}`}
                  onClick={() => { setSelectedAgentId(config.id); setMessage(null); }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    selectedAgentId === config.id
                      ? 'bg-zinc-950 text-white shadow-md'
                      : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200/60 hover:bg-zinc-50'
                  }`}
                >
                  <span>{agentLabels[config.id as keyof typeof agentLabels] || config.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Editor de Arquivos do Agente */}
        <div className="lg:col-span-8">
          {selectedAgent ? (
            <div className="tactile-raised p-6 bg-white/60 space-y-6">
              <div className="border-b border-zinc-200 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="font-display font-bold text-zinc-900 text-base">
                    Workspace: {selectedAgent.name}
                  </h2>
                  <p className="text-zinc-500 text-xs font-medium">ID: {selectedAgentId}</p>
                </div>
                <button
                  id="btn-save-agent-configs"
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {saving ? '⏳ Salvando...' : '💾 Salvar Configurações'}
                </button>
              </div>

              {message && (
                <p className="text-xs text-zinc-700 font-medium bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5">
                  {message}
                </p>
              )}

              {/* Editor Tabs (SOUL.md, IDENTITY.md, SKILLS.md) */}
              <div className="space-y-5">
                {/* SOUL.md */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      SOUL.md (Essência & Visão)
                    </label>
                    <span className="text-[9px] text-zinc-400 font-mono">markdown</span>
                  </div>
                  <textarea
                    value={soul}
                    onChange={e => setSoul(e.target.value)}
                    rows={6}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3.5 text-xs text-zinc-800 font-mono focus:outline-none focus:border-zinc-900 shadow-inner"
                  />
                </div>

                {/* IDENTITY.md */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      IDENTITY.md (Papel Funcional & Responsabilidades)
                    </label>
                    <span className="text-[9px] text-zinc-400 font-mono">markdown</span>
                  </div>
                  <textarea
                    value={identity}
                    onChange={e => setIdentity(e.target.value)}
                    rows={6}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3.5 text-xs text-zinc-800 font-mono focus:outline-none focus:border-zinc-900 shadow-inner"
                  />
                </div>

                {/* SKILLS.md */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      SKILLS.md / SKILL.md (Scripts & Abstrações)
                    </label>
                    <span className="text-[9px] text-zinc-400 font-mono">markdown</span>
                  </div>
                  <textarea
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    rows={6}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3.5 text-xs text-zinc-800 font-mono focus:outline-none focus:border-zinc-900 shadow-inner"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="tactile-raised p-12 text-center bg-white/60">
              <p className="text-zinc-450 text-sm font-medium">Selecione um agente na barra lateral para começar a configurar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
