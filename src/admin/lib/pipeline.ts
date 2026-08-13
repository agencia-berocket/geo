import type { Lead, PipelineStage, CommercialStage } from '../hooks/useFirestore';

export interface CommercialStageConfig {
  key: CommercialStage;
  stepNumber: number;
  label: string;
  description: string;
  defaultNextAction: string;
  badgeClass: string;
  borderClass: string;
  bgLightClass: string;
  textColorClass: string;
}

export const COMMERCIAL_STAGES: CommercialStageConfig[] = [
  {
    key: 'lead_captured',
    stepNumber: 1,
    label: '1. Lead Capturado',
    description: 'Lead entrou no CRM',
    defaultNextAction: 'Qualificar',
    badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-300',
    borderClass: 'border-zinc-300',
    bgLightClass: 'bg-zinc-50',
    textColorClass: 'text-zinc-800',
  },
  {
    key: 'initial_contact',
    stepNumber: 2,
    label: '2. Contato Inicial',
    description: 'Primeira abordagem enviada',
    defaultNextAction: 'Aguardar resposta',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    borderClass: 'border-blue-300',
    bgLightClass: 'bg-blue-50',
    textColorClass: 'text-blue-800',
  },
  {
    key: 'responded',
    stepNumber: 3,
    label: '3. Respondido',
    description: 'Lead respondeu à abordagem',
    defaultNextAction: 'Avaliar interesse',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    borderClass: 'border-purple-300',
    bgLightClass: 'bg-purple-50',
    textColorClass: 'text-purple-800',
  },
  {
    key: 'qualification',
    stepNumber: 4,
    label: '4. Qualificação',
    description: 'Entender necessidade, orçamento, autoridade e timing',
    defaultNextAction: 'Agendar conversa',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    borderClass: 'border-amber-300',
    bgLightClass: 'bg-amber-50',
    textColorClass: 'text-amber-900',
  },
  {
    key: 'meeting_scheduled',
    stepNumber: 5,
    label: '5. Reunião Agendada',
    description: 'Reunião marcada com o decisor',
    defaultNextAction: 'Realizar reunião',
    badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    borderClass: 'border-cyan-300',
    bgLightClass: 'bg-cyan-50',
    textColorClass: 'text-cyan-900',
  },
  {
    key: 'meeting_done',
    stepNumber: 6,
    label: '6. Reunião Realizada',
    description: 'Discovery / apresentação de diagnóstico realizada',
    defaultNextAction: 'Enviar proposta',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    borderClass: 'border-teal-300',
    bgLightClass: 'bg-teal-50',
    textColorClass: 'text-teal-900',
  },
  {
    key: 'proposal_sent',
    stepNumber: 7,
    label: '7. Proposta Enviada',
    description: 'Proposta comercial ou proposta GEO enviada',
    defaultNextAction: 'Follow-up',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    borderClass: 'border-indigo-300',
    bgLightClass: 'bg-indigo-50',
    textColorClass: 'text-indigo-900',
  },
  {
    key: 'negotiation',
    stepNumber: 8,
    label: '8. Negociação',
    description: 'Cliente demonstrou interesse e há negociação ativa',
    defaultNextAction: 'Resolver objeções',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
    borderClass: 'border-orange-300',
    bgLightClass: 'bg-orange-50',
    textColorClass: 'text-orange-900',
  },
  {
    key: 'awaiting_decision',
    stepNumber: 9,
    label: '9. Aguardando Decisão',
    description: 'Proposta em avaliação interna no cliente',
    defaultNextAction: 'Follow-up programado',
    badgeClass: 'bg-violet-100 text-violet-900 border-violet-300',
    borderClass: 'border-violet-300',
    bgLightClass: 'bg-violet-50',
    textColorClass: 'text-violet-900',
  },
  {
    key: 'closed_won',
    stepNumber: 10,
    label: '10. Fechado — Ganho',
    description: 'Cliente aceitou a proposta comercial',
    defaultNextAction: 'Onboarding',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black',
    borderClass: 'border-emerald-300',
    bgLightClass: 'bg-emerald-50',
    textColorClass: 'text-emerald-900',
  },
  {
    key: 'closed_lost',
    stepNumber: 11,
    label: '11. Fechado — Perdido',
    description: 'Negócio não avançou ou foi descartado',
    defaultNextAction: 'Registrar motivo',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    borderClass: 'border-rose-300',
    bgLightClass: 'bg-rose-50',
    textColorClass: 'text-rose-900',
  },
  {
    key: 'onboarding',
    stepNumber: 12,
    label: '12. Onboarding',
    description: 'Cliente entrou na operação de implantação',
    defaultNextAction: 'Implantação',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    borderClass: 'border-sky-300',
    bgLightClass: 'bg-sky-50',
    textColorClass: 'text-sky-900',
  },
  {
    key: 'active_client',
    stepNumber: 13,
    label: '13. Cliente Ativo',
    description: 'Serviço/produto GEO em execução ativa',
    defaultNextAction: 'Sucesso / Upsell',
    badgeClass: 'bg-emerald-200 text-emerald-950 border-emerald-400 font-bold',
    borderClass: 'border-emerald-400',
    bgLightClass: 'bg-emerald-100',
    textColorClass: 'text-emerald-950',
  },
  {
    key: 'expansion_upsell',
    stepNumber: 14,
    label: '14. Expansão / Upsell',
    description: 'Nova oportunidade ou expansão de escopo no cliente',
    defaultNextAction: 'Nova proposta',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300',
    borderClass: 'border-fuchsia-300',
    bgLightClass: 'bg-fuchsia-50',
    textColorClass: 'text-fuchsia-900',
  },
];

