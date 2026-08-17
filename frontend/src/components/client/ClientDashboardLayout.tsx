import { useState, useEffect, useRef } from 'react';
import { LogOut, Home, KeySquare, Camera, ArrowLeft, MoreHorizontal, Settings, ScanLine, Wallet, Clock, User, QrCode, Menu, X, Bell, Zap, ChevronRight } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { getEcho } from '../../services/echo';
import { NotificationPanel } from '../NotificationPanel';
import { motion, AnimatePresence } from 'motion/react';

interface ClientDashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  user?: any; // Added user prop
  onLogout?: () => void;
}

const menuItems = [
  { id: 'home', label: 'Festa Atual', icon: Home },
  { id: 'wallet', label: 'Carteira', icon: Wallet },
  { id: 'qr', label: 'QR Code', icon: QrCode },
  { id: 'history', label: 'Histórico', icon: Clock },
  { id: 'profile', label: 'Perfil', icon: User },
];

export function ClientDashboardLayout({ children, currentPage, onPageChange, user, onLogout }: ClientDashboardLayoutProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Logout modal structure
  const logoutModal = showLogoutModal && (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border"
        style={{
          background: 'linear-gradient(180deg, rgba(30,30,30,0.95) 0%, rgba(15,15,15,0.98) 100%)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/30">
            <LogOut className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Terminar Sessão</h3>
          <p className="text-gray-400 text-sm mb-6">
            Pretendes sair totalmente da tua conta ou apenas voltar à seleção de clubes?
          </p>
          
          <div className="w-full space-y-3">
            <button
              onClick={() => {
                setShowLogoutModal(false);
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              Mudar de Clube
            </button>
            <button
              onClick={() => {
                setShowLogoutModal(false);
                if (onLogout) onLogout();
              }}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30"
            >
              Sair da Conta
            </button>
            <button
              onClick={() => setShowLogoutModal(false)}
              className="w-full py-3 px-4 rounded-xl font-semibold text-gray-400 hover:text-white transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [newMatchData, setNewMatchData] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Default Name if user is missing
  const userName = user?.name || "Cliente VIBE";
  const userId = user?.id;

  const currentDate = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Handle Resize for Responsive Behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      } else {
        setIsMobileMenuOpen(false); // Close mobile menu when switching to desktop
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load profile photo
  useEffect(() => {
    if (!userId) return;

    const loadProfilePhoto = async () => {
      try {
        const data = await apiFetch('/profile', {
          method: 'POST',
          body: JSON.stringify({ user_id: userId })
        });

        if (data.status === 'success' && data.data?.profile_photo_path) {
          setProfilePhotoUrl(data.data.profile_photo_path);
        }
      } catch (err) {
        console.error('Error loading profile photo:', err);
      }
    };

    loadProfilePhoto();
  }, [userId]);

  // Poll for new matches (Passive Liker) & Listen for Active Swipes
  useEffect(() => {
    if (!userId) return;

    const pollMatches = async () => {
      try {
        const response = await apiFetch('/networking/check-updates');
        if (response.status === 'success' && response.has_new_matches) {
          setNewMatchData(response.match_data);
          // Manually increment the unreadCount to make the bell react
          setUnreadCount(prev => prev + 1);
        }
      } catch (err) {
        console.error('Error polling matches:', err);
      }
    };

    const handleLocalMatch = (e: any) => {
      const matchedPerson = e.detail;
      setNewMatchData([matchedPerson]); // Format as array to match expected data structure
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener('newMatch', handleLocalMatch);
    const interval = setInterval(pollMatches, 15000); // Poll every 15 seconds (fallback if the socket drops)

    // Real-time: check immediately instead of waiting for the next poll tick.
    const echo = getEcho();
    let channelName: string | null = null;
    if (echo) {
      channelName = `App.Models.User.${userId}`;
      echo.private(channelName).notification((notification: any) => {
        if (notification.type === 'match') {
          pollMatches();
        }
      });
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('newMatch', handleLocalMatch);
      if (echo && channelName) echo.leave(channelName);
    };
  }, [userId]);

  const mainContentRef = useRef<HTMLElement>(null);

  // Scroll to Top on Page Change
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Determine Sidebar Classes
  const getSidebarClasses = () => {
    const baseClasses = "flex flex-col transition-all duration-300 z-50";

    if (isMobileMenuOpen) {
      // Mobile Overlay Mode: Fixed, full screen
      return `${baseClasses} fixed inset-0 w-full h-full bg-black/95 backdrop-blur-xl p-6`;
    }

    // Default Mode:
    // Desktop: Visible (md:flex), no sticky needed as parent is h-screen
    // Mobile: Hidden
    return `${baseClasses} hidden md:flex ${isCollapsed ? 'w-20 md:w-24 p-2 md:p-4' : 'w-72 p-6'}`;
  };

  const getSidebarStyle = () => {
    if (isMobile && !isMobileMenuOpen) {
      return { display: 'none' };
    }

    if (isMobileMenuOpen) {
      return { background: '#000000' };
    }

    return {
      background: 'rgba(255, 255, 255, 0.03)',
      borderRight: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
    };
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden flex-col md:flex-row" style={{ background: '#0a0a0a' }}>
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)' }}></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(184,134,11,0.06) 0%, transparent 70%)' }}></div>
      </div>

      {/* Sidebar */}
      <aside
        className={getSidebarClasses()}
        style={getSidebarStyle()}
      >
        {/* Mobile Close Button */}
        {isMobile && isMobileMenuOpen && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>
        )}

        {/* Logo & Toggle */}
        <div className={`mb-8 md:mb-12 flex items-center ${isCollapsed && !isMobileMenuOpen ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
          <div className={`flex items-center gap-3 ${isCollapsed && !isMobileMenuOpen ? 'justify-center' : ''}`}>
            <div
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
              }}
            >
              <Zap className="w-6 h-6 md:w-7 md:h-7 text-black" fill="black" />
            </div>
            {(!isCollapsed || isMobileMenuOpen) && (
              <div className="flex flex-col">
                <span
                  className="text-xl md:text-2xl font-black tracking-tight leading-none"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  VIBE
                </span>
                <span className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase">Client Hub</span>
              </div>
            )}
          </div>

          {!isMobile && !isMobileMenuOpen && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  if (isMobile) {
                    setIsMobileMenuOpen(false); // Close menu on selection
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 md:px-4 rounded-xl transition-all duration-300 group ${isCollapsed && !isMobileMenuOpen ? 'justify-center' : ''}`}
                style={{
                  background: isActive ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid transparent',
                  color: isActive ? '#D4AF37' : '#ffffff',
                }}
                title={isCollapsed && !isMobileMenuOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {(!isCollapsed || isMobileMenuOpen) && (
                  <>
                    <span className="flex-1 text-left font-medium text-sm md:text-base">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div
          className={`mt-6 p-3 md:p-4 rounded-2xl flex ${isCollapsed && !isMobileMenuOpen ? 'flex-col justify-center items-center' : 'flex-row items-center'} gap-3 transition-all duration-300`}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold shrink-0 text-sm md:text-base overflow-hidden"
            style={{
              background: profilePhotoUrl ? 'transparent' : 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              color: '#000000',
            }}
          >
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl.startsWith('http') ? profilePhotoUrl : `/api/serve-image?file=${profilePhotoUrl}`}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              userName.charAt(0)
            )}
          </div>

          {!isCollapsed || isMobileMenuOpen ? (
            <>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate text-sm md:text-base">{userName}</p>
                <p className="text-xs text-gray-400 truncate">VIBE Guest</p>
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-0 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        ref={mainContentRef}
        className={`flex-1 overflow-x-hidden relative transition-all duration-300 w-full ${['qr'].includes(currentPage) ? 'overflow-y-hidden' : 'overflow-y-auto'
          }`}
      >
        {/* Header */}
        <header
          className="sticky top-0 z-40 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between"
          style={{
            background: 'rgba(10, 10, 10, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 30, // Increased z-index
          }}
        >
          <div>
            <h1
              className="text-2xl md:text-3xl font-black mb-1"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Olá, {userName.split(' ')[0]}
            </h1>
            <p className="text-xs md:text-sm text-gray-400">{currentDate} • {currentTime}</p>
          </div>

          <button
            className="relative p-2 md:p-3 rounded-xl transition-all duration-300 hover:scale-110"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5 text-white" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  color: '#000000',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationPanel
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onUnreadCountChange={setUnreadCount}
          />
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {logoutModal}

      {/* Mobile Bottom Navigation Bar (Static Block) */}
      {isMobile && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between"
          style={{
            background: '#000000',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
          }}
        >
          {/* 1. Open Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>

          {/* Custom Mobile Nav Items */}

          {/* Custom Mobile Nav Items */}
          {[
            menuItems.find(i => i.id === 'home'),
            menuItems.find(i => i.id === 'wallet'),
            menuItems.find(i => i.id === 'qr'),
            menuItems.find(i => i.id === 'profile'),
          ].filter(Boolean).map((item) => {
            if (!item) return null;
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#D4AF37]' : 'text-gray-400'}`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
      
      {/* Global Match Notification Popup */}
      <AnimatePresence>
        {newMatchData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(15px)' }}
            onClick={() => setNewMatchData(null)}
          >
            <div className="text-center space-y-6 max-w-sm mx-auto p-8 rounded-3xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%)',
                border: '2px solid rgba(212, 175, 55, 0.5)',
                boxShadow: '0 0 50px rgba(212, 175, 55, 0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-[#D4AF37] opacity-20 blur-3xl rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
              
              <div className="relative z-10">
                <div className="text-7xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>🔥</div>
                <h2
                  className="text-4xl font-black mb-2"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  IT'S A VIBE!
                </h2>
                <p className="text-gray-200 font-medium text-lg leading-relaxed">
                  Alguém acabou de dar Match contigo! 🎉
                </p>
                <p className="text-sm text-[#D4AF37] font-semibold mt-4">
                  Verifica a secção Networking.
                </p>
                
                <button 
                  onClick={() => setNewMatchData(null)}
                  className="mt-8 w-full py-4 rounded-2xl font-black text-black text-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ 
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    boxShadow: '0 10px 20px rgba(212, 175, 55, 0.3)'
                  }}
                >
                  Incrível!
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}