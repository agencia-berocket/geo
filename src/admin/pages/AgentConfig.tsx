import { useEffect, useState } from 'react';

interface AgentFile {
  filename: string;
  content: string;
}

const fileLabels = {
  'Soul.md': '🧠 Soul.md (Essência & Visão Geral dos Agentes)',
  'Introducao.md': '🚀 Introducao.md (Metodologia e Arquitetura GEO)',
  'Estrutura.md': '📁 Estrutura.md (Mapeamento de Pastas, Skills e Fluxos)',
};

export default function AgentConfig() {
  const [files, setFiles] = useState<AgentFile[]>([]);
  const [selectedFilename, setSelectedFilename] = useState<string>('Soul.md');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Field value
  const [content, setContent] = useState('');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/agents/files');
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    const active = files.find(f => f.filename === selectedFilename);
    if (active) {
      setContent(active.content || '');
    }
  }, [selectedFilename, files]);

  const handleSaveFile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/agents/files/save', {
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
        // Update local state
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

  const selectedFile = files.find(f => f.filename === selectedFilename);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900">Arquivos e Prompting dos Agentes</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Edite os arquivos conceituais de comportamento e engenharia dos agentes em tempo real</p>
        </div>
        <button
          onClick={handleGitSync}
          disabled={syncing}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2 border-t border-emerald-400"
        >
          {syncing ? '⏳ Enviando ao GitHub...' : '☁️ Enviar e Sincronizar com GitHub (Push)'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lista de Arquivos */}
        <div className="lg:col-span-4 space-y-3">
          <div className="tactile-raised p-4 bg-white/60 space-y-2">
            <h2 className="font-display font-bold text-zinc-950 text-xs uppercase tracking-wider mb-2">
              Selecione o Arquivo
            </h2>
            {loading ? (
              <p className="text-zinc-400 text-xs font-mono py-4 text-center">Carregando arquivos...</p>
            ) : (
              files.map(file => (
                <button
                  key={file.filename}
                  id={`file-select-${file.filename.replace('.', '-')}`}
                  onClick={() => { setSelectedFilename(file.filename); setMessage(null); }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    selectedFilename === file.filename
                      ? 'bg-zinc-950 text-white shadow-md'
                      : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200/60 hover:bg-zinc-50'
                  }`}
                >
                  <span>{fileLabels[file.filename as keyof typeof fileLabels] || file.filename}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Editor de Texto Markdown */}
        <div className="lg:col-span-8">
          {selectedFile ? (
            <div className="tactile-raised p-6 bg-white/60 space-y-6">
              <div className="border-b border-zinc-200 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="font-display font-bold text-zinc-900 text-base">
                    Arquivo: {selectedFile.filename}
                  </h2>
                  <p className="text-zinc-550 text-xs font-mono font-bold">Caminho: Base/Estrutura de Agentes/{selectedFile.filename}</p>
                </div>
                <button
                  id="btn-save-agent-file"
                  onClick={handleSaveFile}
                  disabled={saving}
                  className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {saving ? '⏳ Salvando...' : '💾 Salvar Rascunho'}
                </button>
              </div>

              {message && (
                <p className="text-xs text-zinc-700 font-medium bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5">
                  {message}
                </p>
              )}

              {/* Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Editor de Conteúdo Markdown
                  </label>
                  <span className="text-[9px] text-zinc-400 font-mono font-bold bg-white border border-zinc-200 px-2 py-0.5 rounded shadow-xs">markdown</span>
                </div>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={20}
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
