import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, Rocket } from 'lucide-react';

export default function Footer() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      setSubscribed(true);

      // Register subscriber in Firestore via backend
      fetch('/api/leads/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
        .then(res => res.json())
        .then(data => console.log('Inscrição newsletter:', data))
        .catch(err => console.error('Erro newsletter:', err));

      setTimeout(() => {
        setSubscribed(false);
        setName('');
        setEmail('');
      }, 5000);
    }
  };


  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#f4f5f8] text-zinc-950 pt-24 border-t border-zinc-200 overflow-hidden relative grid-blueprint">
      
      {/* Container wrapper */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Giant B.ROCKET text banner with real tactile 3D style */}
        <div className="w-full text-center relative pointer-events-none select-none mb-12">
          <h1 className="font-display font-black text-[13vw] leading-none tracking-[0.05em] text-zinc-950 uppercase text-tactile-3d-dark">
            b.rocket
          </h1>
          <div className="absolute bottom-1 right-2 font-mono text-[9px] text-zinc-450 hidden sm:block tracking-widest uppercase font-bold">
            ENTREGAMOS O TRABALHO MELHOR DO QUE O BRIEFING // B.ROCKET*
          </div>
        </div>

        {/* Divider line */}
        <div className="h-[1px] bg-zinc-200 w-full mb-16" />

        {/* Form and Navigation Links Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 mb-20">
          
          {/* Left Block (Col-6): Newsletter Form styled tactile-raised */}
          <div className="lg:col-span-5 space-y-6">
            <div className="tactile-raised p-8 rounded-3xl bg-white border border-zinc-200 space-y-6">
              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-2xl text-zinc-950 tracking-tight uppercase">
                  Newsletter
                </h3>
                <p className="text-xs text-zinc-500 font-light max-w-sm leading-relaxed">
                  Fique atualizado sobre as nossas novas descobertas científicas de GEO, updates de algoritmos e análises de mercado.
                </p>
              </div>

              {/* Newsletter input form */}
              <AnimatePresence mode="wait">
                {!subscribed ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubscribe}
                    className="space-y-4 pt-2"
                  >
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Seu Nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#f1f2f5] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06),inset_-3px_-3px_6px_#fff] border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-950 font-mono text-xs placeholder-zinc-400 focus:outline-none focus:border-zinc-950 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="Seu E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#f1f2f5] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06),inset_-3px_-3px_6px_#fff] border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-950 font-mono text-xs placeholder-zinc-400 focus:outline-none focus:border-zinc-950 transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex items-center gap-3 text-zinc-950 hover:text-zinc-700 font-mono text-xs font-bold uppercase tracking-widest pt-4 transition-colors group cursor-pointer"
                    >
                      INSCREVER-SE 
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-950" />
                      </motion.span>
                    </button>
                    <span className="block font-mono text-[8px] text-zinc-450 uppercase tracking-wider font-semibold">
                      UM E-MAIL DE VALOR REAL, SEM SPAM. ESSA É A GARANTIA.
                    </span>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-[#f1f2f5] shadow-[inset_4px_4px_12px_rgba(0,0,0,0.06),inset_-4px_-4px_12px_#fff] border border-zinc-200 p-6 rounded-2xl flex items-start gap-4"
                  >
                    <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-zinc-950 text-base uppercase tracking-tight">Inscrição Confirmada!</h4>
                      <p className="text-xs text-zinc-500 mt-1 font-light leading-relaxed">
                        Obrigado, {name}! Seu e-mail foi cadastrado com segurança em nossa base.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Block (Col-7): 3 Columns Navigation Grid */}
          <div className="lg:col-span-7 lg:col-start-6 grid grid-cols-2 sm:grid-cols-3 gap-8">
            
            {/* Column 1: Navigation */}
            <div className="space-y-4">
              <h4 className="font-mono text-[9px] text-zinc-450 uppercase tracking-widest font-bold">
                Navegação
              </h4>
              <ul className="space-y-2.5 font-display text-sm text-zinc-600 font-medium">
                <li><a href="#hero" className="hover:text-zinc-950 transition-colors">Início</a></li>
                <li><a href="#projects" className="hover:text-zinc-950 transition-colors">Portfólio</a></li>
                <li><a href="#services" className="hover:text-zinc-950 transition-colors">Serviços</a></li>
                <li><a href="#expertise" className="hover:text-zinc-950 transition-colors">Simulador</a></li>
                <li><a href="#pricing" className="hover:text-zinc-950 transition-colors">Preços</a></li>
                <li><a href="#team" className="hover:text-zinc-950 transition-colors">Sobre</a></li>
              </ul>
            </div>

            {/* Column 2: Legal */}
            <div className="space-y-4">
              <h4 className="font-mono text-[9px] text-zinc-450 uppercase tracking-widest font-bold">
                Legal
              </h4>
              <ul className="space-y-2.5 font-display text-sm text-zinc-600 font-medium">
                <li><a href="#hero" className="hover:text-zinc-950 transition-colors">Políticas de Privacidade</a></li>
                <li><a href="#hero" className="hover:text-zinc-950 transition-colors">Termos de Uso</a></li>
                <li><a href="#hero" className="hover:text-zinc-950 transition-colors">Isenção de Responsabilidade</a></li>
              </ul>
            </div>

            {/* Column 3: Social */}
            <div className="space-y-4 col-span-2 sm:col-span-1">
              <h4 className="font-mono text-[9px] text-zinc-450 uppercase tracking-widest font-bold">
                Redes Sociais
              </h4>
              <ul className="space-y-2.5 font-display text-sm text-zinc-600 font-medium">
                <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-zinc-950 transition-colors">X (Twitter)</a></li>
                <li><a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-zinc-950 transition-colors">YouTube</a></li>
                <li><a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-zinc-950 transition-colors">LinkedIn</a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-zinc-950 transition-colors">Instagram</a></li>
              </ul>
            </div>

          </div>

        </div>

        {/* Divider line */}
        <div className="h-[1px] bg-zinc-200 w-full mb-12" />

        {/* Meta details & copyrights */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 items-start text-zinc-500 font-mono text-[10px] md:text-xs">
          
          {/* Agency definition (Col-4) */}
          <div className="md:col-span-4 space-y-2">
            <span className="text-zinc-950 font-display font-extrabold block uppercase tracking-wider">
              b.rocket Agency
            </span>
            <p className="font-light leading-relaxed max-w-xs text-zinc-500">
              b.rocket é pioneira em Generative Engine Optimization (GEO). Engenharia semântica de alta performance para a nova era da internet.
            </p>
          </div>

          {/* Contact Details (Col-4) */}
          <div className="md:col-span-4 flex flex-col gap-1 text-zinc-500 font-light">
            <span className="font-bold text-zinc-950 uppercase block tracking-wider mb-1">Contato</span>
            <a href="mailto:berocket@berocket.com.br" className="hover:text-zinc-950 transition-colors block font-mono">berocket@berocket.com.br</a>
            <span className="block font-mono">(11) 94059-5792</span>
            <span className="text-[10px] text-zinc-450 block mt-2 font-bold">© 2026 b.rocket. Todos os direitos reservados.</span>
          </div>

          {/* Credits and templates info (Col-4) */}
          <div className="md:col-span-4 md:text-right flex flex-col md:items-end justify-between self-stretch gap-4">
            {/* Starburst logo */}
            <div className="flex items-center gap-2 text-zinc-950 md:justify-end">
              <div className="w-6 h-6 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800 shadow-md shrink-0 relative overflow-hidden">
                {/* Outer Helmet Dome */}
                <div className="w-4 h-4 rounded-full border border-white/95 bg-white relative flex items-center justify-center overflow-hidden">
                  {/* Gold/Sleek Reflective Visor */}
                  <div className="w-[11px] h-[7px] bg-zinc-950 rounded-[3px] relative overflow-hidden shadow-inner mt-[-1px] border border-zinc-900/40">
                    <div className="absolute top-[0.5px] left-[0.5px] w-[2px] h-[3px] bg-white/40 rounded-full rotate-12" />
                    <div className="absolute bottom-0 right-0 w-[3px] h-[2px] bg-emerald-500/80 blur-[0.5px] rounded-full" />
                  </div>
                  <div className="absolute bottom-[1px] w-[7px] h-[1px] bg-zinc-300 rounded-full" />
                </div>
              </div>
              <span className="font-display font-black text-lg tracking-widest">B.ROCKET</span>
            </div>
            
            <span className="text-zinc-450 block text-[9px] uppercase font-bold">
              PORTED BY b.rocket
            </span>
          </div>

        </div>

      </div>

      {/* Floating Rocket Back-To-Top footer bar */}
      <div className="bg-zinc-100 border-t border-zinc-200 py-4 flex items-center justify-center relative select-none">
        <button
          onClick={scrollToTop}
          className="flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase text-zinc-500 hover:text-zinc-950 transition-colors focus:outline-none focus:ring-0 group cursor-pointer font-bold"
          aria-label="Scroll to top"
        >
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            <Rocket className="w-4 h-4 text-zinc-950 group-hover:text-zinc-700" />
          </motion.div>
          <span>LAUNCH_TO_TOP</span>
        </button>
      </div>

    </footer>
  );
}
