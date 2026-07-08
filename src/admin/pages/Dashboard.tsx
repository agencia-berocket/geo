import { useEffect, useState } from 'react';
import { useLeads, useClients } from '../hooks/useFirestore';
import StatusBadge from '../components/StatusBadge';
import { IconClipboard, IconActivity, IconRocket, IconLightbulb } from '../components/icons';

interface DashboardProps {
  onNavigate: (page: string, id?: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { leads, loading: leadsLoading, fetchLeads } = useLeads();
  const { clients, fetchClients } = useClients();
  const [apiCostMonth, setApiCostMonth] = useState<number | null>(null);

  useEffect(() => {
    fetchLeads();
    fetchClients();
    const diagCompleted = leads.filter(l => l.status === 'completed' || l.status === 'converted').length;
    setApiCostMonth(diagCompleted * 0.06);
  }, []);

  const newLeads = leads.filter(l => l.status === 'new');
  const processing = leads.filter(l => l.status === 'processing');
  const completed = leads.filter(l => l.status === 'completed');
  const converted = leads.filter(l => l.status === 'converted');

  const stats = [
    { label: 'Total Leads', value: leads.length, icon: IconClipboard, color: 'text-zinc-900', sub: `${newLeads.length} novos` },
    { label: 'Diagnósticos', value: completed.length + converted.length, icon: IconActivity, color: 'text-zinc-900', sub: `${processing.length} em fila` },
    { label: 'Clientes Ativos', value: clients.length, icon: IconRocket, color: 'text-zinc-900', sub: 'com workspace GEO' },
    { label: 'Custo/Mês (est.)', value: `US$ ${apiCostMonth?.toFixed(2) ?? '0.00'}`, icon: IconLightbulb, color: 'text-zinc-900', sub: 'via OpenRouter' },
  ];

  const recentLeads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1 font-medium">Visão geral da operação GEO b.rocket</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="tactile-raised p-6 bg-white/60 hover:scale-[1.02] transition-transform duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-3xl font-display font-bold mt-1.5 ${stat.color}`}>{stat.value}</p>
                  <p className="text-zinc-500 text-xs mt-1 font-medium">{stat.sub}</p>
                </div>
                <span className="p-2 bg-zinc-100 rounded-xl text-zinc-600">
                  <Icon className="w-5 h-5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent leads */}
        <div className="lg:col-span-2 tactile-raised p-6 bg-white/60">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200/50">
            <h2 className="font-display font-bold text-zinc-900 text-base">Leads Recentes</h2>
            <button onClick={() => onNavigate('leads')} className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200/60 cursor-pointer">
              Ver todos →
            </button>
          </div>
          <div className="divide-y divide-zinc-200/50">
            {leadsLoading ? (
              <div className="p-8 text-center text-zinc-400 text-sm font-mono">Carregando...</div>
            ) : recentLeads.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-zinc-500 text-sm font-medium">Nenhum lead ainda</p>
                <p className="text-zinc-400 text-xs mt-1">Os leads do widget aparecerão aqui</p>
              </div>
            ) : (
              recentLeads.map(lead => (
                <div
                  key={lead.id}
                  className="py-4 flex items-center gap-4 hover:bg-zinc-100/40 rounded-xl px-2 -mx-2 cursor-pointer transition-colors"
                  onClick={() => onNavigate('leads', lead.id)}
                >
                  <div className="w-10 h-10 bg-zinc-100 border border-zinc-200/80 rounded-xl flex items-center justify-center text-xs font-mono text-zinc-600 font-bold flex-shrink-0">
                    {lead.url.replace('https://', '').replace('http://', '').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{lead.url}</p>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate">{lead.email}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {lead.geoScore !== undefined && (
                      <span className={`text-sm font-mono font-bold ${lead.geoScore >= 70 ? 'text-emerald-600' : lead.geoScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {lead.geoScore}%
                      </span>
                    )}
                    <StatusBadge status={lead.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Processing queue + quick stats */}
        <div className="space-y-6">
          {/* Pipeline status */}
          <div className="tactile-raised p-6 bg-white/60">
            <h2 className="font-display font-bold text-zinc-900 text-sm mb-4">Pipeline de Diagnóstico</h2>
            <div className="space-y-3">
              {[
                { label: 'Novos', count: newLeads.length, color: 'bg-zinc-400' },
                { label: 'Processando', count: processing.length, color: 'bg-blue-500' },
                { label: 'Concluídos', count: completed.length, color: 'bg-emerald-500' },
                { label: 'Convertidos', count: converted.length, color: 'bg-violet-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-zinc-600">{item.label}</span>
                  </div>
                  <span className="font-bold text-zinc-950 font-mono bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/50">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agents status */}
          <div className="tactile-raised p-6 bg-white/60">
            <h2 className="font-display font-bold text-zinc-900 text-sm mb-4">Agentes GEO</h2>
            <div className="space-y-3">
              {[
                { name: 'Orquestrador', status: 'online' },
                { name: 'Gatekeeper', status: 'online' },
                { name: 'Metadata', status: 'online' },
                { name: 'Content', status: 'online' },
                { name: 'Intent (OpenRouter)', status: 'online' },
              ].map(agent => (
                <div key={agent.name} className="flex items-center justify-between text-xs font-medium">
                  <span className="text-zinc-600">{agent.name}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-emerald-600 font-bold">online</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

