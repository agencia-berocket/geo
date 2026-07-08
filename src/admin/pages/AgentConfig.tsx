import { useEffect, useState } from 'react';

interface AgentFile {
  filename: string;
  content: string;
}

const fileExplanations: Record<string, string> = {
  'SOUL.md': '🧠 Define a personalidade, o tom comportamental e as diretrizes de resposta do agente quando acionado.',
  'IDENTITY.md': '🆔 Descreve a função, responsabilidades diretas e o escopo técnico específico do cargo do agente.',
  'USER.md': '👤 Armazena o contexto da b.rocket e as preferências de execução e de formato desejados pelo Guilherme.',
  'AGENTS.md': '🤝 Regras de governança de boot, handoff de arquivos e comunicação com outros agentes do ecossistema.',
  'MAPA.md': '🗺️ O guia descritivo dos arquivos e dos caminhos de sandbox locais que o agente tem permissão de acessar.',
  'memory/MEMORY.md': '💾 Subdiretório que guarda dados temporários de processamento (hot.md) e históricos persistentes e estatísticas (MEMORY.md).',
  'skills/SKILL.md': '📝 Subdiretório que contém as ferramentas codificadas e scripts que o agente aciona para executar suas tarefas técnicas.',
  'Estrutura.md': '📁 Mapeamento global de pastas, skills e fluxos operacionais de todos os agentes integrados.',
  'Introducao.md': '🚀 Introdução conceitual à metodologia b.rocket, arquitetura e entrega de valor de GEO.',
  'Soul.md': '🧠 Visão geral e essência unificada dos agentes da empresa.'
};

const agentsList = [
  { id: 'orchestrator', name: '🕵️‍♂️ Orquestrador Principal', desc: 'Gerencia o pipeline, divide tarefas e consolida o b.rocket GEO-Score e relatórios PDF.' },
  { id: 'gatekeeper', name: '🛡️ Technical Gatekeeper', desc: 'Audita robots.txt, ativação de SSR, latência do servidor e indexabilidade para robôs de IA.' },
  { id: 'metadata', name: '🗂️ Metadata Entity', desc: 'Valida Schemas JSON-LD (Organization, Person, FAQ) e cria mapas de RAG em /llms.txt.' },
  { id: 'content', name: '📝 Content Absorption', desc: 'Revisa modularidade, tamanho de chunks, Answer-First e fatores científicos de Princeton.' },
  { id: 'intent', name: '🔍 Intent Prompt', desc: 'Testa menções e Citation Share nas LLMs (ChatGPT, Gemini, Perplexity) usando OpenRouter.' },
];

const generalFiles = ['Soul.md', 'Introducao.md', 'Estrutura.md'];

const fileLabels: Record<string, string> = {
  'Soul.md': '🧠 Soul.md (Essência Geral)',
  'Introducao.md': '🚀 Introducao.md (Metodologia)',
  'Estrutura.md': '📁 Estrutura.md (Mapa de Fluxos)',
  'SOUL.md': '🧠 SOUL.md (Personalidade)',
  'IDENTITY.md': '🆔 IDENTITY.md (Papel Funcional)',
  'USER.md': '👤 USER.md (Contexto b.rocket)',
  'AGENTS.md': '🤝 AGENTS.md (Governança/Boot)',
  'MAPA.md': '🗺️ MAPA.md (Mapa do Sandbox)',
  'memory/MEMORY.md': '💾 memory/MEMORY.md (Memória Histórica)',
  'skills/SKILL.md': '📝 skills/SKILL.md (Habilidade Principal)'
};

