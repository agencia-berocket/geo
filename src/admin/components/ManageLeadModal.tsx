import React, { useState } from 'react';
import { type Lead, type CommercialStage, type LeadTemperature } from '../hooks/useFirestore';
import { COMMERCIAL_STAGES, COMMERCIAL_STAGE_MAP, getCommercialStage, calculateLeadMetrics } from '../lib/pipeline';
import Modal from './Modal';
import { IconCheck, IconX, IconTarget, IconSparkles, IconHourglass, IconCalendar, IconMail, IconChat } from './icons';

interface ManageLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (leadId: string, patch: Partial<Lead>) => Promise<void>;
}

export default function ManageLeadModal({ lead, onClose, onSave }: ManageLeadModalProps) {
  const initialStage = getCommercialStage(lead);
  
  const [commercialStage, setCommercialStage] = useState<CommercialStage>(initialStage);
  const [temperature, setTemperature] = useState<LeadTemperature>(lead.temperature || 'cold');
  const [nextAction, setNextAction] = useState<string>(
    lead.nextAction || COMMERCIAL_STAGE_MAP[initialStage]?.defaultNextAction || ''
  );
  const [nextFollowupDate, setNextFollowupDate] = useState<string>(
    lead.nextFollowupDate ? lead.nextFollowupDate.split('T')[0] : ''
  );
  const [lastInteraction, setLastInteraction] = useState<string>(lead.lastInteraction || '');
  const [firstContactAt, setFirstContactAt] = useState<string>(
    lead.firstContactAt ? lead.firstContactAt.split('T')[0] : (lead.emailSentAt ? lead.emailSentAt.split('T')[0] : '')
  );
  const [respondedAt, setRespondedAt] = useState<string>(
    lead.respondedAt ? lead.respondedAt.split('T')[0] : ''
  );
  const [lastContactAt, setLastContactAt] = useState<string>(
    lead.lastContactAt ? lead.lastContactAt.split('T')[0] : ''
  );
  const [meetingDate, setMeetingDate] = useState<string>(
    lead.meetingDate ? lead.meetingDate.split('T')[0] : ''
  );
  const [proposalDate, setProposalDate] = useState<string>(
    lead.proposalDate ? lead.proposalDate.split('T')[0] : ''
  );
  const [closedAt, setClosedAt] = useState<string>(
    lead.closedAt ? lead.closedAt.split('T')[0] : ''
  );
  const [followupCount, setFollowupCount] = useState<number>(
    lead.followupCount !== undefined ? lead.followupCount : (lead.sentHistory ? lead.sentHistory.length : 0)
  );
  const [assignedTo, setAssignedTo] = useState<string>(lead.assignedTo || 'Guilherme');
  const [saving, setSaving] = useState(false);

  // Mudar etapa sugere próxima ação padrão caso não tenha sido customizada
  const handleStageChange = (newStage: CommercialStage) => {
    setCommercialStage(newStage);
    const config = COMMERCIAL_STAGE_MAP[newStage];
    if (config && (!nextAction || COMMERCIAL_STAGES.some(s => s.defaultNextAction === nextAction))) {
      setNextAction(config.defaultNextAction);
    }
  };

  // Objeto temporário para calcular métricas simuladas em tempo real na modal
  const simulatedLead: Lead = {
    ...lead,
    commercialStage,
    temperature,
    nextAction,
    nextFollowupDate: nextFollowupDate ? new Date(nextFollowupDate).toISOString() : undefined,
    lastInteraction,
    firstContactAt: firstContactAt ? new Date(firstContactAt).toISOString() : undefined,
    respondedAt: respondedAt ? new Date(respondedAt).toISOString() : undefined,
    lastContactAt: lastContactAt ? new Date(lastContactAt).toISOString() : undefined,
    meetingDate: meetingDate ? new Date(meetingDate).toISOString() : undefined,
    proposalDate: proposalDate ? new Date(proposalDate).toISOString() : undefined,
    closedAt: closedAt ? new Date(closedAt).toISOString() : undefined,
    followupCount,
    assignedTo,
  };

  const metrics = calculateLeadMetrics(simulatedLead);
  const currentStageConfig = COMMERCIAL_STAGE_MAP[commercialStage] || COMMERCIAL_STAGES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const patch: Partial<Lead> = {
        commercialStage,
        temperature,
        nextAction,
        nextFollowupDate: nextFollowupDate ? new Date(nextFollowupDate).toISOString() : '',
        lastInteraction,
        firstContactAt: firstContactAt ? new Date(firstContactAt).toISOString() : '',
        respondedAt: respondedAt ? new Date(respondedAt).toISOString() : '',
        lastContactAt: lastContactAt ? new Date(lastContactAt).toISOString() : '',
        meetingDate: meetingDate ? new Date(meetingDate).toISOString() : '',
        proposalDate: proposalDate ? new Date(proposalDate).toISOString() : '',
        closedAt: closedAt ? new Date(closedAt).toISOString() : '',
        followupCount,
        assignedTo,
      };

      // Se mudou a etapa, grava a data de mudança
      if (commercialStage !== lead.commercialStage) {
        patch.stageChangedAt = new Date().toISOString();
      }

      // Se marcou data de resposta, atualiza responded=true
      if (respondedAt) {
        patch.responded = true;
      }

      await onSave(lead.id, patch);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar pipeline do lead:', err);
    } finally {
      setSaving(false);
    }
  };

  const PRESET_ACTIONS = [
    'Qualificar',
    'Aguardar resposta',
    'Avaliar interesse',
    'Agendar conversa',
    'Realizar reunião',
    'Enviar proposta',
    'Follow-up',
    'Follow-up WhatsApp',
    'Resolver objeções',
    'Onboarding',
    'Implantação',
  ];

  return (
    <Modal onClose={onClose} title={`Gerenciar Lead & Pipeline Comercial`} maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* CABEÇALHO DO LEAD */}
        <div className="bg-zinc-950 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-zinc-800">
          <div>
            <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">LEAD / EMPRESA</span>
            <h3 className="font-display font-black text-lg text-white tracking-tight flex items-center gap-2 mt-0.5">
              {lead.company || lead.domain || lead.url}
            </h3>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
              {lead.contactName ? `${lead.contactName} (${lead.contactRole || 'Decisor'})` : lead.url}
              {lead.email ? ` · ${lead.email}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-zinc-400">TEMPERATURA:</span>
            <select
              value={temperature}
              onChange={(e) => setTemperature(e.target.value as LeadTemperature)}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-xl text-xs font-mono font-bold px-3 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="hot">🚀 Quente (Hot)</option>
              <option value="warm">🔥 Morno (Warm)</option>
              <option value="cold">❄️ Frio (Cold)</option>
              <option value="lost">❌ Inativo (Lost)</option>
              <option value="converted">💎 Convertido</option>
            </select>
          </div>
        </div>

        {/* PAINEL DE MÉTRICAS CALCULADAS EM TEMPO REAL */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3.5 shadow-xs">
          <div className="bg-white border border-zinc-200 rounded-xl p-2.5">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase block">⏱️ 1ª Resposta</span>
            <span className="font-display font-bold text-xs text-zinc-900 mt-0.5 block truncate">
              {metrics.timeToFirstResponseFormatted}
            </span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-2.5">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase block">⏳ Sem Resposta</span>
            <span className="font-display font-bold text-xs text-zinc-900 mt-0.5 block truncate">
              {metrics.daysWithoutResponseFormatted}
            </span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-2.5">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase block">📊 Na Etapa Atual</span>
            <span className="font-display font-bold text-xs text-zinc-900 mt-0.5 block truncate">
              {metrics.daysInCurrentStageFormatted}
            </span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-2.5">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase block">🚨 Follow-up</span>
            <span className={`font-display font-bold text-xs mt-0.5 block truncate ${
              metrics.followupStatus === 'overdue' ? 'text-red-600 animate-pulse' :
              metrics.followupStatus === 'due_today' ? 'text-amber-600' : 'text-emerald-700'
            }`}>
              {metrics.followupStatusFormatted}
            </span>
          </div>
        </div>

        {/* REGRA DAS 3 PERGUNTAS */}
        <div className="space-y-4 border border-zinc-200 rounded-2xl p-5 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h4 className="font-display font-bold text-zinc-950 text-sm flex items-center gap-2">
              <IconTarget className="w-4 h-4 text-blue-600" />
              Regra de Ouro: As 3 Perguntas do Lead
            </h4>
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">PIPELINE & EXECUÇÃO</span>
          </div>

          {/* PERGUNTA 1: ONDE ELE ESTÁ? (ETAPA COMERCIAL) */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold text-zinc-800 uppercase flex items-center gap-1.5">
              <span>1. Onde ele está?</span>
              <span className="text-[10px] text-zinc-400 font-normal font-sans">(Etapa do Funil Comercial)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {COMMERCIAL_STAGES.map((s) => {
                const isSelected = commercialStage === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => handleStageChange(s.key)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `${s.badgeClass} ring-2 ring-zinc-950 shadow-sm`
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    <span className="font-display font-bold text-xs block">{s.label}</span>
                    <span className="text-[10px] opacity-75 line-clamp-1 mt-0.5">{s.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PERGUNTA 2: O QUE ACONTECEU? (ÚLTIMA INTERAÇÃO) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold text-zinc-800 uppercase flex items-center gap-1.5">
              <span>2. O que aconteceu?</span>
              <span className="text-[10px] text-zinc-400 font-normal font-sans">(Última interação registrada)</span>
            </label>
            <input
              type="text"
              value={lastInteraction}
              onChange={(e) => setLastInteraction(e.target.value)}
              placeholder="Ex: 12/08 — Recebeu a proposta comercial via WhatsApp e confirmou leitura."
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
            />
          </div>

          {/* PERGUNTA 3: O QUE PRECISA ACONTECER AGORA? */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-mono font-bold text-zinc-800 uppercase flex items-center gap-1.5">
              <span>3. O que precisa acontecer agora?</span>
              <span className="text-[10px] text-zinc-400 font-normal font-sans">(Próxima Ação + Data + Responsável)</span>
            </label>

            {/* Presets rápidos de ação */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ACTIONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNextAction(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium transition-all cursor-pointer ${
                    nextAction === preset
                      ? 'bg-zinc-950 text-white font-bold'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">PRÓXIMA AÇÃO</label>
                <input
                  type="text"
                  required
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="Ex: Follow-up proposta"
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">DATA PRÓXIMO FOLLOW-UP</label>
                <input
                  type="date"
                  value={nextFollowupDate}
                  onChange={(e) => setNextFollowupDate(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-zinc-950 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">RESPONSÁVEL</label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Guilherme"
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
                />
              </div>
            </div>
          </div>
        </div>

        {/* REGISTRO DE DATAS OPERACIONAIS E CONTADOR DE FOLLOW-UPS */}
        <div className="border border-zinc-200 rounded-2xl p-5 bg-white space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h4 className="font-display font-bold text-zinc-950 text-sm flex items-center gap-2">
              <IconCalendar className="w-4 h-4 text-emerald-600" />
              Datas Operacionais do CRM
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-zinc-500">FOLLOW-UPS REALIZADOS:</span>
              <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50">
                <button
                  type="button"
                  onClick={() => setFollowupCount(Math.max(0, followupCount - 1))}
                  className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-200 font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="px-3 font-mono font-bold text-xs text-zinc-950">{followupCount}</span>
                <button
                  type="button"
                  onClick={() => setFollowupCount(followupCount + 1)}
                  className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-200 font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">1º CONTATO ENVIADO</label>
              <input
                type="date"
                value={firstContactAt}
                onChange={(e) => {
                  setFirstContactAt(e.target.value);
                  if (!lastContactAt) setLastContactAt(e.target.value);
                }}
                className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-zinc-950 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">DATA DA RESPOSTA</label>
              <input
                type="date"
                value={respondedAt}
                onChange={(e) => setRespondedAt(e.target.value)}
                className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-zinc-950 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">ÚLTIMO CONTATO REALIZADO</label>
              <input
                type="date"
                value={lastContactAt}
                onChange={(e) => setLastContactAt(e.target.value)}
                className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-zinc-950 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">DATA DA REUNIÃO</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-zinc-950 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">DATA DA PROPOSTA</label>
              <input
                type="date"
                value={proposalDate}
                onChange={(e) => setProposalDate(e.target.value)}
                className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-zinc-950 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">DATA DE FECHAMENTO</label>
              <input
                type="date"
                value={closedAt}
                onChange={(e) => setClosedAt(e.target.value)}
                className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-zinc-950 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold font-display shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <IconCheck className="w-4 h-4 text-emerald-400" />
                <span>Salvar Gestão do Pipeline</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
