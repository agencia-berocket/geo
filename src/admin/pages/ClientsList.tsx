import React, { useEffect, useState } from 'react';
import { useClients, type Client } from '../hooks/useFirestore';
import Modal from '../components/Modal';
import { IconEdit, IconTrash, IconRocket, IconSearch } from '../components/icons';

interface ClientsListProps {
  onNavigate: (page: string, id?: string) => void;
}

const stageLabels: Record<number, string> = {
  1: 'GEO Start',
  2: 'Planejamento',
  3: 'GEO Growth',
  4: 'GEO Authority',
  5: 'Monitoramento',
};

const planConfig = {
  premium: { label: 'Premium', color: 'text-zinc-700 bg-zinc-100 border-zinc-200/80' },
  enterprise: { label: 'Enterprise', color: 'text-zinc-950 bg-zinc-200/80 border-zinc-300' },
};

function getScoreColor(score: number) {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c => {
    const searchMatch = !searchTerm || [c.company, c.url, c.email, c.contactName].some(f =>
      (f || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const planMatch = planFilter === 'all' || c.plan === planFilter;
    const stageMatch = stageFilter === 'all' || String(c.currentStage) === stageFilter;
    return searchMatch && planMatch && stageMatch;
  });

  const stats = {
    total: clients.length,
    premium: clients.filter(c => c.plan === 'premium').length,
    enterprise: clients.filter(c => c.plan === 'enterprise').length,
    avgScore: clients.length > 0
      ? Math.round(clients.reduce((sum, c) => sum + (c.geoScoreHistory?.[c.geoScoreHistory.length - 1]?.score || 0), 0) / clients.length)
      : 0,
    inProgress: clients.filter(c => c.currentStage < 5).length,
  };

  const handleSaveClient = async (updatedFields: Partial<Client>) => {
    if (!editingClient) return;
    try {
      const res = await editClient(editingClient.id, updatedFields);
      if (res.success) {
        setEditingClient(null);
        showToast('✅ Cliente atualizado com sucesso!');
      }
    } catch (err: any) {
      showToast(`Erro ao salvar cliente: ${err.message}`);
    }
  };

  const handleDeleteClient = async (e: React.MouseEvent, clientId: string, label: string) => {
    e.stopPropagation();
    if (!window.confirm(`Tem certeza que deseja excluir o cliente ${label}? Todo o histórico será removido.`)) return;
    try {
      await deleteClient(clientId);
      showToast('Cliente excluído com sucesso.');
    } catch (err: any) {
      showToast(`Erro ao excluir cliente: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white text-xs font-mono px-4 py-3 rounded-2xl shadow-2xl border border-zinc-800 animate-bounce">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-display font-bold text-zinc-900">Clientes</h1>
        <p className="text-zinc-500 text-sm mt-1 font-medium">Gestão GEO completa com entregáveis acionáveis e histórico de evolução</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
          <span className="font-mono text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">TOTAL DE CLIENTES</span>
          <span className="font-display font-black text-2xl text-zinc-950 mt-1 block">{stats.total}</span>
        </div>
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
          <span className="font-mono text-[9px] text-zinc-600 font-bold uppercase tracking-wider block">PREMIUM</span>
          <span className="font-display font-black text-2xl text-zinc-800 mt-1 block">{stats.premium}</span>
        </div>
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
          <span className="font-mono text-[9px] text-purple-600 font-bold uppercase tracking-wider block">ENTERPRISE</span>
          <span className="font-display font-black text-2xl text-purple-700 mt-1 block">{stats.enterprise}</span>
        </div>
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
          <span className="font-mono text-[9px] text-emerald-600 font-bold uppercase tracking-wider block">SCORE MÉDIO</span>
          <span className="font-display font-black text-2xl text-emerald-700 mt-1 block">{stats.avgScore}%</span>
        </div>
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <span className="font-mono text-[9px] text-blue-600 font-bold uppercase tracking-wider block">EM ANDAMENTO</span>
          <span className="font-display font-black text-2xl text-blue-700 mt-1 block">{stats.inProgress}</span>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <IconSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por empresa, e-mail ou responsável..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950 focus:bg-white"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="w-full md:w-auto px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 cursor-pointer"
        >
          <option value="all">Todos os Planos</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="w-full md:w-auto px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 cursor-pointer"
        >
          <option value="all">Todas as Etapas</option>
          {[1, 2, 3, 4, 5].map(s => <option key={s} value={String(s)}>Etapa {s}</option>)}
        </select>
      </div>

      {/* TABLE (desktop) + CARDS (mobile) */}
      {loading ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
          <div className="w-8 h-8 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-zinc-500 font-mono text-xs">Carregando clientes...</span>
        </div>
      ) : error ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center text-red-500 text-sm font-medium">{error}</div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-3">
          <IconRocket className="w-10 h-10 text-zinc-300 mx-auto" />
          <p className="text-zinc-800 font-display font-bold text-base">Nenhum cliente encontrado</p>
          <p className="text-zinc-500 text-sm">Converta um lead em cliente para começar</p>
          <button
            onClick={() => onNavigate('leads')}
            className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
          >
            Ver Leads →
          </button>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200/60 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="p-4">Empresa / Cliente</th>
                  <th className="p-4">Plano</th>
                  <th className="p-4">Etapa GEO</th>
                  <th className="p-4 text-center">Score GEO Atual</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filteredClients.map(client => {
                  const score = client.geoScoreHistory?.[client.geoScoreHistory.length - 1]?.score || 0;
                  return (
                    <tr
                      key={client.id}
                      onClick={() => onNavigate('clients', client.id)}
                      className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 font-medium">
                        <div className="font-display font-bold text-zinc-950 text-sm group-hover:text-blue-600 transition-colors">
                          {client.company || client.url}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono truncate max-w-[200px]">{client.url}</div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${planConfig[client.plan]?.color || ''}`}>
                          {planConfig[client.plan]?.label || client.plan}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-700 font-medium">
                        Etapa {client.currentStage}/5 — {stageLabels[client.currentStage]}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-display font-black text-lg ${getScoreColor(score)}`}>{score}%</span>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingClient(client)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
                            title="Editar Cliente"
                          >
                            <IconEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClient(e, client.id, client.company || client.url)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Excluir Cliente"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Cards View */}
          <div className="lg:hidden divide-y divide-zinc-100">
            {filteredClients.map(client => {
              const score = client.geoScoreHistory?.[client.geoScoreHistory.length - 1]?.score || 0;
              return (
                <div
                  key={client.id}
                  onClick={() => onNavigate('clients', client.id)}
                  className="p-4 hover:bg-zinc-50 transition-colors cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display font-bold text-zinc-950 text-sm">{client.company || client.url}</h4>
                      <p className="text-xs text-zinc-400 font-mono">{client.url}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${planConfig[client.plan]?.color || ''}`}>
                      {planConfig[client.plan]?.label || client.plan}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-zinc-600">Etapa {client.currentStage}/5 — {stageLabels[client.currentStage]}</span>
                    <span className={`font-display font-black ${getScoreColor(score)}`}>{score}%</span>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setEditingClient(client)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
                      title="Editar Cliente"
                    >
                      <IconEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClient(e, client.id, client.company || client.url)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Excluir Cliente"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
