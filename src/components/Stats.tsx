import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { stats } from '../data';
import { Play, Sparkles, X, Activity } from 'lucide-react';

// Sub-component for animated counting
function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      if (start === end) return;

      const duration = 1.5; // seconds
      const totalFrames = 60 * duration;
      let frame = 0;

      const counterInterval = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        // Ease-out quad formula
        const currentCount = Math.floor(end * (1 - (1 - progress) * (1 - progress)));
        
        setCount(currentCount);

        if (frame >= totalFrames) {
          setCount(end);
          clearInterval(counterInterval);
        }
      }, 1000 / 60);

      return () => clearInterval(counterInterval);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className="font-display font-black text-5xl md:text-6xl tracking-tight text-zinc-950 select-none text-tactile-3d-dark block">
      {count}
      <span className="text-zinc-400 font-light text-3xl md:text-4xl ml-1">{suffix}</span>
    </span>
  );
}

export default function Stats() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <section id="stats" className="bg-[#f4f5f8] grid-blueprint py-24 md:py-32 px-6 md:px-12 border-b border-zinc-200 relative">
      {/* Reference crosshair */}
      <div className="absolute top-12 left-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>
      <div className="absolute bottom-12 right-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>

      <div className="max-w-7xl mx-auto">
        
        {/* Intro Blocks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-20 md:mb-24 items-start">
          {/* Main Title Col-7 */}
          <div className="lg:col-span-7 space-y-4">
            <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-bold block">Estatísticas Reais de Busca</span>
            <h3 className="font-display font-black text-3xl md:text-4xl text-zinc-950 tracking-tight uppercase leading-[1.1] max-w-2xl text-tactile-3d-dark">
              A URGÊNCIA SILENCIOSA QUE <br className="hidden md:inline" />
              <span className="text-zinc-500/80">BLOQUEIA SEU CRESCIMENTO.</span>
            </h3>
          </div>

          {/* Subtext Paragraph Col-5 */}
          <div className="lg:col-span-5">
            <p className="text-zinc-500 font-sans text-sm leading-relaxed font-light mt-2">
              O tráfego orgânico tradicional baseado em cliques está despencando mundialmente. À medida que as LLMs resolvem as dúvidas diretas, você precisa ter uma infraestrutura que te coloque no topo dos embeddings sugeridos.
            </p>
          </div>
        </div>

        {/* 4 Stats Grid with Tactile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24 md:mb-32">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.05, ease: "easeOut" }}
              style={{ willChange: "transform, opacity" }}
              className="tactile-raised p-6 flex flex-col justify-between min-h-[200px] bg-white border border-zinc-200"
            >
              {/* Animated number */}
              <div className="border-b border-zinc-100 pb-3">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              
              <div className="space-y-1.5 mt-4">
                {/* Title & Desc */}
                <h4 className="font-display font-extrabold text-sm text-zinc-950 uppercase tracking-tight">
                  {stat.title}
                </h4>
                
                <p className="text-xs text-zinc-500 font-light leading-relaxed">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Showreel Cinematic Banner inside a gorgeous thick Claymorphic frame */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ willChange: "transform, opacity" }}
          className="tactile-raised p-4 w-full h-[340px] md:h-[480px] rounded-3xl overflow-hidden group cursor-pointer bg-white border border-zinc-200"
          onClick={() => setIsVideoOpen(true)}
        >
          <div className="w-full h-full rounded-2xl overflow-hidden relative border border-zinc-200 shadow-inner">
            {/* Background image */}
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200"
              alt="b.rocket GEO Engine loop"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover brightness-[0.35] grayscale contrast-[1.15] transition-transform duration-1000 ease-out group-hover:scale-102"
            />

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:30px_30px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

            {/* Banner text label */}
            <div className="absolute top-8 left-8 flex flex-col gap-1 z-10">
              <span className="font-display font-extrabold text-lg text-white tracking-[0.2em] uppercase">b.rocket</span>
              <span className="font-mono text-[9px] text-zinc-400 tracking-[0.3em] uppercase flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-red-500" /> // METRIC_SIMULATION
              </span>
            </div>

            {/* Play Center Button Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border border-white/20 bg-black/60 backdrop-blur-md flex items-center justify-center text-white relative shadow-2xl transition-all"
              >
                {/* Pulsing ring */}
                <div className="absolute inset-0 rounded-2xl border border-white/10 animate-ping" />
                <Play className="w-8 h-8 md:w-10 md:h-10 fill-white translate-x-1 text-white" />
              </motion.div>
              
              <div className="text-center px-4">
                <span className="font-mono text-[10px] md:text-xs text-zinc-400 tracking-widest block uppercase mt-2 select-none">
                  VER DEMONSTRAÇÃO VETORIAL
                </span>
                <span className="font-display font-bold text-xs md:text-sm text-zinc-300 block mt-1">
                  Como os robôs de IA decodificam seu conteúdo em RAG.
                </span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Video Mockup Full-screen Modal */}
      {isVideoOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-start justify-center p-4 pt-6 md:pt-12 pb-12 overflow-y-auto no-scrollbar"
          onClick={() => setIsVideoOpen(false)}
        >
          <div 
            className="bg-[#f4f5f8] border border-zinc-200 w-full max-w-5xl aspect-video relative flex flex-col justify-between p-6 shadow-2xl rounded-3xl no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header info bar */}
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <span className="font-mono text-[10px] text-zinc-400 font-bold">B_ROCKET_GEO_SIMULATOR_V1.05</span>
              <button 
                onClick={() => setIsVideoOpen(false)}
                className="w-8 h-8 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-950 flex items-center justify-center transition-all focus:outline-none cursor-pointer shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video center screen */}
            <div className="flex-grow flex items-center justify-center relative overflow-hidden my-4 rounded-2xl shadow-inner border border-zinc-200 bg-zinc-950">
              <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200')` }} />
              <div className="relative z-10 flex flex-col items-center gap-4 text-center p-6">
                <Sparkles className="w-8 h-8 text-white animate-spin" />
                <h4 className="font-display font-extrabold text-2xl md:text-3xl text-white uppercase tracking-tight">
                  SIMULAÇÃO CIENTÍFICA VETORIAL
                </h4>
                <p className="text-zinc-400 font-mono text-[11px] max-w-sm font-light">
                  Análise dinâmica de similaridade cosseno de embeddings RAG.
                </p>
                {/* Simulated playback bar */}
                <div className="w-64 h-[3px] bg-zinc-900 rounded-full mt-4 overflow-hidden relative border border-zinc-800">
                  <motion.div 
                    initial={{ left: '-100%' }}
                    animate={{ left: '100%' }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                    className="absolute top-0 bottom-0 w-24 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Bottom player controls mockup */}
            <div className="flex justify-between items-center border-t border-zinc-200 pt-3 text-[10px] font-mono text-zinc-400">
              <span className="text-zinc-950 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full animate-ping" /> REALTIME PLOTTING IN PROGRESS
              </span>
              <span>RESOLUÇÃO: MULTIDIMENSIONAL VECTORS</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
