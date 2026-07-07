import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { projects } from '../data';
import { Project } from '../types';
import { X, User, Tag, ArrowUpRight, ShieldAlert, Sparkles, Cpu, Layers } from 'lucide-react';

export default function Portfolio() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section id="projects" className="bg-[#f4f5f8] grid-blueprint py-24 md:py-32 px-6 md:px-12 border-b border-zinc-200 relative">
      {/* Reference crosshair */}
      <div className="absolute top-12 left-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>
      <div className="absolute bottom-12 right-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>

      <div className="max-w-7xl mx-auto">
        
        {/* Section Header Line */}
        <div className="flex justify-between items-center border-b border-zinc-200/60 pb-5 mb-14 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full" />
            <span>DIAGNÓSTICO // CONTEÚDO CRÍTICO</span>
          </div>
          <span>ESTUDO CIENTÍFICO DE GEO</span>
        </div>

        {/* Large Header Title */}
        <div className="max-w-4xl mb-16">
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-zinc-950 leading-[1.08] tracking-tight uppercase text-tactile-3d-dark">
            SEU SITE ESTÁ TOTALMENTE<br />
            <span className="text-zinc-500/80">INVISÍVEL PARA AS NOVAS IAs?</span>
          </h2>
          <p className="font-sans text-sm text-zinc-500 max-w-xl mt-4 font-light">
            Mais de 80% das páginas corporativas ativas falham em passar nos filtros de similaridade cosseno das inteligências artificiais. Mapeamos cada ponto de falha abaixo:
          </p>
        </div>

        {/* 12-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Side (Col-8): 2x2 Segmented Tactile Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project, idx) => {
              const isSelected = hoveredId === project.id;

              return (
                <motion.div
                   key={project.id}
                   initial={{ opacity: 0, y: 10 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.4, delay: idx * 0.05, ease: "easeOut" }}
                   onMouseEnter={() => setHoveredId(project.id)}
                   onMouseLeave={() => setHoveredId(null)}
                   onClick={() => setSelectedProject(project)}
                   style={{ willChange: "transform, opacity" }}
                   className="tactile-raised tactile-raised-hover p-8 flex flex-col justify-between min-h-[240px] cursor-pointer transition-all duration-300 relative group"
                >
                  {/* Top: Indicator Index and Title */}
                  <div className="space-y-3">
                    <span className="font-mono text-[9px] font-black tracking-widest block uppercase text-zinc-400">
                      {project.category}
                    </span>
                    <h3 className="font-display font-extrabold text-xl tracking-tight uppercase text-zinc-950">
                      {project.title}
                    </h3>
                  </div>

                  {/* Description snippet */}
                  <p className="text-xs text-zinc-500 mt-4 font-light leading-relaxed max-w-xs flex-grow">
                    {project.description}
                  </p>

                  {/* Bottom: Subtitle and Interactive Indicator */}
                  <div className="pt-5 mt-4 flex justify-between items-center border-t border-zinc-100">
                    <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest">DETALHES DO DIAGNÓSTICO</span>
                    <motion.div
                      animate={isSelected ? { rotate: 45, scale: 1.1 } : { rotate: 0, scale: 1 }}
                      className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center shrink-0 border border-white shadow-sm text-zinc-950 group-hover:bg-zinc-950 group-hover:text-white group-hover:border-transparent transition-colors duration-200"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Side (Col-4): Sleek 3D Tech Slab - Reference Image 4 & 7 style */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
            whileHover={{ y: -4, scale: 1.005, transition: { duration: 0.15 } }}
            style={{ willChange: "transform, opacity" }}
            className="lg:col-span-4 bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative min-h-[420px] shadow-2xl border-t-zinc-700 cursor-default"
          >
            {/* Ambient subtle layout graphics */}
            <div className="absolute inset-0 z-0 opacity-15">
              <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:20px_20px]" />
            </div>

            {/* Glowing neon sphere backing */}
            <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-indigo-500/20 blur-3xl select-none pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold block">
                VETORIZAÇÃO SEMÂNTICA // RAG STREAM
              </span>
              <h3 className="font-display font-black text-2xl text-white tracking-tight uppercase leading-tight pt-2">
                O fluxo de busca sintética
              </h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                As LLMs geram respostas combinando embeddings e passagens em tempo real. Se sua marca não estiver indexada nas distâncias cosseno mais próximas do vetor do usuário, ela se torna tecnicamente invisível.
              </p>
            </div>

            {/* Simulated mini node block */}
            <div className="relative z-10 bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2 mt-4">
              <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                <span>VEC_009</span>
                <span className="text-indigo-400 font-bold">MATCH SCORE: 0.982</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  whileInView={{ width: "98.2%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-indigo-500" 
                />
              </div>
            </div>

            {/* Bottom metadata tags inside the wave card */}
            <div className="relative z-10 pt-6 border-t border-zinc-900 flex justify-between items-center text-[10px] font-mono text-zinc-500">
              <span>LATENCY: 140MS</span>
              <span>GEO-SCORE RE-RANK</span>
            </div>
          </motion.div>

        </div>

      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-6 md:pt-12 pb-12 overflow-y-auto no-scrollbar"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-zinc-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-12 relative shadow-2xl rounded-3xl"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-950 flex items-center justify-center transition-all focus:outline-none cursor-pointer shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Text Pane (Col-12 full details) */}
              <div className="md:col-span-12 p-8 md:p-12 flex flex-col justify-between">
                <div className="flex flex-col gap-6">
                  {/* Category & Year */}
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[9px] text-zinc-600 bg-zinc-100 border border-zinc-200 px-3 py-1.5 uppercase tracking-widest font-extrabold rounded-lg">
                      {selectedProject.category}
                    </span>
                  </div>

                  {/* Headings */}
                  <div>
                    <h3 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-zinc-950 uppercase">
                      {selectedProject.title}
                    </h3>
                    <p className="text-zinc-500 mt-2 text-xs font-mono uppercase tracking-wider">
                      {selectedProject.subtitle}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="h-[1px] bg-zinc-200 w-full" />

                  {/* Detailed Didactical Content */}
                  {selectedProject.detailedAnalysis ? (
                    <div className="space-y-6 text-zinc-950">
                      {/* Grid: Critial and Audit */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-2xl space-y-2">
                          <h4 className="font-display font-extrabold text-xs uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4" />
                            Por Que é Crítico?
                          </h4>
                          <p className="text-xs text-zinc-600 leading-relaxed font-light">
                            {selectedProject.detailedAnalysis.whyItIsCritical}
                          </p>
                        </div>

                        <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-2xl space-y-2">
                          <h4 className="font-display font-extrabold text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                            <Cpu className="w-4 h-4" />
                            Como a b.rocket Audita?
                          </h4>
                          <p className="text-xs text-zinc-600 leading-relaxed font-light">
                            {selectedProject.detailedAnalysis.howWeAudit}
                          </p>
                        </div>
                      </div>

                      {/* Metrics Delivered */}
                      <div className="space-y-3">
                        <h4 className="font-display font-extrabold text-xs uppercase tracking-wider text-zinc-950 flex items-center gap-1.5 border-b border-zinc-100 pb-2">
                          <Layers className="w-4 h-4 text-zinc-500" />
                          Métricas Entregues no Relatório
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedProject.detailedAnalysis.metricsDelivered.map((metric, midx) => {
                            const [title, desc] = metric.split(':');
                            return (
                              <li key={midx} className="text-xs text-zinc-600 flex items-start gap-2 leading-relaxed">
                                <span className="text-zinc-950 font-bold font-mono mt-0.5">•</span>
                                <div className="font-light">
                                  <strong className="font-semibold text-zinc-950">{title}</strong>: {desc}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {/* Recommended Actions */}
                      <div className="space-y-3 bg-zinc-950 text-white p-6 rounded-2xl">
                        <h4 className="font-display font-extrabold text-xs uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-white animate-pulse" />
                          Ações Corretivas Recomendadas
                        </h4>
                        <div className="grid grid-cols-1 gap-3 pt-1">
                          {selectedProject.detailedAnalysis.recommendedActions.map((action, aidx) => (
                            <div key={aidx} className="flex items-start gap-2 text-xs text-zinc-300 font-light leading-relaxed">
                              <span className="text-zinc-100 font-mono font-bold mt-0.5">0{aidx + 1}.</span>
                              <p>{action}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-mono text-[10px] text-zinc-950 uppercase tracking-widest font-extrabold">
                        Metodologia b.rocket de Diagnóstico
                      </h4>
                      <p className="text-zinc-600 text-sm leading-relaxed font-light">
                        {selectedProject.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer metadata details */}
                <div className="grid grid-cols-2 gap-4 mt-8 border-t border-zinc-150 pt-6 font-mono text-[10px] text-zinc-500">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-zinc-950" />
                    <span>ALVO: {selectedProject.client}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-zinc-950" />
                    <span>TIPO: RE-RANKING</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
