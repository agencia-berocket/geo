import React, { useState } from 'react';
import { logout } from '../lib/firebase';
import { User } from 'firebase/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
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
  const [sidebarOpen, setSidebarOpen] = useState(false); // Closed by default on mobile
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setSidebarOpen(false); // Auto-close sidebar on mobile navigation
  };

  return (
    <div className="min-h-screen bg-[#f4f5f8] grid-blueprint text-zinc-950 flex font-sans antialiased overflow-x-hidden">
      
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-30 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Drawer on Mobile, flex element on Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 transform lg:relative lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${desktopSidebarOpen ? 'lg:w-60' : 'lg:w-20'}
        w-64 transition-all duration-300 flex-shrink-0 bg-[#f4f5f8] p-4 flex flex-col h-full
      `}>
        <div className="tactile-raised h-full flex flex-col overflow-hidden bg-white/70 backdrop-blur-md">
          {/* Logo */}
          <div className="p-4 border-b border-zinc-200/50 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shadow-md shrink-0 relative overflow-hidden">
              <div className="w-5.5 h-5.5 rounded-full border border-white/95 bg-white shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)] relative flex items-center justify-center overflow-hidden">
                <div className="w-[15px] h-[10px] bg-zinc-950 rounded-[4px] relative overflow-hidden shadow-inner mt-[-1.5px] border border-zinc-900/40">
                  <div className="absolute top-[0.5px] left-[1px] w-[3px] h-[4px] bg-white/40 rounded-full rotate-12" />
                  <div className="absolute bottom-0 right-0 w-[4px] h-[3px] bg-emerald-500/80 blur-[0.5px] rounded-full" />
                </div>
                <div className="absolute bottom-[2px] w-[10px] h-[1.5px] bg-zinc-300 rounded-full" />
              </div>
              <div className="absolute left-[1px] top-1/2 -translate-y-1/2 w-[1px] h-[3px] bg-zinc-800 rounded-r" />
              <div className="absolute right-[1px] top-1/2 -translate-y-1/2 w-[1px] h-[3px] bg-zinc-800 rounded-l" />
            </div>
            {(sidebarOpen || desktopSidebarOpen) && (
              <div className="min-w-0">
                <span className="font-display font-extrabold text-sm tracking-wider text-zinc-950 uppercase">
                  b.rocket
                </span>
                <span className="text-[9px] text-zinc-400 font-mono ml-1 font-semibold">ADMIN</span>
              </div>
            )}
            
            {/* Desktop toggle button */}
            <button
              onClick={() => setDesktopSidebarOpen(s => !s)}
              className="hidden lg:block ml-auto text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              {desktopSidebarOpen ? '◀' : '▶'}
            </button>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden ml-auto text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  currentPage === item.id
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
                }`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {(sidebarOpen || desktopSidebarOpen) && <span className="truncate font-display">{item.label}</span>}
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
              {(sidebarOpen || desktopSidebarOpen) && (
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
      <main className="flex-1 overflow-auto flex flex-col min-h-screen min-w-0">
        {/* Top bar with mobile hamburger and status */}
        <div className="h-16 flex items-center px-4 lg:px-8 gap-4 justify-between border-b border-zinc-200/40 bg-white/40 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-zinc-650 hover:text-zinc-900 p-1.5 rounded-lg border border-zinc-200 bg-white shadow-xs cursor-pointer"
            >
              ☰
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-zinc-950 rounded-full animate-ping" />
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider font-semibold">GEO_CORE_V10 // ACTIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 font-mono bg-white px-3 py-1 rounded-full border border-zinc-200/60 shadow-xs">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>

        {/* Content Container - Ensure responsiveness padding */}
        <div className="p-4 lg:p-8 max-w-7xl w-full mx-auto flex-1 min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
