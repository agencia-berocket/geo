import { useEffect, useState } from 'react';
import { useLeads, useDiagnostic, type Lead } from '../hooks/useFirestore';
import StatusBadge from '../components/StatusBadge';
import GeoScoreGauge from '../components/GeoScoreGauge';

interface LeadsListProps {
  onNavigate: (page: string, id?: string) => void;
  selectedLeadId?: string;
}

// ─── Agent Report Accordion ─────────────────────────────────────────────────
function AgentReport({ title, icon, status, children }: {
  title: string; icon: string; status: 'ok' | 'warning' | 'critical'; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const statusColor = status === 'ok' ? 'text-emerald-600 font-bold' : status === 'warning' ? 'text-amber-600 font-bold' : 'text-red-600 font-bold';
  return (
    <div className="tactile-raised overflow-hidden bg-white/80 p-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer"
      >
        <span className="text-lg">{icon}</span>
        <span className="flex-1 font-display font-semibold text-zinc-900 text-sm">{title}</span>
        <span className={`text-xs font-mono ${statusColor}`}>{status.toUpperCase()}</span>
        <span className="text-zinc-400 text-xs ml-2">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 text-sm text-zinc-600 border-t border-zinc-100 mt-2 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Lead Detail Panel ──────────────────────────────────────────────────────
function LeadDetailPanel({ lead, onClose, onNavigate }: {
  lead: Lead; onClose: () => void; onNavigate: (page: string, id?: string) => void;
}) {
  const { diagnostic, loading: diagLoading, fetchDiagnostic } = useDiagnostic(lead.id);
  const { runDiagnostic, sendReport, convertToClient } = useLeads();
  const [running, setRunning] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lead.status === 'completed' || lead.status === 'converted') {
      fetchDiagnostic();
    }
  }, [lead.status]);

  const handleRunDiagnostic = async () => {
    setRunning(true);
    setMessage(null);
    try {
      await runDiagnostic(lead.id);
      setMessage('✅ Diagnóstico iniciado! Aguarde alguns minutos...');
      setTimeout(() => window.location.reload(), 3000);
    } catch (e: any) {
      setMessage(`❌ Erro: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleSendReport = async () => {
    setSending(true);
    setMessage(null);
    try {
      await sendReport(lead.id);
      setMessage('✅ Relatório HTML enviado por e-mail!');
    } catch (e: any) {
      setMessage(`❌ Erro: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleConvert = async () => {
    try {
      const result = await convertToClient(lead.id, {
        name: lead.name || lead.email.split('@')[0],
        company: lead.company || lead.url,
        plan: 'premium',
        currentStage: 1,
      });
      if (result.success) {
        setMessage('⭐ Lead convertido em cliente!');
        setTimeout(() => onNavigate('clients'), 1500);
      }
    } catch (e: any) {
      setMessage(`❌ Erro: ${e.message}`);
    }
  };

  const d = diagnostic;

  return (
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-start justify-end p-4">
      <div className="tactile-raised bg-[#f4f5f8] w-full max-w-2xl h-full overflow-auto shadow-2xl p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 transition-colors font-bold text-sm cursor-pointer">← Voltar</button>
            <div className="min-w-0">
              <p className="text-zinc-900 font-display font-bold truncate">{lead.url}</p>
              <p className="text-zinc-500 text-xs font-mono truncate">{lead.email}</p>
            </div>
          </div>
          <StatusBadge status={lead.status} />
        </div>

        {/* GEO Score + actions */}
        <div className="flex items-center gap-8 bg-white/60 p-6 rounded-2xl border border-zinc-200/50 shadow-xs">
          <GeoScoreGauge score={lead.geoScore ?? 0} size="lg" />
          <div className="flex-1 space-y-3">
            {lead.status === 'new' && (
              <button
                id={`run-diag-${lead.id}`}
                onClick={handleRunDiagnostic}
                disabled={running}
                className="w-full flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm shadow-md cursor-pointer"
              >
                {running ? '⏳ Processando...' : '▶ Iniciar Diagnóstico'}
              </button>
            )}
            {lead.status === 'completed' && (
              <>
                <button
                  id={`send-report-${lead.id}`}
                  onClick={handleSendReport}
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm shadow-md cursor-pointer"
                >
                  {sending ? '📤 Enviando...' : '📧 Enviar Relatório HTML'}
                </button>
                <button
                  id={`convert-${lead.id}`}
                  onClick={handleConvert}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm shadow-md cursor-pointer"
                >
                  ⭐ Converter em Cliente
                </button>
              </>
            )}
            {message && (
              <p className="text-xs text-zinc-600 font-medium bg-zinc-100 border border-zinc-200/80 rounded-xl px-3.5 py-2.5">{message}</p>
            )}
          </div>
        </div>

        {/* Lead info */}
        <div className="tactile-sunken rounded-2xl p-5 grid grid-cols-2 gap-4 text-xs font-medium">
          <div><span className="text-zinc-400 block uppercase font-bold text-[9px] mb-0.5">URL</span><span className="text-zinc-900 text-sm break-all font-mono">{lead.url}</span></div>
          <div><span className="text-zinc-400 block uppercase font-bold text-[9px] mb-0.5">E-mail</span><span className="text-zinc-900 text-sm break-all font-mono">{lead.email}</span></div>
          <div><span className="text-zinc-400 block uppercase font-bold text-[9px] mb-0.5">Empresa</span><span className="text-zinc-900 text-sm">{lead.company || '—'}</span></div>
          <div><span className="text-zinc-400 block uppercase font-bold text-[9px] mb-0.5">Data</span><span className="text-zinc-900 text-sm">{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span></div>
        </div>

        <div className="p-6 space-y-6">
          {/* Diagnostic accordion */}
          {diagLoading && (
            <div className="text-center py-8 text-zinc-400 text-sm font-mono">Carregando diagnóstico...</div>
          )}
          {d && (
            <div className="space-y-4">
              <h3 className="text-zinc-900 font-display font-bold text-base mt-2">Relatório por Agente</h3>

              <AgentReport
                title="Agente 2 — Technical Gatekeeper"
                icon="🛡️"
                status={d.gatekeeperStatus.robotsTxtAllowAiBots && d.gatekeeperStatus.ssrActive ? 'ok' : !d.gatekeeperStatus.robotsTxtAllowAiBots ? 'critical' : 'warning'}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-zinc-700 font-medium">
                    <span className="text-base">{d.gatekeeperStatus.robotsTxtAllowAiBots ? '✅' : '❌'}</span>
                    <span>Bots de IA no robots.txt</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-700 font-medium">
                    <span className="text-base">{d.gatekeeperStatus.ssrActive ? '✅' : '⚠️'}</span>
                    <span>SSR/conteúdo acessível</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-700 font-medium">
                    <span className="text-base">{!d.gatekeeperStatus.hasPriceGatekeeperIssue ? '✅' : '⚠️'}</span>
                    <span>Preços visíveis</span>
                  </div>
                  <div className="text-zinc-700 font-medium">
                    <span className="text-zinc-400">Latência:</span>{' '}
                    <span className={`font-mono font-bold ${d.gatekeeperStatus.serverLatencyMs < 800 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {d.gatekeeperStatus.serverLatencyMs}ms
                    </span>
                  </div>
                </div>
                {d.gatekeeperStatus.blockedCrawlers.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold">
                    ⚠️ Bots bloqueados: {d.gatekeeperStatus.blockedCrawlers.join(', ')}
                  </div>
                )}
              </AgentReport>

              <AgentReport
                title="Agente 3 — Metadata Entity"
                icon="🗂️"
                status={d.metadataAnalysis.organizationSchemaPresent && d.metadataAnalysis.llmsTxtPublished ? 'ok' : d.metadataAnalysis.organizationSchemaPresent ? 'warning' : 'critical'}
              >
                <div className="space-y-2 text-zinc-700 font-medium">
                  {[
                    { label: 'Schema Organization', ok: d.metadataAnalysis.organizationSchemaPresent },
                    { label: 'Schema Person (autor)', ok: d.metadataAnalysis.personSchemaPresent },
                    { label: '/llms.txt publicado', ok: d.metadataAnalysis.llmsTxtPublished },
                    { label: `sameAs links (${d.metadataAnalysis.organizationSameAsCount})`, ok: d.metadataAnalysis.organizationSameAsCount > 0 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="text-base">{item.ok ? '✅' : '❌'}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                  {d.metadataAnalysis.missingSchemas.length > 0 && (
                    <p className="text-amber-600 text-xs font-semibold mt-2">Schemas ausentes: {d.metadataAnalysis.missingSchemas.join(', ')}</p>
                  )}
                </div>
              </AgentReport>

              <AgentReport
                title="Agente 4 — Content Absorption"
                icon="📝"
                status={
                  Object.values(d.contentReview.factorsDetected).filter(Boolean).length >= 3 ? 'ok' :
                  Object.values(d.contentReview.factorsDetected).filter(Boolean).length >= 2 ? 'warning' : 'critical'
                }
              >
                <div className="space-y-2 text-zinc-700 font-medium">
                  {[
                    { label: 'Resposta AEO nas primeiras 60 palavras', ok: d.contentReview.factorsDetected.hasTldrAnswerFirstParagraph },
                    { label: 'Estatísticas a cada 150 palavras', ok: d.contentReview.factorsDetected.hasStatisticsPer150Words },
                    { label: 'Aspas de especialistas', ok: d.contentReview.factorsDetected.hasExpertQuotes },
                    { label: 'Tabelas comparativas HTML', ok: d.contentReview.factorsDetected.hasHtmlComparisonTables },
                    { label: 'Preço não mencionado', ok: !d.contentReview.priceNotMentioned },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="text-base">{item.ok ? '✅' : '❌'}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                  <p className="text-zinc-400 text-xs mt-3 font-mono">Tamanho médio de chunk: {d.contentReview.meanChunkSizeTokens} tokens</p>
                </div>
              </AgentReport>

              <AgentReport
                title="Agente 5 — Intent Prompt (Citation Share)"
                icon="🔍"
                status={d.visibilityBenchmarking.citationSharePercentage >= 0.3 ? 'ok' : d.visibilityBenchmarking.citationSharePercentage >= 0.1 ? 'warning' : 'critical'}
              >
                <div className="space-y-3 text-zinc-700 font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Citation Share</span>
                    <span className={`font-mono font-bold text-lg ${d.visibilityBenchmarking.citationSharePercentage >= 0.3 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {(d.visibilityBenchmarking.citationSharePercentage * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Sentimento</span>
                    <span className={`font-bold ${d.visibilityBenchmarking.brandSentimentScore === 'Positivo' ? 'text-emerald-600' : d.visibilityBenchmarking.brandSentimentScore === 'Neutro' ? 'text-amber-600' : 'text-red-600'}`}>
                      {d.visibilityBenchmarking.brandSentimentScore}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Prompts testados</span>
                    <span className="text-zinc-900 font-mono">{d.visibilityBenchmarking.totalPromptsTest}</span>
                  </div>
                  {Object.entries(d.visibilityBenchmarking.citationsByModel).map(([model, count]) => (
                    <div key={model} className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">{model}</span>
                      <span className="text-zinc-700 font-bold">{count} citações</span>
                    </div>
                  ))}
                </div>
              </AgentReport>

              {/* Priority action plan */}
              <div className="tactile-raised p-5 bg-white/80">
                <h4 className="font-display font-bold text-zinc-900 text-sm mb-3">📋 Plano de Ação Priorizado</h4>
                <div className="space-y-2">
                  {d.actionItemsPriorityList.map(item => (
                    <div key={item.step} className="flex items-start gap-3 p-3 bg-zinc-50 border border-zinc-200/50 rounded-xl">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        item.impact.includes('Crítico') ? 'bg-red-50 text-red-600 border border-red-200' :
                        item.impact.includes('Alto') ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        'bg-blue-50 text-blue-600 border border-blue-200'
                      }`}>{item.impact}</span>
                      <span className="text-xs text-zinc-700 font-medium leading-relaxed">{item.task}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Leads List Page ──────────────────────────────────────────────────────────
export default function LeadsList({ onNavigate, selectedLeadId }: LeadsListProps) {
  const { leads, loading, error, fetchLeads, runDiagnostic } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [runningId, setRunningId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (selectedLeadId) {
      const lead = leads.find(l => l.id === selectedLeadId);
      if (lead) setSelectedLead(lead);
    }
  }, [selectedLeadId, leads]);

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);

  const handleQuickRun = async (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setRunningId(lead.id);
    try {
      await runDiagnostic(lead.id);
      await fetchLeads();
    } catch {}
    setRunningId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900">Leads</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Diagnóstico gratuito Raio-X de GEO</p>
        </div>
        <span className="text-xs text-zinc-400 font-mono font-bold bg-white border border-zinc-200/60 px-3 py-1 rounded-full shadow-xs">{leads.length} leads totais</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'new', 'processing', 'completed', 'converted'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === s ? 'bg-zinc-950 text-white shadow-md' : 'bg-white text-zinc-500 hover:text-zinc-900 border border-zinc-200/60 hover:bg-zinc-50'
            }`}
          >
            {s === 'all' ? 'Todos' : s === 'new' ? 'Novos' : s === 'processing' ? 'Processando' : s === 'completed' ? 'Concluídos' : 'Clientes'}
            {' '}({s === 'all' ? leads.length : leads.filter(l => l.status === s).length})
          </button>
        ))}
      </div>

      {/* Table with Neumorphic Container */}
      <div className="tactile-raised overflow-hidden bg-white/70 backdrop-blur-md">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-sm font-mono">Carregando leads...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 font-medium text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm font-semibold mb-1">Nenhum lead encontrado</p>
            <p className="text-zinc-400 text-xs">Os leads são capturados automaticamente pelo widget do site</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50/70 border-b border-zinc-200/50">
              <tr>
                {['URL / Empresa', 'E-mail', 'Captado em', 'GEO Score', 'Status', 'Ações'].map(col => (
                  <th key={col} className="text-left px-5 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/40">
              {filtered.map(lead => (
                <tr
                  key={lead.id}
                  className="hover:bg-zinc-100/40 cursor-pointer transition-colors"
                  onClick={() => setSelectedLead(lead)}
                >
                  <td className="px-5 py-4">
                    <p className="text-zinc-900 font-semibold truncate max-w-[200px]">{lead.url}</p>
                    {lead.company && <p className="text-zinc-400 text-xs mt-0.5 truncate">{lead.company}</p>}
                  </td>
                  <td className="px-5 py-4 text-zinc-500 font-mono truncate max-w-[160px]">{lead.email}</td>
                  <td className="px-5 py-4 text-zinc-500 text-xs font-mono">
                    {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-4">
                    {lead.geoScore !== undefined ? (
                      <span className={`font-mono font-bold ${lead.geoScore >= 70 ? 'text-emerald-600' : lead.geoScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {lead.geoScore}%
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {lead.status === 'new' && (
                        <button
                          id={`quick-run-${lead.id}`}
                          onClick={e => handleQuickRun(e, lead)}
                          disabled={runningId === lead.id}
                          className="text-xs bg-zinc-950 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {runningId === lead.id ? '⏳' : '▶ Diagnóstico'}
                        </button>
                      )}
                      {lead.status === 'completed' && (
                        <button
                          id={`view-diag-${lead.id}`}
                          onClick={e => { e.stopPropagation(); setSelectedLead(lead); }}
                          className="text-xs bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          📄 Ver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

