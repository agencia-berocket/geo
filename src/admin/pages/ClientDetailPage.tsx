import React, { useEffect, useState } from 'react';
import { useClients, useLeads, type Client, type ClientHistory } from '../hooks/useFirestore';
import Modal from '../components/Modal';
import GeoScoreGauge from '../components/GeoScoreGauge';
import { LeadChat } from '../components/LeadChat';
import { AuditAndScreenshotsPanel } from '../components/AuditAndScreenshotsPanel';
import { auth } from '../../lib/firebase';
import {
  IconEdit, IconTrash, IconPlay, IconChat, IconBot, IconShield, IconFolder,
  IconNote, IconHourglass, IconRocket, IconCheck, IconClipboard, IconTarget,
  IconChevron, IconSparkles,
} from '../components/icons';

interface ClientDetailPageProps {
  clientId: string;
  onNavigate: (page: string, id?: string) => void;
}

const stageLabels: Record<number, string> = {
  1: 'GEO Start — Diagnóstico Técnico',
  2: 'Planejamento de Intenções',
  3: 'GEO Growth — Infraestrutura',
  4: 'GEO Authority — Conteúdo',
  5: 'Monitoramento Contínuo',
};

const stageAgentMap: Record<number, AgentName> = {
  1: 'gatekeeper',
  2: 'intent',
  3: 'metadata',
  4: 'content',
  5: 'orchestrator',
};

const planConfig = {
  premium: { label: 'Implantação Premium', color: 'text-zinc-700 bg-zinc-100 border-zinc-200/80 shadow-xs' },
  enterprise: { label: 'Enterprise', color: 'text-zinc-950 bg-zinc-200/80 border-zinc-300 shadow-xs' },
};

type AgentName = 'orchestrator' | 'gatekeeper' | 'metadata' | 'content' | 'seo_optimizer' | 'semantic_explorer' | 'offpage' | 'intent' | 'checklist_architect';
type MainView = 'lead_history' | 'deliverables' | 'stages' | 'history' | 'audit' | 'chat';

const agents: Array<{ id: AgentName; icon: React.ReactNode; name: string; description: string; stage: number }> = [
  { id: 'orchestrator', icon: <IconBot className="w-4 h-4" />, name: 'Orquestrador Master', description: 'Gerencia o pipeline completo e consolida o relatório final', stage: 5 },
  { id: 'gatekeeper', icon: <IconShield className="w-4 h-4" />, name: 'Technical Gatekeeper', description: 'Gera robots.txt otimizado e audita SSR/robots.txt', stage: 1 },
  { id: 'metadata', icon: <IconFolder className="w-4 h-4" />, name: 'Metadata Entity', description: 'Gera códigos JSON-LD Schema e arquivo /llms.txt', stage: 3 },
  { id: 'content', icon: <IconNote className="w-4 h-4" />, name: 'Content Absorption', description: 'Gera bloco AEO (<60 palavras) e tabelas HTML', stage: 4 },
  { id: 'seo_optimizer', icon: <IconEdit className="w-4 h-4" />, name: 'SEO Optimizer', description: 'Otimiza Title/Meta tags, Alt tags e links internos', stage: 1 },
  { id: 'semantic_explorer', icon: <IconFolder className="w-4 h-4" />, name: 'Semantic Explorer', description: 'Mapeia Content Gaps e Topic Clusters semânticos', stage: 2 },
  { id: 'offpage', icon: <IconShield className="w-4 h-4" />, name: 'Off-Page Entity Monitor', description: 'Audita menções externas, Wikidata e pautas de RP', stage: 4 },
  { id: 'intent', icon: <IconChat className="w-4 h-4" />, name: 'Intent Prompt', description: 'Mapeia Citation Share e 20 prompts em 4 LLMs', stage: 2 },
  { id: 'checklist_architect', icon: <IconCheck className="w-4 h-4" />, name: 'Checklist Architect', description: 'QA técnico, código compilado e tutoriais CMS para devs', stage: 5 },
];

// ─── HELPER COMPONENTS: COPY & DOWNLOAD ──────────────────────────────────────
function CopyButton({ text, label = 'Copiar Código' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
    >
      {copied ? <><IconCheck className="w-3.5 h-3.5 text-emerald-400" /> Copiado!</> : label}
    </button>
  );
}

function DownloadButton({ content, filename, label = 'Baixar Arquivo', mimeType = 'text/plain' }: {
  content: string; filename: string; label?: string; mimeType?: string;
}) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      type="button"
      className="text-xs bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 font-semibold px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
    >
      📥 {label}
    </button>
  );
}

