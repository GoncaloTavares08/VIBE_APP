import { useState, useEffect } from 'react';
import { ScanQrCode, BarChart3, LogOut, Menu, X, ChevronRight, Zap, Bell } from 'lucide-react';
import { Scanner } from './pages/Scanner';
import { Statistics } from './pages/Statistics';
import { ManualCheckin } from './pages/ManualCheckin';

type View = 'scanner' | 'statistics';

interface DoorOpsAppProps {
  onLogout: () => void;
}

export function DoorOpsApp({ onLogout }: DoorOpsAppProps) {
  const [currentView, setCurrentView] = useState<View>('scanner');
  const [isMobile, setIsMobile] = useState(false);
  const [showManualCheckin, setShowManualCheckin] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

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

  useEffect(() => {
    const handleResize = () => {
      // Logic for mobile view (Bottom Bar) vs Desktop view (Unified Sidebar)
      // DashboardLayout uses 768 for collapsing.
      // Here we want to determine if we show the "Mobile App" version or "Desktop" version.
      // Let's stick with 1024 as the cutoff for the "Mobile App" view as originally requested/implemented for the "Mobile Scanner".
      // But for the Sidebar collapsing behavior, we should follow standard breakpoints if we were in desktop mode.

      const isMobileAppView = window.innerWidth < 1024;
      setIsMobile(isMobileAppView);

      // Sidebar collapsing logic (only relevant if we are NOT in mobile app view, i.e. >= 1024)
      const shouldCollapse = window.innerWidth < 1280; // Example breakpoint for auto-collapse on smaller desktops if desired, or just keep manual. 
      // Actually DashboardLayout collapses at 768. Since we only show this layout at >= 1024, it will be expanded by default.
      if (window.innerWidth < 1280) {
        setIsCollapsed(true);
      } else {
        // Optional: Expand on large screens? Or just leave user preference? 
        // DashboardLayout resets to collapsed if < 768.
        // Let's just default to false (expanded) unless user collapses it, or maybe collapse if space is tight.
        // For now, let's just leave isCollapsed state management to user interaction mostly.
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Staff Menu Items
  const menuItems = [
    { id: 'scanner', label: 'Scanner de Porta', icon: ScanQrCode },
    { id: 'statistics', label: 'Estatísticas', icon: BarChart3 },
  ];

  // Sidebar Classes Logic
  const getSidebarClasses = () => {
    const baseClasses = "flex flex-col transition-all duration-300 z-50";
    if (isMobileMenuOpen) {
      return `${baseClasses} fixed inset-0 w-full h-full bg-black/95 backdrop-blur-xl p-6`;
    }
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

  // If strictly mobile view for functionality (Scanner UI):
  // The original Step 18 code had a completely separate return for Mobile.
  // The User asked to make the SIDEBAR equal.
  // The original Mobile view didn't HAVE a sidebar, it had a bottom bar.
  // I should PROBABLY keep the Bottom Bar for mobile as originally requested ("No mobile quero o scanner quase na tela toda com um bottom bar"),
  // and ONLY use the Sidebar for Desktop.
  // The DashboardLayout switches to Sidebar hidden on mobile.
  // So I will maintain the "Mobile Mode" with Bottom Bar from the previous implementation if isMobile is true,
  // BUT I will ensure the Desktop view uses the new Sidebar.

  // Actually, looking at DashboardLayout, it handles mobile by hiding sidebar and showing nothing (standard dashboard content).
  // But here we want a Bottom Bar for mobile.
  // So I will use the `isMobile` state. If `isMobile` (width < 768 ?? Or 1024?), I render the Mobile layout.
  // The original code used 1024. Let's stick to 1024 for the "Mobile App Feel" vs "Desktop Dashboard".

  if (window.innerWidth < 1024 && isMobile) { // Using the hook state which relies on resize
    // Re-using the mobile layout from before, as that was specifically requested for mobile
    return (
      <div className="h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
        <div className="flex-1 relative overflow-y-auto pb-28">
          {currentView === 'scanner' && (
            <div className="h-full flex flex-col">
              <Scanner onOpenManual={() => setShowManualCheckin(true)} />
              {/* Manual Check-in Button - Inside scrollable container */}
              <button
                onClick={() => setShowManualCheckin(true)}
                className="mx-4 my-4 transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(255, 215, 0, 0.2) 100%)',
                  backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '16px', padding: '14px 28px', boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3)',
                }}
              >
                <span className="text-[#D4AF37] font-semibold text-center block">Manual Check-in</span>
              </button>
            </div>
          )}
          {currentView === 'statistics' && <Statistics />}
        </div>
        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'rgba(10, 10, 10, 0.95)', backdropFilter: 'blur(30px)', borderTop: '1px solid rgba(212, 175, 55, 0.2)', boxShadow: '0 -4px 40px rgba(0, 0, 0, 0.6)' }}>
          <div className="flex items-center justify-around px-4 py-3 safe-area-bottom">
            <button onClick={() => setCurrentView('scanner')} className="flex flex-col items-center gap-1 px-6 py-2" style={{ color: currentView === 'scanner' ? '#D4AF37' : '#888888' }}>
              <div className="p-2 rounded-2xl" style={{ background: currentView === 'scanner' ? 'rgba(212, 175, 55, 0.2)' : 'transparent' }}><ScanQrCode className="w-6 h-6" /></div>
              <span className="text-xs font-medium">Scanner</span>
            </button>
            <button onClick={() => setCurrentView('statistics')} className="flex flex-col items-center gap-1 px-6 py-2" style={{ color: currentView === 'statistics' ? '#D4AF37' : '#888888' }}>
              <div className="p-2 rounded-2xl" style={{ background: currentView === 'statistics' ? 'rgba(212, 175, 55, 0.2)' : 'transparent' }}><BarChart3 className="w-6 h-6" /></div>
              <span className="text-xs font-medium">Statistics</span>
            </button>
            <button onClick={onLogout} className="flex flex-col items-center gap-1 px-6 py-2" style={{ color: '#888888' }}>
              <div className="p-2 rounded-2xl"><LogOut className="w-6 h-6" /></div>
              <span className="text-xs font-medium">Sair</span>
            </button>
          </div>
        </div>
        {showManualCheckin && <ManualCheckin onClose={() => setShowManualCheckin(false)} />}
      </div>
    );
  }

  // Desktop View with Unified Sidebar
  return (
    <div className="flex h-screen w-full overflow-hidden flex-col md:flex-row" style={{ background: '#0a0a0a' }}>
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#D4AF37] opacity-10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#FFD700] opacity-8 blur-[120px] rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#B8860B] opacity-6 blur-[100px] rounded-full"></div>
      </div>

      <aside className={getSidebarClasses()} style={getSidebarStyle()}>
        {/* Mobile Close Button */}
        {isMobile && isMobileMenuOpen && (
          <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 p-2 text-white hover:text-gray-300">
            <X className="w-8 h-8" />
          </button>
        )}

        <div className={`mb-8 md:mb-12 flex items-center ${isCollapsed && !isMobileMenuOpen ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
          <div className={`flex items-center gap-3 ${isCollapsed && !isMobileMenuOpen ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)', boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)' }}>
              <Zap className="w-6 h-6 md:w-7 md:h-7 text-black" fill="black" />
            </div>
            {(!isCollapsed || isMobileMenuOpen) && (
              <span className="text-xl md:text-2xl font-black tracking-tight" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                VIBE
              </span>
            )}
          </div>
          {!isMobile && !isMobileMenuOpen && (
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id as View);
                  if (isMobile) setIsMobileMenuOpen(false);
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

        <div className={`mt-6 p-3 md:p-4 rounded-2xl flex ${isCollapsed && !isMobileMenuOpen ? 'flex-col justify-center items-center' : 'flex-row items-center'} gap-3 transition-all duration-300`} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold shrink-0 text-sm md:text-base" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)', color: '#000000' }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          {(!isCollapsed || isMobileMenuOpen) ? (
            <>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate text-sm md:text-base">{user?.name || 'Staff'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || 'staff@vibe.pt'}</p>
              </div>
              <button onClick={onLogout} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors" title="Sair">
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button onClick={onLogout} className="p-0 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="Sair">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative transition-all duration-300 w-full">
        <header className="sticky top-0 z-10 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between" style={{ background: 'rgba(10, 10, 10, 0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div>
            <h1 className="text-2xl md:text-3xl font-black mb-1" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Olá, {user?.name || 'Staff'}
            </h1>
            <p className="text-xs md:text-sm text-gray-400">{currentDate} • {currentTime}</p>
          </div>
          <button className="relative p-2 md:p-3 rounded-xl transition-all duration-300 hover:scale-110" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)', color: '#000000' }}>3</span>
          </button>
        </header>

        {currentView === 'scanner' && (
          <div className="flex-1 overflow-hidden h-[calc(100vh-100px)]">
            <div className="h-full flex">
              <div className="w-1/2 border-r" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                <Scanner onOpenManual={() => { }} />
              </div>
              <div className="w-1/2">
                <ManualCheckin onClose={() => { }} embedded />
              </div>
            </div>
          </div>
        )}

        {currentView === 'statistics' && (
          <div className="p-4 md:p-8 w-full"><Statistics /></div>
        )}
      </main>
    </div>
  );
}