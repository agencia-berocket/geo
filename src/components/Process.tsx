import { motion } from 'motion/react';
import { processSteps, team } from '../data';
import { 
  ArrowRight, Activity, Cpu, Layers, Globe, Mail, Check, Search, 
  Lock, Shield, FileText, Sparkles, Download, Terminal, AlertCircle 
} from 'lucide-react';

export default function Process() {
  const founder = team[0]; // Guilherme C. Rossi
  if (!founder) return null;

  // Render high-fidelity premium interactive dashboard widgets mimicking professional AI SaaS interfaces
  const renderIsometricIcon = (index: string) => {
    switch (index) {
      case '/01':
        // Step 1: Insira os Dados (Sleek Data Entry Dashboard Representation)
        return (
          <div className="relative w-full h-44 flex flex-col justify-between font-mono text-[8px] text-zinc-500 overflow-hidden select-none">
            {/* Top header */}
            <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-bold uppercase tracking-wider text-zinc-400">DOMAIN_SECURE_INPUT</span>
              </div>
              <span className="text-zinc-400">V1.0.4</span>
            </div>

            {/* Input Mockup 1: URL */}
            <div className="space-y-3 flex-grow justify-center flex flex-col">
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-zinc-350 transition-colors">
                <div className="w-5 h-5 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-400 shrink-0">
                  <Globe className="w-3 h-3 text-zinc-600" />
                </div>
                <div className="flex-grow text-left">
                  <div className="text-[6.5px] text-zinc-400 font-extrabold uppercase leading-none">URL DO NEGÓCIO</div>
                  <div className="text-[9.5px] font-bold text-zinc-950 mt-0.5">https://suamarca.com</div>
                </div>
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              </div>

              {/* Input Mockup 2: Email */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-zinc-350 transition-colors">
                <div className="w-5 h-5 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-400 shrink-0">
                  <Mail className="w-3 h-3 text-zinc-600" />
                </div>
                <div className="flex-grow text-left">
                  <div className="text-[6.5px] text-zinc-400 font-extrabold uppercase leading-none">E-MAIL CORPORATIVO</div>
                  <div className="text-[9.5px] font-bold text-zinc-950 mt-0.5">ceo@suamarca.com</div>
                </div>
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              </div>
            </div>

            {/* Ready State */}
            <div className="border-t border-zinc-200/60 pt-2 flex items-center justify-between text-zinc-400 text-[7.5px] font-bold tracking-wider">
              <span className="flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-emerald-500" />
                DADOS CRIPTOGRAFADOS
              </span>
              <span className="text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-100 px-1 rounded uppercase">PRONTO PARA SCAN</span>
            </div>
          </div>
        );
      case '/02':
        // Step 2: Análise Rápida (Sleek Robots Scanner Simulation)
        return (
          <div className="relative w-full h-44 flex flex-col justify-between font-mono text-[8px] text-zinc-500 overflow-hidden select-none">
            {/* Top header */}
            <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold uppercase tracking-wider text-zinc-400">RAG_SCANNER_ACTIVE</span>
              </div>
              <span className="text-zinc-400">03:00 MIN</span>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center flex-grow">
              {/* Left Side: Scanning Radar Circle */}
              <div className="col-span-5 flex items-center justify-center relative">
                <div className="w-16 h-16 rounded-full border border-zinc-200/80 bg-white flex items-center justify-center relative shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <div className="absolute inset-1.5 rounded-full border border-dashed border-zinc-350 animate-spin-slow" />
                  <span className="absolute -inset-1 rounded-full border border-blue-400 animate-ping opacity-25" />
                  <div className="w-8 h-8 rounded-full bg-zinc-950 text-white flex flex-col items-center justify-center text-center shadow-md">
                    <span className="font-display font-black text-[7px] leading-none">GEO</span>
                    <span className="text-[5px] text-zinc-400 font-mono tracking-widest leading-none uppercase mt-0.5">SCORE</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Log terminal output */}
              <div className="col-span-7 bg-zinc-950 text-zinc-400 border border-zinc-800 rounded-2xl p-2.5 shadow-md h-[105px] flex flex-col justify-between text-[6.5px] leading-tight font-mono select-none overflow-hidden">
                <div className="space-y-1 overflow-hidden">
                  <div className="text-emerald-500 font-bold">&gt; GPTBot: SCANNING_DOM</div>
                  <div>&gt; Robots.txt: ALLOWED_OAI</div>
                  <div className="text-emerald-500 font-bold">&gt; ClaudeBot: INDEX_OK</div>
                  <div>&gt; Cosine: 0.94_ALIGNMENT</div>
                  <motion.div 
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-white font-bold"
                  >
                    &gt; CALCULATING_GEO_SCORE...
                  </motion.div>
                </div>
                <div className="border-t border-zinc-800 pt-1 text-[5px] text-zinc-500 text-right">
                  PROCESS ID: #229
                </div>
              </div>
            </div>

            {/* Active Task progress bar */}
            <div className="border-t border-zinc-200/60 pt-2 flex items-center justify-between text-zinc-400 text-[7.5px] font-bold tracking-wider mt-1">
              <span className="flex items-center gap-1 uppercase">
                <Activity className="w-2.5 h-2.5 text-blue-500" />
                Simulação de RAG Ativa
              </span>
              <span className="text-blue-600">84% CONCLUÍDO</span>
            </div>
          </div>
        );
      case '/03':
        // Step 3: Plano de Ação GEO (Elegant report output preview)
        return (
          <div className="relative w-full h-44 flex flex-col justify-between font-mono text-[8px] text-zinc-500 overflow-hidden select-none">
            {/* Top header */}
            <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="font-bold uppercase tracking-wider text-zinc-400">PDF_REPORT_GENERATED</span>
              </div>
              <span className="text-zinc-400">READY</span>
            </div>

            {/* Document representation */}
            <div className="bg-white border border-zinc-200/80 p-2.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex-grow flex flex-col justify-between relative overflow-hidden h-[105px] hover:border-zinc-300 transition-colors">
              <div className="absolute top-0 right-0 bg-emerald-500 text-zinc-950 text-[5px] font-black px-2 py-0.5 rounded-bl uppercase tracking-wider">
                GEO_REPORT.PDF
              </div>

              {/* Inner mini grid display */}
              <div className="space-y-1.5 flex-grow justify-center flex flex-col">
                <div className="flex justify-between items-center text-[7px]">
                  <span className="font-bold text-zinc-900 uppercase">1. Recomendações Críticas</span>
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-1 py-0.25 rounded">3 Correcões</span>
                </div>
                
                {/* Simulated Chart preview */}
                <div className="h-9 bg-zinc-50 border border-zinc-150 rounded-md p-1 flex flex-col justify-between relative">
                  <div className="flex items-center justify-between text-[5.5px] text-zinc-400 font-bold">
                    <span>PRESENÇA EM BUSCA DE IA:</span>
                    <span className="text-emerald-600">SUA MARCA (68%)</span>
                  </div>
                  {/* Two small visual comparative bars */}
                  <div className="space-y-1">
                    <div className="h-1 bg-zinc-100 rounded-full overflow-hidden p-0.25">
                      <div className="h-full bg-emerald-500 rounded-full w-[68%]" />
                    </div>
                    <div className="h-1 bg-zinc-100 rounded-full overflow-hidden p-0.25">
                      <div className="h-full bg-rose-500 rounded-full w-[24%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom PDF indicator download buttons */}
              <div className="flex justify-between items-center border-t border-zinc-100 pt-1.5 mt-1">
                <div className="flex items-center gap-1">
                  <FileText className="w-2.5 h-2.5 text-zinc-500" />
                  <span className="text-[6px] text-zinc-400 uppercase font-black tracking-wider leading-none">Princeton Criteria V2</span>
                </div>
                <div className="bg-zinc-950 text-white text-[6px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 uppercase tracking-wider">
                  <Download className="w-2 h-2 text-white" /> Download
                </div>
              </div>
            </div>

            {/* Delivered Status */}
            <div className="border-t border-zinc-200/60 pt-2 flex items-center justify-between text-zinc-400 text-[7.5px] font-bold tracking-wider mt-1">
              <span className="flex items-center gap-1 uppercase">
                <Sparkles className="w-2.5 h-2.5 text-rose-500 animate-pulse" />
                Estratégia Completa
              </span>
              <span className="text-rose-600 font-extrabold bg-rose-50 border border-rose-100 px-1 rounded uppercase">ENTREGUE NO E-MAIL</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section id="process" className="bg-[#f4f5f8] grid-blueprint py-24 md:py-32 px-6 md:px-12 border-b border-zinc-200 relative">
      {/* Reference crosshairs */}
      <div className="absolute top-12 left-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>
      <div className="absolute bottom-12 right-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>

      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200/60 pb-8 mb-16 gap-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full" />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">PROCESSO DE ENTREGA</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-zinc-500">
            <span>Diagnóstico rápido em 3 etapas</span>
            <span className="text-zinc-400">//</span>
            <span className="text-zinc-950">Integração estratégica rápida.</span>
          </div>
        </div>

        {/* Massive section Title */}
        <div className="max-w-5xl mb-20 md:mb-24">
          <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-zinc-950 leading-[1.05] tracking-tight uppercase text-tactile-3d-dark">
            SEU PLANO DE AÇÃO<br />
            ESTRUTURADO EM<br />
            <span className="text-zinc-500/80">3 ETAPAS SIMPLES.</span>
          </h2>
        </div>

        {/* 3 Steps Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 md:mb-32">
          {processSteps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.05, ease: "easeOut" }}
              whileHover={{ y: -6, scale: 1.01, transition: { duration: 0.15 } }}
              style={{ willChange: "transform, opacity" }}
              className="tactile-raised p-8 flex flex-col justify-between rounded-3xl relative overflow-hidden group min-h-[460px] bg-white border border-zinc-200 transition-shadow duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] cursor-default"
            >
              {/* Highlight colored strip */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-zinc-950" />

              {/* Step Header */}
              <div className="flex justify-between items-center mb-6 border-b border-zinc-50 pb-3">
                <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-bold">
                  PASSO // ETAPA
                </span>
                <span className="font-display font-black text-2xl text-zinc-300 group-hover:text-zinc-950 transition-colors duration-300">
                  {step.index}
                </span>
              </div>

              {/* Recessed Claymorphic Icon Pocket */}
              <div className="flex justify-center my-6 bg-[#f1f2f5] shadow-[inset_4px_4px_12px_rgba(0,0,0,0.06),inset_-4px_-4px_12px_#fff] p-4.5 rounded-2xl border border-zinc-200">
                {renderIsometricIcon(step.index)}
              </div>

              {/* Text Area */}
              <div className="space-y-4">
                <div>
                  <span className="font-mono text-[9px] text-zinc-400 tracking-wider block font-bold uppercase">
                    {step.timeframe}
                  </span>
                  <h3 className="font-display font-extrabold text-2xl text-zinc-950 tracking-tight mt-1 uppercase">
                    {step.title}
                  </h3>
                </div>
                
                <p className="text-zinc-500 font-light text-sm leading-relaxed">
                  {step.description}
                </p>

                {/* Sub-Bullets list */}
                <div className="space-y-1.5 pt-4 border-t border-zinc-200 font-mono text-[10px] text-zinc-500">
                  {step.bullets.map((bullet, bidx) => (
                    <div key={bidx} className="flex items-center gap-2">
                      <span className="text-zinc-950 font-bold">+</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
