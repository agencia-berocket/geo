import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowUpRight } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 15);

      if (currentScrollY < 15) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setVisible(false); // scrolling down
        setIsOpen(false); // close mobile menu when scrolling down
      } else {
        setVisible(true); // scrolling up
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: 'Diagnósticos', href: '#projects' },
    { name: 'Metodologia', href: '#services' },
    { name: 'Google IA', href: '#google-mode' },
    { name: 'Processo', href: '#process' },
    { name: 'Pilares', href: '#expertise' },
    { name: 'Planos', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <header 
      id="navbar" 
      className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 py-4 px-6 md:px-12 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div 
        className={`max-w-7xl mx-auto px-6 md:px-8 py-3.5 flex justify-between items-center transition-all duration-300 ${
          scrolled 
            ? 'tactile-raised bg-white translate-y-2' 
            : 'bg-transparent border-b border-zinc-200/40'
        }`}
      >
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shadow-md shrink-0 relative overflow-hidden group-hover:scale-105 transition-all duration-300">
            {/* Outer Helmet Dome */}
            <div className="w-5.5 h-5.5 rounded-full border border-white/95 bg-white shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)] relative flex items-center justify-center overflow-hidden">
              {/* Gold/Sleek Reflective Visor */}
              <div className="w-[15px] h-[10px] bg-zinc-950 rounded-[4px] relative overflow-hidden shadow-inner mt-[-1.5px] border border-zinc-900/40">
                {/* Slanted Glare Highlight */}
                <div className="absolute top-[0.5px] left-[1px] w-[3px] h-[4px] bg-white/40 rounded-full rotate-12" />
                {/* Tech Green/Cyan HUD Light Glow */}
                <div className="absolute bottom-0 right-0 w-[4px] h-[3px] bg-emerald-500/80 blur-[0.5px] rounded-full" />
              </div>
              {/* Collar base / Neck seal */}
              <div className="absolute bottom-[2px] w-[10px] h-[1.5px] bg-zinc-300 rounded-full" />
            </div>
            {/* Earcomms/side fixtures */}
            <div className="absolute left-[1px] top-1/2 -translate-y-1/2 w-[1px] h-[3px] bg-zinc-800 rounded-r" />
            <div className="absolute right-[1px] top-1/2 -translate-y-1/2 w-[1px] h-[3px] bg-zinc-800 rounded-l" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-[0.08em] text-zinc-950 uppercase">
            b.rocket
          </span>
          <motion.span 
            className="text-zinc-900 font-bold text-lg"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            *
          </motion.span>
        </a>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="font-mono text-[10px] text-zinc-600 hover:text-zinc-950 uppercase tracking-widest font-bold transition-colors duration-200 relative group py-1"
            >
              {item.name}
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-zinc-950 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
          <a
            href="#pricing"
            className="tactile-raised !bg-zinc-950 text-white font-mono text-[10px] md:text-xs font-semibold px-5 py-2.5 hover:bg-zinc-800 uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 rounded-xl shadow-lg border-t border-zinc-700 hover:scale-102"
          >
            Início <ArrowUpRight className="w-3.5 h-3.5 text-zinc-300" />
          </a>
        </nav>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-3">
          <a
            href="#pricing"
            className="bg-zinc-950 text-white font-mono text-[10px] font-bold px-4 py-2 hover:bg-zinc-800 uppercase tracking-wider transition-all duration-300 rounded-xl"
          >
            Começar
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center border border-white shadow-sm text-zinc-950 hover:text-zinc-700 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute top-full left-0 w-full px-6 py-4 md:hidden z-40"
          >
            <div className="tactile-raised bg-white p-6 flex flex-col gap-5 shadow-2xl">
              {menuItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="font-display font-extrabold text-base text-zinc-800 hover:text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-2"
                >
                  {item.name}
                </a>
              ))}
              <a
                href="#pricing"
                onClick={() => setIsOpen(false)}
                className="bg-zinc-950 text-white font-mono text-xs font-bold py-3 text-center uppercase tracking-widest flex items-center justify-center gap-2 mt-2 rounded-xl"
              >
                Começar Otimização GEO <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
