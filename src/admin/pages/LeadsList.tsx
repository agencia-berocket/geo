import { useEffect, useState, useCallback } from 'react';
import { useLeads, useDiagnostic, type Lead, type DiagnosticReport } from '../hooks/useFirestore';
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
  const statusColor = status === 'ok' ? 'text-emerald-400 border-emerald-800' : status === 'warning' ? 'text-amber-400 border-amber-800' : 'text-red-400 border-red-800';
  return (
    <div className={`border rounded-lg overflow-hidden ${status === 'critical' ? 'border-red-900/60' : status === 'warning' ? 'border-amber-900/60' : 'border-zinc-800'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <span className="text-xl">{icon}</span>
        <span className="flex-1 font-medium text-zinc-200 text-sm">{title}</span>
        <span className={`text-xs font-mono ${statusColor}`}>{status.toUpperCase()}</span>
        <span className="text-zinc-500 text-xs ml-2">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-zinc-400 border-t border-zinc-800/50 pt-3">
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-end p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl h-full overflow-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center gap-3 z-10">
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-sm">← Voltar</button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{lead.url}</p>
            <p className="text-zinc-500 text-xs truncate">{lead.email}</p>
          </div>
          <StatusBadge status={lead.status} />
        </div>

        <div className="p-6 space-y-6">
          {/* GEO Score + actions */}
          <div className="flex items-center gap-6">
            <GeoScoreGauge score={lead.geoScore ?? 0} size="lg" />
            <div className="flex-1 space-y-2">
              {lead.status === 'new' && (
                <button
                  id={`run-diag-${lead.id}`}
                  onClick={handleRunDiagnostic}
                  disabled={running}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-medium py-2.5 px-4 rounded-lg transition-all text-sm"
                >
                  {running ? '⏳ Processando...' : '▶ Iniciar Diagnóstico'}
                </button>
              )}
              {(lead.status === 'completed') && (
                <>
                  <button
                    id={`send-report-${lead.id}`}
                    onClick={handleSendReport}
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg transition-all text-sm"
                  >
                    {sending ? '📤 Enviando...' : '📧 Enviar Relatório HTML'}
                  </button>
                  <button
                    id={`convert-${lead.id}`}
                    onClick={handleConvert}
                    className="w-full flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all text-sm"
                  >
                    ⭐ Converter em Cliente
                  </button>
                </>
              )}
              {message && (
                <p className="text-xs text-zinc-400 bg-zinc-800 rounded-lg px-3 py-2">{message}</p>
              )}
            </div>
          </div>

          {/* Lead info */}
          <div className="bg-zinc-800/40 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-zinc-500 block text-xs">URL</span><span className="text-zinc-200">{lead.url}</span></div>
            <div><span className="text-zinc-500 block text-xs">E-mail</span><span className="text-zinc-200">{lead.email}</span></div>
            <div><span className="text-zinc-500 block text-xs">Empresa</span><span className="text-zinc-200">{lead.company || '—'}</span></div>
            <div><span className="text-zinc-500 block text-xs">Data</span><span className="text-zinc-200">{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span></div>
          </div>

          {/* Diagnostic accordion */}
          {diagLoading && (
            <div className="text-center py-8 text-zinc-500 text-sm">Carregando diagnóstico...</div>
          )}
          {d && (
            <div className="space-y-3">
              <h3 className="text-zinc-300 font-semibold text-sm">Relatório por Agente</h3>

              <AgentReport
                title="Agente 2 — Technical Gatekeeper"
                icon="🛡️"
                status={d.gatekeeperStatus.robotsTxtAllowAiBots && d.gatekeeperStatus.ssrActive ? 'ok' : !d.gatekeeperStatus.robotsTxtAllowAiBots ? 'critical' : 'warning'}
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className={d.gatekeeperStatus.robotsTxtAllowAiBots ? 'text-emerald-400' : 'text-red-400'}>
                      {d.gatekeeperStatus.robotsTxtAllowAiBots ? '✅' : '❌'}
                    </span>
                    <span>Bots de IA no robots.txt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={d.gatekeeperStatus.ssrActive ? 'text-emerald-400' : 'text-amber-400'}>
                      {d.gatekeeperStatus.ssrActive ? '✅' : '⚠️'}
                    </span>
                    <span>SSR/conteúdo acessível</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={!d.gatekeeperStatus.hasPriceGatekeeperIssue ? 'text-emerald-400' : 'text-amber-400'}>
                      {!d.gatekeeperStatus.hasPriceGatekeeperIssue ? '✅' : '⚠️'}
                    </span>
                    <span>Preços visíveis</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Latência:</span>{' '}
                    <span className={d.gatekeeperStatus.serverLatencyMs < 800 ? 'text-emerald-400' : 'text-amber-400'}>
                      {d.gatekeeperStatus.serverLatencyMs}ms
                    </span>
                  </div>
                </div>
                {d.gatekeeperStatus.blockedCrawlers.length > 0 && (
                  <div className="mt-2 p-2 bg-red-950/30 rounded text-red-400 text-xs">
                    Bots bloqueados: {d.gatekeeperStatus.blockedCrawlers.join(', ')}
                  </div>
                )}
              </AgentReport>

              <AgentReport
                title="Agente 3 — Metadata Entity"
                icon="🗂️"
                status={d.metadataAnalysis.organizationSchemaPresent && d.metadataAnalysis.llmsTxtPublished ? 'ok' : d.metadataAnalysis.organizationSchemaPresent ? 'warning' : 'critical'}
              >
                <div className="space-y-1.5">
                  {[
                    { label: 'Schema Organization', ok: d.metadataAnalysis.organizationSchemaPresent },
                    { label: 'Schema Person (autor)', ok: d.metadataAnalysis.personSchemaPresent },
                    { label: '/llms.txt publicado', ok: d.metadataAnalysis.llmsTxtPublished },
                    { label: `sameAs links (${d.metadataAnalysis.organizationSameAsCount})`, ok: d.metadataAnalysis.organizationSameAsCount > 0 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className={item.ok ? 'text-emerald-400' : 'text-red-400'}>{item.ok ? '✅' : '❌'}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                  {d.metadataAnalysis.missingSchemas.length > 0 && (
                    <p className="text-amber-400 text-xs mt-2">Schemas ausentes: {d.metadataAnalysis.missingSchemas.join(', ')}</p>
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
                <div className="space-y-1.5">
                  {[
                    { label: 'Resposta AEO nas primeiras 60 palavras', ok: d.contentReview.factorsDetected.hasTldrAnswerFirstParagraph },
                    { label: 'Estatísticas a cada 150 palavras', ok: d.contentReview.factorsDetected.hasStatisticsPer150Words },
                    { label: 'Aspas de especialistas', ok: d.contentReview.factorsDetected.hasExpertQuotes },
                    { label: 'Tabelas comparativas HTML', ok: d.contentReview.factorsDetected.hasHtmlComparisonTables },
                    { label: 'Preço não mencionado', ok: !d.contentReview.priceNotMentioned },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className={item.ok ? 'text-emerald-400' : 'text-red-400'}>{item.ok ? '✅' : '❌'}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                  <p className="text-zinc-500 text-xs mt-2">Tamanho médio de chunk: {d.contentReview.meanChunkSizeTokens} tokens</p>
                </div>
              </AgentReport>

              <AgentReport
                title="Agente 5 — Intent Prompt (Citation Share)"
                icon="🔍"
                status={d.visibilityBenchmarking.citationSharePercentage >= 0.3 ? 'ok' : d.visibilityBenchmarking.citationSharePercentage >= 0.1 ? 'warning' : 'critical'}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Citation Share</span>
                    <span className={`font-bold text-lg ${d.visibilityBenchmarking.citationSharePercentage >= 0.3 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(d.visibilityBenchmarking.citationSharePercentage * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sentimento</span>
                    <span className={`font-medium ${d.visibilityBenchmarking.brandSentimentScore === 'Positivo' ? 'text-emerald-400' : d.visibilityBenchmarking.brandSentimentScore === 'Neutro' ? 'text-amber-400' : 'text-red-400'}`}>
                      {d.visibilityBenchmarking.brandSentimentScore}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Prompts testados</span>
                    <span className="text-zinc-300">{d.visibilityBenchmarking.totalPromptsTest}</span>
                  </div>
                  {Object.entries(d.visibilityBenchmarking.citationsByModel).map(([model, count]) => (
                    <div key={model} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">{model}</span>
                      <span className="text-zinc-300">{count} citações</span>
                    </div>
                  ))}
                </div>
              </AgentReport>

              {/* Priority action plan */}
              <div className="bg-zinc-800/40 rounded-xl p-4 mt-4">
                <h4 className="font-semibold text-zinc-200 text-sm mb-3">📋 Plano de Ação Priorizado</h4>
                <div className="space-y-2">
                  {d.actionItemsPriorityList.map(item => (
                    <div key={item.step} className="flex items-start gap-3 p-2 bg-zinc-800/50 rounded-lg">
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
                        item.impact.includes('Crítico') ? 'bg-red-900/50 text-red-300' :
                        item.impact.includes('Alto') ? 'bg-amber-900/50 text-amber-300' :
                        'bg-blue-900/50 text-blue-300'
                      }`}>{item.impact}</span>
                      <span className="text-xs text-zinc-300">{item.task}</span>
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
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-zinc-400 text-sm mt-1">Diagnóstico gratuito Raio-X de GEO</p>
        </div>
        <span className="text-sm text-zinc-500">{leads.length} leads totais</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'new', 'processing', 'completed', 'converted'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            {s === 'all' ? 'Todos' : s === 'new' ? 'Novos' : s === 'processing' ? 'Processando' : s === 'completed' ? 'Concluídos' : 'Clientes'}
            {' '}({s === 'all' ? leads.length : leads.filter(l => l.status === s).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Carregando leads...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-400 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-400 text-sm mb-2">Nenhum lead encontrado</p>
            <p className="text-zinc-600 text-xs">Os leads são capturados automaticamente pelo widget do site</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-800/50 border-b border-zinc-800">
              <tr>
                {['URL / Empresa', 'E-mail', 'Captado em', 'GEO Score', 'Status', 'Ações'].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.map(lead => (
                <tr
                  key={lead.id}
                  className="hover:bg-zinc-800/20 cursor-pointer transition-colors"
                  onClick={() => setSelectedLead(lead)}
                >
                  <td className="px-4 py-3">
                    <p className="text-zinc-200 font-medium truncate max-w-[200px]">{lead.url}</p>
                    {lead.company && <p className="text-zinc-500 text-xs truncate">{lead.company}</p>}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 truncate max-w-[160px]">{lead.email}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    {lead.geoScore !== undefined ? (
                      <span className={`font-bold ${lead.geoScore >= 70 ? 'text-emerald-400' : lead.geoScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                        {lead.geoScore}%
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {lead.status === 'new' && (
                        <button
                          id={`quick-run-${lead.id}`}
                          onClick={e => handleQuickRun(e, lead)}
                          disabled={runningId === lead.id}
                          className="text-xs bg-blue-700/40 hover:bg-blue-700 text-blue-300 px-2 py-1 rounded transition-all disabled:opacity-50"
                        >
                          {runningId === lead.id ? '⏳' : '▶ Diagnóstico'}
                        </button>
                      )}
                      {lead.status === 'completed' && (
                        <button
                          id={`view-diag-${lead.id}`}
                          onClick={e => { e.stopPropagation(); setSelectedLead(lead); }}
                          className="text-xs bg-emerald-700/40 hover:bg-emerald-700 text-emerald-300 px-2 py-1 rounded transition-all"
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
