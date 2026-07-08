import { useEffect, useState } from 'react';
import { useLeads, useClients, type Lead } from '../hooks/useFirestore';
import StatusBadge from '../components/StatusBadge';
import GeoScoreGauge from '../components/GeoScoreGauge';

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
    // Simulated API cost (could be fetched from OpenRouter API)
    const diagCompleted = leads.filter(l => l.status === 'completed' || l.status === 'converted').length;
    setApiCostMonth(diagCompleted * 0.06);
  }, []);

  const newLeads = leads.filter(l => l.status === 'new');
  const processing = leads.filter(l => l.status === 'processing');
  const completed = leads.filter(l => l.status === 'completed');
  const converted = leads.filter(l => l.status === 'converted');

  const stats = [
    { label: 'Total Leads', value: leads.length, icon: '📋', color: 'text-blue-400', sub: `${newLeads.length} novos` },
    { label: 'Diagnósticos', value: completed.length + converted.length, icon: '🔬', color: 'text-emerald-400', sub: `${processing.length} em fila` },
    { label: 'Clientes Ativos', value: clients.length, icon: '🚀', color: 'text-violet-400', sub: 'com workspace GEO' },
    { label: 'Custo/Mês (est.)', value: `US$ ${apiCostMonth?.toFixed(2) ?? '0.00'}`, icon: '💡', color: 'text-amber-400', sub: 'via OpenRouter' },
  ];

  const recentLeads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Visão geral da operação GEO b.rocket</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                <p className="text-zinc-600 text-xs mt-0.5">{stat.sub}</p>
              </div>
              <span className="text-2xl opacity-60">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent leads */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">Leads Recentes</h2>
            <button onClick={() => onNavigate('leads')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Ver todos →
            </button>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {leadsLoading ? (
              <div className="p-8 text-center text-zinc-500 text-sm">Carregando...</div>
            ) : recentLeads.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-zinc-500 text-sm">Nenhum lead ainda</p>
                <p className="text-zinc-600 text-xs mt-1">Os leads do widget aparecerão aqui</p>
              </div>
            ) : (
              recentLeads.map(lead => (
                <div
                  key={lead.id}
                  className="p-4 flex items-center gap-3 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                  onClick={() => onNavigate('leads', lead.id)}
                >
                  <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-xs font-mono text-zinc-400 flex-shrink-0">
                    {lead.url.replace('https://', '').replace('http://', '').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{lead.url}</p>
                    <p className="text-xs text-zinc-500 truncate">{lead.email}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {lead.geoScore !== undefined && (
                      <span className={`text-sm font-bold ${lead.geoScore >= 70 ? 'text-emerald-400' : lead.geoScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
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
        <div className="space-y-4">
          {/* Pipeline status */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white text-sm mb-3">Pipeline de Diagnóstico</h2>
            <div className="space-y-2">
              {[
                { label: 'Novos', count: newLeads.length, color: 'bg-zinc-400' },
                { label: 'Processando', count: processing.length, color: 'bg-blue-400' },
                { label: 'Concluídos', count: completed.length, color: 'bg-emerald-400' },
                { label: 'Convertidos', count: converted.length, color: 'bg-violet-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-xs text-zinc-400">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-200">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agents status */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white text-sm mb-3">Agentes GEO</h2>
            <div className="space-y-2">
              {[
                { name: 'Orquestrador', status: 'online' },
                { name: 'Gatekeeper', status: 'online' },
                { name: 'Metadata', status: 'online' },
                { name: 'Content', status: 'online' },
                { name: 'Intent (OpenRouter)', status: 'online' },
              ].map(agent => (
                <div key={agent.name} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{agent.name}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span className="text-xs text-emerald-400">online</span>
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
