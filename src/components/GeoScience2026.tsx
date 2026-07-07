import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Search, 
  BookOpen, 
  Activity, 
  HelpCircle, 
  FileCheck, 
  ShieldAlert, 
  TrendingUp, 
  Layers, 
  Cpu, 
  FileText, 
  Award, 
  History, 
  Terminal,
  Zap,
  CheckCircle2,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';

type TabType = 'framework' | 'container' | 'factors' | 'guardians' | 'aso';

export default function GeoScience2026() {
  const [activeTab, setActiveTab] = useState<TabType>('framework');
  const [activeEvidenceType, setActiveEvidenceType] = useState<'def' | 'stat' | 'table' | 'howto'>('stat');

  // Interactive slider values for Selection vs Absorption
  const [selectionRate, setSelectionRate] = useState(70);
  const [absorptionRate, setAbsorptionRate] = useState(25);

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'framework', label: 'Seleção vs. Absorção', icon: Layers },
    { id: 'container', label: 'Contêiner de Evidências', icon: BookOpen },
    { id: 'factors', label: '6 Fatores de Impulsionamento', icon: TrendingUp },
    { id: 'guardians', label: '4 Guardiões (Exclusões)', icon: ShieldAlert },
    { id: 'aso', label: 'ASO & Agentes Autónomos', icon: Cpu },
  ];

  return (
    <section id="geo-science" className="bg-white border-b border-zinc-200 py-24 md:py-32 px-6 md:px-12 relative overflow-hidden grid-blueprint">
      {/* Decorative Science Blueprint markers */}
      <div className="absolute top-8 left-8 font-mono text-[8px] text-zinc-400 select-none pointer-events-none">
        SCI_FRAMEWORK // GEO_CITED_LAB_2026
      </div>
      <div className="absolute bottom-8 right-8 font-mono text-[8px] text-zinc-400 select-none pointer-events-none">
        EMPIRICAL_METRICS // RAG_COMPLIANT
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Tag */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200 pb-6 mb-12 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">Ciência de GEO Avançada</span>
          </div>
          <div className="font-mono text-xs text-zinc-400">
            DADOS CIENTÍFICOS ATUALIZADOS // ANO 2026
          </div>
        </div>

        {/* Title and Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          <div className="lg:col-span-7">
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-zinc-950 leading-[1.05] tracking-tight uppercase">
              O CHOQUE DE REALIDADE <br />
              <span className="text-zinc-500/80">CIENTÍFICA DO GEO</span>
            </h2>
            <p className="text-zinc-500 font-sans text-sm md:text-base mt-4 border-l-2 border-zinc-950 pl-4 max-w-2xl leading-relaxed font-light">
              Novas descobertas empíricas revelam que as IAs tratam a internet de forma inteiramente diferente dos antigos mecanismos de pesquisa. Estar na primeira página do Google é apenas o primeiro passo. Conheça a metodologia científica que rege as decisões do RAG.
            </p>
          </div>
          <div className="lg:col-span-5 flex flex-col justify-end">
            <div className="bg-[#f4f5f8] p-5 rounded-2xl border border-zinc-200 text-left space-y-2">
              <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-bold">DADO DE IMPACTO IMEDIATO</span>
              <p className="text-xs text-zinc-700 leading-relaxed">
                <strong className="text-zinc-950 font-extrabold text-sm block mb-1">53% DOS SITES CITADOS NÃO SÃO TOP 10 NO GOOGLE</strong>
                As LLMs usam recuperação semântica independente da classificação clássica. O SEO antigo não garante que sua marca seja mencionada na resposta generativa.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Workspace Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation vertical list (Tabs) */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider font-bold mb-3 pl-2">
              SELECIONE UM FRAMEWORK METODOLÓGICO
            </div>
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'bg-zinc-950 border-zinc-950 text-white shadow-md'
                      : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-700 border border-zinc-200'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-grow">
                    <span className="font-display font-extrabold text-xs uppercase tracking-tight block">
                      {tab.label}
                    </span>
                    <span className="font-mono text-[8px] text-zinc-400 block mt-0.5 uppercase">
                      {tab.id === 'framework' ? 'Métricas de Absorção' :
                       tab.id === 'container' ? 'Engenharia Editorial' :
                       tab.id === 'factors' ? 'Estatísticas Empíricas' :
                       tab.id === 'guardians' ? 'Fatores Excludentes' :
                       'Protocolos de Integração'}
                    </span>
                  </div>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    isSelected ? 'translate-x-1 opacity-100' : 'opacity-30'
                  }`} />
                </button>
              );
            })}
          </div>

          {/* Dynamic Content Panel (Interactive & Explanatory) */}
          <div className="lg:col-span-8 bg-zinc-50 border border-zinc-200 p-6 md:p-8 rounded-[2rem] shadow-inner relative min-h-[500px] flex flex-col justify-between">
            <div className="absolute inset-0 opacity-5 grid-blueprint pointer-events-none rounded-[2rem]" />
            
            <AnimatePresence mode="wait">
              
              {/* TAB 1: FRAMEWORK SELEÇÃO VS ABSORÇÃO */}
              {activeTab === 'framework' && (
                <motion.div
                  key="framework-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 font-mono text-[9px] text-red-500 font-bold uppercase tracking-widest">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Citation Selection vs. Citation Absorption</span>
                  </div>

                  <h3 className="font-display font-extrabold text-xl md:text-2xl text-zinc-950 uppercase tracking-tight">
                    Não basta ser listado. É preciso ser absorvido.
                  </h3>

                  <p className="text-zinc-600 text-xs md:text-sm font-light leading-relaxed">
                    Pesquisas do <strong className="text-zinc-950 font-bold">geo-citation-lab (2026)</strong> dividiram o processo de resposta de IA em duas etapas. Sua meta de marketing não deve ser apenas a seleção, mas sim dominar a <strong className="text-zinc-950 font-semibold">Absorção de Citação</strong>, garantindo que seu conteúdo construa a resposta principal da IA.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* Left block */}
                    <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] bg-zinc-100 text-zinc-500 px-2.5 py-0.5 rounded-full font-bold uppercase">ETAPA 01 // SELEÇÃO</span>
                        <span className="text-zinc-400 font-mono text-[10px]">Citation Selection</span>
                      </div>
                      <h4 className="font-display font-black text-sm uppercase text-zinc-950">A Entrada no Pool de Fontes</h4>
                      <p className="text-[11px] text-zinc-500 leading-relaxed font-light">
                        O robô aciona a busca (via RAG) e escolhe quais páginas lerá. Depende de autoridade de domínio, indexabilidade do bot no <code className="bg-zinc-50 px-1 py-0.5 border border-zinc-150 rounded text-zinc-950">robots.txt</code> e correspondência semântica básica.
                      </p>
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-[9px] font-mono font-bold text-zinc-400">
                          <span>Sua taxa de seleção simulada</span>
                          <span>{selectionRate}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="100" 
                          value={selectionRate} 
                          onChange={(e) => setSelectionRate(Number(e.target.value))}
                          className="w-full accent-zinc-950 h-1 bg-zinc-100 rounded-lg cursor-pointer" 
                        />
                      </div>
                    </div>

                    {/* Right block */}
                    <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] bg-red-50 text-red-500 px-2.5 py-0.5 rounded-full font-bold uppercase">ETAPA 02 // ABSORÇÃO</span>
                        <span className="text-red-500 font-mono text-[10px] font-bold">Citation Absorption</span>
                      </div>
                      <h4 className="font-display font-black text-sm uppercase text-zinc-950">A Extração das Respostas</h4>
                      <p className="text-[11px] text-zinc-500 leading-relaxed font-light">
                        A IA lê os trechos selecionados e extrai dados para formular os parágrafos reais da resposta. Se sua página tiver baixa absorção, ela será apenas um link fraco jogado no final da resposta, sem visibilidade de marca.
                      </p>
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-[9px] font-mono font-bold text-zinc-400">
                          <span>Sua taxa de absorção (Absorption Score)</span>
                          <span className="text-red-500 font-black">{absorptionRate}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="5" 
                          max="100" 
                          value={absorptionRate} 
                          onChange={(e) => setAbsorptionRate(Number(e.target.value))}
                          className="w-full accent-red-500 h-1 bg-zinc-100 rounded-lg cursor-pointer" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-950 text-white p-4.5 rounded-2xl border-t border-zinc-700 flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-zinc-300">FOCO DO NOSSO MÉTODO:</span>
                    <span className="font-display font-black text-xs uppercase tracking-wider text-emerald-400">
                      Otimizar o ABOSORPTION SCORE da sua página acima de 85%
                    </span>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: CONTÊINER DE EVIDÊNCIAS & FAQ MITO */}
              {activeTab === 'container' && (
                <motion.div
                  key="container-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 font-mono text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                    <BookOpen className="w-3.5 h-3.5 text-zinc-900" />
                    <span>Evidence-Container Design & Modular Blocks</span>
                  </div>

                  <h3 className="font-display font-extrabold text-xl md:text-2xl text-zinc-950 uppercase tracking-tight">
                    O Fim do "Mito da FAQ Simples" e o Contêiner de Evidências
                  </h3>

                  <p className="text-zinc-600 text-xs md:text-sm font-light leading-relaxed">
                    Transformar o site em uma lista rasa de Perguntas e Respostas (FAQ) é uma tática ultrapassada que falha no RAG. Pesquisas empíricas revelaram que páginas puramente de FAQ tiveram uma <strong className="text-red-500 font-extrabold">redução de -5,74% na absorção</strong> por serem consideradas conteúdo raso. As IAs tratam as páginas como <strong className="text-zinc-950 font-bold">"Contêineres de Evidências"</strong> ricos e modulares.
                  </p>

                  <div className="space-y-3">
                    <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Os 4 Gêneros de Evidência Exigidos pelas LLMs:</span>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                      <button
                        onClick={() => setActiveEvidenceType('def')}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                          activeEvidenceType === 'def'
                            ? 'bg-zinc-950 border-zinc-950 text-white shadow'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        <span className="font-mono text-[14px] font-bold block text-emerald-400">+57.3%</span>
                        <span className="font-display font-extrabold text-[10px] uppercase mt-1 block">Definições</span>
                      </button>

                      <button
                        onClick={() => setActiveEvidenceType('stat')}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                          activeEvidenceType === 'stat'
                            ? 'bg-zinc-950 border-zinc-950 text-white shadow'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        <span className="font-mono text-[14px] font-bold block text-emerald-400">+61.5%</span>
                        <span className="font-display font-extrabold text-[10px] uppercase mt-1 block">Estatísticas</span>
                      </button>

                      <button
                        onClick={() => setActiveEvidenceType('table')}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                          activeEvidenceType === 'table'
                            ? 'bg-zinc-950 border-zinc-950 text-white shadow'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        <span className="font-mono text-[14px] font-bold block text-emerald-400">+47%</span>
                        <span className="font-display font-extrabold text-[10px] uppercase mt-1 block">Tabelas</span>
                      </button>

                      <button
                        onClick={() => setActiveEvidenceType('howto')}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                          activeEvidenceType === 'howto'
                            ? 'bg-zinc-950 border-zinc-950 text-white shadow'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        <span className="font-mono text-[14px] font-bold block text-emerald-400">+41.2%</span>
                        <span className="font-display font-extrabold text-[10px] uppercase mt-1 block">Instruções</span>
                      </button>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-xl p-4.5 min-h-[110px] flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="font-mono text-[8px] text-zinc-400 font-extrabold uppercase">
                          {activeEvidenceType === 'def' && 'DETALHES DO IMPACTO // DEFINIÇÃO EXPLICITA'}
                          {activeEvidenceType === 'stat' && 'DETALHES DO IMPACTO // DADOS NUMÉRICOS'}
                          {activeEvidenceType === 'table' && 'DETALHES DO IMPACTO // TABELAS COMPARATIVAS'}
                          {activeEvidenceType === 'howto' && 'DETALHES DO IMPACTO // CÓDIGO PASSO-A-PASSO'}
                        </span>
                        <p className="text-xs text-zinc-650 leading-relaxed font-light">
                          {activeEvidenceType === 'def' && 'Definições diretas e conceituais do produto nas primeiras linhas aumentam a citabilidade em até 57.3% porque as LLMs as utilizam como premissas conceituais para introduzir a resposta ao usuário.'}
                          {activeEvidenceType === 'stat' && 'Adicionar dados numéricos específicos e estatísticas concretas em passagens de texto gera o maior ganho empírico do RAG (+61.5%). As IAs adoram sintetizar fatos objetivos respaldados por números.'}
                          {activeEvidenceType === 'table' && 'As tabelas comparativas recebem 47% mais citações do que textos corridos de comparação. As LLMs analisam o grid de dados com facilidade e frequentemente replicam a tabela inteira na resposta final.'}
                          {activeEvidenceType === 'howto' && 'Instruções claras e ordenadas de "Como fazer" (How-to) aumentam as citações de IA em 41.2%, pois fornecem guias acionáveis e diretos altamente úteis para resolver a dor do prompt.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: OS 6 FATORES CIENTÍFICOS */}
              {activeTab === 'factors' && (
                <motion.div
                  key="factors-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 font-mono text-[9px] text-emerald-500 font-bold uppercase tracking-widest">
                    <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
                    <span>Os 6 Fatores Científicos de Impulsionamento (2026)</span>
                  </div>

                  <h3 className="font-display font-extrabold text-xl md:text-2xl text-zinc-950 uppercase tracking-tight">
                    Fatores com Validação Acadêmica Exata
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Factor 1 */}
                    <div className="bg-white p-4 rounded-xl border border-zinc-200 flex items-start gap-3 shadow-xs">
                      <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center shrink-0 font-mono text-xs font-black">1</div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-zinc-950 uppercase">Fator TL;DR</h4>
                          <span className="text-emerald-500 font-mono text-[10px] font-black">+35%</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-light leading-normal">Resumo explicativo direto de 60 palavras no início da página.</p>
                      </div>
                    </div>

                    {/* Factor 2 */}
                    <div className="bg-white p-4 rounded-xl border border-zinc-200 flex items-start gap-3 shadow-xs">
                      <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center shrink-0 font-mono text-xs font-black">2</div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-zinc-950 uppercase">Credenciais (E-E-A-T)</h4>
                          <span className="text-emerald-500 font-mono text-[10px] font-black">+40%</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-light leading-normal">Assinatura de especialistas (MD, Ph.D, LinkedIn Schema Person).</p>
                      </div>
                    </div>

                    {/* Factor 3 */}
                    <div className="bg-white p-4 rounded-xl border border-zinc-200 flex items-start gap-3 shadow-xs">
                      <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center shrink-0 font-mono text-xs font-black">3</div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-zinc-950 uppercase">Atribuição de Fonte</h4>
                          <span className="text-emerald-500 font-mono text-[10px] font-black">+41%</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-light leading-normal">Estatísticas embasadas com citação a cada 150-200 palavras.</p>
                      </div>
                    </div>

                    {/* Factor 4 */}
                    <div className="bg-white p-4 rounded-xl border border-zinc-200 flex items-start gap-3 shadow-xs">
                      <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center shrink-0 font-mono text-xs font-black">4</div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-zinc-950 uppercase">Aspas de Autoridade</h4>
                          <span className="text-emerald-500 font-mono text-[10px] font-black">+28%</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-light leading-normal">Citações textuais entre aspas de executivos renomados do setor.</p>
                      </div>
                    </div>

                    {/* Factor 5 */}
                    <div className="bg-white p-4 rounded-xl border border-zinc-200 flex items-start gap-3 shadow-xs">
                      <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center shrink-0 font-mono text-xs font-black">5</div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-zinc-950 uppercase">Estrutura Limpa</h4>
                          <span className="text-emerald-500 font-mono text-[10px] font-black">+40%</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-light leading-normal">Hierarquia impecável (H2 para H3 com tópicos ordenados).</p>
                      </div>
                    </div>

                    {/* Factor 6 */}
                    <div className="bg-white p-4 rounded-xl border border-zinc-200 flex items-start gap-3 shadow-xs">
                      <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center shrink-0 font-mono text-xs font-black">6</div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-zinc-950 uppercase">Frescor de Dados</h4>
                          <span className="text-emerald-500 font-mono text-[10px] font-black">3.2x</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-light leading-normal">Atualizações estruturais do site e datas nos últimos 30 dias.</p>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* TAB 4: OS 4 GUARDIÕES DO RAG */}
              {activeTab === 'guardians' && (
                <motion.div
                  key="guardians-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 font-mono text-[9px] text-red-500 font-bold uppercase tracking-widest">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Os 4 Guardiões do RAG // Fatores Excludentes</span>
                  </div>

                  <h3 className="font-display font-extrabold text-xl md:text-2xl text-zinc-950 uppercase tracking-tight">
                    Erros Críticos que Eliminam sua Citação Imediatamente
                  </h3>

                  <p className="text-zinc-600 text-xs md:text-sm font-light leading-relaxed">
                    A pesquisa competitiva identificou quatro fatores impiedosos. Se o seu site falhar em qualquer um desses eixos, a probabilidade de recomendação pelas LLMs cai para praticamente zero, mesmo se o seu conteúdo for de qualidade.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Guardian 1 */}
                    <div className="bg-white p-4 rounded-xl border border-zinc-200 space-y-1">
                      <div className="flex items-center gap-2 text-red-600 font-mono text-[9px] font-bold">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>01 // TOPIC MISMATCH</span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-950 uppercase">Desalinhamento Tópico</h4>
                      <p className="text-[10px] text-zinc-400 leading-normal font-light">Se o algoritmo de busca inicial trouxer páginas irrelevantes, a LLM o descarta do pool de imediato.</p>
                    </div>

                    {/* Guardian 2 */}
                    <div className="bg-white p-4 rounded-xl border border-zinc-200 space-y-1">
                      <div className="flex items-center gap-2 text-red-600 font-mono text-[9px] font-bold">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>02 // PRICE NOT MENTIONED</span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-950 uppercase">Ausência de Dados Comerciais</h4>
                      <p className="text-[10px] text-zinc-400 leading-normal font-light">Para buscas de compra, não mencionar taxas ou faixas de preço claras elimina o site de forma automática.</p>
                    </div>

                    {/* Guardian 3 */}
                    <div className="bg-white p-4 rounded-xl border border-zinc-200 space-y-1">
                      <div className="flex items-center gap-2 text-red-600 font-mono text-[9px] font-bold">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>03 // STALE TIMESTAMPS</span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-950 uppercase">Datas Muito Antigas</h4>
                      <p className="text-[10px] text-zinc-400 leading-normal font-light">LLMs filtram por datas recentes para evitar alucinações. Páginas com data de anos anteriores são descartadas.</p>
                    </div>

                    {/* Guardian 4 */}
                    <div className="bg-white p-4 rounded-xl border border-zinc-200 space-y-1">
                      <div className="flex items-center gap-2 text-red-600 font-mono text-[9px] font-bold">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>04 // LOWER LIST POSITION</span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-950 uppercase">Fora do Top 10 Orgânico</h4>
                      <p className="text-[10px] text-zinc-400 leading-normal font-light">Apesar do GEO revolucionar a busca, 92,36% das fontes do Google AI Overviews ainda dependem de estar no Top 10 orgânico clássico.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 5: PREPARANDO PARA O ASO (AGENTIC SEARCH OPTIMIZATION) */}
              {activeTab === 'aso' && (
                <motion.div
                  key="aso-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 font-mono text-[9px] text-red-500 font-bold uppercase tracking-widest">
                    <Cpu className="w-3.5 h-3.5 text-zinc-950 animate-pulse" />
                    <span>Next Frontier // Agentic Search Optimization (ASO)</span>
                  </div>

                  <h3 className="font-display font-extrabold text-xl md:text-2xl text-zinc-950 uppercase tracking-tight">
                    Preparando sua Arquitetura para os Agentes de IA
                  </h3>

                  <p className="text-zinc-600 text-xs md:text-sm font-light leading-relaxed">
                    Até agora, os humanos conversavam com as IAs. Nos próximos trimestres, os <strong className="text-zinc-950 font-bold">Agentes Autônomos de IA</strong> (como OpenAI Operator, Claude Computer Use) navegarão e farão transações de forma automatizada pelo usuário. 
                  </p>

                  <div className="bg-zinc-950 text-[#39ff14] p-5 rounded-2xl border border-zinc-800 font-mono text-xs space-y-3 shadow-lg">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                      <span>mcp_protocol_connection.json</span>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <div className="space-y-1 text-[10.5px] leading-relaxed">
                      <p className="text-zinc-400">{"{"}</p>
                      <p className="pl-4">{"\"protocol\": \"Model Context Protocol (MCP)\","}</p>
                      <p className="pl-4">{"\"endpoint\": \"/api/mcp/v1/tools\","}</p>
                      <p className="pl-4 text-emerald-400">{"\"llms_text_integration\": true, // llms.txt at root"}</p>
                      <p className="pl-4">{"\"response_format\": \"structured-json-nodes\""}</p>
                      <p className="text-zinc-400">{"}"}</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 leading-relaxed font-light">
                    O método <strong className="text-zinc-950 font-semibold">b.rocket</strong> já entrega a arquitetura do seu site com endpoints estruturados (JSON e Markdown nativos via <code className="bg-zinc-100 px-1 py-0.5 rounded border text-zinc-950 font-mono text-[9px]">llms.txt</code>) preparados para o Model Context Protocol, permitindo que agentes de compras tomem decisões sobre o seu serviço em milissegundos.
                  </p>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Bottom Panel Branding */}
            <div className="mt-8 pt-4 border-t border-zinc-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-zinc-450" />
                <span className="font-mono text-[8px] text-zinc-400 uppercase tracking-widest font-black">
                  b.rocket // ESTÁGIO DE MATURIDADE TECNOLÓGICA: 100% PRONTO
                </span>
              </div>
              <span className="font-mono text-[9px] bg-zinc-900 text-white px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">
                COGNITIVE ENGINE v3.5
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
