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
    <section id="pricing" className="bg-[#f4f5f8] grid-blueprint py-24 md:py-32 px-6 md:px-12 border-b border-zinc-200 relative">
      {/* Reference crosshairs */}
      <div className="absolute top-12 right-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>
      <div className="absolute bottom-12 left-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>

      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200/60 pb-8 mb-16 gap-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full" />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">PLANOS & INVESTIMENTO</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-zinc-500">
            <span>Investimento transparente</span>
            <span className="text-zinc-400">//</span>
            <span className="text-zinc-950">Value defined clearly.</span>
          </div>
        </div>

        {/* Large Title */}
        <div className="max-w-5xl mb-12">
          <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-zinc-950 leading-[1.05] tracking-tight uppercase text-tactile-3d-dark">
            INVESTIMENTO FECHADO<br />
            <span className="text-zinc-500/80">GARANTIA DE VISIBILIDADE</span>
          </h2>
          <p className="text-zinc-500 font-sans text-sm md:text-base mt-4 border-l-2 border-zinc-950 pl-4 font-light leading-relaxed max-w-3xl">
            Projetos corporativos estruturados com escopo fixo e validação científica de similaridade cosseno de RAG. Sem custos invisíveis.
          </p>
        </div>

        {/* 3 Pricing Plans Stacked (Vertical block stacked cards) */}
        <div className="space-y-6 mb-24 md:mb-32">
          {pricingPlans.map((plan, idx) => {
            const isSelected = plan.id === selectedPlanId;
            return (
              <motion.div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05, ease: "easeOut" }}
                whileHover={{ y: -4, scale: 1.005, transition: { duration: 0.15 } }}
                style={{ willChange: "transform, opacity" }}
                className={`tactile-raised p-8 md:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 cursor-pointer relative overflow-hidden transition-all duration-300 bg-white ${
                  isSelected
                    ? 'shadow-[12px_16px_36px_rgba(13,20,33,0.12),inset_0px_0px_0px_2px_#18181b]'
                    : 'tactile-raised-hover'
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <div className="absolute top-0 bottom-0 left-0 w-[4px] bg-zinc-950" />
                )}

                {/* Col 1: Title & Duration */}
                <div className="lg:max-w-xs flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-2.5 py-1 text-[9px] font-mono font-bold text-white uppercase tracking-widest rounded-lg"
                      style={{ backgroundColor: isSelected ? '#18181b' : plan.color }}
                    >
                      {plan.name}
                    </span>
                    <span className="font-mono text-[9px] text-zinc-400 border border-zinc-200 px-2 py-0.5 uppercase rounded-md tracking-widest bg-zinc-50 font-bold">
                      PACOTE
                    </span>
                  </div>

                  <h3 className="font-display font-extrabold text-3xl text-zinc-950 mt-1 uppercase">
                    {plan.name}
                  </h3>
                  
                  <span className="font-mono text-xs text-zinc-400 tracking-wider font-bold">
                    {plan.duration}
                  </span>
                </div>

                {/* Col 2: Pricing Tag */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display font-black text-5xl md:text-6xl text-zinc-950 tracking-tighter">
                      {plan.price}
                    </span>
                    <span className="font-mono text-zinc-400 text-sm font-bold uppercase">
                      {plan.billing}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-zinc-400 tracking-widest uppercase mt-1">
                    VALOR FINAL // RE-VETORIZAÇÃO INCLUSA
                  </span>
                </div>

                {/* Col 3: Bullets list checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 lg:max-w-md">
                  {plan.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-500">
                      <div className="w-5 h-5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-950 shrink-0 mt-0.5 shadow-inner">
                        <Check className="w-3 h-3 text-zinc-950" />
                      </div>
                      <span className="font-light leading-relaxed">{bullet}</span>
                    </div>
                  ))}
                </div>

                {/* Col 4: Action Button */}
                <div className="shrink-0">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (plan.id === 'pl1') {
                        window.dispatchEvent(new Event('open-diagnostic-modal'));
                      } else {
                        window.dispatchEvent(new Event('open-booking-modal'));
                      }
                    }}
                    className={`font-mono text-xs font-bold px-6 py-4 tracking-widest uppercase transition-all duration-300 flex items-center gap-2 rounded-xl w-full lg:w-auto justify-center cursor-pointer shadow-md ${
                      isSelected
                        ? 'bg-zinc-950 text-white hover:bg-zinc-900 border-t border-zinc-700'
                        : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 border border-zinc-200'
                    }`}
                  >
                    {plan.buttonText} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
