import { motion } from 'motion/react';
import { Sparkles, Cpu, Target, Database, TrendingUp, ShieldCheck } from 'lucide-react';

export default function BentoExpertise() {
  return (
    <section id="expertise" className="bg-[#f4f5f8] grid-blueprint py-24 md:py-32 px-6 md:px-12 border-b border-zinc-200 relative">
      {/* Reference crosshairs */}
      <div className="absolute top-12 left-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>
      <div className="absolute bottom-12 right-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>

      <div className="max-w-7xl mx-auto">
        
        {/* Header Grid Tagline */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200/60 pb-8 mb-16 gap-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full" />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">EXPERTISING b.rocket</span>
          </div>
          <div className="font-mono text-xs text-zinc-500">
            <span>METODOLOGIA ATUALIZADA // ACADEMIC RESEARCH</span>
          </div>
        </div>

        {/* Large Bento Heading */}
        <div className="max-w-4xl mb-16">
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-zinc-950 leading-[1.08] tracking-tight uppercase">
            OS PILARES CIENTÍFICOS DO <br className="hidden md:inline" />
            <span className="text-zinc-500/80">POSICIONAMENTO EM IA (GEO)</span>
          </h2>
          <p className="text-zinc-500 font-sans text-sm md:text-base mt-4 border-l-2 border-zinc-950 pl-4 max-w-3xl leading-relaxed font-light">
            Não se trata de enganar algoritmos, mas de dominar a engenharia semântica. A metodologia da <strong className="text-zinc-950 font-semibold">b.rocket</strong> baseia-se em ciência da computação pura para calibrar como as inteligências artificiais interpretam, indexam e recomendam a sua marca.
          </p>
        </div>

        {/* Bento Grid Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card 1: Alinhamento Semântico e RAG */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
            whileHover={{ y: -6, scale: 1.01, transition: { duration: 0.2 } }}
            style={{ willChange: "transform, opacity" }}
            className="tactile-raised p-8 md:p-10 flex flex-col justify-between relative overflow-hidden bg-white rounded-3xl border border-zinc-200/80 min-h-[380px] shadow-[0_10px_30px_rgba(0,0,0,0.015)] cursor-default group"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-center group-hover:bg-zinc-950 group-hover:text-white transition-colors duration-300">
                  <Database className="w-5 h-5 text-zinc-950 group-hover:text-white transition-colors duration-300" />
                </div>
                <span className="font-mono text-[9px] text-zinc-400 tracking-wider uppercase font-bold">PILLAR // 01</span>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-display font-black text-xl text-zinc-950 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                  Alinhamento de RAG
                </h3>
                <p className="text-zinc-500 text-xs md:text-[13px] font-light leading-relaxed">
                  As inteligências artificiais usam RAG (Geração de Conteúdo com Recuperação) para buscar informações na web antes de responder ao usuário. Nós reestruturamos seus dados em fragmentos otimizados para que as LLMs encontrem e selecionem o seu negócio de forma direta e sem ruídos.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 flex items-center justify-between font-mono text-[9px] text-zinc-400">
              <span>RAG_RETRIEVAL: OPTIMIZED</span>
              <span className="text-zinc-950 font-bold">100% COMPATÍVEL</span>
            </div>
          </motion.div>

          {/* Card 2: Princeton & Georgia Tech Impact */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
            whileHover={{ y: -6, scale: 1.01, transition: { duration: 0.2 } }}
            style={{ willChange: "transform, opacity" }}
            className="tactile-raised p-8 md:p-10 flex flex-col justify-between relative overflow-hidden bg-white rounded-3xl border border-zinc-200/80 min-h-[380px] shadow-[0_10px_30px_rgba(0,0,0,0.015)] cursor-default group"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center shadow-md">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="font-mono text-[9px] text-zinc-400 tracking-wider uppercase font-bold">PILLAR // 02</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-black text-5xl text-zinc-950 tracking-tighter group-hover:text-emerald-600 transition-colors">+40%</span>
                  <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Citação</span>
                </div>
                <h3 className="font-display font-black text-lg text-zinc-950 uppercase tracking-tight mt-1">
                  Metodologia Princeton
                </h3>
                <p className="text-zinc-500 text-xs md:text-[13px] font-light leading-relaxed">
                  Baseado no estudo seminal de Princeton, Cornell e Georgia Tech. Provamos na prática que a adição de termos técnicos relevantes e dados estruturados semânticos gera um aumento médio real de 40% na probabilidade de escolha e menção do seu produto nos buscadores generativos.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 flex items-center justify-between font-mono text-[9px] text-zinc-400">
              <span>RESEARCH_PAPER: VALIDATED</span>
              <span className="text-zinc-950 font-bold">ACADEMIC LEVEL</span>
            </div>
          </motion.div>

          {/* Card 3: Cosseno Vetorial (Embeddings) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
            whileHover={{ y: -6, scale: 1.01, transition: { duration: 0.2 } }}
            style={{ willChange: "transform, opacity" }}
            className="tactile-raised p-8 md:p-10 flex flex-col justify-between relative overflow-hidden bg-white rounded-3xl border border-zinc-200/80 min-h-[380px] shadow-[0_10px_30px_rgba(0,0,0,0.015)] cursor-default group"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-center group-hover:bg-zinc-950 group-hover:text-white transition-colors duration-300">
                  <Cpu className="w-5 h-5 text-zinc-950 group-hover:text-white transition-colors duration-300" />
                </div>
                <span className="font-mono text-[9px] text-zinc-400 tracking-wider uppercase font-bold">PILLAR // 03</span>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-display font-black text-xl text-zinc-950 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                  Proximidade Vetorial
                </h3>
                <p className="text-zinc-500 text-xs md:text-[13px] font-light leading-relaxed">
                  As IAs modernas não realizam buscas por palavras-chave exatas. Elas convertem dados textuais em vetores matemáticos multidimensionais (embeddings). Calibramos o conteúdo das suas páginas para alinhar esses vetores à exata intenção de busca semântica dos tomadores de decisão.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 flex items-center justify-between font-mono text-[9px] text-zinc-400">
              <span>VECTOR_INDEX: ACTIVE</span>
              <span className="text-zinc-950 font-bold">EMBEDDINGS ENGINE</span>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
