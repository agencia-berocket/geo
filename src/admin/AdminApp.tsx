import { useState, useEffect } from 'react';
import { IconX } from './components/icons';
import AdminLogin from './AdminLogin';
import AdminLayout from './AdminLayout';
import Dashboard from './pages/Dashboard';
import LeadsList from './pages/LeadsList';
import ClientsList from './pages/ClientsList';
import Newsletter from './pages/Newsletter';
import AgentConfig from './pages/AgentConfig';
import { useAuth } from './hooks/useAuth';

type Page = 'dashboard' | 'leads' | 'clients' | 'newsletter' | 'configs';

export default function AdminApp() {
  const { user, authState } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  // Set browser tab title dynamically
  useEffect(() => {
    if (authState === 'authorized') {
      const pageTitle = currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
      document.title = `b.rocket Admin // ${pageTitle}`;
    } else {
      document.title = 'b.rocket Admin // Restrito';
    }
  }, [authState, currentPage]);

  const handleNavigate = (page: string, id?: string) => {
    setCurrentPage(page as Page);
    setSelectedId(id);
  };

  // Loading state
  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500 text-sm font-mono">b.rocket // VERIFICANDO ACESSO...</span>
        </div>
      </div>
    );
  }

  // Not logged in
  if (authState === 'unauthenticated') {
    return <AdminLogin />;
  }

  // Wrong email
  if (authState === 'unauthorized') {
    return (
      <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <IconX className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-zinc-950 font-bold text-xl font-display">Acesso Negado</h1>
          <p className="text-zinc-500 text-sm">
            Seu e-mail <span className="text-zinc-950 font-mono">{user?.email}</span><br />
            não tem permissão para acessar este painel.
          </p>
          <button
            onClick={() => import('../lib/firebase').then(m => m.logout())}
            className="text-sm text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer"
          >
            ← Sair e tentar com outro e-mail
          </button>
        </div>
      </div>
    );
  }

  // Authorized admin
  const renderPage = () => {
    switch (currentPage) {
      case 'leads': return <LeadsList onNavigate={handleNavigate} selectedLeadId={selectedId} />;
      case 'clients': return <ClientsList onNavigate={handleNavigate} />;
      case 'newsletter': return <Newsletter />;
      case 'configs': return <AgentConfig />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <AdminLayout user={user!} currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </AdminLayout>
  );
}

