import React, { useState, useEffect } from 'react';
import { type Lead, type CommercialStage, type LeadTemperature } from '../hooks/useFirestore';
import { COMMERCIAL_STAGES, COMMERCIAL_STAGE_MAP, getCommercialStage, calculateLeadMetrics } from '../lib/pipeline';
import { IconCheck, IconTarget, IconCalendar, IconSparkles, IconMail } from './icons';

interface LeadCommercialPipelinePanelProps {
  lead: Lead;
  onSave: (patch: Partial<Lead>) => Promise<void>;
}

export default function LeadCommercialPipelinePanel({ lead, onSave }: LeadCommercialPipelinePanelProps) {
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
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Re-sincronizar quando a prop lead mudar
  useEffect(() => {
    const stage = getCommercialStage(lead);
    setCommercialStage(stage);
    setTemperature(lead.temperature || 'cold');
    setNextAction(lead.nextAction || COMMERCIAL_STAGE_MAP[stage]?.defaultNextAction || '');
    setNextFollowupDate(lead.nextFollowupDate ? lead.nextFollowupDate.split('T')[0] : '');
    setLastInteraction(lead.lastInteraction || '');
    setFirstContactAt(lead.firstContactAt ? lead.firstContactAt.split('T')[0] : (lead.emailSentAt ? lead.emailSentAt.split('T')[0] : ''));
    setRespondedAt(lead.respondedAt ? lead.respondedAt.split('T')[0] : '');
    setLastContactAt(lead.lastContactAt ? lead.lastContactAt.split('T')[0] : '');
    setMeetingDate(lead.meetingDate ? lead.meetingDate.split('T')[0] : '');
    setProposalDate(lead.proposalDate ? lead.proposalDate.split('T')[0] : '');
    setClosedAt(lead.closedAt ? lead.closedAt.split('T')[0] : '');
    setFollowupCount(lead.followupCount !== undefined ? lead.followupCount : (lead.sentHistory ? lead.sentHistory.length : 0));
    setAssignedTo(lead.assignedTo || 'Guilherme');
  }, [lead]);

  const handleStageChange = (newStage: CommercialStage) => {
    setCommercialStage(newStage);
    const config = COMMERCIAL_STAGE_MAP[newStage];
    if (config && (!nextAction || COMMERCIAL_STAGES.some(s => s.defaultNextAction === nextAction))) {
      setNextAction(config.defaultNextAction);
    }
  };

  // Lead simulado para computar métricas em tempo real
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
  const currentConfig = COMMERCIAL_STAGE_MAP[commercialStage] || COMMERCIAL_STAGES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
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

      if (commercialStage !== lead.commercialStage) {
        patch.stageChangedAt = new Date().toISOString();
      }

      if (respondedAt) {
        patch.responded = true;
      }

      await onSave(patch);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Erro ao salvar pipeline comercial:', err);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* CARD TOP DE RESULTADO DA ETAPA ATUAL E MÉTRICAS EM TEMPO REAL */}
      <div className="bg-zinc-950 text-white rounded-2xl p-6 shadow-md border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">ETAPA COMERCIAL ATUAL</span>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-display font-black border ${currentConfig.badgeClass}`}>
                {currentConfig.label}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {currentConfig.description}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-zinc-400">TEMPERATURA:</span>
            <select
              value={temperature}
              onChange={(e) => setTemperature(e.target.value as LeadTemperature)}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-xl text-xs font-mono font-bold px-3.5 py-2 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="hot">🚀 Quente (Hot)</option>
              <option value="warm">🔥 Morno (Warm)</option>
              <option value="cold">❄️ Frio (Cold)</option>
              <option value="lost">❌ Inativo (Lost)</option>
              <option value="converted">💎 Convertido</option>
            </select>
          </div>
        </div>

        {/* MÉTRICAS CALCULADAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase block">⏱️ 1ª Resposta</span>
            <span className="font-display font-bold text-sm text-white mt-1 block">
              {metrics.timeToFirstResponseFormatted}
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase block">⏳ Sem Resposta</span>
            <span className="font-display font-bold text-sm text-white mt-1 block">
              {metrics.daysWithoutResponseFormatted}
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase block">📊 Na Etapa Atual</span>
            <span className="font-display font-bold text-sm text-white mt-1 block">
              {metrics.daysInCurrentStageFormatted}
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase block">🚨 Follow-up</span>
            <span className={`font-display font-bold text-sm mt-1 block ${
              metrics.followupStatus === 'overdue' ? 'text-red-400 animate-pulse' :
              metrics.followupStatus === 'due_today' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {metrics.followupStatusFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* PAINEL REGRA DAS 3 PERGUNTAS DO LEAD */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
          <h3 className="font-display font-bold text-zinc-950 text-base flex items-center gap-2">
            <IconTarget className="w-5 h-5 text-blue-600" />
            As 3 Perguntas Fundamentais do Lead
          </h3>
          <span className="text-xs font-mono text-zinc-400 uppercase font-semibold">CRM PIPELINE COMERCIAL</span>
        </div>

        {/* 1. ONDE ELE ESTÁ? (SELETOR DAS 14 ETAPAS) */}
        <div className="space-y-3">
          <label className="block text-xs font-mono font-bold text-zinc-900 uppercase">
            1. Onde o lead está? <span className="text-zinc-400 font-normal font-sans">(Selecione uma das 14 etapas do pipeline)</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {COMMERCIAL_STAGES.map((s) => {
              const isSelected = commercialStage === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => handleStageChange(s.key)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? `${s.badgeClass} ring-2 ring-zinc-950 shadow-md scale-[1.02]`
                      : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <div className="font-display font-bold text-xs flex items-center justify-between">
                    <span>{s.label}</span>
                    {isSelected && <IconCheck className="w-3.5 h-3.5" />}
                  </div>
                  <p className="text-[10px] opacity-80 mt-1 line-clamp-2">{s.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. O QUE ACONTECEU? (ÚLTIMA INTERAÇÃO) */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-bold text-zinc-900 uppercase">
            2. O que aconteceu? <span className="text-zinc-400 font-normal font-sans">(Histórico / Resumo da última interação)</span>
          </label>
          <textarea
            value={lastInteraction}
            onChange={(e) => setLastInteraction(e.target.value)}
            rows={3}
            placeholder="Ex: 12/08 — Reunião de discovery realizada com o CMO. Lead solicitou proposta comercial adaptada para plano Enterprise."
            className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-950 focus:bg-white"
          />
        </div>

        {/* 3. O QUE PRECISA ACONTECER AGORA? */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-mono font-bold text-zinc-900 uppercase">
            3. O que precisa acontecer agora? <span className="text-zinc-400 font-normal font-sans">(Próxima Ação + Data + Responsável)</span>
          </label>

          {/* Atalhos Rápidos */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_ACTIONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setNextAction(preset)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  nextAction === preset
                    ? 'bg-zinc-950 text-white font-bold'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-600 mb-1">PRÓXIMA AÇÃO *</label>
              <input
                type="text"
                required
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Ex: Follow-up proposta"
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-600 mb-1">DATA DO PRÓXIMO FOLLOW-UP</label>
              <input
                type="date"
                value={nextFollowupDate}
                onChange={(e) => setNextFollowupDate(e.target.value)}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-zinc-950 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-600 mb-1">RESPONSÁVEL COMERCIAL</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Guilherme"
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PAINEL DE DATAS OPERACIONAIS DO CRM & FOLLOW-UPS */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <h3 className="font-display font-bold text-zinc-950 text-base flex items-center gap-2">
            <IconCalendar className="w-5 h-5 text-emerald-600" />
            Registro de Datas Operacionais do Funil
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-zinc-500">FOLLOW-UPS REALIZADOS:</span>
            <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50">
              <button
                type="button"
                onClick={() => setFollowupCount(Math.max(0, followupCount - 1))}
                className="px-3 py-1 text-zinc-600 hover:bg-zinc-200 font-bold cursor-pointer"
              >
                -
              </button>
              <span className="px-3 font-mono font-bold text-xs text-zinc-950">{followupCount}</span>
              <button
                type="button"
                onClick={() => setFollowupCount(followupCount + 1)}
                className="px-3 py-1 text-zinc-600 hover:bg-zinc-200 font-bold cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div>
            <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">1º CONTATO</label>
            <input
              type="date"
              value={firstContactAt}
              onChange={(e) => {
                setFirstContactAt(e.target.value);
                if (!lastContactAt) setLastContactAt(e.target.value);
              }}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-zinc-950 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">DATA RESPOSTA</label>
            <input
              type="date"
              value={respondedAt}
              onChange={(e) => setRespondedAt(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-zinc-950 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">ÚLTIMO CONTATO</label>
            <input
              type="date"
              value={lastContactAt}
              onChange={(e) => setLastContactAt(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-zinc-950 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">DATA REUNIÃO</label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-zinc-950 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">DATA PROPOSTA</label>
            <input
              type="date"
              value={proposalDate}
              onChange={(e) => setProposalDate(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-zinc-950 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-1">DATA FECHAMENTO</label>
            <input
              type="date"
              value={closedAt}
              onChange={(e) => setClosedAt(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-zinc-950 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* BARRA FIXA DE SALVAMENTO */}
      <div className="flex items-center justify-between p-4 bg-zinc-950 text-white rounded-2xl shadow-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          {savedSuccess ? (
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 animate-bounce">
              <IconCheck className="w-4 h-4" /> Alterações salvas no CRM!
            </span>
          ) : (
            <span className="text-xs font-mono text-zinc-400">
              Altere os campos acima e clique para salvar a gestão do lead.
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-display font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Salvando Pipeline...</span>
            </>
          ) : (
            <>
              <IconCheck className="w-4 h-4" />
              <span>Salvar Pipeline Comercial</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
