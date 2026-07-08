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
    <div className="min-h-screen bg-[#f4f5f8] grid-blueprint flex items-center justify-center relative overflow-hidden">
      {/* Light background grid is automatically applied via grid-blueprint class */}

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Tactile Card */}
        <div className="tactile-raised p-8 text-zinc-900">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
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
              <span className="font-display font-extrabold text-lg tracking-[0.08em] text-zinc-950 uppercase">
                b.rocket
              </span>
              <span className="text-[10px] text-zinc-500 ml-1 font-mono border border-zinc-300 px-1.5 py-0.5 rounded">ADMIN</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-zinc-900 mb-2">Acesso Restrito</h1>

            <p className="text-zinc-500 text-sm leading-relaxed">
              Painel de gestão GEO — exclusivo para<br />
              <span className="text-zinc-700 font-mono text-xs font-semibold">{ADMIN_EMAIL}</span>
            </p>
          </div>

          {/* Status indicators in Tactile Sunken box */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {['LEADS', 'DIAGNÓSTICOS', 'CLIENTES'].map(label => (
              <div key={label} className="tactile-sunken rounded-xl p-3 text-center">
                <div className="w-1.5 h-1.5 bg-zinc-950 rounded-full mx-auto mb-1 animate-pulse" />
                <span className="text-[10px] text-zinc-600 font-mono font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* Google Sign In button with tactile styling */}
          <button
            id="admin-google-login"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" className="fill-current">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </button>
        </div>

        {/* System info */}
        <div className="text-center mt-6">
          <span className="text-[10px] text-zinc-400 font-mono tracking-wider">b.rocket // GEO_CORE_V10 // ADMIN_PORTAL</span>
        </div>
      </div>
    </div>
  );
}

