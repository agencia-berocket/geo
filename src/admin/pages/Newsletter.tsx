import React, { useEffect, useState, useRef } from 'react';
import Modal from '../components/Modal';
import { IconRocket, IconUsers, IconUpload } from '../components/icons';

interface Subscriber {
  id: string;
  name: string;
  email: string;
  subscribedAt: string;
}

export default function Newsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/newsletter');
      const data = await res.json();
      setSubscribers(data.subscribers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setHtmlContent(text);
      setMessage(`Arquivo "${file.name}" carregado com sucesso.`);
    };
    reader.readAsText(file);
  };

  const handleSendBroadcast = async () => {
    if (!subject.trim()) {
      setMessage('Por favor, digite o assunto do e-mail.');
      return;
    }
    if (!htmlContent.trim()) {
      setMessage('Por favor, cole ou faça upload do arquivo HTML do e-mail.');
      return;
    }

    const confirmSend = window.confirm(`Você tem certeza que deseja enviar este e-mail para ${subscribers.length} inscritos?`);
    if (!confirmSend) return;

    setSending(true);
    setMessage('Enviando e-mails em lote...');
    try {
      const res = await fetch('/api/admin/newsletter/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, htmlContent }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`E-mail enviado com sucesso para ${data.count} inscritos!`);
        setSubject('');
        setHtmlContent('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setMessage(`Erro no envio: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Erro de conexão: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900">Newsletter</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Gestão de inscritos e disparos em massa</p>
        </div>
        <span className="text-xs text-zinc-400 font-mono font-bold bg-white border border-zinc-200/60 px-3 py-1 rounded-full shadow-xs">
          {subscribers.length} inscritos
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Disparo de E-mail */}
        <div className="lg:col-span-7 space-y-6">
          <div className="tactile-raised p-6 bg-white/60 space-y-5">
            <h2 className="font-display font-bold text-zinc-950 text-base border-b border-zinc-200/50 pb-3 flex items-center gap-2">
              <IconRocket className="w-4 h-4" /> Disparar E-mail em Massa
            </h2>

            {/* Subject */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Assunto do E-mail
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Ex: [b.rocket] Novas descobertas em Otimização GEO"
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900 shadow-inner"
              />
            </div>

            {/* Template HTML Source / Upload */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Template HTML do E-mail
                </label>
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".html"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="html-file-upload"
                  />
                  <label
                    htmlFor="html-file-upload"
                    className="text-xs bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-700 px-3 py-1.5 rounded-lg font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <IconUpload className="w-3.5 h-3.5" /> Fazer Upload (.html)
                  </label>
                </div>
              </div>

              <textarea
                value={htmlContent}
                onChange={e => setHtmlContent(e.target.value)}
                placeholder="Cole o código HTML do seu e-mail aqui ou use o botão de upload acima..."
                rows={10}
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3.5 text-xs text-zinc-800 font-mono focus:outline-none focus:border-zinc-900 shadow-inner"
              />
            </div>

            {/* Action */}
            <div className="pt-2 flex gap-2">
              {htmlContent.trim() && (
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold py-3 px-4 rounded-xl transition-all text-sm shadow-xs cursor-pointer"
                >
                  Pré-visualizar
                </button>
              )}
              <button
                id="btn-broadcast-newsletter"
                onClick={handleSendBroadcast}
                disabled={sending}
                className="flex-1 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm shadow-md cursor-pointer"
              >
                {sending ? 'Disparando...' : `Disparar para ${subscribers.length} inscritos`}
              </button>
            </div>

            {/* Preview Section */}
            {htmlContent.trim() && (
              <div className="space-y-2 mt-4 pt-4 border-t border-zinc-200/50">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pré-visualização</h3>
                <div className="border border-zinc-250 rounded-xl bg-white overflow-hidden max-h-80 shadow-inner">
                  <iframe
                    srcDoc={htmlContent}
                    title="Pré-visualização do e-mail"
                    sandbox=""
                    className="w-full h-80 border-0"
                  />
                </div>
              </div>
            )}

            {showPreview && (
              <Modal onClose={() => setShowPreview(false)} title="Pré-visualização do E-mail" subtitle={subject || undefined}>
                <iframe
                  srcDoc={htmlContent}
                  title="Pré-visualização completa do e-mail"
                  sandbox=""
                  className="w-full flex-1 min-h-[70vh] border-0 rounded-xl bg-white"
                />
              </Modal>
            )}

            {message && (
              <p className="text-xs text-zinc-700 font-medium bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 mt-4">
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Lista de Inscritos */}
        <div className="lg:col-span-5 space-y-6">
          <div className="tactile-raised p-6 bg-white/60">
            <h2 className="font-display font-bold text-zinc-950 text-base border-b border-zinc-200/50 pb-3 mb-4 flex items-center gap-2">
              <IconUsers className="w-4 h-4" /> Lista de Inscritos
            </h2>

            <div className="divide-y divide-zinc-200/40 max-h-[480px] overflow-auto pr-1">
              {loading ? (
                <p className="text-center py-8 text-zinc-400 text-xs font-mono">Carregando...</p>
              ) : subscribers.length === 0 ? (
                <p className="text-center py-8 text-zinc-500 text-xs font-medium">Nenhum inscrito ainda</p>
              ) : (
                subscribers.map(sub => (
                  <div key={sub.id} className="py-3 flex flex-col">
                    <span className="text-zinc-900 font-semibold text-xs truncate">{sub.name || 'Sem nome'}</span>
                    <span className="text-zinc-400 font-mono text-[10px] truncate">{sub.email}</span>
                    <span className="text-[9px] text-zinc-400 font-mono mt-0.5">
                      inscrito em {new Date(sub.subscribedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
