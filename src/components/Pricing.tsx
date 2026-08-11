import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { pricingPlans, team } from '../data';
import { Check, ArrowRight, Sparkles, Send, Target } from 'lucide-react';

export default function Pricing() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('pl2'); // default to Advanced
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const founder = team[0]; // Guilherme C. Rossi

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setEmail('');
      setName('');
    }, 4000);
  };

  if (!founder) return null;

  return (
    <section id="pricing" className="bg-[#f4f5f8] grid-blueprint py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-12 border-b border-zinc-200 relative">
      {/* Reference crosshairs */}
      <div className="absolute top-12 right-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>
      <div className="absolute bottom-12 left-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>

      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200/60 pb-6 mb-12 sm:mb-16 gap-3">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full" />
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-zinc-500">INVESTIMENTO TRANSPARENTE E PREVISÍVEL</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-xs text-zinc-500">
            <span>Investimento transparente</span>
            <span className="text-zinc-400">//</span>
            <span className="text-zinc-950">Sem custos ocultos</span>
          </div>
        </div>

        {/* Large Title */}
        <div className="max-w-5xl mb-10 sm:mb-12">
          <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-zinc-950 leading-[1.08] tracking-tight uppercase text-tactile-3d-dark">
            Escolha o plano ideal para acelerar seu crescimento
          </h2>
          <p className="text-zinc-500 font-sans text-xs sm:text-sm md:text-base mt-4 border-l-2 border-zinc-950 pl-4 font-light leading-relaxed max-w-3xl">
            Projetos corporativos estruturados com escopo fixo e validação científica de similaridade cosseno de RAG. Sem custos invisíveis.
          </p>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch mb-16 md:mb-32">
          {pricingPlans.map((plan, idx) => {
            const isRecommended = plan.id === 'pl3';
            const isSelected = plan.id === selectedPlanId;

            return (
              <motion.div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.08, ease: "easeOut" }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`tactile-raised p-6 sm:p-8 md:p-10 flex flex-col justify-between relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl transition-all duration-300 ${
                  isRecommended
                    ? 'border-2 border-red-500 shadow-[0_20px_40px_rgba(239,68,68,0.12)] scale-[1.01] sm:scale-[1.02] z-10'
                    : isSelected
                    ? 'border-2 border-zinc-950 shadow-xl'
                    : 'border border-zinc-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.02)]'
                }`}
              >
                {/* Highlight Banner for Recommended Plan */}
                {isRecommended && (
                  <div className="absolute top-0 right-0 left-0 bg-red-600 text-white font-mono text-[9px] font-bold py-1.5 text-center uppercase tracking-widest">
                    🔥 Plano Mais Recomendado
                  </div>
                )}

                {/* Plan Header */}
                <div className={`space-y-5 sm:space-y-6 ${isRecommended ? 'pt-4' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span 
                      className="px-3 py-1 text-[9px] font-mono font-bold text-white uppercase tracking-widest rounded-lg"
                      style={{ backgroundColor: plan.color }}
                    >
                      {plan.name}
                    </span>
                    <span className="font-mono text-[9px] text-zinc-400 border border-zinc-200 px-2 py-0.5 uppercase rounded-md tracking-widest bg-zinc-50 font-bold">
                      {plan.id === 'pl1' ? 'GRATUITO' : 'RECORRENTE'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-black text-xl sm:text-2xl md:text-3xl text-zinc-950 uppercase tracking-tight">
                      {plan.name}
                    </h3>
                    <p className="font-mono text-xs text-zinc-400 tracking-wider font-bold mt-1">
                      {plan.duration}
                    </p>
                  </div>

                  {/* Price Tag */}
                  <div className="pt-2 border-t border-zinc-100">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-zinc-950 tracking-tighter">
                        {plan.price}
                      </span>
                      {plan.billing && (
                        <span className="font-mono text-zinc-400 text-xs sm:text-sm font-bold uppercase">
                          {plan.billing}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[8.5px] sm:text-[9px] text-zinc-400 tracking-widest uppercase block mt-1">
                      VALOR TRANSPARENTE // SEM TAXAS OCULTAS
                    </span>
                  </div>

                  {/* Checklist Items - Vertical Stacked for Maximum Readability */}
                  <div className="space-y-3 pt-4 border-t border-zinc-100">
                    <span className="font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">
                      O QUE ESTÁ INCLUSO:
                    </span>
                    {plan.bullets.map((bullet, bulletIdx) => (
                      <div key={bulletIdx} className="flex items-start gap-2.5 text-xs md:text-[13px] text-zinc-600">
                        <div className="w-5 h-5 rounded-md bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-950 shrink-0 mt-0.5 shadow-inner">
                          <Check className="w-3.5 h-3.5 text-zinc-950" />
                        </div>
                        <span className="font-light leading-relaxed">{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Action Button */}
                <div className="pt-6 sm:pt-8 mt-6 border-t border-zinc-100">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (plan.id === 'pl1') {
                        window.dispatchEvent(new Event('open-diagnostic-modal'));
                      } else {
                        window.dispatchEvent(new Event('open-booking-modal'));
                      }
                    }}
                    className={`w-full font-mono text-xs font-bold py-4 px-6 min-h-[48px] tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-md active:scale-[0.99] ${
                      isRecommended
                        ? 'bg-red-600 hover:bg-red-500 text-white border-t border-red-400'
                        : isSelected
                        ? 'bg-zinc-950 hover:bg-zinc-800 text-white border-t border-zinc-700'
                        : 'bg-zinc-50 hover:bg-zinc-950 text-zinc-700 hover:text-white border border-zinc-200'
                    }`}
                  >
                    <span>{plan.buttonText}</span>
                  </button>
                </div>

              </motion.div>
            );
          })}
        </div>

        {/* Section Integrada: Formulário de Agendamento Rápido de Reunião */}
        <div id="formulario-agendamento" className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl space-y-3.5 sm:space-y-4">
            <span className="font-mono text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest block">
              SESSÃO ESTRATÉGICA DIRETA
            </span>
            <h3 className="font-display font-extrabold text-xl sm:text-2xl md:text-3xl text-zinc-950 uppercase tracking-tight">
              Agende sua sessão técnica de GEO
            </h3>
            <p className="text-xs md:text-sm text-zinc-500 font-light leading-relaxed">
              Insira os seus dados profissionais abaixo. Guilherme Rossi entrará em contato direto com você através de e-mail corporativo ou WhatsApp profissional em até 2 horas úteis.
            </p>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                window.dispatchEvent(new Event('open-booking-modal'));
              }}
              className="space-y-3.5 sm:space-y-4 pt-2 sm:pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                <input
                  type="text"
                  required
                  placeholder="Seu nome completo (Ex: João da Silva)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 min-h-[44px] font-mono text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 shadow-inner"
                />
                <input
                  type="email"
                  required
                  placeholder="Seu melhor e-mail profissional (Ex: joao@suaempresa.com.br)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 min-h-[44px] font-mono text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 shadow-inner"
                />
              </div>

              <button
                type="submit"
                className="w-full md:w-auto bg-zinc-950 hover:bg-zinc-800 active:scale-[0.99] text-white font-mono text-xs font-bold px-8 py-4 min-h-[48px] uppercase tracking-widest transition-all rounded-xl cursor-pointer shadow-md border-t border-zinc-700 flex items-center justify-center gap-2"
              >
                SOLICITAR AGENDAMENTO IMEDIATO ➔
              </button>
            </form>

            <div className="pt-2 text-[9.5px] sm:text-[10px] text-zinc-400 font-sans font-light flex items-center gap-1.5">
              <span>🔒 Seus dados de contato profissional serão utilizados apenas para este agendamento técnico. Nós odiamos spam e nunca enviaremos mensagens promocionais indesejadas para o seu e-mail profissional ou número de WhatsApp.</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
