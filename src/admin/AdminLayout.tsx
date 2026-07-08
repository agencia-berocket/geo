import { useState } from 'react';
import { logout } from '../lib/firebase';
import { User } from 'firebase/auth';

interface AdminLayoutProps {
  children: React.Node;
  user: User;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', icon: '⚡', label: 'Dashboard' },
  { id: 'leads', icon: '📋', label: 'Leads' },
  { id: 'clients', icon: '🚀', label: 'Clientes' },
  { id: 'newsletter', icon: '✉️', label: 'Newsletter' },
  { id: 'configs', icon: '⚙️', label: 'Agentes' },
];

export default function AdminLayout({ children, user, currentPage, onNavigate }: AdminLayoutProps) {

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f4f5f8] grid-blueprint text-zinc-950 flex font-sans antialiased">
      {/* Sidebar with Tactile Raised style */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-20'} transition-all duration-300 flex-shrink-0 bg-[#f4f5f8] p-4 flex flex-col z-20`}>
        <div className="tactile-raised h-full flex flex-col overflow-hidden bg-white/70 backdrop-blur-md">
          {/* Logo */}
          <div className="p-4 border-b border-zinc-200/50 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shadow-md shrink-0 relative overflow-hidden">
              {/* Outer Helmet Dome */}
              <div className="w-5.5 h-5.5 rounded-full border border-white/95 bg-white shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)] relative flex items-center justify-center overflow-hidden">
                {/* Visor */}
                <div className="w-[15px] h-[10px] bg-zinc-950 rounded-[4px] relative overflow-hidden shadow-inner mt-[-1.5px] border border-zinc-900/40">
                  <div className="absolute top-[0.5px] left-[1px] w-[3px] h-[4px] bg-white/40 rounded-full rotate-12" />
                  <div className="absolute bottom-0 right-0 w-[4px] h-[3px] bg-emerald-500/80 blur-[0.5px] rounded-full" />
                </div>
                {/* Collar */}
                <div className="absolute bottom-[2px] w-[10px] h-[1.5px] bg-zinc-300 rounded-full" />
              </div>
              {/* Side fixtures */}
              <div className="absolute left-[1px] top-1/2 -translate-y-1/2 w-[1px] h-[3px] bg-zinc-800 rounded-r" />
              <div className="absolute right-[1px] top-1/2 -translate-y-1/2 w-[1px] h-[3px] bg-zinc-800 rounded-l" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <span className="font-display font-extrabold text-sm tracking-wider text-zinc-950 uppercase">
                  b.rocket
                </span>
                <span className="text-[9px] text-zinc-400 font-mono ml-1 font-semibold">ADMIN</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(s => !s)}
              className="ml-auto text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>


          {/* Nav items */}
          <nav className="flex-1 p-3 space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  currentPage === item.id
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
                }`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="truncate font-display">{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* User info */}
          <div className="p-3 border-t border-zinc-200/50 bg-zinc-50/50">
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full flex-shrink-0 shadow-inner" />
              ) : (
                <div className="w-8 h-8 bg-zinc-200 text-zinc-700 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold">G</div>
              )}
              {sidebarOpen && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-800 font-semibold truncate">{user.displayName || 'Admin'}</p>
                  <button
                    onClick={() => logout()}
                    className="text-[10px] text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer block mt-0.5"
                  >
                    Desconectar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-auto flex flex-col min-h-screen">
        {/* Top bar with tactile details */}
        <div className="h-16 flex items-center px-8 gap-4 justify-between border-b border-zinc-200/40 bg-white/40 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-zinc-950 rounded-full animate-ping" />
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider font-semibold">GEO_CORE_V10 // ACTIVE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 font-mono bg-white px-3 py-1 rounded-full border border-zinc-200/60 shadow-xs">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>

        <div className="p-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}

