import { useState, useEffect, useRef } from 'react';
import {
  Home,
  Users,
  History,
  Calendar,
  Gift,
  Settings,
  Bell,
  Zap,
  ChevronRight,
  Menu,
  LogOut,
  X // Added X icon
} from 'lucide-react';
import { NotificationPanel } from '../NotificationPanel';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'rps', label: 'RPs e Equipas', icon: Users },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'events', label: 'Eventos', icon: Calendar },
  { id: 'rewards', label: 'Prémios', icon: Gift },
  { id: 'settings', label: 'Definições', icon: Settings },
];

export function DashboardLayout({ children, currentPage, onPageChange, user, onLogout }: DashboardLayoutProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // New state for mobile menu overlay

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

  const mainContentRef = useRef<HTMLElement>(null);

  // Scroll to Top on Page Change
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Determine Sidebar Classes
  // Refactored for Viewport-Constrained Layout
  const getSidebarClasses = () => {
    // Desktop: Flex behavior, height controlled by parent flex-row
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
    // Safety check: if detected as mobile but menu not open, force hide via inline style
    // This handles cases where CSS 'hidden' might be overridden or conflicting
    if (isMobile && !isMobileMenuOpen) {
      return { display: 'none' };
    }

    // Only apply opaque black background if mobile menu is actively open
    if (isMobileMenuOpen) {
      return { background: '#000000' };
    }

    // Default desktop glassmorphism
    // (Will be applied to hidden element on mobile, so no impact)
    return {
      background: 'rgba(255, 255, 255, 0.03)',
      borderRight: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
    };
  };

  return (
    // Root: Viewport-constrained (h-screen), Mobile: Column, Desktop: Row
    <div className="flex h-screen w-full overflow-hidden flex-col md:flex-row" style={{ background: '#0a0a0a' }}>
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#D4AF37] opacity-10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#FFD700] opacity-8 blur-[120px] rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#B8860B] opacity-6 blur-[100px] rounded-full"></div>
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

        {/* Logo & Toggle - Hidden on Mobile Menu Overlay if desired, or kept for consistency.
            Request says "permitindo fechar com um X no canto", so maybe we don't need the toggle button inside the overlay.
            But let's keep the logo.
        */}
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
              <span
                className="text-xl md:text-2xl font-black tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                VIBE
              </span>
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
            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold shrink-0 text-sm md:text-base"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              color: '#000000',
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>

          {!isCollapsed || isMobileMenuOpen ? (
            <>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate text-sm md:text-base">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || 'admin@vibe.pt'}</p>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={onLogout}
              className="p-0 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainContentRef} className="flex-1 overflow-y-auto overflow-x-hidden relative transition-all duration-300 w-full">
        {/* Header */}
        <header
          className="sticky top-0 z-10 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between"
          style={{
            background: 'rgba(10, 10, 10, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
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
              Olá, {user?.name || 'Admin'}
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
            <span
              className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                color: '#000000',
              }}
            >
              3
            </span>
          </button>

          <NotificationPanel
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </header>

        {/* Page Content */}
        {/* Standard padding, large bottom padding for mobile to account for fixed Bottom Nav */}
        <div className="p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Static Block) */}
      {isMobile && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between"
          style={{
            background: '#000000',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' // Respect safe area
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

          {/* 2. Dashboard */}
          <button
            onClick={() => onPageChange('dashboard')}
            className={`flex flex-col items-center gap-1 transition-colors ${currentPage === 'dashboard' ? 'text-[#D4AF37]' : 'text-gray-400'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </button>

          {/* 3. RPs */}
          <button
            onClick={() => onPageChange('rps')}
            className={`flex flex-col items-center gap-1 transition-colors ${currentPage === 'rps' ? 'text-[#D4AF37]' : 'text-gray-400'}`}
          >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-medium">RPs</span>
          </button>

          {/* 4. Events */}
          <button
            onClick={() => onPageChange('events')}
            className={`flex flex-col items-center gap-1 transition-colors ${currentPage === 'events' ? 'text-[#D4AF37]' : 'text-gray-400'}`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-[10px] font-medium">Eventos</span>
          </button>

          {/* 5. Settings */}
          <button
            onClick={() => onPageChange('settings')}
            className={`flex flex-col items-center gap-1 transition-colors ${currentPage === 'settings' ? 'text-[#D4AF37]' : 'text-gray-400'}`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-[10px] font-medium">Definições</span>
          </button>
        </div>
      )}
    </div>
  );
}