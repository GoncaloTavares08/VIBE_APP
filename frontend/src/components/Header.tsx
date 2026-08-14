import { Zap, LogOut, Crown } from 'lucide-react';
import { useClubInfo } from '../hooks/useClubInfo';

interface HeaderProps {
  onLoginClick?: () => void;
  isLoggedIn?: boolean;
  userName?: string;
  isSuperAdmin?: boolean;
  onSuperAdminClick?: () => void;
}

export function Header({ onLoginClick, isLoggedIn = false, userName, isSuperAdmin = false, onSuperAdminClick }: HeaderProps) {
  const { clubInfo, isLoading } = useClubInfo();

  // Display "VIBE" or "VIBE - Club Name from DB"
  const displayName = clubInfo ? `VIBE - ${clubInfo.name}` : 'VIBE';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full px-4 sm:px-8 py-3.5 backdrop-blur-2xl bg-[#0a0a0a]/95 border-b border-white/10 shadow-2xl transition-all duration-300">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden bg-black"
            style={{
              background: clubInfo?.logo_url ? '#000000' : 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              border: clubInfo?.logo_url ? '1px solid rgba(212, 175, 55, 0.3)' : 'none',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
            }}
          >
            {clubInfo?.logo_url ? (
              <img
                src={clubInfo.logo_url}
                alt={clubInfo.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Zap className="w-6 h-6 text-black" fill="black" />
            )}
          </div>
          <span
            className="text-2xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #888888 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {isLoading ? 'VIBE' : displayName}
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {userName && (
                <span className="text-white text-sm hidden md:block">
                  Olá, <span className="text-[#D4AF37] font-semibold">{userName}</span>
                </span>
              )}
              {isSuperAdmin && (
                <button
                  onClick={onSuperAdminClick}
                  className="px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 font-black text-xs shadow-lg cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000000',
                    boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
                  }}
                >
                  <Crown className="w-4 h-4 text-black fill-black" />
                  <span>Painel SuperAdmin</span>
                </button>
              )}
              <button
                onClick={onLoginClick}
                className="px-5 py-2 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 0 15px rgba(212, 175, 55, 0.2)',
                }}
              >
                <LogOut className="w-4 h-4 text-[#D4AF37]" />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Logout
                </span>
              </button>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 15px rgba(212, 175, 55, 0.2)',
              }}
            >
              <span
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Login
              </span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