export default function AgentConfig() {
  const [activeMode, setActiveMode] = useState<'general' | 'agents'>('general');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('orchestrator');
  const [selectedFilename, setSelectedFilename] = useState<string>('Soul.md');
  const [files, setFiles] = useState<AgentFile[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [content, setContent] = useState('');

  // Fetch files based on active mode & selected agent
  const fetchFiles = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const url = activeMode === 'general' 
        ? '/api/admin/agents/files' 
        : `/api/admin/agents/${selectedAgentId}/files`;
        
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || []);
        // Select first file of list by default
        if (data.files && data.files.length > 0) {
          const defaultFile = activeMode === 'general' ? 'Soul.md' : 'SOUL.md';
          const fileExists = data.files.find((f: AgentFile) => f.filename === defaultFile);
          const finalFile = fileExists ? defaultFile : data.files[0].filename;
          setSelectedFilename(finalFile);
        }
      }
    } catch (e) {
      console.error(e);
      setMessage('❌ Erro ao buscar arquivos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [activeMode, selectedAgentId]);

  useEffect(() => {
    const activeFile = files.find(f => f.filename === selectedFilename);
    if (activeFile) {
      setContent(activeFile.content || '');
    }
  }, [selectedFilename, files]);

  const handleSaveFile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const url = activeMode === 'general' 
        ? '/api/admin/agents/files/save' 
        : `/api/admin/agents/${selectedAgentId}/files/save`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFilename,
          content,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Arquivo salvo localmente com sucesso.');
        setFiles(prev => prev.map(f => f.filename === selectedFilename ? { ...f, content } : f));
      } else {
        setMessage(`❌ Erro ao salvar: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`❌ Erro de conexão: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGitSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/agents/git/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`☁️ ${data.message || 'Sincronizado com sucesso!'}`);
      } else {
        setMessage(`❌ Erro de sincronização: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`❌ Erro de conexão: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900">Configuração & Prompting dos Agentes</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Ajuste a personalidade, regras e memórias de RAG do time digital da b.rocket</p>
        </div>
        <button
          onClick={handleGitSync}
          disabled={syncing}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2 border-t border-emerald-400"
        >
          {syncing ? '⏳ Enviando ao GitHub...' : '☁️ Enviar e Sincronizar com GitHub (Push)'}
        </button>
      </div>

      {/* Tabs Principais */}
      <div className="flex border-b border-zinc-200 gap-6">
        <button
          onClick={() => { setActiveMode('general'); setSelectedFilename('Soul.md'); }}
          className={`pb-4 text-sm font-semibold transition-all cursor-pointer border-b-2 ${
            activeMode === 'general' ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          📁 Documentos de Arquitetura Geral
        </button>
        <button
          onClick={() => { setActiveMode('agents'); setSelectedFilename('SOUL.md'); }}
          className={`pb-4 text-sm font-semibold transition-all cursor-pointer border-b-2 ${
            activeMode === 'agents' ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          🤖 Agentes Especialistas (Estrutura OpenClaw)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navegação Lateral */}
        <div className="lg:col-span-4 space-y-4">
          {activeMode === 'general' ? (
            <div className="tactile-raised p-4 bg-white/60 space-y-2">
              <h2 className="font-display font-bold text-zinc-950 text-xs uppercase tracking-wider mb-2">
                Arquivos de Arquitetura
              </h2>
              {loading ? (
                <p className="text-zinc-400 text-xs font-mono py-4 text-center">Carregando...</p>
              ) : (
                files.map(file => (
                  <button
                    key={file.filename}
                    onClick={() => setSelectedFilename(file.filename)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                      selectedFilename === file.filename
                        ? 'bg-zinc-950 text-white shadow-md'
                        : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200/60 hover:bg-zinc-50'
                    }`}
                  >
                    <span>{fileLabels[file.filename] || file.filename}</span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Seletor de Agentes */}
              <div className="tactile-raised p-4 bg-white/60 space-y-2">
                <h2 className="font-display font-bold text-zinc-950 text-xs uppercase tracking-wider mb-2">
                  Escolha o Agente
                </h2>
                {agentsList.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer border ${
                      selectedAgentId === agent.id
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-md'
                        : 'bg-white text-zinc-650 hover:text-zinc-900 border-zinc-200/60 hover:bg-zinc-50'
                    }`}
                  >
                    <p className="text-xs font-bold font-display">{agent.name}</p>
                    <p className={`text-[10px] mt-1 leading-normal ${selectedAgentId === agent.id ? 'text-zinc-300' : 'text-zinc-400'}`}>
                      {agent.desc}
                    </p>
                  </button>
                ))}
              </div>

              {/* Seletor de Arquivos do Agente */}
              <div className="tactile-raised p-4 bg-white/60 space-y-2">
                <h2 className="font-display font-bold text-zinc-950 text-xs uppercase tracking-wider mb-2">
                  Estrutura OpenClaw
                </h2>
                {loading ? (
                  <p className="text-zinc-400 text-xs font-mono py-4 text-center">Carregando...</p>
                ) : (
                  files.map(file => (
                    <button
                      key={file.filename}
                      onClick={() => setSelectedFilename(file.filename)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                        selectedFilename === file.filename
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200/60 hover:bg-zinc-50'
                      }`}
                    >
                      <span>{fileLabels[file.filename] || file.filename}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Editor de Texto & Explicação */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card Didático sobre o Arquivo Selecionado */}
          <div className="bg-zinc-950 text-white p-5 rounded-2xl shadow-lg border border-zinc-800 space-y-2">
            <h3 className="font-display font-bold text-sm text-zinc-100 flex items-center gap-2">
              💡 Para que serve este arquivo?
            </h3>
            <p className="text-zinc-350 text-xs leading-relaxed font-medium">
              {fileExplanations[selectedFilename] || 'Arquivo de configuração interna da estrutura do agente.'}
            </p>
          </div>

          {files.find(f => f.filename === selectedFilename) ? (
            <div className="tactile-raised p-6 bg-white/60 space-y-6">
              <div className="border-b border-zinc-200 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="font-display font-bold text-zinc-900 text-base">
                    Arquivo: {selectedFilename}
                  </h2>
                  <p className="text-zinc-500 text-xs font-mono mt-0.5">
                    Caminho: {activeMode === 'general' ? `Base/Estrutura de Agentes/${selectedFilename}` : `Base/Agentes/${selectedAgentId}/${selectedFilename}`}
                  </p>
                </div>
                <button
                  id="btn-save-agent-file"
                  onClick={handleSaveFile}
                  disabled={saving}
                  className="bg-zinc-950 hover:bg-zinc-850 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer border-t border-zinc-800"
                >
                  {saving ? '⏳ Salvando...' : '💾 Salvar Alterações'}
                </button>
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-xs font-semibold border ${
                  message.includes('❌') 
                    ? 'bg-red-50/50 border-red-200 text-red-700' 
                    : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                }`}>
                  {message}
                </div>
              )}

              {/* Editor */}
              <div className="space-y-3">
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={22}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3.5 text-xs text-zinc-850 font-mono focus:outline-none focus:border-zinc-900 shadow-inner leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="tactile-raised p-12 text-center bg-white/60">
              <p className="text-zinc-450 text-sm font-medium">Selecione um arquivo na barra lateral para começar a configurar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
