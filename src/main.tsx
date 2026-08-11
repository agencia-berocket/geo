import React, { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const AdminApp = React.lazy(() => import('./admin/AdminApp'));
const App = React.lazy(() => import('./App'));

function checkIsAdmin(): boolean {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path.startsWith('/admin') || hash.startsWith('#/admin') || hash.startsWith('#admin');
}

function RootRouter() {
  const [isAdmin, setIsAdmin] = useState(checkIsAdmin);

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdmin(checkIsAdmin());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center font-mono text-xs text-zinc-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          <span>b.rocket // CARREGANDO...</span>
        </div>
      </div>
    }>
      {isAdmin ? <AdminApp /> : <App />}
    </React.Suspense>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootRouter />
  </StrictMode>
);
