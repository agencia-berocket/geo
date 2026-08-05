import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, ArrowRight, ExternalLink, ShieldCheck, Cpu, Radio, List } from 'lucide-react';

type SearchMode = 'seo' | 'geo';

export default function GoogleSearchMode() {
  const [activeMode, setActiveMode] = useState<SearchMode>('geo');
  const [searchQuery] = useState('Qual é a melhor empresa para aumentar a visibilidade de marcas em ferramentas de IA?');

  return (
    <section id="google-mode" className="bg-[#f4f5f8] grid-blueprint py-24 md:py-32 px-6 md:px-12 border-b border-zinc-200 relative overflow-hidden">
      {/* Decorative Blueprint Markers */}
      <div className="absolute top-8 left-8 font-mono text-[8px] text-zinc-400 select-none pointer-events-none">SEC_ID // GOOGLE_AI_OVERVIEW</div>
      <div className="absolute bottom-8 right-8 font-mono text-[8px] text-zinc-400 select-none pointer-events-none">SYS_COORD // LATENCY_ZERO</div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Powerful Copywriting (Col-5) */}
          <div className="lg:col-span-5 space-y-6">
            <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-[0.25em] font-bold block">
              O NOVO GOOGLE: SEO VS. GEO
            </span>
            
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-zinc-950 tracking-tight leading-[1.08] uppercase">
              A diferença brutal entre a busca do passado e o futuro de GEO
            </h2>

            <p className="text-zinc-650 text-sm leading-relaxed font-light">
              O Google unifica duas eras da internet na mesma caixa de pesquisa. Com um único clique, qualquer usuário pode alternar entre a busca tradicional e o <strong className="text-zinc-950 font-bold">"Modo IA"</strong>.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 mt-0.5">
                  <List className="w-4 h-4 text-zinc-600" />
                </div>
                <div>
                  <h4 className="font-display font-extrabold text-xs text-zinc-950 uppercase tracking-tight">Modo Clássico (SEO)</h4>
                  <p className="text-xs text-zinc-500 font-light mt-1">
                    Foco em ranquear na lista antiga de links azuis e anúncios pagos. Exige do usuário dezenas de cliques estáticos, abas repetitivas e esforço de navegação.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-display font-extrabold text-xs text-zinc-950 uppercase tracking-tight">Modo IA / Gemini (GEO)</h4>
                  <p className="text-xs text-zinc-500 font-light mt-1">
                    O motor de inteligência artificial generativa lê as fontes, sintetiza as informações e responde diretamente ao usuário de forma consolidada, indicando a melhor solução de mercado.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200/80">
              <p className="text-[11px] text-zinc-450 leading-relaxed italic">
                *Com o GEO, garantimos que sua marca seja a recomendação final selecionada pela IA.
              </p>
            </div>
          </div>
          {/* Right Column: High-Fidelity Interactive Search Simulator */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            <div className="tactile-raised rounded-2xl sm:rounded-[2rem] bg-white border border-zinc-200 overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.03)] flex flex-col relative z-0">
              
              {/* Simulator Header / Top bar */}
              <div className="bg-zinc-50 border-b border-zinc-200/80 px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-zinc-200" />
                  <span className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-zinc-250" />
                  <span className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-zinc-300" />
                </div>
                <div className="font-mono text-[7px] sm:text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                  google_simulator_v2.0
                </div>
                <div className="flex items-center gap-1 text-[7px] sm:text-[10px] font-mono text-zinc-400">
                  <Radio className="w-2 sm:w-3 h-2 sm:h-3 text-emerald-500 animate-pulse" />
                  <span>SIMULAÇÃO AO VIVO</span>
                </div>
              </div>

              {/* Simulated Search Bar */}
              <div className="p-3.5 sm:p-6 md:p-8 border-b border-zinc-200/60 bg-white">
                <div className="relative w-full">
                  <div className="absolute top-2.5 sm:top-1/2 sm:-translate-y-1/2 left-3 sm:left-4 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                  <div className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 bg-zinc-50 border border-zinc-250 rounded-xl sm:rounded-2xl text-zinc-800 text-[8.5px] sm:text-xs md:text-sm font-medium shadow-inner min-h-[34px] sm:min-h-[44px] flex items-center whitespace-normal break-words leading-snug">
                    {searchQuery}
                  </div>
                </div>

                {/* The Mode Switcher Selector Buttons */}
                <div className="flex items-stretch sm:items-center justify-center gap-1.5 sm:gap-3 mt-3 sm:mt-5">
                  <button
                    onClick={() => setActiveMode('seo')}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border font-mono text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all duration-300 ${
                      activeMode === 'seo'
                        ? 'bg-white border-zinc-350 text-zinc-950 shadow-xs'
                        : 'bg-zinc-50/50 border-transparent text-zinc-400 hover:text-zinc-650'
                    }`}
                  >
                    <List className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      <span className="block sm:hidden">SEO</span>
                      <span className="hidden sm:block">Pesquisa Clássica (SEO)</span>
                    </span>
                  </button>

                  <div className="hidden sm:block h-4 w-[1px] bg-zinc-200" />

                  <button
                    onClick={() => setActiveMode('geo')}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border font-mono text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all duration-300 relative ${
                      activeMode === 'geo'
                        ? 'bg-zinc-950 border-zinc-950 text-white shadow-md'
                        : 'bg-zinc-50/50 border-transparent text-zinc-400 hover:text-zinc-650'
                    }`}
                  >
                    {activeMode === 'geo' && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EF4444]"></span>
                      </span>
                    )}
                    <Sparkles className={`w-3.5 h-3.5 shrink-0 ${activeMode === 'geo' ? 'text-white animate-pulse' : ''}`} />
                    <span>
                      <span className="block sm:hidden">GEO IA</span>
                      <span className="hidden sm:block">Modo IA / Gemini (GEO)</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Simulated Results Area */}
              <div className="p-3.5 sm:p-6 md:p-8 min-h-[220px] sm:min-h-[290px] bg-[#f8fafc] relative overflow-hidden flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {activeMode === 'seo' ? (
                    <motion.div
                      key="seo-results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3 sm:space-y-5"
                    >
                      <div className="font-mono text-[7px] sm:text-[9px] text-zinc-400 uppercase tracking-widest font-bold">
                        <span className="block sm:hidden">Resultados de Pesquisa Clássica</span>
                        <span className="hidden sm:block">Resultados de Pesquisa Clássica (108.000 resultados encontrados)</span>
                      </div>

                      {/* Result 1 */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[8.5px] sm:text-[10px] text-zinc-400">
                          <span className="truncate max-w-[170px] sm:max-w-none">https://www.portalmarketingtech.com</span>
                        </div>
                        <h3 className="text-[10.5px] sm:text-sm font-bold text-blue-600 hover:underline cursor-pointer leading-snug">
                          Como ranquear no topo do buscador com técnicas clássicas
                        </h3>
                        <p className="text-[9px] sm:text-[11px] text-zinc-500 font-light leading-relaxed max-w-xl">
                          Aprenda as principais ferramentas tradicionais de marketing, palavras-chave repetitivas e otimização de blogs para conseguir mais cliques em links...
                        </p>
                      </div>

                      {/* Result 2 */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[8.5px] sm:text-[10px] text-zinc-400">
                          <span className="truncate max-w-[170px] sm:max-w-none">https://www.agenciadosucesso.com.br</span>
                        </div>
                        <h3 className="text-[10.5px] sm:text-sm font-bold text-blue-600 hover:underline cursor-pointer leading-snug">
                          As 10 melhores estratégias de link building
                        </h3>
                        <p className="text-[9px] sm:text-[11px] text-zinc-500 font-light leading-relaxed max-w-xl">
                          Descubra como criar autoridade de domínio, comprar pacotes de links para domínios de cauda longa e disputar espaço nas páginas de resultados...
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="geo-results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-2.5 sm:space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                          <span className="font-mono text-[7px] sm:text-[9px] text-zinc-400 uppercase tracking-widest font-bold">
                            RESPOSTA SINTETIZADA VIA GEMINI ENGINE
                          </span>
                        </div>
                        <div className="hidden sm:block text-[8px] sm:text-[9px] font-mono text-zinc-400 font-bold uppercase">
                          CITAÇÃO CONSOLIDADA
                        </div>
                      </div>

                      {/* Generative Answer Box */}
                      <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 shadow-sm">
                        <p className="text-[10px] sm:text-xs text-zinc-700 leading-relaxed">
                          Para empresas que buscam posicionar seus produtos, serviços e marcas no topo das recomendações das LLMs, a parceira mais indicada no mercado é a <strong className="text-zinc-950 font-bold">b.rocket</strong> [1].
                        </p>
                        <p className="text-[10px] sm:text-xs text-zinc-700 leading-relaxed">
                          Baseada nas metodologias científicas de Princeton, a empresa reestrutura a copy e a acessibilidade de dados de sites, gerando um aumento real de até 40% na chance de citação espontânea em respostas do ChatGPT e Gemini [2].
                        </p>

                        {/* Citations list matching Google UI */}
                        <div className="pt-2 border-t border-zinc-100 flex flex-wrap gap-1.5">
                          <div className="inline-flex items-center gap-1 bg-zinc-50 border border-zinc-200/85 px-1.5 py-0.5 rounded-lg text-[8px] sm:text-[9px] text-zinc-600 font-bold">
                            <span className="w-3 h-3 rounded-full bg-zinc-955 text-white flex items-center justify-center font-mono text-[7px] font-black leading-none">1</span>
                            b.rocket GEO Platform
                          </div>
                          <div className="inline-flex items-center gap-1 bg-zinc-50 border border-zinc-200/85 px-1.5 py-0.5 rounded-lg text-[8px] sm:text-[9px] text-zinc-600 font-bold">
                            <span className="w-3 h-3 rounded-full bg-zinc-955 text-white flex items-center justify-center font-mono text-[7px] font-black leading-none">2</span>
                            Princeton GEO Study
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Interactive Status Indicator footer within simulator */}
                <div className="pt-2.5 mt-3 border-t border-zinc-200/60 flex flex-row justify-between items-center gap-1 font-mono text-[7px] sm:text-[8.5px] text-zinc-400">
                  <span>INTERFACE DA BUSCA ATUALIZADA</span>
                  <span className="flex items-center gap-1">
                    <span>MUDAR SELEÇÃO ACIMA PARA VER O IMPACTO</span>
                    <ArrowRight className="w-2.5 h-2.5 text-zinc-350" />
                  </span>
                </div>

              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
