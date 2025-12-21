import { Zap, LogOut } from 'lucide-react';
import { useClubInfo } from '../hooks/useClubInfo';

interface HeaderProps {
  onLoginClick?: () => void;
  isLoggedIn?: boolean;
  userName?: string;
}

export function Header({ onLoginClick, isLoggedIn = false, userName }: HeaderProps) {
  const { clubInfo, isLoading } = useClubInfo();

  // Display "VIBE" or "VIBE - Club Name from DB"
  const displayName = clubInfo ? `VIBE - ${clubInfo.name}` : 'VIBE';

  return (
    <header className="container mx-auto px-4 py-6">
      <nav className="flex items-center justify-between">
        {/* Logo and brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
            }}
          >
            <Zap className="w-6 h-6 text-black" fill="black" />
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
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              {userName && (
                <span className="text-white text-sm hidden md:block">
                  Olá, <span className="text-[#D4AF37] font-semibold">{userName}</span>
                </span>
              )}
              <button
                onClick={onLoginClick}
                className="px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
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