export const COMMERCIAL_STAGE_MAP: Record<CommercialStage, CommercialStageConfig> = COMMERCIAL_STAGES.reduce(
  (acc, stage) => {
    acc[stage.key] = stage;
    return acc;
  },
  {} as Record<CommercialStage, CommercialStageConfig>
);

// Deriva a etapa comercial caso o lead ainda não tenha commercialStage gravado explicitamente
export function getCommercialStage(lead: Lead): CommercialStage {
  if (lead.commercialStage && COMMERCIAL_STAGE_MAP[lead.commercialStage]) {
    return lead.commercialStage;
  }

  // Fallback derivado dos dados existentes
  if (lead.status === 'converted' || lead.temperature === 'converted') return 'closed_won';
  if ((lead.status as string) === 'lost' || lead.temperature === 'lost') return 'closed_lost';
  if (lead.responded) return 'responded';
  if (lead.emailSentAt || (lead.sentHistory && lead.sentHistory.length > 0)) return 'initial_contact';
  if (lead.diagnosticId || lead.geoScore) return 'qualification';
  
  return 'lead_captured';
}

export function getCommercialStageConfig(lead: Lead): CommercialStageConfig {
  const stageKey = getCommercialStage(lead);
  return COMMERCIAL_STAGE_MAP[stageKey] || COMMERCIAL_STAGES[0];
}

export interface CalculatedLeadMetrics {
  timeToFirstResponseFormatted: string;
  daysWithoutResponse: number | null;
  daysWithoutResponseFormatted: string;
  daysInCurrentStage: number;
  daysInCurrentStageFormatted: string;
  followupStatus: 'overdue' | 'due_today' | 'upcoming' | 'none';
  followupStatusFormatted: string;
  followupCount: number;
}

export function calculateLeadMetrics(lead: Lead): CalculatedLeadMetrics {
  const now = Date.now();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  // 1. Tempo até a primeira resposta
  let timeToFirstResponseFormatted = 'Sem resposta ainda';
  const firstContact = lead.firstContactAt || lead.emailSentAt || (lead.sentHistory?.[0]?.sentAt);
  const responded = lead.respondedAt;

  if (firstContact && responded) {
    const diffDays = Math.max(0, Math.floor((new Date(responded).getTime() - new Date(firstContact).getTime()) / MS_PER_DAY));
    if (diffDays === 0) timeToFirstResponseFormatted = 'No mesmo dia';
    else if (diffDays === 1) timeToFirstResponseFormatted = '1 dia';
    else timeToFirstResponseFormatted = `${diffDays} dias`;
  } else if (lead.responded) {
    timeToFirstResponseFormatted = 'Respondido';
  }

  // 2. Dias sem resposta / desde último contato
  let daysWithoutResponse: number | null = null;
  let daysWithoutResponseFormatted = 'Sem contatos';
  const lastContact = lead.lastContactAt || lead.emailSentAt || (lead.sentHistory?.[lead.sentHistory.length - 1]?.sentAt) || lead.firstContactAt;
  
  if (lastContact) {
    daysWithoutResponse = Math.max(0, Math.floor((now - new Date(lastContact).getTime()) / MS_PER_DAY));
    if (daysWithoutResponse === 0) daysWithoutResponseFormatted = 'Hoje';
    else if (daysWithoutResponse === 1) daysWithoutResponseFormatted = '1 dia sem resposta';
    else daysWithoutResponseFormatted = `${daysWithoutResponse} dias sem resposta`;
  }

  // 3. Dias no estágio atual
  const stageRefDate = lead.stageChangedAt || lead.createdAt || new Date().toISOString();
  const daysInCurrentStage = Math.max(0, Math.floor((now - new Date(stageRefDate).getTime()) / MS_PER_DAY));
  const daysInCurrentStageFormatted = daysInCurrentStage === 0 ? 'Hoje' : `${daysInCurrentStage} dias nesta etapa`;

  // 4. Status de Follow-up
  let followupStatus: 'overdue' | 'due_today' | 'upcoming' | 'none' = 'none';
  let followupStatusFormatted = 'Sem data definida';

  if (lead.nextFollowupDate) {
    const todayStr = new Date().toISOString().split('T')[0];
    const followupStr = lead.nextFollowupDate.split('T')[0];

    if (followupStr < todayStr) {
      followupStatus = 'overdue';
      followupStatusFormatted = '🚨 Follow-up atrasado!';
    } else if (followupStr === todayStr) {
      followupStatus = 'due_today';
      followupStatusFormatted = '⏰ Follow-up para hoje';
    } else {
      followupStatus = 'upcoming';
      const followupDateObj = new Date(lead.nextFollowupDate);
      followupStatusFormatted = `📅 Próximo em ${followupDateObj.toLocaleDateString('pt-BR')}`;
    }
  }

  // 5. Número de follow-ups
  const followupCount = lead.followupCount !== undefined
    ? lead.followupCount
    : (lead.sentHistory ? lead.sentHistory.length : 0);

  return {
    timeToFirstResponseFormatted,
    daysWithoutResponse,
    daysWithoutResponseFormatted,
    daysInCurrentStage,
    daysInCurrentStageFormatted,
    followupStatus,
    followupStatusFormatted,
    followupCount,
  };
}

// Retrocompatibilidade do Pipeline antigo
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