// ─── EDITABLE DELIVERABLE CARD ──────────────────────────────────────────────
function DeliverableCard({ title, description, content: initialContent, filename, onSave }: {
  title: string; description: string; content: string; filename: string; onSave?: (updated: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(initialContent);

  useEffect(() => {
    setEditableContent(initialContent);
  }, [initialContent]);

  const hasUnfilledPlaceholder = /\[PREENCHER|\[INSTRUÇÃO|\[Dado real|\[Critério relevante|\[Nome real da fonte/i.test(editableContent);

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
      {hasUnfilledPlaceholder && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-xl px-3 py-2">
          ⚠️ Este template contém instruções entre [colchetes] — substitua por informação real antes de publicar.
        </div>
      )}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h4 className="font-display font-bold text-zinc-900 text-sm flex items-center gap-1.5">⚡ {title}</h4>
          <p className="text-zinc-500 text-xs mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(e => !e)}
            className="text-xs bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
          >
            {isEditing ? '✓ Concluir Edição' : '✏️ Editar'}
          </button>
          <CopyButton text={editableContent} label="Copiar" />
          <DownloadButton content={editableContent} filename={filename} label="Baixar" />
        </div>
      </div>
      {isEditing ? (
        <textarea
          value={editableContent}
          onChange={e => {
            setEditableContent(e.target.value);
            if (onSave) onSave(e.target.value);
          }}
          rows={10}
          className="w-full bg-zinc-950 text-emerald-400 font-mono text-[11px] p-4 rounded-xl border border-zinc-800 focus:outline-none focus:border-emerald-500"
        />
      ) : (
        <div className="bg-zinc-950 text-zinc-200 font-mono text-[11px] p-4 rounded-xl overflow-x-auto max-h-72 whitespace-pre-wrap leading-relaxed border border-zinc-800">
          {editableContent}
        </div>
      )}
    </div>
  );
}

// ─── HELPER: LABEL/VALUE FIELD ───────────────────────────────────────────────
function InfoField({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  return (
    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
      <span className="text-zinc-400 block text-[10px] font-mono">{label}</span>
      {isLink && value !== '—' ? (
        <a href={value} target="_blank" rel="noreferrer" className="font-bold text-blue-600 text-xs hover:underline break-all">{value}</a>
      ) : (
        <span className="font-bold text-zinc-900 text-xs break-all">{value}</span>
      )}
    </div>
  );
}

// ─── PANEL: HISTÓRICO DO LEAD (dados herdados na conversão) ──────────────────
function LeadHistoryPanel({ client }: { client: Client }) {
  const hasProspectingData = !!(
    client.contactName || client.phone || client.linkedinUrl ||
    (client.searchTerms && client.searchTerms.length > 0) ||
    (client.outreachCopies && Object.keys(client.outreachCopies).length > 0)
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-display font-bold text-zinc-950 text-base flex items-center gap-2">
          <IconClipboard className="w-5 h-5 text-blue-600" />
          Contato Original da Prospecção
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <InfoField label="DECISOR" value={client.contactName || '—'} />
          <InfoField label="CARGO" value={client.contactRole || '—'} />
          <InfoField label="TELEFONE" value={client.phone || '—'} />
          <InfoField label="LINKEDIN" value={client.linkedinUrl || '—'} isLink />
          <InfoField label="NICHO" value={client.niche || '—'} />
          <InfoField label="ORIGEM DO LEAD" value={client.sourceLabel || client.source || '—'} />
          <InfoField label="CONVERTIDO EM" value={client.convertedAt ? new Date(client.convertedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—'} />
          <InfoField label="SCORE GEO INICIAL (NA CONVERSÃO)" value={`${client.initialGeoScore ?? 0}%`} />
        </div>
        {client.companyOverview && (
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 text-xs text-zinc-700">
            <span className="font-mono font-bold text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Perfil da Empresa (Análise IA)</span>
            {client.companyOverview}
          </div>
        )}
      </div>

      {client.searchTerms && client.searchTerms.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-3">
          <h3 className="font-display font-bold text-zinc-950 text-base flex items-center gap-2">
            <IconSparkles className="w-5 h-5 text-amber-500" />
            Termos de Pesquisa Estratégicos Aprovados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {client.searchTerms.map((term, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-2 text-xs">
                <span className="w-5 h-5 bg-zinc-200 text-zinc-700 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold shrink-0">{idx + 1}</span>
                {term}
              </div>
            ))}
          </div>
        </div>
      )}

      {client.outreachCopies && Object.keys(client.outreachCopies).length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-3">
          <h3 className="font-display font-bold text-zinc-950 text-base flex items-center gap-2">
            <IconChat className="w-5 h-5 text-indigo-600" />
            Copies de Prospecção Utilizadas
          </h3>
          {Object.entries(client.outreachCopies).map(([key, text]) => (
            <details key={key} className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
              <summary className="text-xs font-bold text-zinc-800 cursor-pointer">{key}</summary>
              <p className="text-xs text-zinc-600 mt-2 whitespace-pre-wrap font-mono leading-relaxed">{text}</p>
            </details>
          ))}
          {client.sentHistory && client.sentHistory.length > 0 && (
            <div className="pt-3 border-t border-zinc-100 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Histórico de Envios</span>
              {client.sentHistory.map((h, i) => (
                <div key={i} className="text-xs text-zinc-600 flex items-center gap-2">
                  <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold">{h.copyKey}</span> via {h.channel} em {new Date(h.sentAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {client.initialDiagnosticId && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h4 className="font-display font-bold text-emerald-900 text-sm">Diagnóstico Inicial Herdado do Lead</h4>
          <p className="text-emerald-700 text-xs mt-1">
            O diagnóstico feito ainda como lead (ID: <span className="font-mono">{client.initialDiagnosticId}</span>) já é considerado automaticamente na aba "Evolução (Antes/Depois)".
          </p>
        </div>
      )}

      {!hasProspectingData && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-zinc-400 text-xs font-mono">
          Este cliente não possui histórico de prospecção registrado (pode ter sido criado antes desta funcionalidade).
        </div>
      )}
    </div>
  );
}

// ─── PANEL: HISTORY & EVOLUTION (Antes vs. Depois) ───────────────────────────
function ClientHistoryPanel({ client, refreshKey }: { client: Client; refreshKey?: number }) {
  const { fetchClientHistory } = useClients();
  const { downloadHtmlReport } = useLeads();
  const [historyData, setHistoryData] = useState<ClientHistory | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetchClientHistory(client.id);
      if (res.success) setHistoryData(res.clientHistory);
    } catch (e) {
      console.error('Erro ao buscar histórico do cliente:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [client.id, refreshKey]);

  if (loading) {
    return <div className="p-8 text-center text-zinc-400 font-mono text-xs">Carregando histórico e evolução do cliente...</div>;
  }

  if (!historyData || historyData.diagnosticsCount === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center space-y-3">
        <IconRocket className="w-8 h-8 text-zinc-300 mx-auto" />
        <p className="text-zinc-800 font-bold text-sm">Nenhum histórico acumulado ainda</p>
        <p className="text-zinc-500 text-xs max-w-md mx-auto">
          Execute os diagnósticos dos Agentes no Workspace para registrar cada marco e acompanhar a evolução temporal do GEO Score.
        </p>
        <button
          onClick={loadHistory}
          className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors"
        >
          🔄 Recarregar Histórico
        </button>
      </div>
    );
  }

  const { initialScore, latestScore, scoreDiff, evolutionPercentage, diagnostics } = historyData;
  const firstDiag = diagnostics[0];
  const lastDiag = diagnostics[diagnostics.length - 1];

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">GEO Score Inicial</span>
          <span className="text-3xl font-mono font-bold text-zinc-700 block mt-1">{initialScore}%</span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">{firstDiag.generatedAt ? new Date(firstDiag.generatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—'}</span>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">GEO Score Atual</span>
          <span className={`text-3xl font-mono font-bold block mt-1 ${latestScore >= 70 ? 'text-emerald-600' : latestScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
            {latestScore}%
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">{lastDiag.generatedAt ? new Date(lastDiag.generatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—'}</span>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Variação de Pontos</span>
          <span className={`text-3xl font-mono font-bold block mt-1 ${scoreDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff} pts
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">diferença total</span>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Ganho de Evolução</span>
          <span className="text-3xl font-mono font-bold text-emerald-600 block mt-1">+{evolutionPercentage}%</span>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">melhoria acumulada</span>
        </div>
      </div>

      {/* Comparative Before vs After Matrix */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h4 className="font-display font-bold text-zinc-900 text-sm flex items-center justify-between flex-wrap gap-2">
          <span>🔄 Comparativo: Antes vs. Depois da Implantação</span>
          <div className="flex items-center gap-3">
            <button
              onClick={loadHistory}
              disabled={loading}
              className="text-xs bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 font-semibold px-3 py-1 rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              🔄 Atualizar Dados
            </button>
            <span className="text-xs font-mono text-zinc-400">{diagnostics.length} auditoria(s) registrada(s)</span>
          </div>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200 font-mono text-[10px] text-zinc-400 uppercase">
              <tr>
                <th className="p-3">Indicador GEO</th>
                <th className="p-3">Antes (Diagnóstico Inicial)</th>
                <th className="p-3">Depois (Status Atual)</th>
                <th className="p-3">Status da Evolução</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150">
              <tr>
                <td className="p-3 font-semibold text-zinc-900">robots.txt para IAs</td>
                <td className="p-3 text-zinc-600">{firstDiag.gatekeeperStatus?.robotsTxtAllowAiBots ? '✓ Liberado' : '✗ Bloqueado'}</td>
                <td className="p-3 font-semibold text-zinc-900">{lastDiag.gatekeeperStatus?.robotsTxtAllowAiBots ? '✓ Liberado' : '✗ Bloqueado'}</td>
                <td className="p-3">{lastDiag.gatekeeperStatus?.robotsTxtAllowAiBots ? <span className="text-emerald-600 font-bold">✓ Otimizado</span> : <span className="text-amber-600 font-bold">Pendente</span>}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-zinc-900">Schema Organization</td>
                <td className="p-3 text-zinc-600">{firstDiag.metadataAnalysis?.organizationSchemaPresent ? '✓ Presente' : '✗ Ausente'}</td>
                <td className="p-3 font-semibold text-zinc-900">{lastDiag.metadataAnalysis?.organizationSchemaPresent ? '✓ Presente' : '✗ Ausente'}</td>
                <td className="p-3">{lastDiag.metadataAnalysis?.organizationSchemaPresent ? <span className="text-emerald-600 font-bold">✓ Otimizado</span> : <span className="text-red-600 font-bold">Crítico</span>}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-zinc-900">Arquivo /llms.txt</td>
                <td className="p-3 text-zinc-600">{firstDiag.metadataAnalysis?.llmsTxtPublished ? '✓ Publicado' : '✗ Ausente'}</td>
                <td className="p-3 font-semibold text-zinc-900">{lastDiag.metadataAnalysis?.llmsTxtPublished ? '✓ Publicado' : '✗ Ausente'}</td>
                <td className="p-3">{lastDiag.metadataAnalysis?.llmsTxtPublished ? <span className="text-emerald-600 font-bold">✓ Otimizado</span> : <span className="text-amber-600 font-bold">Pendente</span>}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-zinc-900">Resposta AEO (&lt;60 palavras)</td>
                <td className="p-3 text-zinc-600">{firstDiag.contentReview?.factorsDetected?.hasTldrAnswerFirstParagraph ? '✓ Sim' : '✗ Não'}</td>
                <td className="p-3 font-semibold text-zinc-900">{lastDiag.contentReview?.factorsDetected?.hasTldrAnswerFirstParagraph ? '✓ Sim' : '✗ Não'}</td>
                <td className="p-3">{lastDiag.contentReview?.factorsDetected?.hasTldrAnswerFirstParagraph ? <span className="text-emerald-600 font-bold">✓ Otimizado</span> : <span className="text-amber-600 font-bold">Pendente</span>}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-zinc-900">Citation Share nas IAs</td>
                <td className="p-3 text-zinc-600">{Math.round((firstDiag.visibilityBenchmarking?.citationSharePercentage || 0) * 100)}%</td>
                <td className="p-3 font-semibold text-zinc-900">{Math.round((lastDiag.visibilityBenchmarking?.citationSharePercentage || 0) * 100)}%</td>
                <td className="p-3"><span className="text-emerald-600 font-bold">✓ Medido</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h4 className="font-display font-bold text-zinc-900 text-sm">📅 Linha do Tempo de Relatórios Salvos no Firestore</h4>
        <div className="space-y-3">
          {diagnostics.map((diag, index) => (
            <div key={diag.id || index} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex-wrap gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Relatório #{index + 1}</span>
                <span className="text-xs font-semibold text-zinc-900">
                  🕒 {diag.generatedAt ? new Date(diag.generatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Sem data'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold text-sm ${diag.overallGeoScore >= 70 ? 'text-emerald-600' : diag.overallGeoScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                  Score: {diag.overallGeoScore}%
                </span>
                <button
                  onClick={() => downloadHtmlReport(diag.id || diag.leadId || diag.clientId || client.leadId || client.id, client.company || 'Cliente', 'audit')}
                  className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  🌐 Baixar Relatório HTML (Auditoria Completa)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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

// ─── CLIENT DETAIL PAGE (ponto de entrada, seguindo o padrão de LeadDetailPage) ──
export default function ClientDetailPage({ clientId, onNavigate }: ClientDetailPageProps) {
  const { editClient, deleteClient, runAgentForClient, fetchClientHistory } = useClients();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState(false);

  const [activeAgent, setActiveAgent] = useState<AgentName>('orchestrator');
  const [mainView, setMainView] = useState<MainView>('lead_history');
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [historyRefreshKey, setHistoryRefreshKey] = useState<number>(0);
  const [agentOutputs, setAgentOutputs] = useState<Record<AgentName, any>>({
    orchestrator: null,
    gatekeeper: null,
    metadata: null,
    content: null,
    seo_optimizer: null,
    semantic_explorer: null,
    offpage: null,
    intent: null,
    checklist_architect: null,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadClient = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken(false);
      const res = await fetch('/api/admin/clients', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Falha ao carregar lista de clientes');
      const data = await res.json();
      const found = (data.clients || []).find((c: Client) => c.id === clientId);
      if (found) {
        setClient(found);
        setCurrentStage(found.currentStage || 1);
      } else {
        setError('Cliente não encontrado.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClient();
  }, [clientId]);

  // Pre-populate deliverables on mount from Firestore
  useEffect(() => {
    if (!client) return;
    (async () => {
      try {
        const res = await fetchClientHistory(client.id);
        if (res.success && res.clientHistory.diagnosticsCount > 0) {
          const latest = res.clientHistory.diagnostics[res.clientHistory.diagnosticsCount - 1];
          if (latest) {
            setAgentOutputs(prev => ({
              ...prev,
              orchestrator: {
                overallGeoScore: latest.overallGeoScore,
                actionItemsPriorityList: latest.actionItemsPriorityList,
                deliverables: (latest as any).deliverables || {
                  robotsTxt: `# robots.txt recomendado\nUser-agent: GPTBot\nAllow: /`,
                  jsonLdSchema: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", "name": client.company || client.url }, null, 2),
                  llmsTxt: `# ${client.company}\n> llms.txt`,
                },
                actionPlanMarkdown: (latest as any).actionPlanMarkdown || `# Plano Estratégico GEO`,
              },
              gatekeeper: latest.gatekeeperStatus ? {
                ...latest.gatekeeperStatus,
                recommendedRobotsTxt: (latest as any).deliverables?.robotsTxt || `# robots.txt recomendado para ${client.url}\nUser-agent: GPTBot\nAllow: /`,
              } : prev.gatekeeper,
              metadata: latest.metadataAnalysis ? {
                ...latest.metadataAnalysis,
                generatedJsonLd: (latest as any).deliverables?.jsonLdSchema || JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", "name": client.company }, null, 2),
                llmsTxt: (latest as any).deliverables?.llmsTxt || `# ${client.company}\n> /llms.txt`,
              } : prev.metadata,
              content: latest.contentReview ? {
                ...latest.contentReview,
                aeoTemplates: (latest as any).deliverables?.aeoTemplates || {
                  tldrAnswerFirstBlock: `<div class="geo-aeo-tldr">Resumo AEO</div>`,
                  htmlComparisonTable: `<table><tr><th>Critério</th><th>${client.url}</th></tr></table>`,
                },
              } : prev.content,
              seo_optimizer: (latest as any).seoAnalysis || prev.seo_optimizer,
              semantic_explorer: (latest as any).semanticAnalysis || prev.semantic_explorer,
              offpage: (latest as any).offpageAnalysis || prev.offpage,
              intent: latest.visibilityBenchmarking || prev.intent,
              checklist_architect: (latest as any).checklist || prev.checklist_architect,
            }));
          }
        }
      } catch (e) {
        console.error('Erro ao preencher entregáveis salvos:', e);
      }
    })();
  }, [client?.id]);

  const handleSaveClient = async (updatedFields: Partial<Client>) => {
    if (!client) return;
    try {
      const res = await editClient(client.id, updatedFields);
      if (res.success) {
        setClient(prev => prev ? { ...prev, ...updatedFields } : null);
        setEditingClient(false);
        showToast('✅ Cliente atualizado com sucesso!');
      }
    } catch (err: any) {
      showToast(`Erro ao salvar cliente: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!client) return;
    if (!window.confirm('Tem certeza absoluta que deseja excluir este Cliente? Todo o histórico dele será removido.')) return;
    try {
      await deleteClient(client.id);
      onNavigate('clients');
    } catch (err: any) {
      showToast(`Erro ao excluir cliente: ${err.message}`);
    }
  };

  const handleRunAgent = async (targetAgent: AgentName = activeAgent) => {
    if (!client) return;
    setRunning(true);
    setLogs([`[${new Date().toLocaleTimeString()}] Executando ${targetAgent}...`]);
    try {
      const res = await runAgentForClient(client.id, targetAgent, { url: client.url });
      
      if (targetAgent === 'orchestrator' && res.result) {
        setAgentOutputs({
          orchestrator: res.result,
          gatekeeper: res.result.gatekeeper ? {
            ...res.result.gatekeeper,
            recommendedRobotsTxt: res.result.deliverables?.robotsTxt,
          } : null,
          metadata: res.result.metadata ? {
            ...res.result.metadata,
            generatedJsonLd: res.result.deliverables?.jsonLdSchema,
            llmsTxt: res.result.deliverables?.llmsTxt,
          } : null,
          content: res.result.content ? {
            ...res.result.content,
            aeoTemplates: res.result.deliverables?.aeoTemplates,
          } : null,
          seo_optimizer: res.result.seoOptimizer || null,
          semantic_explorer: res.result.semanticExplorer || null,
          offpage: res.result.offpage || null,
          intent: res.result.visibility || null,
          checklist_architect: res.result.checklistArchitect || null,
        });
      } else {
        setAgentOutputs(prev => ({
          ...prev,
          [targetAgent]: res.result,
        }));
      }

      setHistoryRefreshKey(k => k + 1);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Concluído com sucesso! Entregáveis gravados.`]);
      await loadClient();
    } catch (e: any) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Erro: ${e.message}`]);
    } finally {
      setRunning(false);
    }
  };

  const handleStageSelect = async (stageNumber: number) => {
    if (!client) return;
    setCurrentStage(stageNumber);
    const mappedAgent = stageAgentMap[stageNumber];
    if (mappedAgent) {
      setActiveAgent(mappedAgent);
    }
    try {
      await editClient(client.id, { currentStage: stageNumber as any });
    } catch (e) {
      console.error('Erro ao atualizar etapa no Firestore:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500 font-mono text-xs">Carregando detalhes do cliente...</span>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4">
        <IconTrash className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="font-display font-bold text-red-950 text-lg">Cliente Não Encontrado</h3>
        <p className="text-red-700 text-sm">{error || 'Não foi possível carregar os dados deste cliente.'}</p>
        <button
          onClick={() => onNavigate('clients')}
          className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors"
        >
          ← Voltar para Todos os Clientes
        </button>
      </div>
    );
  }

  const currentAgent = agents.find(a => a.id === activeAgent)!;
  const currentOutput = agentOutputs[activeAgent];
  const latestScore = client.geoScoreHistory?.[client.geoScoreHistory.length - 1]?.score || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white text-xs font-mono px-4 py-3 rounded-2xl shadow-2xl border border-zinc-800 animate-bounce">
          {toast}
        </div>
      )}

      {/* Top Header / Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('clients')}
            className="p-2 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Voltar para Lista"
          >
            <IconChevron direction="left" className="w-5 h-5" />
          </button>
          <GeoScoreGauge score={latestScore} size="sm" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-black text-xl text-zinc-950 tracking-tight">
                {client.company || client.url}
              </h1>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${planConfig[client.plan]?.color || ''}`}>
                {planConfig[client.plan]?.label || client.plan}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              {client.url} • Etapa #{currentStage}: {stageLabels[currentStage]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setEditingClient(true)} className="text-xs bg-zinc-100 hover:bg-zinc-200 font-bold px-3 py-2 rounded-xl border border-zinc-300 transition-all cursor-pointer flex items-center gap-1.5">
            <IconEdit className="w-3.5 h-3.5" /> Editar Cliente
          </button>
          <button onClick={handleDelete} className="text-xs bg-red-50 hover:bg-red-100 text-red-650 font-bold px-3 py-2 rounded-xl border border-red-200 transition-all cursor-pointer flex items-center gap-1.5">
            <IconTrash className="w-3.5 h-3.5" /> Excluir
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="border-b border-zinc-200 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-6 min-w-max">
          <button
            onClick={() => setMainView('lead_history')}
            className={`py-3 px-1 border-b-2 font-display text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              mainView === 'lead_history' ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <IconClipboard className="w-4 h-4" />
            <span>1. Histórico do Lead</span>
          </button>
          <button
            onClick={() => setMainView('deliverables')}
            className={`py-3 px-1 border-b-2 font-display text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              mainView === 'deliverables' ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <IconBot className="w-4 h-4" />
            <span>2. Agentes & Entregáveis</span>
          </button>
          <button
            onClick={() => setMainView('stages')}
            className={`py-3 px-1 border-b-2 font-display text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              mainView === 'stages' ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <IconTarget className="w-4 h-4" />
            <span>3. Etapas GEO</span>
          </button>
          <button
            onClick={() => setMainView('history')}
            className={`py-3 px-1 border-b-2 font-display text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              mainView === 'history' ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <IconFolder className="w-4 h-4" />
            <span>4. Evolução (Antes/Depois)</span>
          </button>
          <button
            onClick={() => setMainView('audit')}
            className={`py-3 px-1 border-b-2 font-display text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              mainView === 'audit' ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <IconShield className="w-4 h-4" />
            <span>5. Auditoria LLM</span>
          </button>
          <button
            onClick={() => setMainView('chat')}
            className={`py-3 px-1 border-b-2 font-display text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              mainView === 'chat' ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <IconChat className="w-4 h-4" />
            <span>6. Chat 360°</span>
          </button>
        </nav>
      </div>

      {/* VIEW 0: HISTÓRICO DO LEAD */}
      {mainView === 'lead_history' && <LeadHistoryPanel client={client} />}

      {/* VIEW 1: AGENTS & DELIVERABLES */}
      {mainView === 'deliverables' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Agent Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block px-1 mb-2">5 Agentes Especialistas GEO</span>
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(agent.id)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-2xl text-left transition-all cursor-pointer border ${
                  activeAgent === agent.id
                    ? 'bg-zinc-950 text-white border-zinc-950 shadow-md'
                    : 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border-zinc-200'
                }`}
              >
                <span className="shrink-0 mt-0.5">{agent.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold font-display leading-tight truncate">{agent.name}</p>
                    {agentOutputs[agent.id] && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Possui entregável gravado" />}
                  </div>
                  <p className={`text-[10px] leading-tight mt-1 ${activeAgent === agent.id ? 'text-zinc-300' : 'text-zinc-400'}`}>{agent.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Deliverables Content Panel */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-zinc-200 rounded-2xl shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-zinc-700">{currentAgent.icon}</span>
                <div>
                  <h3 className="text-zinc-900 font-display font-bold text-sm">{currentAgent.name}</h3>
                  <p className="text-zinc-500 text-xs">{currentAgent.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleRunAgent(activeAgent)}
                disabled={running}
                className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {running ? <><IconHourglass className="w-3.5 h-3.5" /> Gerando entregáveis...</> : <><IconPlay className="w-3.5 h-3.5" /> Executar {currentAgent.name}</>}
              </button>
            </div>

            {logs.length > 0 && (
              <div className="tactile-sunken rounded-xl p-3.5 font-mono text-[10px] space-y-1 bg-zinc-50 text-zinc-600">
                {logs.map((log, i) => <p key={i}>{log}</p>)}
              </div>
            )}

            {!currentOutput ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-3">
                <IconBot className="w-10 h-10 text-zinc-300 mx-auto" />
                <p className="text-zinc-800 font-bold text-sm">Nenhum entregável gerado para {currentAgent.name} ainda</p>
                <p className="text-zinc-500 text-xs max-w-md mx-auto">
                  Clique no botão acima para executar a análise e gerar códigos de implementação prontos para editar, copiar e baixar.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Orquestrador Deliverables */}
                {activeAgent === 'orchestrator' && (
                  <>
                    {currentOutput.actionPlanMarkdown && (
                      <DeliverableCard
                        title="Roteiro Estratégico de Implantação GEO (5 Etapas)"
                        description="Plano de ação completo para apresentar e implantar junto com o cliente."
                        content={currentOutput.actionPlanMarkdown}
                        filename={`Plano_Acao_GEO_${client.company || 'Cliente'}.md`}
                        onSave={updated => {
                          setAgentOutputs(prev => ({
                            ...prev,
                            orchestrator: { ...prev.orchestrator, actionPlanMarkdown: updated }
                          }));
                        }}
                      />
                    )}
                    {currentOutput.deliverables?.jsonLdSchema && (
                      <DeliverableCard
                        title="Códigos JSON-LD Schema (Organization, Person, WebSite)"
                        description="Código pronto para copiar e colar na tag <head> do site do cliente."
                        content={currentOutput.deliverables.jsonLdSchema}
                        filename="schema.jsonld"
                        onSave={updated => {
                          setAgentOutputs(prev => ({
                            ...prev,
                            orchestrator: { ...prev.orchestrator, deliverables: { ...prev.orchestrator.deliverables, jsonLdSchema: updated } }
                          }));
                        }}
                      />
                    )}
                    {currentOutput.deliverables?.llmsTxt && (
                      <DeliverableCard
                        title="Arquivo /llms.txt (Mapa Semântico em Markdown para IAs)"
                        description="Arquivo pronto para salvar e publicar na raiz do servidor web do cliente."
                        content={currentOutput.deliverables.llmsTxt}
                        filename="llms.txt"
                        onSave={updated => {
                          setAgentOutputs(prev => ({
                            ...prev,
                            orchestrator: { ...prev.orchestrator, deliverables: { ...prev.orchestrator.deliverables, llmsTxt: updated } }
                          }));
                        }}
                      />
                    )}
                  </>
                )}

                {/* Technical Gatekeeper Deliverable */}
                {activeAgent === 'gatekeeper' && (
                  <DeliverableCard
                    title="Arquivo robots.txt Otimizado para Robôs de IA"
                    description="Configuração de permissões explícitas para GPTBot, ClaudeBot, PerplexityBot e Bytespider."
                    content={currentOutput.recommendedRobotsTxt || `# robots.txt recomendado para ${client.url}\nUser-agent: GPTBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /`}
                    filename="robots.txt"
                    onSave={updated => {
                      setAgentOutputs(prev => ({
                        ...prev,
                        gatekeeper: { ...prev.gatekeeper, recommendedRobotsTxt: updated }
                      }));
                    }}
                  />
                )}

                {/* Metadata Entity Deliverables */}
                {activeAgent === 'metadata' && (
                  <>
                    <DeliverableCard
                      title="Código JSON-LD Schema Completo"
                      description="Estrutura de dados com sameAs apontando para LinkedIn, Crunchbase e Wikipedia."
                      content={currentOutput.generatedJsonLd || JSON.stringify(currentOutput, null, 2)}
                      filename="schema.jsonld"
                      onSave={updated => {
                        setAgentOutputs(prev => ({
                          ...prev,
                          metadata: { ...prev.metadata, generatedJsonLd: updated }
                        }));
                      }}
                    />
                    <DeliverableCard
                      title="Arquivo /llms.txt para Publicação"
                      description="Mapa de autoridades e links canônicos para consumo nativo por LLMs."
                      content={currentOutput.llmsTxt || `# /llms.txt para ${client.url}`}
                      filename="llms.txt"
                      onSave={updated => {
                        setAgentOutputs(prev => ({
                          ...prev,
                          metadata: { ...prev.metadata, llmsTxt: updated }
                        }));
                      }}
                    />
                  </>
                )}

                {/* Content Absorption Deliverables */}
                {activeAgent === 'content' && (
                  <>
                    {currentOutput.aeoTemplates?.tldrAnswerFirstBlock && (
                      <DeliverableCard
                        title="Bloco de Resposta Direta AEO (<60 palavras)"
                        description="Trecho otimizado para inserção no topo de páginas H2."
                        content={currentOutput.aeoTemplates.tldrAnswerFirstBlock}
                        filename="aeo_tldr_block.html"
                        onSave={updated => {
                          setAgentOutputs(prev => ({
                            ...prev,
                            content: { ...prev.content, aeoTemplates: { ...prev.content.aeoTemplates, tldrAnswerFirstBlock: updated } }
                          }));
                        }}
                      />
                    )}
                    {currentOutput.aeoTemplates?.htmlComparisonTable && (
                      <DeliverableCard
                        title="Tabela Comparativa em HTML Nativo (Princeton Factor)"
                        description="Tabela HTML otimizada para aumentar em até 47% a citabilidade nas LLMs."
                        content={currentOutput.aeoTemplates.htmlComparisonTable}
                        filename="tabela_comparativa.html"
                        onSave={updated => {
                          setAgentOutputs(prev => ({
                            ...prev,
                            content: { ...prev.content, aeoTemplates: { ...prev.content.aeoTemplates, htmlComparisonTable: updated } }
                          }));
                        }}
                      />
                    )}
                  </>
                )}

                {/* SEO Optimizer Deliverable */}
                {activeAgent === 'seo_optimizer' && (
                  <DeliverableCard
                    title="Relatório de Otimização de SEO Clássico (Title/Meta, Alt Tags, PageRank)"
                    description="Diagnóstico de trechos, atributos de imagens e links internos."
                    content={JSON.stringify(currentOutput, null, 2)}
                    filename="relatorio_seo_optimizer.json"
                  />
                )}

                {/* Semantic Explorer Deliverable */}
                {activeAgent === 'semantic_explorer' && (
                  <DeliverableCard
                    title="Mapeamento de Content Gaps e Topic Clusters"
                    description="Ideação de lacunas de conteúdo e briefings estruturados."
                    content={JSON.stringify(currentOutput, null, 2)}
                    filename="topic_clusters_briefing.json"
                  />
                )}

                {/* Off-Page Entity Monitor Deliverable */}
                {activeAgent === 'offpage' && (
                  <DeliverableCard
                    title="Auditoria de Entidade Externa, Wikidata e Pautas de PR Digital"
                    description="Co-ocorrência semântica e oportunidades de imprensa."
                    content={JSON.stringify(currentOutput, null, 2)}
                    filename="relatorio_offpage_pr.json"
                  />
                )}

                {/* Intent Prompt Deliverable */}
                {activeAgent === 'intent' && (
                  <DeliverableCard
                    title="Relatório de Visibilidade e Prompts de Teste nas IAs"
                    description="Mapeamento de Citation Share e perguntas de intenção testadas."
                    content={JSON.stringify(currentOutput, null, 2)}
                    filename="citation_share_report.json"
                  />
                )}

                {/* Checklist Architect Deliverable */}
                {activeAgent === 'checklist_architect' && (
                  <DeliverableCard
                    title="Checklist Interativo de QA & Instruções CMS para Devs"
                    description="Snippets de código compilados, tutoriais de instalação e checklist de validação."
                    content={JSON.stringify(currentOutput, null, 2)}
                    filename="checklist_qa_devs.json"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: STAGES CONTROL */}
      {mainView === 'stages' && (
        <div className="space-y-5">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-150 pb-4">
              <div>
                <h4 className="font-display font-bold text-zinc-900 text-base">🗺️ Controle e Navegação das 5 Etapas GEO</h4>
                <p className="text-zinc-500 text-xs mt-0.5">Selecione uma etapa para avançar a esteira do cliente e executar seu agente correspondente.</p>
              </div>
              <span className="text-xs font-mono font-bold bg-zinc-100 text-zinc-800 px-3.5 py-1.5 rounded-xl border border-zinc-200 self-start">
                Etapa Atual no Projeto: #{currentStage}
              </span>
            </div>

            {/* Stage Cards Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map(stage => {
                const isCurrent = currentStage === stage;
                const agentForStage = agents.find(a => a.stage === stage)!;
                return (
                  <button
                    key={stage}
                    onClick={() => handleStageSelect(stage)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                      isCurrent
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-md scale-[1.02]'
                        : stage < currentStage
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/60'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold uppercase ${isCurrent ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        Etapa #{stage}
                      </span>
                      {stage < currentStage && <IconCheck className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs leading-tight line-clamp-2">{stageLabels[stage].split(' — ')[1] || stageLabels[stage]}</p>
                      <p className={`text-[10px] font-mono mt-1 ${isCurrent ? 'text-zinc-400' : 'text-zinc-500'}`}>🤖 {agentForStage.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stage Action Box */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h5 className="font-bold text-zinc-900 text-sm">Etapa Selecionada: #{currentStage} — {stageLabels[currentStage]}</h5>
                <p className="text-zinc-500 text-xs mt-1">
                  Agente Responsável: <span className="font-bold text-zinc-800">{agents.find(a => a.stage === currentStage)?.name}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  const mappedAgent = stageAgentMap[currentStage];
                  if (mappedAgent) {
                    setActiveAgent(mappedAgent);
                    setMainView('deliverables');
                    handleRunAgent(mappedAgent);
                  }
                }}
                disabled={running}
                className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-3 px-5 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap"
              >
                {running ? <><IconHourglass className="w-3.5 h-3.5" /> Executando...</> : <><IconPlay className="w-3.5 h-3.5" /> ⚡ Executar Agente da Etapa #{currentStage}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: HISTORY & EVOLUTION */}
      {mainView === 'history' && <ClientHistoryPanel client={client} refreshKey={historyRefreshKey} />}

      {/* VIEW 4: AUDITORIA LLM & PRINTS */}
      {mainView === 'audit' && (
        <AuditAndScreenshotsPanel entityType="client" entityId={client.id} leadUrl={client.url} />
      )}

      {/* VIEW 5: CHAT 360 */}
      {mainView === 'chat' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-4 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-700 shadow-xs">
            <span>Agente Ativo no Chat 360°:</span>
            <select
              value={activeAgent}
              onChange={e => setActiveAgent(e.target.value as AgentName)}
              className="bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
            >
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs min-h-[480px]">
            <LeadChat leadId={client.id} agentName={activeAgent} leadUrl={client.url} />
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <ClientEditModal
          client={client}
          onSave={handleSaveClient}
          onCancel={() => setEditingClient(false)}
        />
      )}
    </div>
  );
}
