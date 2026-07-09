import React, { useEffect, useState, useRef } from 'react';
import { IconBot, IconChat, IconWarning, IconCopy, IconPaperclip } from '../components/icons';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export function LeadChat({ leadId, agentName = 'orchestrator', leadUrl }: { leadId: string; agentName?: string; leadUrl?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyingIndex, setCopyingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`/api/admin/chat/history/${leadId}/${agentName}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
        }
      });
      const data = await res.json();
      if (data.history) {
        setMessages(data.history);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico do chat:', err);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [leadId, agentName]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
        },
        body: JSON.stringify({
          clientId: leadId,
          agentName: agentName,
          message: userMsg.content,
          history: messages
        })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setError(data.error || 'Erro ao processar mensagem.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async () => {
    if (!window.confirm('Deseja realmente limpar esta conversa e iniciar um novo contexto?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/chat/history/${leadId}/${agentName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMessages([]);
      } else {
        setError('Erro ao resetar histórico.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopyingIndex(index);
    setTimeout(() => setCopyingIndex(null), 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const fileContext = `[CONTEÚDO DO ARQUIVO ANEXADO "${file.name}":]\n${text.slice(0, 15000)}\n[FIM DO ARQUIVO ANEXADO]`;
      setInput(prev => prev ? `${prev}\n\n${fileContext}` : fileContext);
    };
    
    if (file.name.endsWith('.pdf')) {
      // PDF nativo precisa de conversão ou apenas ler como binário/texto básico.
      // Lemos como texto genérico, o ideal seria extrator, mas lemos o Buffer text.
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex flex-col bg-zinc-150/40 rounded-2xl border border-zinc-200 overflow-hidden min-h-[380px]">
      <div className="bg-zinc-950 text-white px-4 py-2.5 text-xs font-mono font-bold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconBot className="w-3.5 h-3.5" />
          <span>{agentName.toUpperCase()} IA: Analisar {leadUrl || 'cliente'}</span>
        </div>
        <button
          onClick={handleNewConversation}
          className="bg-white/10 hover:bg-white/20 text-white text-[10px] px-2.5 py-1 rounded transition-all cursor-pointer font-sans"
        >
          Nova Conversa (Reset)
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[320px] bg-zinc-50/50">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 space-y-2">
            <IconChat className="w-6 h-6 mx-auto text-zinc-300" />
            <p className="font-bold font-display text-xs">Pergunte algo sobre este Lead</p>
            <p className="text-[9.5px] max-w-sm mx-auto leading-relaxed text-zinc-400">
              Tire dúvidas com o agente especialista sobre o diagnóstico obtido, peça sugestões de abordagem comercial ou envie um arquivo de texto para que ele analise.
            </p>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs border leading-relaxed relative group ${
                m.role === 'user' ? 'bg-zinc-950 text-white border-zinc-900 shadow-sm' : 'bg-white text-zinc-850 border-zinc-250/50 shadow-sm'
              }`}>
                <p className="font-bold text-[9px] uppercase tracking-wider mb-1 opacity-70">
                  {m.role === 'user' ? 'Você' : agentName}
                </p>
                <p className="whitespace-pre-wrap">{m.content}</p>
                
                {/* Botão de Cópia */}
                <button
                  onClick={() => handleCopy(m.content, idx)}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-200/50 hover:bg-zinc-200 p-1.5 rounded-lg text-zinc-700 cursor-pointer"
                  title="Copiar mensagem"
                >
                  {copyingIndex === idx ? (
                    <span className="text-[8px] font-bold">Copiado!</span>
                  ) : (
                    <IconCopy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white border border-zinc-250/50 text-zinc-500 rounded-2xl px-4 py-3 text-xs shadow-xs flex items-center gap-2">
              <IconBot className="w-3.5 h-3.5" />
              {agentName} analisando contexto e formulando resposta...
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-650 text-center font-bold flex items-center justify-center gap-1.5">
            <IconWarning className="w-3.5 h-3.5" /> {error}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-zinc-200 flex gap-2 items-center">
        {/* Anexo de Arquivo */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".txt,.md,.pdf,.json"
          onChange={handleFileUpload}
          className="hidden"
          id="chat-file-attach"
        />
        <label
          htmlFor="chat-file-attach"
          className="p-2.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-250 rounded-xl cursor-pointer text-zinc-650 transition-all"
          title="Anexar arquivo (.txt, .pdf, .md, .json)"
        >
          <IconPaperclip className="w-4 h-4" />
        </label>

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Pergunte ao agente, anexe arquivos ou peça argumentos de venda..."
          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-zinc-950 focus:bg-white"
        />
        
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
