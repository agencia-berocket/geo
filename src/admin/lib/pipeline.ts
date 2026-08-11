import type { Lead, PipelineStage } from '../hooks/useFirestore';

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  new: 'Novo',
  terms_approved: 'Termos OK',
  diagnosed: 'Diagnosticado',
  email_sent: 'E-mail Enviado',
  responded: 'Respondido',
  converted: 'Convertido',
};

export const PIPELINE_STAGE_COLORS: Record<PipelineStage, string> = {
  new: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  terms_approved: 'bg-amber-50 text-amber-700 border-amber-200',
  diagnosed: 'bg-blue-50 text-blue-700 border-blue-200',
  email_sent: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  responded: 'bg-purple-50 text-purple-700 border-purple-200',
  converted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

// Deriva o estágio do pipeline a partir das ações reais já registradas no lead.
// Se o lead tiver sido movido manualmente (pipelineStage persistido) e essa marcação
// estiver mais avançada que o que os dados derivados indicam, respeita a marcação manual.
export function getPipelineStage(lead: Lead): PipelineStage {
  let derived: PipelineStage = 'new';
  if (lead.searchTermsStatus === 'approved') derived = 'terms_approved';
  if (lead.diagnosticId || lead.geoScore) derived = 'diagnosed';
  if (lead.emailSentAt || (lead.sentHistory && lead.sentHistory.length > 0)) derived = 'email_sent';
  if (lead.responded) derived = 'responded';
  if (lead.status === 'converted' || lead.temperature === 'converted') derived = 'converted';

  const order: PipelineStage[] = ['new', 'terms_approved', 'diagnosed', 'email_sent', 'responded', 'converted'];
  const manual = lead.pipelineStage;
  if (manual && order.includes(manual) && order.indexOf(manual) > order.indexOf(derived)) {
    return manual;
  }
  return derived;
}

// Dias inteiros desde o último e-mail enviado (usa emailSentAt, com fallback para o sentHistory mais recente)
export function getDaysSinceLastEmail(lead: Lead): number | null {
  let lastSent = lead.emailSentAt;
  if (!lastSent && lead.sentHistory && lead.sentHistory.length > 0) {
    const emailSends = lead.sentHistory.filter(h => h.channel === 'email');
    if (emailSends.length > 0) {
      lastSent = emailSends.reduce((latest, item) => (item.sentAt > latest ? item.sentAt : latest), emailSends[0].sentAt);
    }
  }
  if (!lastSent) return null;
  const diffMs = Date.now() - new Date(lastSent).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatFollowupLabel(lead: Lead): string {
  const days = getDaysSinceLastEmail(lead);
  if (days === null) return '';
  if (days === 0) return 'enviado hoje';
  if (days === 1) return 'há 1 dia';
  return `há ${days} dias`;
}
