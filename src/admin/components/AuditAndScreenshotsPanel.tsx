import React, { useEffect, useState, useRef } from 'react';
import { auth } from '../../lib/firebase';
import { IconChat, IconDownload, IconHourglass, IconCheck, IconX, IconWarning } from './icons';

async function getIdToken(): Promise<string> {
  return auth.currentUser?.getIdToken(false) ?? '';
}

interface AuditEntry {
  model: string;
  modelLabel?: string;
  systemPrompt?: string;
  userPrompt: string;
  response: string;
  citedBrand: boolean;
  error?: string | null;
  simulated?: boolean;
  timestamp?: string;
}

interface SavedFile {
  name: string;
  url: string;
  isImage: boolean;
  isHtml: boolean;
  sizeBytes: number;
  createdAt: string;
}

interface AuditAndScreenshotsPanelProps {
  entityType: 'lead' | 'client';
  entityId: string;
  diagnostic?: any;
  leadUrl?: string;
}

export function AuditAndScreenshotsPanel({
  entityType,
  entityId,
  diagnostic,
  leadUrl,
}: AuditAndScreenshotsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState<any>(null);
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [activeModelFilter, setActiveModelFilter] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/admin/audits/${entityType}/${entityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditData(data.auditData);
        setFiles(data.files || []);
      }
    } catch (e) {
      console.error('Erro ao buscar dados de auditoria:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [entityType, entityId]);

  // Consolidar agentAuditLog do diagnóstico local caso auditData do servidor ainda não exista
  const auditLogs: AuditEntry[] =
    auditData?.agentAuditLog ||
    diagnostic?.visibilityBenchmarking?.agentAuditLog ||
    [];

  const modelsList = [...new Set(auditLogs.map(e => e.modelLabel || e.model.split('/')[1] || e.model))];

  const filteredLogs =
    activeModelFilter === 'all'
      ? auditLogs
      : auditLogs.filter(
          e => (e.modelLabel || e.model).toLowerCase().includes(activeModelFilter.toLowerCase())
        );

  const imageFiles = files.filter(f => f.isImage);
  const htmlFile = files.find(f => f.isHtml);

  // Upload handler para prints manuais de conversas com cliente
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadMsg('⚠️ Selecione um arquivo de imagem (PNG, JPG, WebP).');
      return;
    }

    setUploading(true);
    setUploadMsg('Enviando print de tela...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const token = await getIdToken();
        const res = await fetch(`/api/admin/audits/${entityType}/${entityId}/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            label: `Print de Auditoria — ${file.name.replace(/\.[^/.]+$/, '')}`,
            base64Data,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setUploadMsg('✅ Print de tela adicionado com sucesso!');
          fetchAuditData();
        } else {
          setUploadMsg(`❌ Erro: ${data.error || 'Falha no envio'}`);
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadMsg(`❌ Erro ao ler arquivo: ${err.message}`);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header & Quick Actions */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-150 pb-4">
          <div>
            <h3 className="font-display font-bold text-zinc-900 text-base flex items-center gap-2">
              🔬 Trilha de Auditoria LLM & Galeria de Evidências
            </h3>
            <p className="text-zinc-500 text-xs mt-0.5">
              Perguntas executadas pelos agentes, respostas brutas das IAs, citação de marca e capturas de tela armazenadas na pasta do {entityType === 'client' ? 'cliente' : 'lead'}.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-2 px-3.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              {uploading ? (
                <><IconHourglass className="w-3.5 h-3.5" /> Enviando...</>
              ) : (
                <>📸 Anexar Print de Conversa</>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            {htmlFile && (
              <a
                href={htmlFile.url}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3.5 rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                👁️ Abrir HTML Completo (1-Click)
              </a>
            )}
          </div>
        </div>

        {uploadMsg && (
          <div className="text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2">
            {uploadMsg}
          </div>
        )}

        {/* Directory Metadata Banner */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-600">
            <span className="font-bold text-zinc-900">📂 Pasta de Armazenamento:</span>
            <span className="bg-white border border-zinc-200 px-2 py-0.5 rounded text-zinc-800 font-bold">
              public/audits/{entityType}_{entityId}/
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-zinc-600">
              📊 GEO Score Medido: <strong className="text-emerald-600">{auditData?.geoScore ?? diagnostic?.overallGeoScore ?? 0}%</strong>
            </span>
            <span className="text-zinc-600">
              💬 Consultas LLM: <strong className="text-zinc-900">{auditLogs.length} prompts</strong>
            </span>
            <span className="text-zinc-600">
              🖼️ Prints Salvos: <strong className="text-zinc-900">{imageFiles.length} imagens</strong>
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: GALERIA DE PRINTS E EVIDÊNCIAS VISUAIS */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-display font-bold text-zinc-900 text-sm flex items-center gap-2">
            🖼️ Galeria de Prints e Evidências Visuais ({imageFiles.length})
          </h4>
          <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Clique em uma imagem para abrir em 1-click</span>
        </div>

        {imageFiles.length === 0 ? (
          <div className="bg-zinc-50 border border-dashed border-zinc-250 rounded-xl p-8 text-center space-y-2">
            <p className="text-zinc-600 text-xs font-semibold">Nenhum print de tela encontrado nesta pasta ainda.</p>
            <p className="text-zinc-400 text-[11px]">
              Execute o diagnóstico para capturar os prints automáticos ou use o botão <strong>"Anexar Print de Conversa"</strong> para adicionar auditorias com o cliente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {imageFiles.map(img => (
              <div
                key={img.name}
                className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div
                  className="relative aspect-video bg-zinc-900 cursor-pointer overflow-hidden"
                  onClick={() => setPreviewImage(img.url)}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                    <span>🔍 Visualizar (1-Click)</span>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between gap-2 bg-white border-t border-zinc-150">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 truncate" title={img.name}>
                      {img.name.replace(/^screenshot_\d+_/, '').replace(/\.png$/, '').replace(/_/g, ' ')}
                    </p>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {(img.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <a
                    href={img.url}
                    download={img.name}
                    className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold px-2.5 py-1 rounded-lg border border-zinc-300 transition-all shrink-0"
                    title="Baixar imagem"
                  >
                    <IconDownload className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: TRILHA DE AUDITORIA DE PERGUNTAS E RESPOSTAS DAS LLMS */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-150 pb-3">
          <div>
            <h4 className="font-display font-bold text-zinc-900 text-sm flex items-center gap-2">
              🔬 Auditoria Detalhada: Perguntas & Respostas das LLMs
            </h4>
            <p className="text-zinc-500 text-xs mt-0.5">
              Perguntas reais de intenção de busca testadas no ChatGPT, Claude, Gemini e Perplexity.
            </p>
          </div>

          {/* Model Filter Pills */}
          {modelsList.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveModelFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeModelFilter === 'all'
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
                }`}
              >
                Todos ({auditLogs.length})
              </button>
              {modelsList.map(m => (
                <button
                  key={m}
                  onClick={() => setActiveModelFilter(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeModelFilter === m
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-zinc-400 font-mono text-xs">
            Carregando histórico de auditoria das LLMs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-8 text-center space-y-2">
            <p className="text-zinc-600 text-xs font-semibold">Nenhuma consulta registrada para o filtro selecionado.</p>
            <p className="text-zinc-400 text-[11px]">Execute o diagnóstico para gerar as 20 consultas em 4 LLMs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((entry, idx) => (
              <div
                key={idx}
                className={`border rounded-xl p-4 transition-all shadow-2xs space-y-3 ${
                  entry.citedBrand
                    ? 'bg-emerald-50/40 border-emerald-300/80'
                    : entry.error
                    ? 'bg-red-50/40 border-red-300/80'
                    : 'bg-zinc-50/60 border-zinc-200'
                }`}
              >
                {/* Header line */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase">#{idx + 1}</span>
                    <span className="font-mono text-[11px] font-bold bg-zinc-900 text-white px-2.5 py-0.5 rounded-md">
                      {entry.modelLabel || entry.model}
                    </span>
                    {entry.simulated && (
                      <span className="font-mono text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                        MODO SIMULADO
                      </span>
                    )}
                  </div>
                  <div>
                    {entry.citedBrand ? (
                      <span className="font-mono text-xs font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <IconCheck className="w-3.5 h-3.5" /> ✓ MARCA CITADA PELA IA
                      </span>
                    ) : entry.error ? (
                      <span className="font-mono text-xs font-bold bg-red-600 text-white px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <IconX className="w-3.5 h-3.5" /> ⚠ ERRO NA CHAMADA
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-bold bg-zinc-200 text-zinc-700 px-2.5 py-0.5 rounded-md">
                        ✗ NÃO CITADA
                      </span>
                    )}
                  </div>
                </div>

                {/* Question sent */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                    📤 PERGUNTA ENVIADA À IA (PROMPT):
                  </span>
                  <p className="text-xs font-semibold text-zinc-900 bg-white border border-zinc-200 p-2.5 rounded-lg border-l-4 border-l-indigo-500">
                    "{entry.userPrompt}"
                  </p>
                </div>

                {/* Response received */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                    📥 RESPOSTA COMPLETA RECEBIDA DA IA:
                  </span>
                  <div className="text-xs text-zinc-800 bg-white border border-zinc-200 p-3 rounded-lg border-l-4 leading-relaxed whitespace-pre-wrap font-sans border-l-zinc-400">
                    {entry.error ? (
                      <span className="text-red-600 font-bold">Erro: {entry.error}</span>
                    ) : (
                      entry.response || '—'
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULLSCREEN IMAGE PREVIEW LIGHTBOX */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] bg-zinc-950 p-2 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full p-2 text-xs font-bold z-10 border border-zinc-700 cursor-pointer"
            >
              ✕ Fechar (Esc)
            </button>
            <img
              src={previewImage}
              alt="Visualização do Print"
              className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
