import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Database, 
  Search, 
  Sparkles, 
  Cpu, 
  Target, 
  X, 
  Loader2, 
  Globe, 
  Mail, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  FileText, 
  BarChart3, 
  MessageSquare,
  Calendar
} from 'lucide-react';

export default function CTA() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [url, setUrl] = useState('');
  const [architecture, setArchitecture] = useState('no_rag');
  const [scale, setScale] = useState('small');
  
  // Diagnosis Step States
  const [diagnosticStep, setDiagnosticStep] = useState<'form' | 'scanning' | 'results'>('form');
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanLog, setCurrentScanLog] = useState('');

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setDiagnosticStep('form');
    setScanProgress(0);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.url) setUrl(customEvent.detail.url);
        if (customEvent.detail.email) setEmail(customEvent.detail.email);
      }
      handleOpenModal();
    };
    window.addEventListener('open-diagnostic-modal', handleOpenEvent);
    return () => {
      window.removeEventListener('open-diagnostic-modal', handleOpenEvent);
    };
  }, []);

  // Simulate scanning progress and logs
  useEffect(() => {
    if (diagnosticStep !== 'scanning') return;

    const logs = [
      'Iniciando conexão segura com a base vetorial...',
      'Analisando topologia de Embeddings e dimensionalidade...',
      'Injetando prompts de teste para detecção de alucinações...',
      'Medindo distância de Cosseno entre consultas e chunks...',
      'Avaliando densidade de contexto e overlap de fatiamento...',
      'Gerando matriz de vulnerabilidades de RAG & indexação de LLMs...',
      'Compilando relatório semântico de alta precisão...'
    ];

    let logIndex = 0;
    setCurrentScanLog(logs[0]);

    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setDiagnosticStep('results');
          return 100;
        }
        
        // Advance log messages relative to progress
        const nextLogIndex = Math.floor((prev / 100) * logs.length);
        if (nextLogIndex !== logIndex && nextLogIndex < logs.length) {
          logIndex = nextLogIndex;
          setCurrentScanLog(logs[logIndex]);
        }

        return prev + 2;
      });
    }, 80);

    return () => clearInterval(progressInterval);
  }, [diagnosticStep]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setDiagnosticStep('scanning');
    setScanProgress(0);

    // Send request to store lead info in the admin dashboard
    fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        email,
        name,
        company: `${url} (${architecture} - ${scale})`
      }),
    })
      .then(res => res.json())
      .then(data => console.log('Lead completo capturado:', data))
      .catch(err => console.error('Erro ao capturar lead completo:', err));
  };


  // Pre-configured custom results based on user inputs for a highly personalized and complete response
  const getDiagnosticResults = () => {
    const isNoRag = architecture === 'no_rag';
    const isKeyword = architecture === 'keyword';
    const isHybrid = architecture === 'hybrid_hallucination';
    const isLlmIndexing = architecture === 'llm_indexing';
    
    return {
      ragScore: isNoRag ? '12%' : isKeyword ? '38%' : isHybrid ? '54%' : '26%',
      citabilityIndex: isNoRag ? 'Crítico' : isKeyword ? 'Baixo' : isHybrid ? 'Instável' : 'Nulo',
      hallucinationRisk: isNoRag ? 'N/A (Sem IA)' : isKeyword ? 'Alto' : isHybrid ? 'Muito Alto' : 'Alto',
      contextEfficiency: isNoRag ? 'Nula' : isKeyword ? 'Ineficiente' : isHybrid ? 'Média' : 'Baixa',
      bottleneckTitle: isNoRag 
        ? 'Ausência Completa de Arquitetura RAG' 
        : isKeyword 
        ? 'Falta de Contexto Semântico (Busca Estática)' 
        : isHybrid
        ? 'Instabilidade Vetorial e Janela de Contexto Poluída'
        : 'Falta de Contêineres de Evidência e Credenciais de Autor',
      bottleneckDesc: isNoRag
        ? 'Sua empresa está totalmente invisível para buscas generativas e não possui barreira semântica. Seus dados não alimentam nenhuma IA de forma estruturada.'
        : isKeyword
        ? 'A busca por palavras-chave pura falha em compreender a intenção real do usuário, gerando respostas rasas ou nulas nos sistemas inteligentes.'
        : isHybrid
        ? 'Sua arquitetura possui "RAG cego": as fatias de documentos (chunks) não são otimizadas, poluindo a janela de contexto das LLMs e elevando os custos de API e as taxas de alucinação.'
        : 'Seu conteúdo falha em estruturar-se como um "Contêiner de Evidências" modular com dados, tabelas e definições, além de não apresentar credenciais de especialistas reais (E-E-A-T), impedindo a absorção e citação pelos modelos generativos.',
      actionRequired: isNoRag
        ? 'Desenhar e implantar um pipeline básico de ingestão vetorial (Embeddings) integrado a LLM.'
        : isKeyword
        ? 'Substituir ou enriquecer a busca com busca híbrida densa/esparsa e modelos de Re-ranking.'
        : isHybrid
        ? 'Ajustar as estratégias de fatiamento (chunking), calibrar limiar de similaridade de cosseno e implementar filtros de metadados.'
        : 'Reestruturar o site seguindo a metodologia científica de Contêiner de Evidências e implementar marcação de autoridade Schema Person.'
    };
  };

  const results = getDiagnosticResults();

  // Contact Guilherme via WhatsApp with custom structured parameters
  const handleTalkToGuilherme = () => {
    const architectureLabel = 
      architecture === 'no_rag' ? 'Sem RAG' :
      architecture === 'keyword' ? 'Busca por Palavras-Chave' :
      architecture === 'hybrid_hallucination' ? 'RAG Híbrido com Alucinações' : 'Desafio em LLMs';

    const text = encodeURIComponent(
      `Olá Guilherme, realizei o Diagnóstico Semântico Avançado de RAG no site b.rocket.\n\n` +
      `*Meus Dados:*\n` +
      `- Nome: ${name}\n` +
      `- Empresa: ${url}\n` +
      `- E-mail: ${email}\n` +
      `- WhatsApp: ${phone}\n` +
      `- Desafio/Arquitetura: ${architectureLabel}\n` +
      `- Escala da Base: ${scale === 'small' ? 'Até 100 docs' : scale === 'medium' ? '100 a 1.000 docs' : 'Mais de 1.000 docs'}\n\n` +
      `Gostaria de agendar a sessão de diagnóstico e entender como corrigir os gargalos identificados.`
    );
    window.open(`https://wa.me/5511999999999?text=${text}`, '_blank');
  };

  return (
    <section id="diagnostic-cta" className="bg-[#f4f5f8] grid-blueprint py-16 md:py-24 px-6 md:px-12 border-b border-zinc-200 relative overflow-hidden">
      {/* Visual background crosshair */}
      <div className="absolute top-8 left-8 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>
      <div className="absolute bottom-8 right-8 font-display text-zinc-350 text-xl font-light select-none pointer-events-none">+</div>

      <div className="max-w-7xl mx-auto">
        {/* Large container replicating the user's mockup layout */}
        <div className="bg-white border border-zinc-200/80 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-14 lg:p-16 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
          {/* Faint subtle grid-blueprint background inside the container */}
          <div className="absolute inset-0 grid-blueprint opacity-10 pointer-events-none rounded-[2rem] md:rounded-[2.5rem]" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: CTA Texts */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-5 max-w-2xl">
              <span className="font-mono text-[9px] md:text-[10px] text-zinc-400 uppercase tracking-[0.25em] font-bold block">
                QUER DIRECIONAR SUAS METAS?
              </span>
              
              <h2 className="font-display font-extrabold text-2xl md:text-3xl lg:text-[2.35rem] text-zinc-950 tracking-tight leading-[1.08] uppercase">
                REALIZE UM DIAGNÓSTICO SEMÂNTICO DE RAG E GEO PARA ENCONTRAR E CORRIGIR OS GARGALOS DA SUA IA.
              </h2>
              
              <button
                id="btn-trigger-diagnostic"
                onClick={handleOpenModal}
                className="inline-flex items-center gap-3 bg-zinc-950 hover:bg-zinc-900 active:scale-95 text-white font-mono text-[10px] md:text-[11px] font-bold px-7 py-4.5 tracking-widest uppercase transition-all duration-300 rounded-xl cursor-pointer shadow-md border-t border-zinc-750 group mt-4"
              >
                REALIZAR DIAGNÓSTICO COMPLETO
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  <ArrowRight className="w-4 h-4 text-white" />
                </motion.span>
              </button>
            </div>

            {/* Right Column: Abstract, gorgeous, context-rich "RAG Retrieval Mapper" */}
            <div className="lg:col-span-5 flex items-center justify-center lg:justify-end min-h-[380px] relative select-none">
              <div className="w-full max-w-[380px] bg-zinc-50 border border-zinc-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                {/* Visual grid in background */}
                <div className="absolute inset-0 opacity-10 grid-blueprint pointer-events-none" />
                
                {/* Header bar of schematic */}
                <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 mb-5 font-mono text-[8px] text-zinc-400 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>RAG_RETRIEVAL // ACTIVE</span>
                  </div>
                  <span>VEC_MAPPING_V3</span>
                </div>

                {/* Conceptual Schematic Steps */}
                <div className="space-y-4 relative z-10">
                  {/* Step 1: User Intent Query */}
                  <div className="bg-white border border-zinc-200/80 p-3.5 rounded-2xl flex items-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-zinc-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center shrink-0 shadow-inner">
                      <Search className="w-3.5 h-3.5 text-zinc-600" />
                    </div>
                    <div className="flex-grow text-left">
                      <div className="font-mono text-[6.5px] text-zinc-400 uppercase font-black tracking-wider leading-none">INTENT_PROMPT_INPUT</div>
                      <div className="text-[10px] font-bold text-zinc-950 mt-1 leading-none">"Melhor solução corporativa de..."</div>
                    </div>
                  </div>

                  {/* Flow connection path */}
                  <div className="flex justify-center my-[-4px]">
                    <div className="w-[1px] h-4 bg-dashed-zinc-300 border-l border-zinc-200" />
                  </div>

                  {/* Step 2: Vector Similarity Comparison Reticle */}
                  <div className="bg-white border border-zinc-200/80 p-3.5 rounded-2xl space-y-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative hover:border-zinc-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0">
                        <Cpu className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-grow text-left">
                        <div className="font-mono text-[6.5px] text-zinc-400 uppercase font-black tracking-wider leading-none">COSSINE_VEC_SIMILARITY</div>
                        <div className="text-[10px] font-bold text-zinc-950 mt-1 leading-none">ALINHAMENTO SEMÂNTICO</div>
                      </div>
                    </div>

                    {/* Vector mapping scatter mini display */}
                    <div className="h-16 bg-[#f1f2f5] border border-zinc-200/80 rounded-lg relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 opacity-15 grid-blueprint" />
                      
                      {/* Faded Competitor dots */}
                      <div className="absolute top-3 left-4 flex flex-col items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-350" />
                        <span className="font-mono text-[4.5px] text-zinc-400 uppercase mt-0.5 scale-90">Rival A (0.35)</span>
                      </div>
                      <div className="absolute bottom-3 left-10 flex flex-col items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-350" />
                        <span className="font-mono text-[4.5px] text-zinc-400 uppercase mt-0.5 scale-90">Rival B (0.24)</span>
                      </div>
                      <div className="absolute top-4 right-5 flex flex-col items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-350" />
                        <span className="font-mono text-[4.5px] text-zinc-400 uppercase mt-0.5 scale-90">Rival C (0.41)</span>
                      </div>
                      
                      {/* Targeted active matching dot with radar halo */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <div className="relative">
                          <span className="absolute -inset-2.5 rounded-full border border-emerald-400 animate-ping opacity-60" />
                          <span className="relative block w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow-xs" />
                        </div>
                        <span className="font-mono text-[5.5px] text-emerald-600 font-extrabold uppercase mt-0.5">SUA MARCA (0.97)</span>
                      </div>
                      
                      {/* Reticle lines */}
                      <div className="absolute inset-x-0 top-1/2 h-[1px] border-t border-zinc-250 border-dashed" />
                      <div className="absolute inset-y-0 left-1/2 w-[1px] border-l border-zinc-250 border-dashed" />
                    </div>
                  </div>

                  {/* Flow connection path */}
                  <div className="flex justify-center my-[-4px]">
                    <div className="w-[1px] h-4 bg-dashed-zinc-300 border-l border-zinc-200" />
                  </div>

                  {/* Step 3: Verified Citation Output */}
                  <div className="bg-white border border-zinc-200/80 p-3.5 rounded-2xl flex items-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-zinc-350 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-emerald-500 text-zinc-950 font-mono text-[6px] px-2.5 py-0.5 rounded-bl font-black tracking-widest uppercase">
                      SELECTED
                    </div>
                    
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="flex-grow text-left">
                      <div className="font-mono text-[6.5px] text-emerald-600 uppercase font-black tracking-wider leading-none">VERIFIED_SOURCE_CITATION</div>
                      <div className="text-[11px] font-black text-zinc-950 mt-1 uppercase tracking-tight">b.rocket (GEO_Rank_#1)</div>
                    </div>
                  </div>
                </div>

                {/* Footer specs of schematic */}
                <div className="mt-5 pt-3.5 border-t border-zinc-200/80 flex items-center justify-between font-mono text-[8px] text-zinc-400">
                  <span>LATENCY: 0.14ms</span>
                  <span>ACCURACY: 99.8%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Full-Screen Diagnostic Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            onClick={handleCloseModal}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md z-[100] flex items-start justify-center p-4 pt-6 md:pt-12 pb-12 overflow-y-auto no-scrollbar"
          >
            <motion.div
              id="diagnostic-modal-container"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-white border border-zinc-200 w-full max-w-4xl rounded-[2rem] overflow-hidden shadow-2xl relative z-10 my-8 no-scrollbar"
            >
              {/* Modal Top Header Bar with Accent Decoration */}
              <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-4 flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-mono text-[9px] md:text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest">
                    SECURE_ENVIRONMENT // DIAGNÓSTICO_AVANÇADO_V2
                  </span>
                </div>
                <button
                  id="btn-close-diagnostic-modal"
                  onClick={handleCloseModal}
                  className="p-1.5 hover:bg-zinc-200/80 active:scale-95 transition-all text-zinc-500 hover:text-zinc-950 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Dynamic Content Body */}
              <div className="p-6 md:p-10">
                <AnimatePresence mode="wait">
                  
                  {/* STEP 1: COMPREHENSIVE FORM */}
                  {diagnosticStep === 'form' && (
                    <motion.div
                      key="form-step"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2 text-center max-w-2xl mx-auto">
                        <span className="inline-flex items-center gap-1.5 bg-zinc-100 border border-zinc-250 px-2.5 py-1 rounded-full text-[9px] text-zinc-600 font-mono font-bold uppercase tracking-widest">
                          <Target className="w-3 h-3 text-zinc-900" /> Nível Avançado de Diagnóstico
                        </span>
                        <h3 className="font-display font-black text-2xl md:text-3xl text-zinc-950 uppercase tracking-tight leading-none">
                          Varredura Profunda de RAG & GEO
                        </h3>
                        <p className="text-xs md:text-sm text-zinc-500 font-light leading-relaxed">
                          Forneça as diretrizes técnicas e operacionais abaixo. Nossa engine irá simular o comportamento de indexação semântica e apontar onde sua inteligência está alucinando ou perdendo relevância.
                        </p>
                      </div>

                      <form onSubmit={handleSubmitForm} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Column 1: Identity & Target */}
                          <div className="space-y-4">
                            <h4 className="font-mono text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider border-b border-zinc-100 pb-1.5">
                              01 / IDENTIFICAÇÃO DO PROJETO
                            </h4>
                            
                            <div className="space-y-1">
                              <label htmlFor="diag-name" className="block text-[10px] font-mono font-bold text-zinc-500 uppercase">Seu Nome</label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
                                  <User className="w-4 h-4" />
                                </span>
                                <input
                                  id="diag-name"
                                  type="text"
                                  required
                                  placeholder="Ex: Guilherme Silva"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3.5 font-mono text-xs text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all shadow-inner"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label htmlFor="diag-email" className="block text-[10px] font-mono font-bold text-zinc-500 uppercase">E-mail Corporativo</label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
                                  <Mail className="w-4 h-4" />
                                </span>
                                <input
                                  id="diag-email"
                                  type="email"
                                  required
                                  placeholder="Ex: seu.nome@empresa.com"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3.5 font-mono text-xs text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all shadow-inner"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label htmlFor="diag-phone" className="block text-[10px] font-mono font-bold text-zinc-500 uppercase">WhatsApp Corporativo</label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
                                  <Phone className="w-4 h-4" />
                                </span>
                                <input
                                  id="diag-phone"
                                  type="tel"
                                  required
                                  placeholder="Ex: (11) 99999-9999"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3.5 font-mono text-xs text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all shadow-inner"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label htmlFor="diag-url" className="block text-[10px] font-mono font-bold text-zinc-500 uppercase">URL do Produto / Empresa</label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
                                  <Globe className="w-4 h-4" />
                                </span>
                                <input
                                  id="diag-url"
                                  type="text"
                                  required
                                  placeholder="Ex: www.minhaempresa.com.br"
                                  value={url}
                                  onChange={(e) => setUrl(e.target.value)}
                                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3.5 font-mono text-xs text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all shadow-inner"
                                />
                              </div>
                            </div>

                          </div>

                          {/* Column 2: Advanced Tech parameters */}
                          <div className="space-y-4">
                            <h4 className="font-mono text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider border-b border-zinc-100 pb-1.5">
                              02 / ARQUITETURA DE DADOS & IA
                            </h4>

                            <div className="space-y-1.5">
                              <label htmlFor="diag-architecture" className="block text-[10px] font-mono font-bold text-zinc-500 uppercase">Arquitetura de Busca / Principal Desafio</label>
                              <select
                                id="diag-architecture"
                                value={architecture}
                                onChange={(e) => setArchitecture(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 font-mono text-xs text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all cursor-pointer shadow-inner"
                              >
                                <option value="no_rag">Não possuímos arquitetura RAG implementada</option>
                                <option value="keyword">Busca baseada em Palavras-Chave tradicional (Baixa relevância)</option>
                                <option value="hybrid_hallucination">RAG Híbrido / Vetorial (Mas as LLMs estão alucinando / errando dados)</option>
                                <option value="llm_indexing">Queremos indexar nossa marca de forma orgânica nos LLMs (ChatGPT, Gemini)</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="diag-scale" className="block text-[10px] font-mono font-bold text-zinc-500 uppercase">Tamanho Estimado da Base de Conhecimento</label>
                              <select
                                id="diag-scale"
                                value={scale}
                                onChange={(e) => setScale(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 font-mono text-xs text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all cursor-pointer shadow-inner"
                              >
                                <option value="small">Pequena (Até 100 PDFs, artigos ou documentos internos)</option>
                                <option value="medium">Média (100 a 1.000 PDFs, artigos ou documentos corporativos)</option>
                                <option value="large">Grande (Mais de 1.000 arquivos complexos ou base heterogênea)</option>
                                <option value="unmeasured">Ainda não mapeado ou não mensurado</option>
                              </select>
                            </div>

                            <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 flex gap-3.5 items-start mt-3">
                              <ShieldAlert className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-zinc-500 leading-relaxed font-light">
                                <strong className="text-zinc-950 font-bold block">Conformidade e Proteção de Dados (LGPD)</strong>
                                Suas informações de infraestrutura são criptografadas e tratadas sob sigilo absoluto, destinadas unicamente ao mapeamento de performance semântica da b.rocket.
                              </p>
                            </div>
                          </div>

                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-zinc-150">
                          <button
                            id="btn-submit-diagnostic-form"
                            type="submit"
                            className="w-full bg-zinc-950 hover:bg-zinc-900 active:scale-98 text-white font-mono text-xs font-bold py-4.5 tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3.5 rounded-xl cursor-pointer shadow-xl border-t border-zinc-700"
                          >
                            GERAR DIAGNÓSTICO DE ALTA FIDELIDADE
                            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* STEP 2: SCANNING SIMULATION */}
                  {diagnosticStep === 'scanning' && (
                    <motion.div
                      key="scanning-step"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col justify-center items-center py-12 space-y-8 font-mono text-center"
                    >
                      <div className="relative">
                        {/* Elegant outer loader ring */}
                        <div className="absolute -inset-4 rounded-full border border-dashed border-zinc-300 animate-spin" style={{ animationDuration: '15s' }} />
                        <div className="w-16 h-16 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-xl">
                          <Loader2 className="w-8 h-8 animate-spin text-white" />
                        </div>
                      </div>

                      <div className="space-y-3.5 max-w-lg">
                        <span className="text-[10px] uppercase font-bold text-red-500 tracking-[0.2em] block animate-pulse">
                          ENGINE: GEO_VECTOR_CRAWLER_V3
                        </span>
                        <h4 className="text-zinc-950 text-lg font-black uppercase">
                          Simulando Varredura de Busca e RAG...
                        </h4>
                        
                        {/* Real-time technical log feedback */}
                        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 min-h-[58px] text-[11px] text-zinc-600 flex items-center justify-center shadow-inner font-light">
                          {currentScanLog}
                        </div>
                      </div>

                      {/* Percentage progress bar */}
                      <div className="w-full max-w-md space-y-2">
                        <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
                          <span>PROGRESSO DA VARREDURA</span>
                          <span>{scanProgress}%</span>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden border border-zinc-200 shadow-inner">
                          <motion.div 
                            className="bg-zinc-950 h-full rounded-full"
                            style={{ width: `${scanProgress}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: INTERACTIVE TECHNICAL RESULTS */}
                  {diagnosticStep === 'results' && (
                    <motion.div
                      key="results-step"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Metric Header Card */}
                      <div className="bg-zinc-950 text-white rounded-2xl p-6 md:p-8 border-t border-zinc-700 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-15 grid-blueprint pointer-events-none" />
                        
                        <div className="space-y-2 relative z-10">
                          <span className="inline-flex items-center gap-1 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[8px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> SIMULAÇÃO CONCLUÍDA
                          </span>
                          <h4 className="font-display font-black text-xl md:text-2xl uppercase tracking-tight">
                            Diagnóstico de RAG de {url || 'Empresa'}
                          </h4>
                          <p className="text-[11px] text-zinc-400 font-light leading-relaxed max-w-xl">
                            Varredura concluída sob as métricas de latência, precisão semântica e probabilidade de alucinações. Identificamos gargalos estruturais críticos em sua indexação.
                          </p>
                        </div>

                        {/* Large score badge */}
                        <div className="bg-white text-zinc-950 p-4.5 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center text-center shrink-0 shadow-lg min-w-[120px] relative z-10">
                          <span className="font-mono text-3xl font-black text-red-500 leading-none">{results.ragScore}</span>
                          <span className="text-[7.5px] uppercase font-bold text-zinc-400 tracking-wider mt-1.5">GEO RAG SCORE</span>
                        </div>
                      </div>

                      {/* Diagnostic Breakdown Matrix */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                          <span className="font-mono text-[8px] text-zinc-400 uppercase font-black">Citabilidade nas IAs</span>
                          <span className="text-zinc-950 font-bold text-base mt-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            {results.citabilityIndex}
                          </span>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                          <span className="font-mono text-[8px] text-zinc-400 uppercase font-black">Risco de Alucinação</span>
                          <span className="text-zinc-950 font-bold text-base mt-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            {results.hallucinationRisk}
                          </span>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                          <span className="font-mono text-[8px] text-zinc-400 uppercase font-black">Eficiência do Contexto</span>
                          <span className="text-zinc-950 font-bold text-base mt-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-zinc-400" />
                            {results.contextEfficiency}
                          </span>
                        </div>
                      </div>

                      {/* Main Bottleneck Box */}
                      <div className="border border-zinc-200 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm bg-white">
                        <div className="flex items-center gap-2.5 text-zinc-950 font-bold">
                          <AlertTriangle className="w-5 h-5 text-zinc-900 shrink-0" />
                          <h5 className="font-display font-black text-sm md:text-base uppercase tracking-tight">
                            Gargalo Principal: {results.bottleneckTitle}
                          </h5>
                        </div>
                        <p className="text-xs md:text-sm text-zinc-600 font-light leading-relaxed">
                          {results.bottleneckDesc}
                        </p>

                        <div className="bg-zinc-50 rounded-xl border border-zinc-150 p-4 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                          <div className="space-y-1">
                            <span className="font-mono text-[7px] text-zinc-400 font-extrabold uppercase tracking-widest block">AÇÃO CORRETIVA RECOMENDADA</span>
                            <span className="text-xs font-bold text-zinc-950 leading-snug">{results.actionRequired}</span>
                          </div>
                          <span className="bg-zinc-950 text-white font-mono text-[8px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider whitespace-nowrap self-stretch sm:self-auto text-center mt-2 sm:mt-0">
                            PRIORIDADE MÁXIMA
                          </span>
                        </div>
                      </div>

                      {/* Success Feedback & CTA */}
                      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-6 space-y-5">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h5 className="text-zinc-950 font-black text-sm uppercase tracking-tight">RELATÓRIO SEMÂNTICO COMPILADO COM SUCESSO!</h5>
                            <p className="text-xs text-zinc-600 font-light leading-relaxed">
                              O dossiê completo contendo a análise profunda de indexabilidade semântica, latência e as ações corretivas foi compilado com segurança e encaminhado para o e-mail <strong className="text-zinc-950 font-mono font-bold">{email}</strong>.
                            </p>
                          </div>
                        </div>

                        {/* WhatsApp & Google Calendar CTA */}
                        <div className="pt-4 border-t border-emerald-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="text-[11px] text-zinc-600 font-light max-w-sm">
                            Agendamento pré-aprovado com nosso especialista Guilherme para analisar os resultados diretamente em sua agenda Google.
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                            <button
                              onClick={() => window.dispatchEvent(new Event('open-booking-modal'))}
                              className="inline-flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-mono text-[10px] font-bold px-5 py-4 uppercase tracking-widest transition-all rounded-xl cursor-pointer shadow-md"
                            >
                              <Calendar className="w-4 h-4 text-white" />
                              AGENDAR GOOGLE MEET
                            </button>
                            <button
                              id="btn-whatsapp-guilherme"
                              onClick={handleTalkToGuilherme}
                              className="inline-flex items-center justify-center gap-2.5 bg-zinc-950 hover:bg-zinc-900 active:scale-95 text-white font-mono text-[10px] font-bold px-5 py-4 uppercase tracking-widest transition-all rounded-xl cursor-pointer shadow-md border-t border-zinc-700"
                            >
                              <MessageSquare className="w-4 h-4 text-emerald-400" />
                              FALAR NO WHATSAPP
                            </button>
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
