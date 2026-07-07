import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { services } from '../data';
import { 
  Check, Search, Sparkles, Database, Code, CircleDot, Terminal,
  Users, GraduationCap, Globe, Network, Quote, FileText, Scissors, 
  Copy, Bot, Zap, ArrowDown, HelpCircle, Eye, Settings, Cpu
} from 'lucide-react';

export default function Services() {
  const [activeId, setActiveId] = useState<string>(services[0].id); // default to first

  const activeService = services.find((s) => s.id === activeId) || services[0];

  // Render visual graphic structures matching GEO disciplines with beautiful claymorphic elements
  const renderGraphic = (type: string) => {
    switch (type) {
      case 'spheres':
        // AEO / Direct point: Pulse waves targeting direct answer index (Fórmula Direto ao Ponto)
        return (
          <div className="relative w-full bg-[#f1f2f5] shadow-[inset_4px_4px_12px_rgba(0,0,0,0.06),inset_-4px_-4px_12px_#fff] border border-zinc-200/50 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center overflow-hidden min-h-[440px] select-none">
            <div className="absolute top-3 left-4 font-mono text-[8px] text-zinc-400">SYSTEM: ANSWER_ENGINE_PULSE // AEO</div>
            
            {/* Pipeline wrapper */}
            <div className="w-full flex flex-col gap-6 mt-4">
              
              {/* Desktop version of the 5-stage pipeline row */}
              <div className="hidden md:grid grid-cols-5 gap-2.5 items-center w-full relative">
                
                {/* Stage 1: Conteúdo Bruto */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-2.5 text-center flex flex-col items-center justify-center h-32 relative z-10 hover:border-zinc-300 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-500 mb-1.5 shadow-inner">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="font-display font-black text-[8px] text-zinc-950 uppercase tracking-tight leading-tight">
                    CONTEÚDO BRUTO
                  </div>
                  <p className="font-sans text-[6.5px] text-zinc-400 leading-tight mt-1 max-w-[80px]">
                    Artigo longo e prolixo tradicional
                  </p>
                </div>

                {/* Arrow connecting */}
                <div className="absolute left-[17%] w-[7%] flex justify-center z-0">
                  <span className="font-mono text-xs text-zinc-300 animate-pulse">&gt;</span>
                </div>

                {/* Stage 2: Extração */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-2.5 text-center flex flex-col items-center justify-center h-32 relative z-10 hover:border-zinc-300 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-500 mb-1.5 shadow-inner">
                    <Search className="w-4 h-4" />
                  </div>
                  <div className="font-display font-black text-[8px] text-zinc-950 uppercase tracking-tight leading-tight">
                    EXTRAÇÃO
                  </div>
                  <p className="font-sans text-[6.5px] text-zinc-400 leading-tight mt-1 max-w-[80px]">
                    Identificação de dúvidas do usuário
                  </p>
                </div>

                {/* Arrow connecting */}
                <div className="absolute left-[37%] w-[7%] flex justify-center z-0">
                  <span className="font-mono text-xs text-zinc-300 animate-pulse">&gt;</span>
                </div>

                {/* Stage 3: AEO Radar Center */}
                <div className="flex flex-col items-center justify-center relative z-10">
                  <div className="bg-zinc-950 text-white border border-zinc-800 rounded-full w-16 h-16 shadow-lg flex flex-col items-center justify-center relative">
                    <div className="absolute -inset-1.5 rounded-full border border-zinc-900/40 animate-ping opacity-35" />
                    
                    <div className="bg-white text-zinc-950 rounded-full w-10 h-10 flex items-center justify-center font-display font-black text-xs shadow-md border border-zinc-800">
                      AEO
                    </div>
                  </div>
                </div>

                {/* Arrow connecting */}
                <div className="absolute left-[59%] w-[7%] flex justify-center z-0">
                  <span className="font-mono text-xs text-zinc-300 animate-pulse">&gt;</span>
                </div>

                {/* Stage 4: Resposta Direta */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-2.5 text-center flex flex-col items-center justify-center h-32 relative z-10 hover:border-zinc-300 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-emerald-500 mb-1.5 shadow-inner">
                    <Zap className="w-4 h-4 animate-pulse text-emerald-500" />
                  </div>
                  <div className="font-display font-black text-[8px] text-zinc-950 uppercase tracking-tight leading-tight">
                    RESPOSTA DIRETA
                  </div>
                  <p className="font-sans text-[6.5px] text-zinc-400 leading-tight mt-1 max-w-[80px]">
                    Máxima resposta em &lt;60 palavras
                  </p>
                </div>

                {/* Arrow connecting */}
                <div className="absolute left-[79%] w-[7%] flex justify-center z-0">
                  <span className="font-mono text-xs text-zinc-300 animate-pulse">&gt;</span>
                </div>

                {/* Stage 5: IA Compreende */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-2.5 text-center flex flex-col items-center justify-center h-32 relative z-10 hover:border-zinc-300 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-indigo-500 mb-1.5 shadow-inner">
                    <Bot className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="font-display font-black text-[8px] text-zinc-950 uppercase tracking-tight leading-tight">
                    IA COMPREENDE
                  </div>
                  <p className="font-sans text-[6.5px] text-zinc-400 leading-tight mt-1 max-w-[80px]">
                    Índice, resume e recomenda
                  </p>
                </div>

              </div>

              {/* Mobile version of the 5-stage pipeline column (Vertical) */}
              <div className="grid grid-cols-1 gap-3.5 items-center w-full relative md:hidden py-2 max-w-[280px] mx-auto">
                
                {/* Stage 1: Conteúdo Bruto */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-3 text-center flex flex-col items-center justify-center w-full relative z-10 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-500 mb-1.5 shadow-inner">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div className="font-display font-black text-[9.5px] text-zinc-950 uppercase tracking-tight leading-tight">
                    CONTEÚDO BRUTO
                  </div>
                  <p className="font-sans text-[8px] text-zinc-400 leading-tight mt-1 max-w-[200px]">
                    Artigo longo e prolixo tradicional
                  </p>
                </div>

                {/* Arrow connecting */}
                <div className="flex justify-center z-0 -my-1">
                  <span className="font-mono text-xs text-zinc-300 animate-pulse">▼</span>
                </div>

                {/* Stage 2: Extração */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-3 text-center flex flex-col items-center justify-center w-full relative z-10 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-500 mb-1.5 shadow-inner">
                    <Search className="w-4.5 h-4.5" />
                  </div>
                  <div className="font-display font-black text-[9.5px] text-zinc-950 uppercase tracking-tight leading-tight">
                    EXTRAÇÃO
                  </div>
                  <p className="font-sans text-[8px] text-zinc-400 leading-tight mt-1 max-w-[200px]">
                    Identificação de dúvidas do usuário
                  </p>
                </div>

                {/* Arrow connecting */}
                <div className="flex justify-center z-0 -my-1">
                  <span className="font-mono text-xs text-zinc-300 animate-pulse">▼</span>
                </div>

                {/* Stage 3: AEO Radar Center */}
                <div className="flex flex-col items-center justify-center relative z-10 py-1">
                  <div className="bg-zinc-950 text-white border border-zinc-800 rounded-full w-14 h-14 shadow-lg flex flex-col items-center justify-center relative">
                    <div className="absolute -inset-1 rounded-full border border-zinc-900/40 animate-ping opacity-35" />
                    
                    <div className="bg-white text-zinc-950 rounded-full w-9 h-9 flex items-center justify-center font-display font-black text-[11px] shadow-md border border-zinc-800">
                      AEO
                    </div>
                  </div>
                </div>

                {/* Arrow connecting */}
                <div className="flex justify-center z-0 -my-1">
                  <span className="font-mono text-xs text-zinc-300 animate-pulse">▼</span>
                </div>

                {/* Stage 4: Resposta Direta */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-3 text-center flex flex-col items-center justify-center w-full relative z-10 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-emerald-500 mb-1.5 shadow-inner">
                    <Zap className="w-4.5 h-4.5 animate-pulse text-emerald-500" />
                  </div>
                  <div className="font-display font-black text-[9.5px] text-zinc-950 uppercase tracking-tight leading-tight">
                    RESPOSTA DIRETA
                  </div>
                  <p className="font-sans text-[8px] text-zinc-400 leading-tight mt-1 max-w-[200px]">
                    Máxima resposta em &lt;60 palavras
                  </p>
                </div>

                {/* Arrow connecting */}
                <div className="flex justify-center z-0 -my-1">
                  <span className="font-mono text-xs text-zinc-300 animate-pulse">▼</span>
                </div>

                {/* Stage 5: IA Compreende */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-3 text-center flex flex-col items-center justify-center w-full relative z-10 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-indigo-500 mb-1.5 shadow-inner">
                    <Bot className="w-4.5 h-4.5 text-indigo-500" />
                  </div>
                  <div className="font-display font-black text-[9.5px] text-zinc-950 uppercase tracking-tight leading-tight">
                    IA COMPREENDER
                  </div>
                  <p className="font-sans text-[8px] text-zinc-400 leading-tight mt-1 max-w-[200px]">
                    Índice, resume e recomenda
                  </p>
                </div>

              </div>

              {/* Bottom Compression Slider */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[8px] text-zinc-400 uppercase tracking-widest font-extrabold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    COMPRESSÃO SEMÂNTICA:
                  </span>
                  <span className="font-mono text-[8px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-widest">
                    &lt;60 PALAVRAS
                  </span>
                </div>

                {/* Visual slider progress indicator */}
                <div className="space-y-1">
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden relative border border-zinc-200/80 p-0.5">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2.5, ease: "easeOut" }}
                      className="h-full bg-emerald-500 rounded-full relative"
                    >
                      {/* Pulse point at the end of progress */}
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-md border-2 border-emerald-600" />
                    </motion.div>
                  </div>
                  
                  {/* Slider Labels */}
                  <div className="flex justify-between font-mono text-[7px] text-zinc-400 font-bold px-1">
                    <span>0 PALAVRAS</span>
                    <span>20</span>
                    <span>40</span>
                    <span className="text-emerald-600">60 MAX</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      case 'nodes':
        // EEAT Optimization: Trust authority connecting nodes (E-E-A-T Avançado)
        return (
          <div className="relative w-full bg-[#f1f2f5] shadow-[inset_4px_4px_12px_rgba(0,0,0,0.06),inset_-4px_-4px_12px_#fff] border border-zinc-200/50 rounded-2xl p-6 flex flex-col items-center justify-center overflow-hidden min-h-[440px] select-none">
            
            {/* Legend / System ID header */}
            <div className="absolute top-3 left-4 right-4 flex justify-between items-center font-mono text-[8px] text-zinc-400">
              <span>SYSTEM: EEAT_AUTHORITY_GRAPH</span>
              <div className="flex gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-[1.5px] bg-zinc-950 inline-block" />
                  ALTA INFLUÊNCIA
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-[1.5px] border-t border-dashed border-zinc-400 inline-block" />
                  INFLUÊNCIA MÉDIA
                </span>
              </div>
            </div>

            {/* Layout Wrapper */}
            <div className="hidden md:flex relative w-full overflow-hidden items-center justify-center min-h-[220px] min-[400px]:min-h-[270px] sm:min-h-[340px] md:min-h-[440px] mt-6">
              <div className="scale-[0.52] min-[400px]:scale-[0.65] sm:scale-[0.8] md:scale-100 origin-center flex items-center justify-center shrink-0 w-[540px] h-[400px] relative">
                
                {/* Central connecting SVG */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 400">
                  {/* Concentric scientific circular guide lines */}
                  <circle cx="250" cy="200" r="55" fill="none" stroke="#e4e4e7" strokeWidth="0.75" />
                  <circle cx="250" cy="200" r="105" fill="none" stroke="#e4e4e7" strokeWidth="0.5" strokeDasharray="3 4" />
                  <circle cx="250" cy="200" r="155" fill="none" stroke="#e4e4e7" strokeWidth="0.5" strokeDasharray="3 4" />

                  {/* Connection lines from center (250,200) to each node */}
                  {/* 1. Especialistas (250, 40) */}
                  <line x1="250" y1="200" x2="250" y2="40" stroke="#18181b" strokeWidth="1" />
                  {/* 2. Estudos (410, 92) */}
                  <line x1="250" y1="200" x2="410" y2="92" stroke="#18181b" strokeWidth="1" />
                  {/* 3. Dados (440, 200) */}
                  <line x1="250" y1="200" x2="440" y2="200" stroke="#18181b" strokeWidth="1" />
                  {/* 4. Fontes (410, 308) */}
                  <line x1="250" y1="200" x2="410" y2="308" stroke="#a1a1aa" strokeWidth="0.75" strokeDasharray="3 3" />
                  {/* 5. Entidades (250, 360) */}
                  <line x1="250" y1="200" x2="250" y2="360" stroke="#a1a1aa" strokeWidth="0.75" strokeDasharray="3 3" />
                  {/* 6. Schema (90, 308) */}
                  <line x1="250" y1="200" x2="90" y2="308" stroke="#a1a1aa" strokeWidth="0.75" strokeDasharray="3 3" />
                  {/* 7. Citações (60, 200) */}
                  <line x1="250" y1="200" x2="60" y2="200" stroke="#18181b" strokeWidth="1" />
                  {/* 8. Artigos (90, 92) */}
                  <line x1="250" y1="200" x2="90" y2="92" stroke="#18181b" strokeWidth="1" />

                  {/* Animated traveling pulses on paths */}
                  <motion.circle cx="250" cy="200" r="2.5" fill="#10b981" animate={{ cy: [200, 40] }} transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }} />
                  <motion.circle cx="250" cy="200" r="2.5" fill="#10b981" animate={{ cx: [250, 410], cy: [200, 92] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} />
                  <motion.circle cx="250" cy="200" r="2.5" fill="#10b981" animate={{ cx: [250, 440] }} transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }} />
                  <motion.circle cx="250" cy="200" r="2" fill="#a1a1aa" animate={{ cx: [250, 410], cy: [200, 308] }} transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }} />
                  <motion.circle cx="250" cy="200" r="2" fill="#a1a1aa" animate={{ cy: [200, 360] }} transition={{ duration: 3.0, repeat: Infinity, ease: "linear" }} />
                  <motion.circle cx="250" cy="200" r="2" fill="#a1a1aa" animate={{ cx: [250, 90], cy: [200, 308] }} transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }} />
                  <motion.circle cx="250" cy="200" r="2.5" fill="#10b981" animate={{ cx: [250, 60] }} transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }} />
                  <motion.circle cx="250" cy="200" r="2.5" fill="#10b981" animate={{ cx: [250, 90], cy: [200, 92] }} transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }} />
                </svg>

                {/* Center Node: Sua Marca */}
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="relative flex flex-col items-center">
                    <div className="absolute -inset-5 rounded-full border border-zinc-950/5 animate-ping opacity-25" />
                    <div className="bg-white border border-zinc-200/80 rounded-full w-20 h-20 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center p-2.5 text-center">
                      <div className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center text-emerald-400 mb-1 shadow-xs">
                        <Settings className="w-4 h-4 animate-spin-slow text-emerald-400" />
                      </div>
                      <div className="font-display font-black text-[9px] tracking-tight text-zinc-950 uppercase leading-none">SUA MARCA</div>
                      <div className="font-mono text-[5.5px] text-zinc-400 font-bold uppercase mt-0.5 tracking-wider leading-none">ENTIDADE PRINCIPAL</div>
                    </div>
                  </div>
                </div>

                {/* The 8 Badges orbiting */}
                {/* 1. Especialistas (Top) */}
                <div className="absolute top-[4%] left-[50%] -translate-x-1/2 z-10">
                  <div className="bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-2xl py-1.5 px-3 flex items-center gap-2 min-w-[130px] transition-all duration-300 hover:border-zinc-350">
                    <div className="w-5 h-5 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-600 shrink-0 shadow-inner">
                      <Users className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                      <div className="font-display font-black text-[8.5px] text-zinc-950 uppercase tracking-tight leading-tight">ESPECIALISTAS</div>
                      <div className="font-mono text-[6.5px] text-zinc-400 font-bold uppercase tracking-wider leading-tight">AUTORES VERIFICADOS</div>
                    </div>
                  </div>
                </div>

                {/* 2. Estudos (Top-Right) */}
                <div className="absolute top-[18%] left-[82%] -translate-x-1/2 z-10">
                  <div className="bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-2xl py-1.5 px-3 flex items-center gap-2 min-w-[130px] transition-all duration-300 hover:border-zinc-350">
                    <div className="w-5 h-5 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-600 shrink-0 shadow-inner">
                      <GraduationCap className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                      <div className="font-display font-black text-[8.5px] text-zinc-950 uppercase tracking-tight leading-tight">ESTUDOS</div>
                      <div className="font-mono text-[6.5px] text-zinc-400 font-bold uppercase tracking-wider leading-tight">PESQUISAS E DADOS</div>
                    </div>
                  </div>
                </div>

                {/* 3. Dados (Right) */}
                <div className="absolute top-[50%] left-[88%] -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-2xl py-1.5 px-3 flex items-center gap-2 min-w-[130px] transition-all duration-300 hover:border-zinc-350">
                    <div className="w-5 h-5 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-600 shrink-0 shadow-inner">
                      <Database className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                      <div className="font-display font-black text-[8.5px] text-zinc-950 uppercase tracking-tight leading-tight">DADOS</div>
                      <div className="font-mono text-[6.5px] text-zinc-400 font-bold uppercase tracking-wider leading-tight">NÚMEROS E ESTATÍSTICAS</div>
                    </div>
                  </div>
                </div>

                {/* 4. Fontes (Bottom-Right) */}
                <div className="absolute top-[78%] left-[82%] -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-2xl py-1.5 px-3 flex items-center gap-2 min-w-[130px] opacity-85 transition-all duration-300 hover:border-zinc-350">
                    <div className="w-5 h-5 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-600 shrink-0 shadow-inner">
                      <Globe className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                      <div className="font-display font-black text-[8.5px] text-zinc-950 uppercase tracking-tight leading-tight">FONTES</div>
                      <div className="font-mono text-[6.5px] text-zinc-400 font-bold uppercase tracking-wider leading-tight">DOMÍNIOS CONFIÁVEIS</div>
                    </div>
                  </div>
                </div>

                {/* 5. Entidades (Bottom) */}
                <div className="absolute top-[90%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-2xl py-1.5 px-3 flex items-center gap-2 min-w-[130px] opacity-85 transition-all duration-300 hover:border-zinc-350">
                    <div className="w-5 h-5 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-600 shrink-0 shadow-inner">
                      <Network className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                      <div className="font-display font-black text-[8.5px] text-zinc-950 uppercase tracking-tight leading-tight">ENTIDADES</div>
                      <div className="font-mono text-[6.5px] text-zinc-400 font-bold uppercase tracking-wider leading-tight">CONEXÕES SEMÂNTICAS</div>
                    </div>
                  </div>
                </div>

                {/* 6. Schema (Bottom-Left) */}
                <div className="absolute top-[78%] left-[18%] -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-2xl py-1.5 px-3 flex items-center gap-2 min-w-[130px] opacity-85 transition-all duration-300 hover:border-zinc-350">
                    <div className="w-5 h-5 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-600 shrink-0 shadow-inner">
                      <Code className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                      <div className="font-display font-black text-[8.5px] text-zinc-950 uppercase tracking-tight leading-tight">SCHEMA</div>
                      <div className="font-mono text-[6.5px] text-zinc-400 font-bold uppercase tracking-wider leading-tight">DADOS ESTRUTURADOS</div>
                    </div>
                  </div>
                </div>

                {/* 7. Citações (Left) */}
                <div className="absolute top-[50%] left-[12%] -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-2xl py-1.5 px-3 flex items-center gap-2 min-w-[130px] transition-all duration-300 hover:border-zinc-350">
                    <div className="w-5 h-5 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-600 shrink-0 shadow-inner">
                      <Quote className="w-3 h-3 text-zinc-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-display font-black text-[8.5px] text-zinc-950 uppercase tracking-tight leading-tight">CITAÇÕES</div>
                      <div className="font-mono text-[6.5px] text-zinc-400 font-bold uppercase tracking-wider leading-tight">MENÇÕES E REFERÊNCIAS</div>
                    </div>
                  </div>
                </div>

                {/* 8. Artigos (Top-Left) */}
                <div className="absolute top-[18%] left-[18%] -translate-x-1/2 z-10">
                  <div className="bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-2xl py-1.5 px-3 flex items-center gap-2 min-w-[130px] transition-all duration-300 hover:border-zinc-350">
                    <div className="w-5 h-5 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-600 shrink-0 shadow-inner">
                      <FileText className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                      <div className="font-display font-black text-[8.5px] text-zinc-950 uppercase tracking-tight leading-tight">ARTIGOS</div>
                      <div className="font-mono text-[6.5px] text-zinc-400 font-bold uppercase tracking-wider leading-tight">CONTEÚDO ORIGINAL</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Mobile-Optimized Authority Grid (Visible only on mobile < md) */}
            <div className="block md:hidden w-full mt-8 space-y-4">
              {/* Central entity card representing "Sua Marca" */}
              <div className="bg-zinc-950 text-white rounded-2xl p-4 border border-zinc-800 shadow-md flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <Settings className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <div className="font-display font-black text-[11px] tracking-wider uppercase leading-none">SUA MARCA</div>
                  <div className="font-mono text-[7px] text-zinc-400 font-bold uppercase mt-1 tracking-widest leading-none">ENTIDADE PRINCIPAL</div>
                </div>
                <div className="ml-auto bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-mono text-[6.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                  ATIVO
                </div>
              </div>

              {/* Grid of the 8 orbiting nodes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Users, label: 'ESPECIALISTAS', sub: 'AUTORES VERIFICADOS', influence: 'alta' },
                  { icon: GraduationCap, label: 'ESTUDOS', sub: 'PESQUISAS E DADOS', influence: 'alta' },
                  { icon: Database, label: 'DADOS', sub: 'NÚMEROS E ESTATÍSTICAS', influence: 'alta' },
                  { icon: Quote, label: 'CITAÇÕES', sub: 'MENÇÕES E REFERÊNCIAS', influence: 'alta' },
                  { icon: FileText, label: 'ARTIGOS', sub: 'CONTEÚDO ORIGINAL', influence: 'alta' },
                  { icon: Globe, label: 'FONTES', sub: 'DOMÍNIOS CONFIÁVEIS', influence: 'media' },
                  { icon: Code, label: 'SCHEMA', sub: 'DADOS ESTRUTURADOS', influence: 'media' },
                  { icon: Network, label: 'ENTIDADES', sub: 'CONEXÕES SEMÂNTICAS', influence: 'media' },
                ].map((node, index) => {
                  const IconComp = node.icon;
                  return (
                    <div key={index} className="bg-white border border-zinc-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-700 shrink-0 shadow-inner">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-display font-black text-[9.5px] text-zinc-950 uppercase tracking-tight leading-none">{node.label}</div>
                          <div className="font-mono text-[7px] text-zinc-400 font-bold uppercase tracking-wider leading-none mt-1">{node.sub}</div>
                        </div>
                      </div>
                      
                      <div>
                        {node.influence === 'alta' ? (
                          <span className="inline-flex items-center gap-1 bg-zinc-950 text-white font-mono text-[6px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full leading-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ALTA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-zinc-50 border border-zinc-200 text-zinc-400 font-mono text-[6px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full leading-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                            MÉDIA
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 'geometrics':
        // Chunking Chunk Index (Fragmentação Eficiente)
        return (
          <div className="relative w-full bg-[#f1f2f5] shadow-[inset_4px_4px_12px_rgba(0,0,0,0.06),inset_-4px_-4px_12px_#fff] border border-zinc-200/50 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center overflow-hidden min-h-[440px] select-none">
            <div className="absolute top-3 left-4 font-mono text-[8px] text-zinc-400">SYSTEM: CHUNK_SEGMENTATION_GRID</div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full items-center mt-4">
              
              {/* Left Column: Webpage Mockup */}
              <div className="md:col-span-3 bg-white border border-zinc-200/80 rounded-3xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] h-[280px] flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-2 left-3 flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-zinc-950 rounded flex items-center justify-center text-white font-mono text-[9px] font-black shadow-xs">B.</div>
                  <div className="h-2 bg-zinc-100 rounded w-16" />
                </div>
                
                {/* Simulated Content Body */}
                <div className="space-y-3.5 mt-8 flex-grow">
                  <div className="font-display font-black text-[10px] text-zinc-950 uppercase tracking-tight leading-tight">
                    TÍTULO PRINCIPAL DO CONTEÚDO
                  </div>
                  
                  {/* Highlights acting as Chunks */}
                  <div className="space-y-2">
                    <div className="bg-emerald-50/75 border-l-2 border-emerald-500 p-1 rounded-r-md relative">
                      <div className="h-1 bg-emerald-450/30 rounded w-full" />
                      <div className="h-1 bg-emerald-450/30 rounded w-3/4 mt-1" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    
                    <div className="bg-amber-50/75 border-l-2 border-amber-500 p-1 rounded-r-md relative">
                      <div className="h-1 bg-amber-450/30 rounded w-full" />
                      <div className="h-1 bg-amber-450/30 rounded w-5/6 mt-1" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </div>

                    <div className="bg-zinc-50 border-l-2 border-zinc-400 p-1 rounded-r-md relative">
                      <div className="h-1 bg-zinc-350/40 rounded w-full" />
                      <div className="h-1 bg-zinc-350/40 rounded w-1/2 mt-1" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    </div>
                  </div>
                </div>

                <div className="font-mono text-[7px] text-zinc-300 text-center uppercase tracking-widest border-t border-zinc-100 pt-2">
                  PARSED_SOURCE_DOM
                </div>
              </div>

              {/* Middle Column: The 6 Chunks */}
              <div className="md:col-span-6 grid grid-cols-2 gap-2">
                {[
                  { id: '00', text: 'Introdução e contexto principal', rel: 'ALTA RELEVÂNCIA', color: 'bg-emerald-500', textCol: 'text-emerald-600', val: '85%' },
                  { id: '01', text: 'Definição e conceitos-chave', rel: 'ALTA RELEVÂNCIA', color: 'bg-emerald-500', textCol: 'text-emerald-600', val: '90%' },
                  { id: '02', text: 'Benefícios e aplicações', rel: 'MÉDIA RELEVÂNCIA', color: 'bg-amber-500', textCol: 'text-amber-600', val: '65%' },
                  { id: '03', text: 'Metodologia e processo', rel: 'MÉDIA RELEVÂNCIA', color: 'bg-amber-500', textCol: 'text-amber-600', val: '55%' },
                  { id: '04', text: 'Exemplos e casos práticos', rel: 'BAIXA RELEVÂNCIA', color: 'bg-zinc-400', textCol: 'text-zinc-500', val: '30%' },
                  { id: '05', text: 'Conclusão e próximos passos', rel: 'BAIXA RELEVÂNCIA', color: 'bg-zinc-400', textCol: 'text-zinc-500', val: '25%' },
                ].map((chk, i) => (
                  <motion.div
                    key={chk.id}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white border border-zinc-200/80 rounded-2xl p-2.5 flex flex-col justify-between h-[82px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-zinc-350 transition-colors"
                  >
                    <div className="flex justify-between items-center border-b border-zinc-100 pb-1 mb-1">
                      <span className="font-mono text-[7px] text-zinc-400 font-bold">CHUNK_{chk.id}</span>
                      <span className={`font-mono text-[5.5px] font-black tracking-wider px-1 py-0.25 rounded-sm bg-zinc-50 ${chk.textCol}`}>
                        {chk.rel}
                      </span>
                    </div>
                    
                    <p className="text-[8.5px] font-sans font-light text-zinc-600 leading-tight flex-grow line-clamp-2">
                      {chk.text}
                    </p>

                    <div className="flex items-center justify-between gap-1.5 mt-1">
                      <div className="h-1 bg-zinc-100 rounded-full flex-grow overflow-hidden flex p-0.25 gap-0.25 border border-zinc-200/50">
                        <div className={`h-full ${chk.color}`} style={{ width: chk.val }} />
                      </div>
                      <span className="font-mono text-[7px] text-zinc-400 font-bold">{chk.val}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Right Column: Uso Pelos LLMs */}
              <div className="md:col-span-3 flex flex-col gap-2 md:border-l border-zinc-200/60 md:pl-3 pt-6 md:pt-0 border-t md:border-t-0 border-zinc-200/60">
                <span className="font-mono text-[7px] text-zinc-400 font-bold uppercase tracking-widest block text-center mb-1">
                  USO PELOS LLMs
                </span>

                <div className="space-y-1 w-full max-w-[125px] mx-auto">
                  {[
                    { label: 'RECORTA', icon: Scissors, desc: 'Isola o bloco' },
                    { label: 'COLA', icon: Copy, desc: 'Preenche contexto' },
                    { label: 'COMPREENDE', icon: Sparkles, desc: 'Processa o RAG' },
                    { label: 'RESPONDE', icon: Bot, desc: 'Cita e recomenda' }
                  ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="bg-white border border-zinc-200/80 rounded-2xl p-2.5 flex items-center gap-2.5 w-full shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                        <div className="w-5 h-5 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-950 shrink-0">
                           <step.icon className="w-3 h-3 text-zinc-950" />
                        </div>
                        <div className="text-left">
                          <div className="font-display font-black text-[8px] text-zinc-950 uppercase leading-none">{step.label}</div>
                          <span className="font-mono text-[6px] text-zinc-400 uppercase tracking-wide mt-0.5 leading-none">{step.desc}</span>
                        </div>
                      </div>
                      {idx < 3 && <ArrowDown className="w-2.5 h-2.5 text-zinc-300 animate-pulse my-0.5" />}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        );
      case 'circuits':
        // Entity Structured: Embeddings and Knowledge Graphs (Estruturação de Entidades)
        return (
          <div className="relative w-full bg-[#f1f2f5] shadow-[inset_4px_4px_12px_rgba(0,0,0,0.06),inset_-4px_-4px_12px_#fff] border border-zinc-200/50 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center overflow-hidden min-h-[440px] select-none">
            <div className="absolute top-3 left-4 font-mono text-[8px] text-zinc-400">SYSTEM: KNOWLEDGE_GRAPH_INTEGRATION // JSON-LD_ENTITIES</div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full items-center mt-4">
              
              {/* Left Column: Schema JSON-LD Code Block */}
              <div className="md:col-span-4 bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-2xl p-4.5 shadow-lg h-[310px] flex flex-col justify-between font-mono text-[9px] relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500 text-zinc-950 text-[6px] font-black px-2 py-0.5 rounded-bl uppercase tracking-wider">
                  VALIDATED
                </div>
                
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-zinc-500 font-bold text-[7.5px] uppercase tracking-wider">schema_markup.jsonld</span>
                </div>

                <div className="flex-grow space-y-1.5 leading-normal overflow-hidden select-none pr-1">
                  <div><span className="text-purple-400">"@context"</span>: <span className="text-emerald-400">"https://schema.org"</span>,</div>
                  <div><span className="text-purple-400">"@type"</span>: <span className="text-emerald-400">"Organization"</span>,</div>
                  <div><span className="text-purple-400">"name"</span>: <span className="text-emerald-400">"Sua Marca"</span>,</div>
                  <div><span className="text-purple-400">"url"</span>: <span className="text-emerald-400">"https://suamarca.com"</span>,</div>
                  <div><span className="text-purple-400">"sameAs"</span>: [</div>
                  <div className="pl-3"><span className="text-emerald-400">"https://wikidata.org/wiki/Q1048"</span>,</div>
                  <div className="pl-3"><span className="text-emerald-400">"https://wikipedia.org/wiki/Sua_Marca"</span></div>
                  <div>],</div>
                  <div><span className="text-purple-400">"knowsAbout"</span>: [</div>
                  <div className="pl-3"><span className="text-emerald-400">"Generative AI"</span>,</div>
                  <div className="pl-3"><span className="text-emerald-400">"Search Optimization"</span></div>
                  <div>]</div>
                </div>

                <div className="border-t border-zinc-800 pt-2.5 mt-2 flex justify-between text-zinc-500 text-[7px] font-bold tracking-widest">
                  <span>FORMAT: JSON-LD</span>
                  <span className="text-emerald-500 animate-pulse">// COMPILE_OK</span>
                </div>
              </div>

              {/* Middle Column: Interactive Knowledge Graph */}
              <div className="md:col-span-5 h-[345px] sm:h-[365px] md:h-[310px] relative flex flex-col justify-between bg-white border border-zinc-200/80 rounded-3xl px-2.5 py-4 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                <span className="font-mono text-[7px] text-zinc-400 font-extrabold uppercase tracking-widest text-center">
                  REDE DE CONEXÕES SEMÂNTICAS
                </span>

                {/* Relational graph vector lines via absolute positions and SVG */}
                <div className="relative flex-grow flex items-center justify-center overflow-hidden min-h-[180px]">
                  <div className="scale-[1.12] min-[375px]:scale-[1.25] min-[410px]:scale-[1.32] sm:scale-[1.4] md:scale-[0.95] lg:scale-100 origin-center flex items-center justify-center shrink-0 w-[200px] h-[200px] relative">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
                      {/* Circle orbits */}
                      <circle cx="100" cy="100" r="35" fill="none" stroke="#e4e4e7" strokeWidth="1" strokeDasharray="2 2" />
                      <circle cx="100" cy="100" r="65" fill="none" stroke="#d4d4d8" strokeWidth="1" />

                      {/* Laser pathways from center to orbits */}
                      <line x1="100" y1="100" x2="100" y2="40" stroke="#cbd5e1" strokeWidth="1" />
                      <line x1="100" y1="100" x2="155" y2="70" stroke="#cbd5e1" strokeWidth="1" />
                      <line x1="100" y1="100" x2="155" y2="130" stroke="#cbd5e1" strokeWidth="1" />
                      <line x1="100" y1="100" x2="45" y2="130" stroke="#cbd5e1" strokeWidth="1" />
                      <line x1="100" y1="100" x2="45" y2="70" stroke="#cbd5e1" strokeWidth="1" />

                      {/* Orbit paths traveling light pulses (now using emerald green brand color) */}
                      <motion.circle cx="100" cy="100" r="1.5" fill="#10b981" animate={{ cx: [100, 100], cy: [100, 40] }} transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }} />
                      <motion.circle cx="100" cy="100" r="1.5" fill="#10b981" animate={{ cx: [100, 155], cy: [100, 70] }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }} />
                      <motion.circle cx="100" cy="100" r="1.5" fill="#10b981" animate={{ cx: [100, 155], cy: [100, 130] }} transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }} />
                      <motion.circle cx="100" cy="100" r="1.5" fill="#10b981" animate={{ cx: [100, 45], cy: [100, 130] }} transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }} />
                      <motion.circle cx="100" cy="100" r="1.5" fill="#10b981" animate={{ cx: [100, 45], cy: [100, 70] }} transition={{ repeat: Infinity, duration: 2.6, ease: "linear" }} />
                    </svg>

                    {/* Central Node: SUA MARCA */}
                    <div className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="relative flex flex-col items-center">
                        <span className="absolute -inset-2.5 rounded-full border border-zinc-950/5 animate-ping opacity-25" />
                        <div className="bg-zinc-950 text-white rounded-full w-14 h-14 shadow-lg border border-zinc-800 flex flex-col items-center justify-center text-center p-1">
                          <Database className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
                          <span className="font-display font-black text-[7.5px] uppercase tracking-tight leading-none">SUA MARCA</span>
                          <span className="font-mono text-[4.5px] text-zinc-400 uppercase tracking-widest leading-none mt-0.5">ENTITY_ID</span>
                        </div>
                      </div>
                    </div>

                    {/* Node 1: Wikipedia (Top) */}
                    <div className="absolute top-[8%] left-[50%] transform -translate-x-1/2 z-10">
                      <div className="bg-white border border-zinc-200 shadow-xs rounded-lg py-1 px-2 flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-sm bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-600">
                          <Globe className="w-2 h-2" />
                        </div>
                        <span className="font-mono text-[6.5px] text-zinc-700 font-extrabold uppercase">Wikipedia Verbete</span>
                      </div>
                    </div>

                    {/* Node 2: Wikidata ID (Top-Right) */}
                    <div className="absolute top-[28%] left-[78%] transform -translate-x-1/2 z-10">
                      <div className="bg-white border border-zinc-200 shadow-xs rounded-lg py-1 px-2 flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-sm bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-600">
                          <Cpu className="w-2 h-2" />
                        </div>
                        <span className="font-mono text-[6.5px] text-zinc-700 font-extrabold uppercase">Wikidata Q1048</span>
                      </div>
                    </div>

                    {/* Node 3: Google Knowledge Graph (Bottom-Right) */}
                    <div className="absolute top-[68%] left-[78%] transform -translate-x-1/2 z-10">
                      <div className="bg-white border border-zinc-200 shadow-xs rounded-lg py-1 px-2 flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-sm bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-600">
                          <Network className="w-2 h-2" />
                        </div>
                        <span className="font-mono text-[6.5px] text-zinc-700 font-extrabold uppercase">Google Graph</span>
                      </div>
                    </div>

                    {/* Node 4: Nicho de Atuação (Bottom-Left) */}
                    <div className="absolute top-[68%] left-[22%] transform -translate-x-1/2 z-10">
                      <div className="bg-white border border-zinc-200 shadow-xs rounded-lg py-1 px-2 flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-sm bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-600">
                          <Code className="w-2 h-2" />
                        </div>
                        <span className="font-mono text-[6.5px] text-zinc-700 font-extrabold uppercase">Nicho Setorial</span>
                      </div>
                    </div>

                    {/* Node 5: Concorrentes Diretos (Top-Left) */}
                    <div className="absolute top-[28%] left-[22%] transform -translate-x-1/2 z-10">
                      <div className="bg-white border border-zinc-200 shadow-xs rounded-lg py-1 px-2 flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-sm bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-600">
                          <Users className="w-2 h-2" />
                        </div>
                        <span className="font-mono text-[6.5px] text-zinc-700 font-extrabold uppercase">Co-ocorrência</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="font-mono text-[7px] text-zinc-300 text-center uppercase tracking-widest border-t border-zinc-100 pt-2">
                  CONEXÕES ATIVAS COM BASES DE CONHECIMENTO
                </div>
              </div>

              {/* Right Column: Cosine Embeddings Meter */}
              <div className="md:col-span-3 flex flex-col justify-between md:h-[310px] md:border-l border-zinc-200/60 md:pl-3 pt-6 md:pt-0 border-t md:border-t-0 border-zinc-200/60 gap-4 md:gap-0">
                <div>
                  <span className="font-mono text-[7px] text-zinc-400 font-extrabold uppercase tracking-widest block text-center mb-1">
                    MEDIDOR DE SIMILARIDADE
                  </span>
                  <p className="font-sans text-[7.5px] text-zinc-400 leading-tight text-center max-w-[120px] mx-auto mb-4">
                    Proximidade conceitual nos embeddings vetoriais das LLMs.
                  </p>
                </div>

                <div className="space-y-3.5 w-full max-w-[150px] mx-auto">
                  {[
                    { label: 'GEO Otimização', score: '0.97', width: '97%', color: 'bg-emerald-500' },
                    { label: 'Especialista RAG', score: '0.94', width: '94%', color: 'bg-emerald-500' },
                    { label: 'Marca Recomendada', score: '0.89', width: '89%', color: 'bg-blue-500' },
                    { label: 'SEO Tradicional', score: '0.35', width: '35%', color: 'bg-zinc-400' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white border border-zinc-150 rounded-xl p-2 shadow-xs">
                      <div className="flex justify-between items-center text-[7.5px] font-mono mb-1">
                        <span className="font-bold text-zinc-700 uppercase">{item.label}</span>
                        <span className="font-black text-zinc-950 font-mono">{item.score}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden p-0.25 border border-zinc-200/50">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: item.width }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 mt-2 shadow-inner text-center">
                  <div className="font-mono text-[7px] text-zinc-400 font-black">VEC_METRIC_STATUS</div>
                  <div className="font-display font-black text-[13px] text-emerald-600 mt-0.5">EXCELENTE</div>
                </div>
              </div>

            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section id="services" className="bg-[#f4f5f8] grid-blueprint py-24 md:py-32 px-6 md:px-12 border-b border-zinc-200 relative">
      {/* Reference crosshair */}
      <div className="absolute top-12 right-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>
      <div className="absolute bottom-12 left-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>

      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200/60 pb-8 mb-16 gap-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full" />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">METODOLOGIA DE GEO</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-zinc-500">
            <span>O SEO tradicional está mudando</span>
            <span className="text-zinc-400">//</span>
            <span className="text-zinc-950">Traditional SEO is dying.</span>
          </div>
        </div>

        {/* COMPARISON CARDS */}
        <div className="mb-24">
          <div className="max-w-5xl mb-12">
            <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-zinc-950 leading-[1.05] tracking-tight uppercase text-tactile-3d-dark">
              O SEO TRADICIONAL JÁ ERA.<br />
              <span className="text-zinc-500/80">SEJA BEM-VINDO AO GEO.</span>
            </h2>
            <p className="text-zinc-500 font-light mt-4 text-sm md:text-base leading-relaxed max-w-4xl">
              No SEO antigo, a grande pergunta era: <strong className="text-zinc-950 font-semibold">"Em que posição o meu site aparece na lista estática de links?"</strong>. Na era dos assistentes de IA, a dinâmica mudou drasticamente para a geração de respostas diretas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* OLD ERA (SEO) CARD - Raised Light Clay Panel */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -4, scale: 1.005, transition: { duration: 0.2 } }}
              style={{ willChange: "transform, opacity" }}
              className="tactile-raised p-8 space-y-4 relative overflow-hidden group cursor-default transition-all duration-300"
            >
              <div className="absolute top-4 right-4 text-zinc-300/40 font-display font-black text-6xl pointer-events-none select-none tracking-tighter">
                SEO
              </div>
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold block">
                COMPORTAMENTO ANTIGO
              </span>
              <h3 className="font-display font-extrabold text-xl text-zinc-800 uppercase tracking-tight">
                A Busca Baseada em Links
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-light">
                O usuário digitava termos desconexos no Google, recebia uma lista estática de 10 links patrocinados, clicava individualmente em cada site e tentava extrair a informação por conta própria.
              </p>
              <div className="h-[1px] bg-zinc-200/80 w-full my-4" />
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                <Search className="w-4 h-4 text-zinc-400" />
                <span>"Melhores softwares de CRM B2B no Brasil"</span>
              </div>
            </motion.div>

            {/* NEW ERA (GEO) CARD - Heavy Dark Slate Plate */}
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -4, scale: 1.005, transition: { duration: 0.2 } }}
              style={{ willChange: "transform, opacity" }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 space-y-4 relative overflow-hidden shadow-2xl border-t-zinc-700 cursor-default transition-all duration-300"
            >
              <div className="absolute top-4 right-4 text-zinc-700/60 font-display font-black text-6xl pointer-events-none select-none tracking-tighter">
                GEO
              </div>
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">
                COMPORTAMENTO NOVO (RAG)
              </span>
              <h3 className="font-display font-extrabold text-xl text-white uppercase tracking-tight">
                A Resposta Sintetizada pela IA
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                O usuário faz uma pergunta de linguagem natural contextual para o <strong className="text-white font-medium">ChatGPT, Claude, Gemini ou Perplexity</strong>. A IA lê a internet, filtra os dados, resume e gera uma recomendação direta. Se seu site não for capturado, você é ignorado.
              </p>
              <div className="h-[1px] bg-zinc-800/80 w-full my-4" />
              <div className="flex items-center gap-2 text-zinc-200 text-xs font-mono">
                <Sparkles className="w-4 h-4 animate-pulse text-white" />
                <span className="text-zinc-300">"Qual o CRM ideal para startups B2B integrável com Slack?"</span>
              </div>
            </motion.div>

          </div>
        </div>

        {/* EMBASAMENTO CIENTÍFICO (ESTUDO DE PRINCETON) */}
        <div className="mb-24 tactile-raised p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-zinc-300/10 rounded-full blur-[80px]" />
          
          <div className="max-w-4xl space-y-4">
            <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-bold block">
              CIÊNCIA & PESQUISA // PRINCETON UNIVERSITY
            </span>
            <h3 className="font-display font-extrabold text-2xl md:text-3xl text-zinc-950 tracking-tight uppercase leading-tight">
              A Ciência por trás do Rank de IA: O Estudo de Princeton
            </h3>
            <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-light">
              O termo <strong className="text-zinc-950 font-semibold">GEO (Generative Engine Optimization)</strong> não é um termo publicitário vazio. Ele foi estabelecido cientificamente por pesquisadores das renomadas universidades americanas <strong className="text-zinc-950 font-semibold">Princeton e Georgia Tech</strong>. Eles comprovaram que otimizar seu site com técnicas focadas em LLMs aumenta em <strong className="text-zinc-950 font-bold">até 40%</strong> as chances de a Inteligência Artificial citar e recomendar a sua marca nas buscas sintetizadas.
            </p>
          </div>
        </div>

        {/* THE 4 PILLARS (TAB INTERACTIVITY) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Navigation Services List (Col-5) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-bold block pl-6 mb-1">
              DIRETRIZES DE OTIMIZAÇÃO (ESTUDO CIENTÍFICO)
            </span>
            {services.map((item) => {
              const isActive = item.id === activeId;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveId(item.id)}
                  className={`w-full text-left py-4.5 px-6 border transition-all duration-300 focus:outline-none flex justify-between items-center rounded-2xl cursor-pointer ${
                    isActive
                      ? 'tactile-pressed border-zinc-300 bg-zinc-50 text-zinc-950 pl-8 shadow-inner'
                      : 'bg-white border-transparent text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50 shadow-sm pl-6'
                  }`}
                >
                  <span className="font-display font-extrabold text-base md:text-lg uppercase tracking-tight">{item.title}</span>
                  <motion.span 
                    animate={isActive ? { x: 4, opacity: 1 } : { x: 0, opacity: 0.3 }}
                    className="font-mono text-xs font-bold text-zinc-400"
                  >
                    {item.index}
                  </motion.span>
                </button>
              );
            })}
          </div>

          {/* Right Selected Detail Pane (Col-7) */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="tactile-raised p-8 md:p-12 relative flex flex-col justify-between min-h-[460px] bg-white border border-zinc-200"
              >
                {/* Accent top tag */}
                <div className="absolute top-4 right-6 font-mono text-[8px] text-zinc-400 uppercase tracking-widest">
                  PRINCETON // TECH_PILLAR
                </div>

                {/* Card Header details */}
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="font-mono text-[9px] text-zinc-400 block uppercase tracking-widest mb-1">
                        {activeService.technicalLabel}
                      </span>
                      <h3 className="font-display font-extrabold text-2xl text-zinc-950 tracking-tight uppercase">
                        {activeService.title}
                      </h3>
                    </div>
                    <span className="font-display font-black text-3xl text-zinc-300 shrink-0">
                      {activeService.index}
                    </span>
                  </div>

                  <p className="text-zinc-500 font-light text-xs md:text-sm leading-relaxed">
                    {activeService.description}
                  </p>
                </div>

                {/* Animated tech graphic wrapper */}
                <div className="my-6">
                  {renderGraphic(activeService.graphicType)}
                </div>

                {/* Card details / bullet points */}
                <div className="space-y-4 pt-5 border-t border-zinc-100">
                  <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-bold block">
                    FOCO DE IMPLEMENTAÇÃO DA AGÊNCIA
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {activeService.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs text-zinc-600">
                        <div className="w-5 h-5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-950 shrink-0 shadow-inner">
                          <Check className="w-3 h-3 text-zinc-950" />
                        </div>
                        <span className="font-light">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
