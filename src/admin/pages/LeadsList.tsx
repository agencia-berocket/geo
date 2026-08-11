import React, { useEffect, useState } from 'react';
import { useLeads, type Lead } from '../hooks/useFirestore';
import { getPipelineStage, formatFollowupLabel, PIPELINE_STAGE_LABELS, PIPELINE_STAGE_COLORS } from '../lib/pipeline';
import {
  IconCheck, IconX, IconTrash, IconPlay, IconTarget,
  IconShield, IconSearch, IconRefresh, IconPlus, IconSparkles, IconLock,
  IconChevron, IconSend, IconMail
} from '../components/icons';
import { getAuth } from 'firebase/auth';

interface LeadsListProps {
  onNavigate: (page: string, id?: string) => void;
  selectedLeadId?: string;
}

function getGeoScoreColor(score: number) {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

export default function LeadsList({ onNavigate }: LeadsListProps) {
  const { leads, loading, error, fetchLeads, deleteLead, addLead } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [temperatureFilter, setTemperatureFilter] = useState<string>('all');

  // Mining drawer/collapsible state
  const [showMiningPanel, setShowMiningPanel] = useState(false);
  const [mining, setMining] = useState(false);
  const [miningSource, setMiningSource] = useState<'google' | 'linkedin' | 'auto' | 'import'>('google');
  const [importUrls, setImportUrls] = useState('');
  const [niche, setNiche] = useState('SaaS B2B');
  const [location, setLocation] = useState('Brasil');
  const [targetRole, setTargetRole] = useState('CEO / CMO / Founder');
  const [companySize, setCompanySize] = useState('20-200 funcionários');
  const [limit, setLimit] = useState(5);
  const [toast, setToast] = useState<string | null>(null);

  // Manual lead registration modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingLead, setAddingLead] = useState(false);
  const [newLead, setNewLead] = useState({ url: '', email: '', company: '', contactName: '', contactRole: '', phone: '' });

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const getAdminToken = async () => {
    const auth = getAuth();
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Handle Mining submission
  const handleStartMining = async (e: React.FormEvent) => {
    e.preventDefault();
    setMining(true);
    try {
      const token = await getAdminToken();
      const res = await fetch('/api/admin/lead-hunter/mine', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: miningSource,
          niche,
          location,
          targetRole,
          companySize,
          limit,
          urls: miningSource === 'import' ? importUrls.split('\n').filter(Boolean) : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao minerar leads');

      showToastMsg(`🚀 Mineração concluída com sucesso! ${data.count || data.leads?.length || 0} novos leads minerados.`);
      setShowMiningPanel(false);
      fetchLeads();
    } catch (err: any) {
      showToastMsg(`Erro na mineração: ${err.message}`);
    } finally {
      setMining(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o lead ${name}?`)) {
      try {
        await deleteLead(id);
        showToastMsg('Lead excluído com sucesso.');
        fetchLeads();
      } catch (err: any) {
        showToastMsg(`Erro ao excluir: ${err.message}`);
      }
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.url || !newLead.email) {
      showToastMsg('URL e e-mail são obrigatórios.');
      return;
    }
    setAddingLead(true);
    try {
      await addLead(newLead);
      showToastMsg('✅ Lead cadastrado com sucesso!');
      setShowAddModal(false);
      setNewLead({ url: '', email: '', company: '', contactName: '', contactRole: '', phone: '' });
    } catch (err: any) {
      showToastMsg(`Erro ao cadastrar lead: ${err.message}`);
    } finally {
      setAddingLead(false);
    }
  };

  // Rótulo textual simples da origem do lead (sem ícones/emojis)
  const getSourceLabel = (lead: Lead) => {
    const src = lead.source || 'lp';
    if (src === 'lp') return 'Landing Page';
    if (src === 'mining_google' || src === 'google') return 'Google Search';
    if (src === 'mining_linkedin' || src === 'linkedin') return 'LinkedIn';
    if (src === 'mining_import' || src === 'import') return 'Importação';
    if (src === 'direct') return 'Cadastro Manual';
    return 'Mineração IA';
  };

  // Filtering leads
  const filteredLeads = leads.filter(l => {
    const searchMatch = !searchTerm || [l.company, l.domain, l.url, l.email, l.contactName, l.name, l.niche].some(field =>
      (field || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sourceMatch = sourceFilter === 'all' || (
      sourceFilter === 'lp' ? (l.source === 'lp' || !l.source) :
      sourceFilter === 'google' ? (l.source === 'mining_google' || l.source === 'google') :
      sourceFilter === 'linkedin' ? (l.source === 'mining_linkedin' || l.source === 'linkedin') :
      sourceFilter === 'import' ? (l.source === 'mining_import' || l.source === 'import') :
      sourceFilter === 'auto' ? (l.source === 'mining_auto' || l.source === 'auto') : true
    );

    const statusMatch = statusFilter === 'all' || l.status === statusFilter;
    const tempMatch = temperatureFilter === 'all' || l.temperature === temperatureFilter;

    return searchMatch && sourceMatch && statusMatch && tempMatch;
  });

  // Calculate quick statistics
  const stats = {
    total: leads.length,
    lp: leads.filter(l => l.source === 'lp' || !l.source).length,
    mined: leads.filter(l => l.source && l.source !== 'lp').length,
    approvedTerms: leads.filter(l => l.searchTermsStatus === 'approved').length,
    diagnosed: leads.filter(l => l.diagnosticId || l.geoScore).length,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white text-xs font-mono px-4 py-3 rounded-2xl shadow-2xl border border-zinc-800 animate-bounce">
          {toast}
        </div>
      )}

      {/* Top Header & Mining Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="font-display font-black text-2xl text-zinc-950 tracking-tight flex items-center gap-2">
            <IconTarget className="w-6 h-6 text-zinc-900" />
            Leads
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            Gerenciamento completo de prospecção, origem do lead, termos de pesquisa e diagnósticos GEO.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLeads()}
            className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors cursor-pointer border border-zinc-200"
            title="Atualizar lista"
          >
            <IconRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-white hover:bg-zinc-100 text-zinc-900 font-display font-bold text-xs rounded-xl shadow-sm border border-zinc-300 transition-all flex items-center gap-2 cursor-pointer"
          >
            <IconPlus className="w-4 h-4" />
            <span>Cadastrar Lead</span>
          </button>

          <button
            onClick={() => setShowMiningPanel(s => !s)}
            className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-display font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <IconSparkles className="w-4 h-4 text-amber-400" />
            <span>{showMiningPanel ? 'Fechar Painel de Mineração' : 'Minerar Novos Leads (Lead Hunter)'}</span>
          </button>
        </div>
      </div>

      {/* MINING DRAWER / PANEL */}
      {showMiningPanel && (
        <div className="bg-white border-2 border-zinc-950 rounded-2xl p-6 shadow-xl space-y-5 animate-fadeIn">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <h3 className="font-display font-bold text-zinc-950 text-base flex items-center gap-2">
              <IconTarget className="w-5 h-5 text-blue-600" />
              Configurar Nova Varredura / Mineração de Leads
            </h3>
            <span className="text-xs font-mono text-zinc-400 uppercase font-semibold">MOTOR DE PROSPECÇÃO GEO</span>
          </div>

          <form onSubmit={handleStartMining} className="space-y-4">
            {/* Mining Source Selection */}
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-700 mb-2 uppercase">Canal de Mineração:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'google', label: '🔵 Google Search / Places' },
                  { id: 'linkedin', label: '🟣 LinkedIn (Decisores)' },
                  { id: 'auto', label: '⚡ IA Autônoma' },
                  { id: 'import', label: '🟧 Importar Lista de URLs' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMiningSource(item.id as any)}
                    className={`p-3 rounded-xl border text-xs font-display font-bold text-left transition-all cursor-pointer ${
                      miningSource === item.id
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs based on mining source */}
            {miningSource === 'import' ? (
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-zinc-700">URLs ou Domínios para Importar (um por linha):</label>
                <textarea
                  value={importUrls}
                  onChange={(e) => setImportUrls(e.target.value)}
                  rows={4}
                  placeholder="empresa1.com.br&#10;https://empresa2.com/contato&#10;https://www.linkedin.com/in/decisor-exemplo"
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-950"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 mb-1">NICHO / SETOR</label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="Ex: SaaS B2B, Clínicas Estéticas..."
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 mb-1">LOCALIZAÇÃO / CIDADE</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: São Paulo, Brasil..."
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 mb-1">CARGO DO DECISOR</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Ex: CEO / CMO / Founder..."
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 mb-1">LIMITE DE LEADS</label>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
                  >
                    <option value={3}>3 Leads</option>
                    <option value={5}>5 Leads</option>
                    <option value={10}>10 Leads</option>
                    <option value={20}>20 Leads</option>
                  </select>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={mining}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {mining ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Minerando e Extraindo Dados...</span>
                  </>
                ) : (
                  <>
                    <IconSparkles className="w-4 h-4" />
                    <span>Iniciar Mineração de Leads</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <span className="font-display font-bold text-sm text-zinc-900 flex items-center gap-2">
                <IconPlus className="w-4 h-4" /> Cadastrar Novo Lead
              </span>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-950 cursor-pointer p-1">
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddLead} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 mb-1">URL / DOMÍNIO *</label>
                  <input
                    type="text"
                    required
                    value={newLead.url}
                    onChange={(e) => setNewLead(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="empresa.com.br"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 mb-1">E-MAIL DE CONTATO *</label>
                  <input
                    type="email"
                    required
                    value={newLead.email}
                    onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contato@empresa.com.br"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 mb-1">EMPRESA</label>
                  <input
                    type="text"
                    value={newLead.company}
                    onChange={(e) => setNewLead(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 mb-1">TELEFONE</label>
                  <input
                    type="text"
                    value={newLead.phone}
                    onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 mb-1">NOME DO DECISOR</label>
                  <input
                    type="text"
                    value={newLead.contactName}
                    onChange={(e) => setNewLead(prev => ({ ...prev, contactName: e.target.value }))}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 mb-1">CARGO DO DECISOR</label>
                  <input
                    type="text"
                    value={newLead.contactRole}
                    onChange={(e) => setNewLead(prev => ({ ...prev, contactRole: e.target.value }))}
                    placeholder="CEO / Diretor..."
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingLead}
                  className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold font-display shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {addingLead ? 'Cadastrando...' : 'Cadastrar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERVIEW STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
          <span className="font-mono text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">TOTAL DE LEADS</span>
          <span className="font-display font-black text-2xl text-zinc-950 mt-1 block">{stats.total}</span>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
          <span className="font-mono text-[9px] text-emerald-600 font-bold uppercase tracking-wider block">VIA LANDING PAGE</span>
          <span className="font-display font-black text-2xl text-emerald-700 mt-1 block">{stats.lp}</span>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
          <span className="font-mono text-[9px] text-blue-600 font-bold uppercase tracking-wider block">MINERADOS (HUNTER)</span>
          <span className="font-display font-black text-2xl text-blue-700 mt-1 block">{stats.mined}</span>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
          <span className="font-mono text-[9px] text-amber-600 font-bold uppercase tracking-wider block">TERMOS APROVADOS</span>
          <span className="font-display font-black text-2xl text-amber-700 mt-1 block">{stats.approvedTerms}</span>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <span className="font-mono text-[9px] text-purple-600 font-bold uppercase tracking-wider block">DIAGNOSTICADOS</span>
          <span className="font-display font-black text-2xl text-purple-700 mt-1 block">{stats.diagnosed}</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <IconSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por empresa, domínio, e-mail ou decisor..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950 focus:bg-white"
          />
        </div>

        {/* Source Filter */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="w-full md:w-auto px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 cursor-pointer"
        >
          <option value="all">Todas as Origens</option>
          <option value="lp">🟢 Landing Page (LP)</option>
          <option value="google">🔵 Mineração Google</option>
          <option value="linkedin">🟣 Mineração LinkedIn</option>
          <option value="import">🟧 Mineração Importação</option>
          <option value="auto">⚡ Mineração IA Auto</option>
        </select>

        {/* Temperature Filter */}
        <select
          value={temperatureFilter}
          onChange={(e) => setTemperatureFilter(e.target.value)}
          className="w-full md:w-auto px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 cursor-pointer"
        >
          <option value="all">Todas as Temperaturas</option>
          <option value="cold">❄️ Frio (Cold)</option>
          <option value="warm">🔥 Morno (Warm)</option>
          <option value="hot">⚡ Quente (Hot)</option>
          <option value="converted">💎 Convertido</option>
        </select>
      </div>

      {/* UNIFIED LEADS LIST TABLE / CARDS */}
      {loading ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
          <div className="w-8 h-8 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-zinc-500 font-mono text-xs">Carregando lista unificada de leads...</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-3">
          <IconTarget className="w-10 h-10 text-zinc-300 mx-auto" />
          <h3 className="font-display font-bold text-zinc-900 text-base">Nenhum lead encontrado</h3>
          <p className="text-xs text-zinc-500">Tente ajustar os filtros ou execute uma nova mineração no botão acima.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200/60 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="p-4">Empresa / Lead</th>
                  <th className="p-4">Origem</th>
                  <th className="p-4">Decisor & Nicho</th>
                  <th className="p-4">Termos de Pesquisa</th>
                  <th className="p-4 text-center">Score GEO</th>
                  <th className="p-4">Status do Pipeline</th>
                  <th className="p-4 text-right">Excluir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filteredLeads.map((lead) => {
                  const score = lead.geoScore || lead.geoScoreEstimado || 0;
                  const stage = getPipelineStage(lead);
                  const followupLabel = formatFollowupLabel(lead);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onNavigate('leads', lead.id)}
                      className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Empresa / Lead */}
                      <td className="p-4 font-medium">
                        <div className="font-display font-bold text-zinc-950 text-sm group-hover:text-blue-600 transition-colors">
                          {lead.company || lead.domain || lead.url}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono truncate max-w-[200px]">
                          {lead.url}
                        </div>
                      </td>

                      {/* Origem */}
                      <td className="p-4">
                        <span className="text-[11px] font-mono font-medium text-zinc-600">
                          {lead.sourceLabel || getSourceLabel(lead)}
                        </span>
                      </td>

                      {/* Decisor & Nicho */}
                      <td className="p-4">
                        <div className="font-bold text-zinc-900">
                          {lead.contactName || lead.name || 'N/A'}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {lead.niche || 'Geral'}
                        </div>
                      </td>

                      {/* Termos de Pesquisa */}
                      <td className="p-4">
                        {lead.searchTermsStatus === 'approved' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <IconCheck className="w-3 h-3" /> Aprovados (14)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            <IconLock className="w-3 h-3" /> Pendente
                          </span>
                        )}
                      </td>

                      {/* Score GEO — apenas número e cor, sem gráfico */}
                      <td className="p-4 text-center">
                        <span className={`font-display font-black text-lg ${getGeoScoreColor(score)}`}>
                          {score}%
                        </span>
                      </td>

                      {/* Status do Pipeline */}
                      <td className="p-4">
                        <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${PIPELINE_STAGE_COLORS[stage]}`}>
                          {PIPELINE_STAGE_LABELS[stage]}
                        </span>
                        {followupLabel && (
                          <div className="text-[10px] text-zinc-400 font-mono mt-1">
                            Follow-up: e-mail {followupLabel}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDelete(lead.id, lead.company || lead.domain || lead.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Excluir Lead"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Cards View */}
          <div className="lg:hidden divide-y divide-zinc-100">
            {filteredLeads.map((lead) => {
              const score = lead.geoScore || lead.geoScoreEstimado || 0;
              const stage = getPipelineStage(lead);
              const followupLabel = formatFollowupLabel(lead);
              return (
                <div
                  key={lead.id}
                  onClick={() => onNavigate('leads', lead.id)}
                  className="p-4 hover:bg-zinc-50 transition-colors cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display font-bold text-zinc-950 text-sm">{lead.company || lead.domain}</h4>
                      <p className="text-xs text-zinc-400 font-mono">{lead.url}</p>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-zinc-500">
                      {lead.sourceLabel || getSourceLabel(lead)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-zinc-400 block text-[9px] font-mono">TERMOS</span>
                      <span className={`font-bold ${lead.searchTermsStatus === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {lead.searchTermsStatus === 'approved' ? 'Aprovados' : 'Pendente'}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block text-[9px] font-mono text-center">SCORE GEO</span>
                      <span className={`font-display font-black ${getGeoScoreColor(score)}`}>{score}%</span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block text-[9px] font-mono text-right">PIPELINE</span>
                      <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${PIPELINE_STAGE_COLORS[stage]}`}>
                        {PIPELINE_STAGE_LABELS[stage]}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-zinc-100" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      {followupLabel && ` · e-mail ${followupLabel}`}
                    </span>
                    <button
                      onClick={() => handleDelete(lead.id, lead.company || lead.domain || lead.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Excluir Lead"
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
    </div>
  );
}
