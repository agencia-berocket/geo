import { useState } from 'react';
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
];

export default function AdminLayout({ children, user, currentPage, onNavigate }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} transition-all duration-300 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">b.</span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <span className="text-white font-bold text-sm">rocket</span>
              <span className="text-zinc-500 font-mono text-[10px] ml-1">ADMIN</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="ml-auto text-zinc-500 hover:text-white transition-colors"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                currentPage === item.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 bg-zinc-700 rounded-full flex-shrink-0 flex items-center justify-center text-xs">G</div>
            )}
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-300 truncate">{user.displayName || 'Admin'}</p>
                <button
                  onClick={() => logout()}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="h-14 bg-zinc-900/50 border-b border-zinc-800 flex items-center px-6 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-zinc-500 font-mono">GEO_CORE_V10 // ACTIVE</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
