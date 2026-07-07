import { motion } from 'motion/react';
import { team } from '../data';
import { Linkedin, ArrowRight, ShieldCheck, Cpu, Target, Layers } from 'lucide-react';

export default function Team() {
  const founder = team[0]; // Guilherme C. Rossi

  const handleScrollToForm = () => {
    const el = document.getElementById('pricing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!founder) return null;

  return (
    <section id="team" className="bg-[#f4f5f8] grid-blueprint py-24 md:py-32 px-6 md:px-12 border-b border-zinc-200 relative">
      {/* Reference crosshairs */}
      <div className="absolute top-12 left-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>
      <div className="absolute bottom-12 right-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>

      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200/60 pb-8 mb-16 gap-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full" />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">O FUNDADOR</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-zinc-500">
            <span>Especialista e Consultor</span>
            <span className="text-zinc-400">//</span>
            <span className="text-zinc-950">Direct Consultation.</span>
          </div>
        </div>

        {/* Large Header Title */}
        <div className="max-w-5xl mb-16">
          <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-zinc-950 leading-[1.05] tracking-tight uppercase text-tactile-3d-dark">
            QUEM CONDUZ SUA<br />
            <span className="text-zinc-500/80">OTIMIZAÇÃO SINTÉTICA</span>
          </h2>
        </div>
        
        {/* Asymmetrical Profile Layout - Reconstructed to be simpler, more fluid and editorial */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Left Column: Refined, Smaller Portrait */}
          <div className="lg:col-span-3 flex flex-col items-center lg:items-start space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative shrink-0"
            >
              {/* Picture wrapper - increased by 50% in size, removed outer border & padding */}
              <div className="relative w-60 h-60 sm:w-64 sm:h-64 rounded-3xl overflow-hidden bg-zinc-50">
                <img
                  src={founder.image}
                  alt={founder.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/25 via-transparent to-transparent pointer-events-none" />
              </div>
            </motion.div>

            {/* Status indicator aligned below image */}
            <div className="font-mono text-[8.5px] text-zinc-500 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span>ONLINE DE SÃO PAULO</span>
            </div>
          </div>
 
          {/* Right Column: Bio Details */}
          <div className="lg:col-span-9 space-y-8">
            
            {/* Bio Title Block */}
            <div className="space-y-4">
              <span className="font-mono text-[9px] text-zinc-400 font-bold uppercase tracking-[0.25em]">
                SOBRE O ESPECIALISTA
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-zinc-950 tracking-tight leading-none uppercase mt-2">
                {founder.name}
              </h3>
              <p className="font-display font-extrabold text-base sm:text-lg text-zinc-650 leading-snug uppercase border-l border-zinc-900 pl-4 py-0.5">
                {founder.bio}
              </p>
            </div>
 
            {/* Deep Biography Content */}
            <div className="font-sans font-light text-zinc-600 text-sm md:text-[14.5px] space-y-5 leading-relaxed">
              <p>
                Ao longo da minha trajetória, desenvolvi experiência sólida em <span className="font-semibold text-zinc-950">SEO, marketing digital, produção de conteúdo, estratégia de posicionamento e otimização de presença online</span>. 
              </p>
              <p>
                Hoje, aplico esse conhecimento em <span className="font-semibold text-zinc-950">GEO (Generative Engine Optimization)</span>, criando estratégias cirúrgicas para aumentar as chances de marcas, produtos e serviços serem encontrados, compreendidos e recomendados de forma orgânica e legítima por plataformas de IA generativa líderes como <span className="font-medium text-zinc-950">ChatGPT, Claude, Gemini e Perplexity</span>.
              </p>
              <p>
                Meu objetivo principal é preparar empresas para um cenário de mercado dinâmico, em que as respostas estruturadas geradas por inteligência artificial influenciam e ditam cada vez mais as decisões de compra e a descoberta de marcas. Mais do que simplesmente melhorar rankings, eu trabalho para <span className="font-semibold text-zinc-950">construir autoridade, relevância e presença</span> onde o futuro das buscas já está acontecendo hoje.
              </p>
            </div>

            {/* Integrated micro value metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4.5 shadow-[0_5px_15px_rgba(0,0,0,0.01)]">
                <span className="font-mono text-[9px] text-zinc-400 font-bold block uppercase mb-1">MÉTODO</span>
                <span className="font-display font-extrabold text-sm text-zinc-950 block uppercase tracking-tight">GEO Avançado</span>
                <p className="text-[11px] text-zinc-500 font-light mt-1">Estratégias estruturadas focadas em LLMs e RAG.</p>
              </div>
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4.5 shadow-[0_5px_15px_rgba(0,0,0,0.01)]">
                <span className="font-mono text-[9px] text-zinc-400 font-bold block uppercase mb-1">FOCO</span>
                <span className="font-display font-extrabold text-sm text-zinc-950 block uppercase tracking-tight">Autoridade</span>
                <p className="text-[11px] text-zinc-500 font-light mt-1">Garantir que sua marca seja a primeira recomendada.</p>
              </div>
            </div>
 
            {/* Pillar Blocks */}
            <div className="bg-zinc-100/60 border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-6">
              <h4 className="font-mono text-[9px] text-zinc-950 font-black uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                ÁREAS DE ATUAÇÃO E PILARES TÉCNICOS
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-950 shadow-sm shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-display font-extrabold text-xs text-zinc-950 uppercase tracking-wide">Posicionamento RAG</h5>
                    <p className="text-[11px] text-zinc-550 leading-relaxed font-light">Alinhamento de copy e estrutura técnica para alimentar os bancos de dados vetoriais de IA.</p>
                  </div>
                </div>
 
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-950 shadow-sm shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-display font-extrabold text-xs text-zinc-950 uppercase tracking-wide">Otimização Semântica</h5>
                    <p className="text-[11px] text-zinc-550 leading-relaxed font-light">Estruturação de dados on-page, JSON-LD robusto e relações de termos por proximidade.</p>
                  </div>
                </div>
 
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-950 shadow-sm shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-display font-extrabold text-xs text-zinc-950 uppercase tracking-wide">Construção de Autoridade</h5>
                    <p className="text-[11px] text-zinc-550 leading-relaxed font-light">Menções contextuais, citações digitais qualificadas e fontes externas de alta reputação.</p>
                  </div>
                </div>
 
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-950 shadow-sm shrink-0">
                    <Linkedin className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-display font-extrabold text-xs text-zinc-950 uppercase tracking-wide">Estratégias de Visibilidade</h5>
                    <p className="text-[11px] text-zinc-550 leading-relaxed font-light">Diagnóstico detalhado dos robôs de IA que mapeiam sua marca e soluções de correção.</p>
                  </div>
                </div>
 
              </div>
            </div>
 
          </div>
        </div>
      </div>
    </section>
  );
}

