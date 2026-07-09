import React, { useEffect, useState, useRef } from 'react';
import Modal from '../components/Modal';
import { IconRocket, IconUsers, IconUpload, IconTrash, IconSend, IconChevron } from '../components/icons';

interface Subscriber {
  id: string;
  name: string;
  email: string;
  subscribedAt: string;
}

interface HistoryItem {
  id: string;
  email: string;
  name: string;
  subject: string;
  broadcastId: string;
  sentAt: string;
  status: 'sent' | 'opened' | 'clicked';
  openedAt?: string;
  clickedAt?: string;
}

export default function Newsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedSubHistory, setSelectedSubHistory] = useState<HistoryItem[]>([]);
  const [selectedSubEmail, setSelectedSubEmail] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'disparo' | 'analytics'>('disparo');
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

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/newsletter/broadcasts');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
    fetchHistory();
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

  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o e-mail ${email} da lista?`)) return;
    try {
      const res = await fetch(`/api/admin/newsletter/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`E-mail ${email} removido com sucesso.`);
        fetchSubscribers();
      } else {
        setMessage(`Erro ao excluir: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Erro na exclusão: ${err.message}`);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      setMessage('Por favor, insira o e-mail de teste.');
      return;
    }
    if (!subject.trim() || !htmlContent.trim()) {
      setMessage('Escreva o assunto e o HTML do e-mail antes de testar.');
      return;
    }
    setSendingTest(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/newsletter/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, htmlContent, testEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
      } else {
        setMessage(`Erro no teste: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Erro de conexão: ${err.message}`);
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendSingleEmail = async (email: string, name: string) => {
    if (!subject.trim() || !htmlContent.trim()) {
      setMessage('Defina o assunto e cole o HTML do e-mail para poder enviar individualmente.');
      return;
    }
    if (!window.confirm(`Deseja enviar este e-mail individualmente para ${email}?`)) return;
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/newsletter/send-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, htmlContent, email, name }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        fetchHistory();
      } else {
        setMessage(`Erro ao enviar e-mail individual: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Erro de conexão: ${err.message}`);
    } finally {
      setSending(false);
    }
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
        fetchHistory();
      } else {
        setMessage(`Erro no envio: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Erro de conexão: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const loadSubHistory = async (email: string) => {
    setSelectedSubEmail(email);
    try {
      const res = await fetch(`/api/admin/newsletter/history/${encodeURIComponent(email)}`);
      const data = await res.json();
      setSelectedSubHistory(data.history || []);
    } catch (e) {
      console.error('Erro ao buscar histórico do inscrito:', e);
    }
  };

  // Filter subscribers based on search query
  const filteredSubscribers = subscribers.filter(sub => {
    const q = searchQuery.toLowerCase();
    return (
      (sub.name || '').toLowerCase().includes(q) ||
      sub.email.toLowerCase().includes(q)
    );
  });

  // Calculate General Analytics
  const totalSent = history.length;
  const totalOpened = history.filter(h => h.status === 'opened' || h.status === 'clicked').length;
  const totalClicked = history.filter(h => h.status === 'clicked').length;
  
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0';
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900">Newsletter</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Gestão de inscritos, disparo de outbound, testes e analytics</p>
        </div>
        <div className="flex bg-zinc-200/60 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('disparo')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'disparo' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-500 hover:text-zinc-950'
            }`}
          >
            Disparos e Inscritos
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'analytics' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-500 hover:text-zinc-950'
            }`}
          >
            Analytics e Histórico
          </button>
        </div>
      </div>

      {activeTab === 'disparo' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Disparo de E-mail */}
          <div className="lg:col-span-7 space-y-6">
            <div className="tactile-raised p-6 bg-white/60 space-y-5">
              <h2 className="font-display font-bold text-zinc-950 text-base border-b border-zinc-200/50 pb-3 flex items-center gap-2">
                <IconRocket className="w-4 h-4" /> Configurar Disparo de E-mail
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
                  rows={8}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3.5 text-xs text-zinc-800 font-mono focus:outline-none focus:border-zinc-900 shadow-inner"
                />
              </div>

              {/* Test Email Row */}
              <div className="border-t border-zinc-200/50 pt-4 space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Enviar E-mail de Teste
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    placeholder="Ex: seu-email@empresa.com"
                    className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-850 focus:outline-none focus:border-zinc-900 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={sendingTest || !testEmail}
                    className="bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {sendingTest ? 'Enviando...' : 'Enviar Teste'}
                  </button>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex gap-2 border-t border-zinc-200/50">
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
                  {sending ? 'Disparando...' : `Disparar em Massa (${subscribers.length} inscritos)`}
                </button>
              </div>

              {/* Preview Section */}
              {htmlContent.trim() && (
                <div className="space-y-2 mt-4 pt-4 border-t border-zinc-200/50">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pré-visualização</h3>
                  <div className="border border-zinc-250 rounded-xl bg-white overflow-hidden max-h-60 shadow-inner">
                    <iframe
                      srcDoc={htmlContent}
                      title="Pré-visualização do e-mail"
                      sandbox=""
                      className="w-full h-60 border-0"
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
                <p className="text-xs text-zinc-750 font-semibold bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 mt-4">
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Lista de Inscritos */}
          <div className="lg:col-span-5 space-y-6">
            <div className="tactile-raised p-6 bg-white/60 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-200/50 pb-3">
                <h2 className="font-display font-bold text-zinc-950 text-base flex items-center gap-2">
                  <IconUsers className="w-4 h-4" /> Inscritos ({filteredSubscribers.length})
                </h2>
              </div>

              {/* Lupa de busca */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="🔍 Buscar lead ou e-mail..."
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-zinc-900 shadow-inner"
                />
              </div>

              <div className="divide-y divide-zinc-200/40 max-h-[350px] overflow-auto pr-1">
                {loading ? (
                  <p className="text-center py-8 text-zinc-400 text-xs font-mono">Carregando...</p>
                ) : filteredSubscribers.length === 0 ? (
                  <p className="text-center py-8 text-zinc-500 text-xs font-medium">Nenhum inscrito encontrado</p>
                ) : (
                  filteredSubscribers.map(sub => (
                    <div key={sub.id} className="py-3 flex items-center justify-between group">
                      <div className="flex flex-col min-w-0 cursor-pointer" onClick={() => loadSubHistory(sub.email)}>
                        <span className="text-zinc-900 font-semibold text-xs truncate hover:underline">{sub.name || 'Sem nome'}</span>
                        <span className="text-zinc-450 font-mono text-[9px] truncate">{sub.email}</span>
                        <span className="text-[8px] text-zinc-400 font-mono mt-0.5">
                          inscrito em {new Date(sub.subscribedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleSendSingleEmail(sub.email, sub.name)}
                          className="text-[9px] bg-white border border-zinc-200 hover:border-zinc-350 p-1.5 rounded-lg text-zinc-700 transition-all cursor-pointer"
                          title="Enviar E-mail Individual"
                        >
                          <IconSend className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                          className="text-[9px] bg-red-50 hover:bg-red-100 p-1.5 rounded-lg text-red-650 transition-all cursor-pointer"
                          title="Excluir da lista"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB: ANALYTICS E HISTÓRICO */
        <div className="space-y-6">
          {/* General Cards Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="tactile-raised p-5 bg-white/60">
              <span className="font-mono text-[9px] text-zinc-400 uppercase font-black tracking-wider block">Total Enviados</span>
              <span className="text-2xl font-display font-black text-zinc-950 mt-1.5 block">{totalSent}</span>
            </div>
            <div className="tactile-raised p-5 bg-white/60">
              <span className="font-mono text-[9px] text-zinc-400 uppercase font-black tracking-wider block">Total Aberturas</span>
              <span className="text-2xl font-display font-black text-zinc-950 mt-1.5 block">{totalOpened}</span>
            </div>
            <div className="tactile-raised p-5 bg-white/60">
              <span className="font-mono text-[9px] text-zinc-400 uppercase font-black tracking-wider block">Total Cliques</span>
              <span className="text-2xl font-display font-black text-zinc-950 mt-1.5 block">{totalClicked}</span>
            </div>
            <div className="tactile-raised p-5 bg-white/60">
              <span className="font-mono text-[9px] text-zinc-400 uppercase font-black tracking-wider block">Taxa de Abertura / Clique</span>
              <span className="text-lg font-display font-black text-zinc-950 mt-1.5 block">{openRate}% / {clickRate}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Histórico Geral */}
            <div className="lg:col-span-7 tactile-raised p-6 bg-white/60 space-y-4">
              <h2 className="font-display font-bold text-zinc-950 text-base border-b border-zinc-200/50 pb-3 flex items-center gap-2">
                <IconRocket className="w-4 h-4" /> Histórico de Disparos Recentes
              </h2>

              <div className="divide-y divide-zinc-200/40 max-h-[400px] overflow-auto pr-1">
                {historyLoading ? (
                  <p className="text-center py-8 text-zinc-400 text-xs font-mono">Carregando histórico...</p>
                ) : history.length === 0 ? (
                  <p className="text-center py-8 text-zinc-500 text-xs font-medium">Nenhum e-mail enviado ainda</p>
                ) : (
                  [...history].reverse().map(item => (
                    <div key={item.id} className="py-3 flex flex-col justify-between md:flex-row md:items-center gap-2">
                      <div className="min-w-0">
                        <span className="text-zinc-900 font-semibold text-xs truncate block">{item.subject}</span>
                        <span className="text-zinc-450 font-mono text-[9px] truncate block">Para: {item.email} ({item.name || 'Sem nome'})</span>
                        <span className="text-[8px] text-zinc-400 font-mono mt-0.5">
                          Enviado em {new Date(item.sentAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div>
                        <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                          item.status === 'clicked'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'opened'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                        }`}>
                          {item.status === 'clicked' ? 'Clicado' : item.status === 'opened' ? 'Aberto' : 'Enviado'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Histórico do Lead Selecionado */}
            <div className="lg:col-span-5 tactile-raised p-6 bg-white/60 space-y-4">
              <h2 className="font-display font-bold text-zinc-950 text-base border-b border-zinc-200/50 pb-3 flex items-center gap-2">
                <IconUsers className="w-4 h-4" /> Histórico Individual de E-mails
              </h2>

              {selectedSubEmail ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                    <div className="min-w-0">
                      <span className="text-[8px] text-zinc-400 font-mono uppercase block font-bold">Inscrito em Foco</span>
                      <span className="text-xs font-bold text-zinc-900 truncate block">{selectedSubEmail}</span>
                    </div>
                    <button
                      onClick={() => setSelectedSubEmail(null)}
                      className="text-[9px] text-zinc-500 hover:text-zinc-950 font-bold transition-all cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>

                  <div className="divide-y divide-zinc-200/40 max-h-[300px] overflow-auto pr-1">
                    {selectedSubHistory.length === 0 ? (
                      <p className="text-center py-8 text-zinc-500 text-xs font-medium">Este inscrito ainda não recebeu e-mails com rastreamento.</p>
                    ) : (
                      selectedSubHistory.map(item => (
                        <div key={item.id} className="py-2.5">
                          <span className="text-zinc-900 font-bold text-xs block">{item.subject}</span>
                          <span className="text-[8px] text-zinc-400 font-mono block mt-0.5">Enviado: {new Date(item.sentAt).toLocaleDateString('pt-BR')}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[8px] font-mono font-bold ${item.status === 'clicked' || item.status === 'opened' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                              • Abertura: {item.openedAt ? new Date(item.openedAt).toLocaleDateString('pt-BR') : 'Aguardando'}
                            </span>
                            {item.clickedAt && (
                              <span className="text-[8px] font-mono font-bold text-blue-600">
                                • Clique: {new Date(item.clickedAt).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-400 space-y-2">
                  <IconUsers className="w-6 h-6 mx-auto text-zinc-300" />
                  <p className="text-xs font-bold font-display">Selecione um inscrito na aba de disparo</p>
                  <p className="text-[9.5px] max-w-xs mx-auto text-zinc-400 leading-relaxed">
                    Clique no nome de algum inscrito na aba "Disparos e Inscritos" para visualizar a lista completa de e-mails enviados a ele, com o status de abertura e clique em tempo real.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
