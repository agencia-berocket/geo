import { motion } from 'motion/react';
import { ArrowLeft, Rocket } from 'lucide-react';

interface LegalSection {
  title: string;
  content: string | string[];
}

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export default function LegalPageLayout({ title, subtitle, lastUpdated, sections }: LegalPageLayoutProps) {
  const goHome = () => {
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f4f5f8] text-zinc-950 font-sans antialiased">
      
      {/* Compact Navbar */}
      <header className="sticky top-0 z-50 py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-3.5 flex justify-between items-center tactile-raised bg-white">
          <a onClick={goHome} className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shadow-md shrink-0 relative overflow-hidden group-hover:scale-105 transition-all duration-300">
              <div className="w-5.5 h-5.5 rounded-full border border-white/95 bg-white shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)] relative flex items-center justify-center overflow-hidden">
                <div className="w-[15px] h-[10px] bg-zinc-950 rounded-[4px] relative overflow-hidden shadow-inner mt-[-1.5px] border border-zinc-900/40">
                  <div className="absolute top-[0.5px] left-[1px] w-[3px] h-[4px] bg-white/40 rounded-full rotate-12" />
                  <div className="absolute bottom-0 right-0 w-[4px] h-[3px] bg-emerald-500/80 blur-[0.5px] rounded-full" />
                </div>
                <div className="absolute bottom-[2px] w-[10px] h-[1.5px] bg-zinc-300 rounded-full" />
              </div>
            </div>
            <span className="font-display font-extrabold text-lg tracking-[0.08em] text-zinc-950 uppercase">
              b.rocket
            </span>
          </a>

          <button
            onClick={goHome}
            className="flex items-center gap-2 font-mono text-[10px] text-zinc-600 hover:text-zinc-950 uppercase tracking-widest font-bold transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Início
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="relative z-10 pb-24">
        
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 font-mono text-[9px] text-zinc-450 uppercase tracking-widest font-bold">
              <a onClick={goHome} className="hover:text-zinc-950 transition-colors cursor-pointer">Início</a>
              <span>/</span>
              <span className="text-zinc-950">Legal</span>
              <span>/</span>
              <span className="text-zinc-950">{title}</span>
            </div>

            {/* Title Block */}
            <div className="space-y-3">
              <h1 className="font-display font-black text-4xl md:text-6xl lg:text-7xl text-zinc-950 uppercase tracking-tight leading-[0.95] text-tactile-3d-dark">
                {title}
              </h1>
              <p className="text-zinc-500 font-light text-base md:text-lg max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                  Documento Ativo
                </span>
              </div>
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
                Última atualização: {lastUpdated}
              </span>
            </div>
          </motion.div>
        </section>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="h-[1px] bg-zinc-200 w-full" />
        </div>

        {/* Legal Content Sections */}
        <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Sidebar - Table of Contents */}
            <aside className="lg:col-span-3">
              <div className="lg:sticky lg:top-28 space-y-3">
                <h3 className="font-mono text-[9px] text-zinc-450 uppercase tracking-widest font-bold mb-4">
                  Índice
                </h3>
                <nav className="space-y-1">
                  {sections.map((section, index) => (
                    <a
                      key={index}
                      href={`#section-${index}`}
                      className="block font-display text-sm text-zinc-500 hover:text-zinc-950 transition-colors py-1.5 border-l-2 border-transparent hover:border-zinc-950 pl-3 truncate"
                    >
                      <span className="font-mono text-[9px] text-zinc-400 mr-2">{String(index + 1).padStart(2, '0')}</span>
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-9 space-y-8">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  id={`section-${index}`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="tactile-raised p-8 md:p-10 rounded-3xl bg-white border border-zinc-200 space-y-5 hover:shadow-lg transition-shadow duration-500">
                    {/* Section number + title */}
                    <div className="flex items-start gap-4">
                      <div className="tactile-sunken w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                        <span className="font-mono text-[11px] text-zinc-500 font-bold">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <h2 className="font-display font-extrabold text-xl md:text-2xl text-zinc-950 uppercase tracking-tight leading-tight pt-1">
                        {section.title}
                      </h2>
                    </div>

                    {/* Content */}
                    <div className="pl-14 space-y-4">
                      {Array.isArray(section.content) ? (
                        section.content.map((paragraph, pIndex) => (
                          <p
                            key={pIndex}
                            className="text-zinc-600 text-sm md:text-[15px] leading-relaxed font-light"
                          >
                            {paragraph}
                          </p>
                        ))
                      ) : (
                        <p className="text-zinc-600 text-sm md:text-[15px] leading-relaxed font-light">
                          {section.content}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Company Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="tactile-sunken p-8 md:p-10 rounded-3xl space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center shadow-md">
                    <Rocket className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-display font-extrabold text-lg text-zinc-950 uppercase tracking-tight">
                    Informações da Empresa
                  </h3>
                </div>
                <div className="pl-11 space-y-1">
                  <p className="font-mono text-xs text-zinc-600 font-medium">BE ROCKET AGENCIA DIGITAL LTDA</p>
                  <p className="font-mono text-xs text-zinc-500">CNPJ: 37.375.164/0001-03</p>
                  <p className="font-mono text-xs text-zinc-500">E-mail: berocket@berocket.com.br</p>
                  <p className="font-mono text-xs text-zinc-500">Telefone: (11) 94059-5792</p>
                </div>
              </motion.div>

              {/* Back to Home CTA */}
              <div className="flex items-center justify-center pt-8">
                <button
                  onClick={goHome}
                  className="tactile-raised tactile-raised-hover !bg-zinc-950 text-white font-mono text-[10px] md:text-xs font-semibold px-8 py-3.5 uppercase tracking-widest flex items-center gap-2.5 rounded-xl shadow-lg border-t border-zinc-700 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-zinc-300" />
                  Voltar ao Início
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Compact Footer */}
      <footer className="bg-[#f4f5f8] border-t border-zinc-200 py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800 shadow-md shrink-0 relative overflow-hidden">
              <div className="w-4 h-4 rounded-full border border-white/95 bg-white relative flex items-center justify-center overflow-hidden">
                <div className="w-[11px] h-[7px] bg-zinc-950 rounded-[3px] relative overflow-hidden shadow-inner mt-[-1px] border border-zinc-900/40">
                  <div className="absolute top-[0.5px] left-[0.5px] w-[2px] h-[3px] bg-white/40 rounded-full rotate-12" />
                  <div className="absolute bottom-0 right-0 w-[3px] h-[2px] bg-emerald-500/80 blur-[0.5px] rounded-full" />
                </div>
                <div className="absolute bottom-[1px] w-[7px] h-[1px] bg-zinc-300 rounded-full" />
              </div>
            </div>
            <span className="font-display font-black text-sm tracking-widest uppercase">B.ROCKET</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center">
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
              BE ROCKET AGENCIA DIGITAL LTDA — CNPJ 37.375.164/0001-03
            </span>
            <span className="font-mono text-[10px] text-zinc-400">
              © 2026 b.rocket. Todos os direitos reservados.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
