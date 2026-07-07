import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { faqs, team } from '../data';
import { Plus, Minus, ArrowRight, Calendar } from 'lucide-react';

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>('fq1'); // default to first open
  const founder = team[0]; // Guilherme C. Rossi

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const handleScrollToForm = () => {
    const el = document.getElementById('pricing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!founder) return null;

  return (
    <section id="faq" className="bg-[#f4f5f8] grid-blueprint py-24 md:py-32 px-6 md:px-12 border-b border-zinc-200 relative">
      {/* Reference crosshairs */}
      <div className="absolute top-12 left-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>
      <div className="absolute bottom-12 right-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>

      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200/60 pb-8 mb-16 gap-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full" />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">FAQ</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-zinc-500">
            <span>Respostas Clarificadas</span>
            <span className="text-zinc-400">//</span>
            <span className="text-zinc-950">Clear answers.</span>
          </div>
        </div>

        {/* Large Header Title */}
        <div className="max-w-5xl mb-20 md:mb-24">
          <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-zinc-950 leading-[1.05] tracking-tight uppercase text-tactile-3d-dark">
            TUDO QUE VOCÊ PRECISA<br />
            <span className="text-zinc-500/80">SABER ANTES DE COMEÇAR.</span>
          </h2>
        </div>

        {/* Two Column Accordion Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-24 md:mb-32">
          
          {/* Left Column (Col-4): Have Queries Card styled as physical panel */}
          <div className="lg:col-span-4 tactile-raised p-8 space-y-6 bg-white border border-zinc-200">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-200 shadow-inner">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=400"
                alt="b.rocket help team"
                referrerPolicy="no-referrer"
                className="w-full h-40 object-cover grayscale"
              />
            </div>
            <div className="space-y-4 px-1">
              <h3 className="font-display font-extrabold text-xl text-zinc-950 tracking-tight uppercase">
                Dúvidas sobre GEO?<br />Nós ajudamos você.
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-light">
                Reunimos as respostas para as perguntas mais frequentes de diretores de marketing e CEOs sobre o posicionamento na nova era dos assistentes de IA. Se preferir, fale com um especialista diretamente.
              </p>
              <button
                onClick={() => window.dispatchEvent(new Event('open-booking-modal'))}
                className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-mono text-[10px] font-bold py-3.5 uppercase tracking-widest transition-all rounded-xl cursor-pointer shadow-md"
              >
                <Calendar className="w-4 h-4 text-white" />
                Agendar Reunião Google Meet
              </button>
            </div>
          </div>

          {/* Right Column (Col-8): Interactive Accordion of tactile panels */}
          <div className="lg:col-span-8 space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = faq.id === openId;
              return (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.05, ease: "easeOut" }}
                  whileHover={{ y: -2, scale: 1.005, transition: { duration: 0.12 } }}
                  style={{ willChange: "transform, opacity" }}
                  className={`tactile-raised overflow-hidden transition-all duration-300 bg-white border border-zinc-200 ${
                    isOpen 
                      ? 'shadow-[6px_10px_24px_rgba(13,20,33,0.06),inset_0px_0px_0px_1.5px_#18181b]' 
                      : 'tactile-raised-hover'
                  }`}
                >
                  {/* Trigger Header */}
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full text-left py-5 px-6 flex justify-between items-center gap-6 focus:outline-none cursor-pointer group"
                  >
                    <span className="font-display font-extrabold text-base md:text-lg text-zinc-950 transition-colors uppercase tracking-tight">
                      {faq.question}
                    </span>
                    <div className="shrink-0 w-8 h-8 rounded-xl border border-zinc-250 bg-zinc-50 shadow-sm flex items-center justify-center text-zinc-950">
                      {isOpen ? <Minus className="w-4 h-4 text-zinc-950" /> : <Plus className="w-4 h-4 text-zinc-400" />}
                    </div>
                  </button>

                  {/* Expandable Content Panel */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pt-2 text-xs md:text-sm text-zinc-500 leading-relaxed font-light border-t border-zinc-100">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
