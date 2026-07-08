import { googleSignIn, ADMIN_EMAIL } from '../lib/firebase';

export default function AdminLogin() {
  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result && result.user.email !== ADMIN_EMAIL) {
        await import('../lib/firebase').then(m => m.logout());
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">b.</span>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">rocket</span>
              <span className="text-xs text-zinc-500 ml-1 font-mono border border-zinc-700 px-1.5 py-0.5 rounded">ADMIN</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Painel de gestão GEO — exclusivo para<br />
              <span className="text-zinc-300 font-mono text-xs">{ADMIN_EMAIL}</span>
            </p>
          </div>

          {/* Status indicators */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            {['LEADS', 'DIAGNÓSTICOS', 'CLIENTES'].map(label => (
              <div key={label} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2 text-center">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mx-auto mb-1 animate-pulse" />
                <span className="text-xs text-zinc-400 font-mono">{label}</span>
              </div>
            ))}
          </div>

          {/* Google Sign In button */}
          <button
            id="admin-google-login"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 text-zinc-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-white/10 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </button>

          <p className="text-center text-xs text-zinc-600 mt-4">
            Apenas <span className="text-zinc-400">{ADMIN_EMAIL}</span> tem acesso
          </p>
        </div>

        {/* System info */}
        <div className="text-center mt-4">
          <span className="text-xs text-zinc-700 font-mono">b.rocket // GEO_CORE_V10 // ADMIN_PORTAL // SECURE</span>
        </div>
      </div>
    </div>
  );
}
