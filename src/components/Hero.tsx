import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDown, Globe, Mail, ArrowRight, ShieldAlert, CheckCircle2, Loader2, Sparkles, Sun, ShieldCheck } from 'lucide-react';

export default function Hero() {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'results'>('idle');
  const [scanStep, setScanStep] = useState(0);
  const [scannedUrl, setScannedUrl] = useState('');
  const [scannedEmail, setScannedEmail] = useState('');

  const scanSteps = [
    'Conectando com APIs de rastreamento de IA...',
    'Varrendo menções no ChatGPT, Claude, Gemini e Perplexity...',
    'Analisando arquivo robots.txt para IA...',
    'Auditando estrutura semântica On-Page...',
    'Medindo tempo de resposta e fragmentação...',
    'Compilando diagnóstico final b.rocket GEO-Score...'
  ];

  const handleStartScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !email) return;

    setScannedUrl(url);
    setScannedEmail(email);
    setScanState('scanning');
    setScanStep(0);

    const interval = setInterval(() => {
      setScanStep((prev) => {
        if (prev >= scanSteps.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setScanState('results');
          }, 850);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  };

  const handleReset = () => {
    setUrl('');
    setEmail('');
    setScanState('idle');
    setScanStep(0);
  };

  return (
    <section 
      id="hero"
      className="relative min-h-screen bg-[#f4f5f8] grid-blueprint overflow-hidden flex flex-col justify-center pt-28 md:pt-36 pb-20 md:pb-28 px-6 md:px-12 border-b border-zinc-200"
    >
      {/* Ambient Moving Glassmorphic Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 40, 0],
            scale: [1, 1.12, 0.95, 1],
            rotate: [0, 90, 180, 360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-zinc-200/50 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -60, 40, 0],
            y: [0, 50, -50, 0],
            scale: [1, 0.9, 1.15, 1],
            rotate: [360, 270, 90, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-100/40 blur-[120px]"
        />
      </div>

      {/* Reference crosshairs + in the corners */}
      <div className="absolute top-24 left-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>
      <div className="absolute top-24 right-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>
      <div className="absolute bottom-24 left-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>
      <div className="absolute bottom-24 right-12 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>

      <div className="max-w-7xl mx-auto w-full z-10 flex flex-col gap-10">
        
        {/* TOP LINE METADATA */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full flex justify-between items-center border-b border-zinc-200/60 pb-3.5 font-mono text-[9px] md:text-xs text-zinc-500 uppercase tracking-widest"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-950 animate-pulse" />
            <span className="font-bold text-zinc-950">b.rocket // GEO_CORE_V10</span>
          </div>
          <span className="hidden sm:inline">PIONEIROS EM OTIMIZAÇÃO PARA MOTORES GERATIVOS</span>
        </motion.div>

        {/* MAIN BODY LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* LEFT SIDE: TACTILE GLOBE AND CUSTOMIZER */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 flex flex-col gap-8"
          >
            
            {/* AI Recommendation Engine Box */}
            <motion.div 
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="tactile-raised p-6 flex flex-col justify-between overflow-hidden relative bg-white border border-zinc-200 rounded-3xl w-full transition-shadow duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]"
            >
              
              {/* Header bar of the software */}
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-4 font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  AI RECOMMENDATION ENGINE
                </span>
                <span className="text-zinc-400">ACTIVE // SECURE</span>
              </div>

              {/* Graphic/Visual mapping area */}
              <div className="relative w-full aspect-[4/3] max-h-[220px] sm:max-h-[240px] flex items-center justify-center bg-zinc-50/50 border border-zinc-150 rounded-2xl overflow-hidden py-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.015)]">
                {/* Blueprint background lines */}
                <div className="absolute inset-0 opacity-5 grid-blueprint pointer-events-none" />
                
                {/* Visual Mapping Graphic: Custom Interactive Concept */}
                <div className="absolute inset-0 flex items-center justify-center">
                  
                  {/* Outer connections diagram using lines */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 240">
                    <defs>
                      <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#18181b" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    
                    {/* Connecting lines from outer nodes to center "Seu Site" */}
                    <line x1="160" y1="45" x2="160" y2="120" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="50" y1="120" x2="160" y2="120" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="270" y1="120" x2="160" y2="120" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="160" y1="195" x2="160" y2="120" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="3 3" />
                    
                    <line x1="50" y1="120" x2="160" y2="45" stroke="#f4f4f5" strokeWidth="0.75" />
                    <line x1="270" y1="120" x2="160" y2="45" stroke="#f4f4f5" strokeWidth="0.75" />
                    <line x1="50" y1="120" x2="160" y2="195" stroke="#f4f4f5" strokeWidth="0.75" />
                    <line x1="270" y1="120" x2="160" y2="195" stroke="#f4f4f5" strokeWidth="0.75" />

                    {/* Animated moving pulses along the paths */}
                    <motion.circle
                      cx="160"
                      cy="45"
                      r="2"
                      fill="#18181b"
                      animate={{ cy: [45, 120] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.circle
                      cx="50"
                      cy="120"
                      r="2"
                      fill="#18181b"
                      animate={{ cx: [50, 160] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.circle
                      cx="270"
                      cy="120"
                      r="2"
                      fill="#18181b"
                      animate={{ cx: [270, 160] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.circle
                      cx="160"
                      cy="195"
                      r="2"
                      fill="#18181b"
                      animate={{ cy: [195, 120] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
                    />
                  </svg>

                  {/* Outer AI Node 1: ChatGPT (Top) */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mb-1 animate-pulse" />
                    <div className="bg-white border border-zinc-200 rounded-lg px-2 py-0.5 text-[8.5px] font-mono font-extrabold text-zinc-900 shadow-xs uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#10a37f]" />
                      ChatGPT
                    </div>
                  </div>

                  {/* Outer AI Node 2: Claude (Left) */}
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5">
                    <div className="bg-white border border-zinc-200 rounded-lg px-2 py-0.5 text-[8.5px] font-mono font-extrabold text-zinc-900 shadow-xs uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#d97706]" />
                      Claude
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                  </div>

                  {/* Outer AI Node 3: Gemini (Right) */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                    <div className="bg-white border border-zinc-200 rounded-lg px-2 py-0.5 text-[8.5px] font-mono font-extrabold text-zinc-900 shadow-xs uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#2563eb]" />
                      Gemini
                    </div>
                  </div>

                  {/* Outer AI Node 4: Perplexity (Bottom) */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col-reverse items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mb-1 animate-pulse" />
                    <div className="bg-white border border-zinc-200 rounded-lg px-2 py-0.5 text-[8.5px] font-mono font-extrabold text-zinc-900 shadow-xs uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#13c2c2]" />
                      Perplexity
                    </div>
                  </div>

                  {/* Center Node: SEU SITE */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="absolute -inset-4 rounded-full border border-zinc-900/10 animate-ping opacity-40" />
                    <div className="bg-zinc-950 text-white border border-zinc-850 rounded-xl px-3.5 py-2 text-center shadow-md relative min-w-[85px]">
                      <div className="font-mono text-[6.5px] text-zinc-450 font-black tracking-widest uppercase mb-0.5">TARGET_CORE</div>
                      <div className="font-display font-black text-[10px] tracking-tight text-white uppercase">SEU SITE</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags panel */}
              <div className="flex flex-wrap gap-1.5 justify-center py-3 border-b border-zinc-150">
                {['Schema', 'Authority', 'RAG', 'Trust', 'Entity'].map((tag) => (
                  <span key={tag} className="font-mono text-[8px] text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-md uppercase tracking-wider font-bold">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Progress and status indicators */}
              <div className="pt-3.5 space-y-2.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-400 font-bold uppercase">
                    <span>Citation Score</span>
                    <span className="text-zinc-900">80%</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-zinc-200/80">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={`h-full flex-grow rounded-[1px] ${i < 8 ? 'bg-zinc-900' : 'bg-transparent'}`} />
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-400 font-bold uppercase">
                    <span>Entity Coverage</span>
                    <span className="text-zinc-900">100%</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-zinc-200/80">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={`h-full flex-grow rounded-[1px] ${i < 10 ? 'bg-zinc-900' : 'bg-transparent'}`} />
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-400 font-bold uppercase">
                    <span>Recommendation Readiness</span>
                    <span className="text-zinc-900">90%</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-zinc-200/80">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={`h-full flex-grow rounded-[1px] ${i < 9 ? 'bg-zinc-900' : 'bg-transparent'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* GEO CORE PILLARS EXPLAINER CARD */}
            <div className="tactile-raised p-6 flex flex-col gap-5">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-wider">INDICADORES DE VISIBILIDADE</span>
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              
              <div className="space-y-1">
                <h4 className="font-display font-extrabold text-sm text-zinc-950 uppercase tracking-tight">
                  Os 3 Pilares do Rankeamento em IA
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-light">
                  Ao contrário do SEO tradicional de palavras-chave, as IAs generativas sintetizam respostas analisando dados estruturados e relevância semântica profunda:
                </p>
              </div>

              {/* Core GEO Pillars list */}
              <div className="space-y-3.5 pt-1">
                {/* Pillar 1 */}
                <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-2xl flex items-start gap-3 hover:bg-zinc-100 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-zinc-200">
                    <span className="font-mono text-xs font-bold text-zinc-950">01</span>
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-display font-bold text-xs text-zinc-950 uppercase tracking-tight">Autoridade RAG (Citação)</h5>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">Sua marca catalogada como fonte confiável nos bancos de dados vetoriais das IAs.</p>
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-2xl flex items-start gap-3 hover:bg-zinc-100 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-zinc-200">
                    <span className="font-mono text-xs font-bold text-zinc-950">02</span>
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-display font-bold text-xs text-zinc-950 uppercase tracking-tight">Intencionalidade Semântica</h5>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">Respostas diretas a intenções complexas dos usuários, em vez de repetição excessiva de keywords.</p>
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-2xl flex items-start gap-3 hover:bg-zinc-100 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-zinc-200">
                    <span className="font-mono text-xs font-bold text-zinc-950">03</span>
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-display font-bold text-xs text-zinc-950 uppercase tracking-tight">Acessibilidade dos Crawlers</h5>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">Liberação técnica no robots.txt e estruturação de schema limpa para rastreadores de IA (GPTBot, ClaudeBot, etc.).</p>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>

          {/* RIGHT SIDE: COPYWRITING AND THE FORM WIDGET */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-7 flex flex-col justify-center space-y-8"
          >
            
            <div className="space-y-5 text-left relative">
              {/* Extra fine technical layout badge */}
              <div className="absolute -top-10 left-0 font-mono text-[10px] text-zinc-400 uppercase tracking-widest bg-zinc-100 px-3 py-1 rounded-md border border-zinc-200">
                METODOLOGIA DE PRINCETON / OTIMIZAÇÃO DE RAG
              </div>

              {/* GIANT 3D TEXT - Reference Image 1 & 8 */}
              <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-zinc-950 tracking-tight leading-[1.02] uppercase text-tactile-3d-dark">
                O SEU SITE<br />
                RECOMENDADO<br />
                PELAS IAs
              </h1>
              
              <p className="font-sans text-sm md:text-base text-zinc-600 leading-relaxed max-w-2xl font-light">
                O SEO de links azuis morreu. Os novos tomadores de decisão agora buscam e compram diretamente através das recomendações sintetizadas do <strong className="text-zinc-950 font-semibold">ChatGPT, Claude, Gemini e Perplexity</strong>. Nós preparamos sua copy e sua infraestrutura técnica de dados para dominar as recomendações dos robôs de IA.
              </p>
            </div>

            {/* THREE PILLS ROW (TERRIXA INTERFACE) */}
            <div className="relative flex flex-wrap gap-3 z-10 pt-2 pb-4">
              <div className="absolute inset-0 -z-10 font-display font-black text-6xl md:text-7xl text-zinc-300/10 tracking-widest select-none pointer-events-none uppercase">
                B.ROCKET
              </div>
              <span className="tactile-raised bg-white text-zinc-950 font-mono text-[10px] uppercase tracking-widest px-4.5 py-2.5 font-bold shadow-sm">
                Otimização
              </span>
              <span className="tactile-raised bg-white text-zinc-950 font-mono text-[10px] uppercase tracking-widest px-4.5 py-2.5 font-bold shadow-sm">
                Aumento de Lucros
              </span>
              <span className="tactile-raised bg-white text-zinc-950 font-mono text-[10px] uppercase tracking-widest px-4.5 py-2.5 font-bold shadow-sm inline-flex items-center gap-1.5">
                Redução de Riscos <span>(↗)</span>
              </span>
            </div>

            {/* INTEGRATED SCAN TERMINAL WIDGET */}
            <div className="tactile-raised overflow-hidden w-full max-w-xl">
              
              {/* Terminal top header */}
              <div className="bg-zinc-50 px-6 py-4 flex justify-between items-center border-b border-zinc-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 border border-white shadow-inner" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 border border-white shadow-inner" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 border border-white shadow-inner" />
                </div>
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
                  b.rocket // GEO DIAGNOSTIC ENGINE v1.4
                </span>
              </div>

              {/* Form panel space */}
              <div className="p-8 min-h-[320px] flex flex-col justify-between bg-white text-zinc-950">
                <AnimatePresence mode="wait">
                  
                  {/* IDLE STATE: Form inputs */}
                  {scanState === 'idle' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-5"
                    >
                      <div className="space-y-1.5">
                        <h3 className="font-display font-extrabold text-xl text-zinc-950 uppercase tracking-tight">
                          Raio-X de GEO Gratuito
                        </h3>
                        <p className="text-xs text-zinc-500 leading-relaxed font-light">
                          Insira a URL corporativa do seu negócio e o e-mail de contato para gerar instantaneamente o plano de ação focado na indexação das LLMs.
                        </p>
                      </div>

                      <form onSubmit={handleStartScan} className="space-y-4">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
                            <Globe className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="URL da sua empresa (Ex: www.empresa.com)"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3.5 font-mono text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all shadow-inner"
                          />
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            required
                            placeholder="E-mail profissional corporativo"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3.5 font-mono text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all shadow-inner"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-zinc-950 hover:bg-zinc-900 text-white font-mono text-xs font-bold py-4.5 tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-lg border-t border-zinc-700 hover:scale-[1.01]"
                        >
                          QUERO MEU RAIO-X DE GEO GRATUITO
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>

                      <div className="text-center font-mono text-[9px] text-zinc-400">
                        🛡️ Relatório em PDF enviado em poucos minutos no seu e-mail
                      </div>
                    </motion.div>
                  )}

                  {/* SCANNING STATE: Progress list */}
                  {scanState === 'scanning' && (
                    <motion.div
                      key="scanning"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col justify-between h-full flex-grow space-y-6 font-mono"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-zinc-950">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs uppercase tracking-widest font-bold">ANALISANDO SISTEMA VETORIAL</span>
                        </div>
                        <div className="text-xs text-zinc-600 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 shadow-inner">
                          <span>Site Alvo:</span> <span className="text-zinc-950 font-bold">{scannedUrl}</span>
                        </div>
                      </div>

                      {/* Step log trace lines */}
                      <div className="space-y-2.5 flex-grow py-4 border-t border-zinc-200 border-b border-zinc-200 min-h-[160px]">
                        {scanSteps.map((step, i) => {
                          const isDone = i < scanStep;
                          const isCurrent = i === scanStep;
                          return (
                            <div 
                              key={i} 
                              className={`text-[11px] flex items-start gap-2.5 transition-opacity duration-300 ${
                                isDone ? 'text-zinc-400' : isCurrent ? 'text-zinc-950 font-semibold' : 'text-zinc-300 opacity-40'
                              }`}
                            >
                              <span className="font-bold shrink-0">
                                {isDone ? '✓' : isCurrent ? '►' : '·'}
                              </span>
                              <span>{step}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-zinc-400">
                        <span>ENGINE STATUS: CRAWLING</span>
                        <span className="animate-pulse text-zinc-950 font-bold">PROCESSANDO...</span>
                      </div>
                    </motion.div>
                  )}

                  {/* RESULTS STATE: Diagnostic overview */}
                  {scanState === 'results' && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-5"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                        <div>
                          <span className="font-mono text-[9px] text-zinc-400 font-bold uppercase tracking-widest block">
                            DIAGNÓSTICO INICIAL
                          </span>
                          <h4 className="font-display font-extrabold text-base text-zinc-950 uppercase mt-0.5">
                            Status: {scannedUrl}
                          </h4>
                        </div>
                        <div className="tactile-raised bg-zinc-50 px-4 py-2 text-zinc-950 font-mono text-sm font-black flex flex-col items-center border border-zinc-200">
                          <span className="text-red-500">34%</span>
                          <span className="text-[8px] uppercase font-bold tracking-tight text-zinc-400">GEO SCORE</span>
                        </div>
                      </div>

                      {/* Diagnostic Bullets */}
                      <div className="space-y-3 font-sans text-xs">
                        
                        <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl flex items-start gap-3">
                          <ShieldAlert className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-zinc-950 block font-bold">Bloqueio de Crawlers Detectado</strong>
                            <span className="text-zinc-500 font-light text-[11px]">
                              robots.txt bloqueia rastreadores oficiais de busca por IA (ex: OAI-SearchBot).
                            </span>
                          </div>
                        </div>

                        <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl flex items-start gap-3">
                          <ShieldAlert className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-zinc-950 block font-bold">Ausência de EEAT Semântico</strong>
                            <span className="text-zinc-500 font-light text-[11px]">
                              Sem estruturas de autoridade ou Schemas JSON-LD. Sem referências a dados estatísticos.
                            </span>
                          </div>
                        </div>

                        <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl flex items-start gap-3">
                          <ShieldAlert className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-zinc-950 block font-bold">Fórmula de 60 Palavras Desrespeitada</strong>
                            <span className="text-zinc-500 font-light text-[11px]">
                              Sua copy inicial é redundante e excessivamente adjetivada para o processamento de RAG das IAs.
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Action success alert */}
                      <div className="bg-zinc-950 text-white p-4.5 rounded-xl flex items-start gap-3.5 shadow-xl border-t border-zinc-700">
                        <CheckCircle2 className="w-5 h-5 text-zinc-100 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <strong className="text-zinc-100 text-xs block font-bold uppercase tracking-wider">Diagnóstico PDF Enviado!</strong>
                          <p className="text-[11px] text-zinc-300 font-light leading-relaxed mt-0.5">
                            O plano de ação prioritário de GEO de Princeton foi compilado e enviado com segurança para <span className="text-white font-mono font-bold">{scannedEmail}</span>.
                          </p>
                        </div>
                      </div>

                      {/* Reset Button */}
                      <button
                        onClick={handleReset}
                        className="w-full bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 font-mono text-xs font-bold py-3 uppercase tracking-widest transition-all rounded-xl text-center border border-zinc-200 shadow-sm"
                      >
                        REALIZAR OUTRA VARREDURA
                      </button>

                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </div>

          </motion.div>

        </div>

      </div>

      {/* Floating Scroll Indicator */}
      <div className="absolute bottom-6 right-6 md:right-12 flex flex-col items-center gap-2 select-none z-10">
        <span className="font-mono text-[8px] text-zinc-400 tracking-[0.25em] uppercase vertical-text">
          CONHECER METODOLOGIA
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-zinc-950"
        >
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </div>
    </section>
  );
}
