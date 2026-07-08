import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDown, Globe, Mail, ArrowRight, ShieldAlert, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

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

      <div className="max-w-7xl mx-auto w-full z-10 flex flex-col gap-10 lg:gap-16 relative">
        
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* LEFT SIDE: COPYWRITING */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col justify-center space-y-8 order-2 lg:order-1"
          >
            
            <div className="space-y-6 text-left relative">
              {/* Extra fine technical layout badge */}
              <div className="inline-block font-mono text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-100 px-3 py-1.5 rounded-md border border-zinc-200 font-bold mb-2">
                METODOLOGIA DE PRINCETON / OTIMIZAÇÃO DE RAG
              </div>

              {/* GIANT 3D TEXT */}
              <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] text-zinc-950 tracking-tight leading-[1.05] uppercase text-tactile-3d-dark">
                O SEU SITE<br />
                RECOMENDADO<br />
                PELAS IAs
              </h1>
              
              <p className="font-sans text-base md:text-lg text-zinc-600 leading-relaxed max-w-xl font-light">
                O SEO de links azuis morreu. Os novos tomadores de decisão agora buscam e compram diretamente através das recomendações sintetizadas do <strong className="text-zinc-950 font-semibold">ChatGPT, Claude, Gemini e Perplexity</strong>. Preparamos sua marca para dominar as recomendações dos robôs de IA.
              </p>
            </div>

            {/* THREE PILLS ROW */}
            <div className="flex flex-wrap gap-3 z-10 pt-2">
              <span className="bg-white text-zinc-950 font-mono text-[10px] uppercase tracking-widest px-4.5 py-2.5 font-bold shadow-sm border border-zinc-200 rounded-lg flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Rankeamento em IAs
              </span>
              <span className="bg-white text-zinc-950 font-mono text-[10px] uppercase tracking-widest px-4.5 py-2.5 font-bold shadow-sm border border-zinc-200 rounded-lg flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Otimização Semântica
              </span>
              <span className="bg-white text-zinc-950 font-mono text-[10px] uppercase tracking-widest px-4.5 py-2.5 font-bold shadow-sm border border-zinc-200 rounded-lg flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Visibilidade Generativa
              </span>
            </div>

          </motion.div>

          {/* RIGHT SIDE: INTEGRATED SCAN TERMINAL WIDGET */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full order-1 lg:order-2 flex justify-center lg:justify-end"
          >
            <div className="tactile-raised overflow-hidden w-full max-w-lg lg:max-w-md bg-white rounded-3xl border border-zinc-200 shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
              
              {/* Terminal top header */}
              <div className="bg-zinc-50/80 px-6 py-4 flex justify-between items-center border-b border-zinc-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 border border-white shadow-inner" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white shadow-inner" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white shadow-inner" />
                </div>
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
                  GEO DIAGNOSTIC ENGINE v1.4
                </span>
              </div>

              {/* Form panel space */}
              <div className="p-8 min-h-[380px] flex flex-col justify-center bg-white text-zinc-950 relative">
                <AnimatePresence mode="wait">
                  
                  {/* IDLE STATE: Form inputs */}
                  {scanState === 'idle' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mb-2">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="font-display font-extrabold text-2xl text-zinc-950 uppercase tracking-tight">
                          As IAs recomendam sua empresa?
                        </h3>
                        <p className="text-sm text-zinc-500 leading-relaxed font-light">
                          Faça uma varredura gratuita e descubra se o ChatGPT e o Gemini estão enviando clientes para você ou para a concorrência.
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
                            placeholder="URL corporativa (ex: site.com)"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3.5 font-mono text-sm text-zinc-950 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
                          />
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            required
                            placeholder="Seu melhor e-mail profissional"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3.5 font-mono text-sm text-zinc-950 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold py-4.5 tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-[0_8px_20px_rgba(5,150,105,0.25)] border-t border-emerald-400 hover:-translate-y-0.5"
                        >
                          DESCOBRIR MEU SCORE AGORA
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>

                      <div className="text-center font-mono text-[9px] text-zinc-400 uppercase tracking-wider font-bold">
                        🔒 Relatório em PDF seguro enviado em minutos
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
                        <div className="flex items-center justify-center gap-3 text-emerald-600">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-xs uppercase tracking-widest font-bold">ANALISANDO SISTEMA VETORIAL</span>
                        </div>
                        <div className="text-xs text-center text-zinc-600 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 shadow-inner break-all">
                          <span>Alvo:</span> <span className="text-zinc-950 font-bold">{scannedUrl}</span>
                        </div>
                      </div>

                      {/* Step log trace lines */}
                      <div className="space-y-3 flex-grow py-4 border-t border-zinc-200 border-b border-zinc-200 min-h-[180px]">
                        {scanSteps.map((step, i) => {
                          const isDone = i < scanStep;
                          const isCurrent = i === scanStep;
                          return (
                            <div 
                              key={i} 
                              className={`text-[10px] sm:text-[11px] flex items-start gap-2.5 transition-opacity duration-300 ${
                                isDone ? 'text-zinc-400' : isCurrent ? 'text-emerald-600 font-semibold' : 'text-zinc-300 opacity-40'
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
                        <span>STATUS: CRAWLING</span>
                        <span className="animate-pulse text-emerald-600 font-bold">PROCESSANDO...</span>
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
                          <h4 className="font-display font-extrabold text-base text-zinc-950 uppercase mt-0.5 max-w-[200px] truncate">
                            {scannedUrl}
                          </h4>
                        </div>
                        <div className="bg-red-50 px-4 py-2 text-zinc-950 font-mono text-sm font-black flex flex-col items-center border border-red-100 rounded-xl">
                          <span className="text-red-600">34%</span>
                          <span className="text-[8px] uppercase font-bold tracking-tight text-red-400">GEO SCORE</span>
                        </div>
                      </div>

                      {/* Diagnostic Bullets */}
                      <div className="space-y-3 font-sans text-xs">
                        
                        <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl flex items-start gap-3">
                          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-zinc-950 block font-bold">Bloqueio de Crawlers Detectado</strong>
                            <span className="text-zinc-500 font-light text-[11px]">
                              robots.txt bloqueia rastreadores oficiais de busca por IA (ex: OAI-SearchBot).
                            </span>
                          </div>
                        </div>

                        <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl flex items-start gap-3">
                          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-zinc-950 block font-bold">Ausência de EEAT Semântico</strong>
                            <span className="text-zinc-500 font-light text-[11px]">
                              Sem estruturas de autoridade ou Schemas JSON-LD. Sem referências a dados estatísticos.
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Action success alert */}
                      <div className="bg-emerald-50 text-emerald-900 p-4 rounded-xl flex items-start gap-3 border border-emerald-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-950 text-xs block font-bold uppercase tracking-wider">Relatório Enviado!</strong>
                          <p className="text-[11px] text-emerald-700/80 font-medium leading-relaxed mt-1">
                            O plano de ação prioritário de GEO foi enviado para <span className="font-mono font-bold text-emerald-900">{scannedEmail}</span>.
                          </p>
                        </div>
                      </div>

                      {/* Reset Button */}
                      <button
                        onClick={handleReset}
                        className="w-full bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 font-mono text-xs font-bold py-3 uppercase tracking-widest transition-all rounded-xl text-center border border-zinc-200 shadow-sm mt-2"
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

        {/* BOTTOM SECTION: GEO CORE PILLARS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 border-t border-zinc-200/60 pt-10"
        >
          <div className="flex justify-between items-center mb-6">
            <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              INDICADORES DE VISIBILIDADE EM IAs
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white border border-zinc-200 p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
                <span className="font-mono text-sm font-bold text-zinc-950">01</span>
              </div>
              <div className="space-y-1.5">
                <h5 className="font-display font-bold text-sm text-zinc-950 uppercase tracking-tight">Autoridade RAG (Citação)</h5>
                <p className="text-xs text-zinc-500 leading-relaxed font-light">Sua marca catalogada como fonte confiável nos bancos de dados vetoriais das IAs, sendo citada como referência primária.</p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white border border-zinc-200 p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
                <span className="font-mono text-sm font-bold text-zinc-950">02</span>
              </div>
              <div className="space-y-1.5">
                <h5 className="font-display font-bold text-sm text-zinc-950 uppercase tracking-tight">Intencionalidade Semântica</h5>
                <p className="text-xs text-zinc-500 leading-relaxed font-light">Respostas diretas a intenções complexas dos usuários, indo muito além da repetição excessiva de palavras-chave do SEO tradicional.</p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white border border-zinc-200 p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
                <span className="font-mono text-sm font-bold text-zinc-950">03</span>
              </div>
              <div className="space-y-1.5">
                <h5 className="font-display font-bold text-sm text-zinc-950 uppercase tracking-tight">Acessibilidade dos Crawlers</h5>
                <p className="text-xs text-zinc-500 leading-relaxed font-light">Liberação técnica impecável no robots.txt e estruturação de schema limpa para rastreadores de IA como GPTBot e ClaudeBot.</p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Floating Scroll Indicator */}
      <div className="absolute bottom-6 right-6 md:right-12 flex flex-col items-center gap-2 select-none z-10">
        <span className="font-mono text-[8px] text-zinc-400 tracking-[0.25em] uppercase vertical-text">
          DESCER A PÁGINA
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
