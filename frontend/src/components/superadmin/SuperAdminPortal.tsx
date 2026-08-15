import { Crown, LogOut, ArrowLeft } from 'lucide-react';
import { SuperAdmin } from '../dashboard/pages/SuperAdmin';

interface SuperAdminPortalProps {
  user: any;
  onLogout: () => void;
  onBack?: () => void;
}

export function SuperAdminPortal({ user, onLogout, onBack }: SuperAdminPortalProps) {
  const currentDate = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-[#070707] text-white relative overflow-x-hidden">
      {/* Ambient glowing lighting */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.10) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/2 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(184,134,11,0.12) 0%, transparent 70%)' }} />
      </div>

      {/* Topbar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 border-b flex items-center justify-between shadow-2xl"
        style={{
          background: 'rgba(10, 10, 10, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(25px)',
        }}
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Voltar à Seleção de Clubes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.35)',
            }}
          >
            <Crown className="w-5 h-5 text-black fill-black" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-lg font-black tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                VIBE SUPERADMIN
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                Plataforma Global
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium capitalize hidden sm:block">
              {currentDate} • Sessão Ativa: {user?.name || 'SuperAdmin'}
            </p>
          </div>
        </div>

        {/* User badge and Logout button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>{user?.email || 'superadmin@vibe.com'}</span>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <SuperAdmin />
      </main>
    </div>
  );
}
