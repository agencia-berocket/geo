import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth } from '../../lib/firebase';
import { NoteAttachment } from '../hooks/useFirestore';
import { IconHourglass, IconCheck, IconX, IconUpload, IconDownload } from './icons';

async function getIdToken(): Promise<string> {
  return auth.currentUser?.getIdToken(false) ?? '';
}

interface NotepadPanelProps {
  entityType: 'lead' | 'client';
  entityId: string;
  initialNotes?: string;
  initialAttachments?: NoteAttachment[];
  onNotesSaved?: (notes: string) => void;
}

export function NotepadPanel({
  entityType,
  entityId,
  initialNotes = '',
  initialAttachments = [],
  onNotesSaved,
}: NotepadPanelProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [attachments, setAttachments] = useState<NoteAttachment[]>(initialAttachments);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize initial notes & attachments when props update
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    setAttachments(initialAttachments);
  }, [initialAttachments]);

  // Save notes to backend
  const saveNotesToBackend = useCallback(
    async (textToSave: string) => {
      setSaveStatus('saving');
      try {
        const token = await getIdToken();
        const endpoint = entityType === 'client' ? `/api/admin/clients/${entityId}` : `/api/admin/leads/${entityId}`;
        const res = await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notes: textToSave }),
        });

        if (!res.ok) {
          throw new Error('Falha ao salvar notas.');
        }

        setSaveStatus('saved');
        const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setLastSavedTime(now);
        if (onNotesSaved) onNotesSaved(textToSave);
      } catch (err) {
        console.error('Error auto-saving notes:', err);
        setSaveStatus('error');
      }
    },
    [entityType, entityId, onNotesSaved]
  );

  // Debounced Auto-Save (800ms)
  useEffect(() => {
    if (notes === initialNotes && saveStatus === 'idle') return;

    const timer = setTimeout(() => {
      saveNotesToBackend(notes);
    }, 800);

    return () => clearTimeout(timer);
  }, [notes, initialNotes, saveNotesToBackend]);

  // Upload attachment file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('⚠️ Arquivo muito grande (máximo 15MB).');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const token = await getIdToken();
        const res = await fetch(`/api/admin/notes/${entityType}/${entityId}/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            base64Data,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.attachment) {
          setAttachments(prev => [...prev, data.attachment]);
        } else {
          setUploadError(`❌ Erro no envio: ${data.error || 'Falha ao anexar arquivo'}`);
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(`❌ Erro ao ler arquivo: ${err.message}`);
      setUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete attachment
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Deseja realmente excluir este anexo?')) return;

    try {
      const token = await getIdToken();
      const res = await fetch(`/api/admin/notes/${entityType}/${entityId}/attachment/${attachmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      } else {
        alert('Erro ao excluir anexo.');
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Helper for file type icon
  const getFileIcon = (fileName: string, fileType?: string) => {
    if (/\.(png|jpg|jpeg|webp|gif)$/i.test(fileName) || fileType === 'image') return '🖼️';
    if (/\.html?$/i.test(fileName) || fileType === 'html') return '🌐';
    if (/\.pdf$/i.test(fileName) || fileType === 'pdf') return '📄';
    if (/\.(docx?|xlsx?|pptx?|txt|csv)$/i.test(fileName) || fileType === 'document') return '📝';
    return '📎';
  };

  // Format file size
  const formatSizeBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-150 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-zinc-900 text-base flex items-center gap-2">
            📝 Bloco de Notas & Anexos do {entityType === 'client' ? 'Cliente' : 'Lead'}
          </h3>
        </div>

        {/* Auto-Save Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-semibold">
              <IconHourglass className="w-3.5 h-3.5 animate-spin" /> Salvando...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
              <IconCheck className="w-3.5 h-3.5 text-emerald-600" /> Salvo automaticamente {lastSavedTime ? `às ${lastSavedTime}` : ''}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 font-semibold">
              <IconX className="w-3.5 h-3.5" /> Erro ao salvar
            </span>
          )}
          {saveStatus === 'idle' && (
            <span className="text-zinc-400 text-[11px]">Salvo automaticamente ao digitar</span>
          )}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => saveNotesToBackend(notes)}
          rows={5}
          placeholder="Escreva anotações importantes, histórico de reuniões, alinhamentos ou observações sobre o contato..."
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 transition-all font-sans leading-relaxed resize-y"
        />
      </div>

      {/* Attachments Section */}
      <div className="space-y-3 pt-1 border-t border-zinc-150">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-xs text-zinc-800 flex items-center gap-1.5">
            📎 Arquivos Anexados ({attachments.length})
          </span>

          {/* Upload Button */}
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              {uploading ? (
                <><IconHourglass className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
              ) : (
                <><IconUpload className="w-3.5 h-3.5" /> Anexar Arquivo</>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {uploadError && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
            {uploadError}
          </div>
        )}

        {/* Attachments List */}
        {attachments.length === 0 ? (
          <div className="bg-zinc-50/60 border border-dashed border-zinc-200 rounded-xl p-4 text-center text-xs text-zinc-400">
            Nenhum arquivo anexado a estas anotações ainda. Clique em <strong>"Anexar Arquivo"</strong> para enviar imagens, documentos, relatórios HTML ou PDFs.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {attachments.map(att => (
              <div
                key={att.id}
                className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 flex items-center justify-between gap-2 hover:bg-zinc-100/80 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">{getFileIcon(att.name, att.fileType)}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 truncate" title={att.name}>
                      {att.name}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      {formatSizeBytes(att.sizeBytes)} • {new Date(att.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Visualizar / Abrir (1-Click)"
                  >
                    <IconDownload className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir anexo"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
