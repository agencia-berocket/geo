import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { stats } from '../data';

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      </div>
    </section>
  );
}
