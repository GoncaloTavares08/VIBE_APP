import { InteractiveBackground } from './components/InteractiveBackground';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { Marquee } from './components/Marquee';
import { FeaturesGrid } from './components/FeaturesGrid';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { RPDashboard } from './components/RPDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { DoorOpsApp } from './components/staff/StaffApp';
import { AccessDenied } from './components/AccessDenied';
import { RPPublicProfilePage } from './pages/RPPublicProfilePage';
import { SuperAdminPortal } from './components/superadmin/SuperAdminPortal';
import { useClubAccess } from './hooks/useClubAccess';
import { clearAllAccessCache } from './utils/clearAccessCache';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import './styles/globals.css';
import { MyClubs } from './components/MyClubs';
import { enablePushNotifications, listenForForegroundMessages } from './services/pushNotifications';
import { Capacitor } from '@capacitor/core';

interface AppUser {
  id: number;
  name: string;
  email?: string;
  role?: string;
  club_slug?: string;
  points?: number;
  member_since?: string;
  is_superadmin?: boolean;
  created_at?: string;
  profile_photo_path?: string | null;
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [showAuth, setShowAuth] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // SuperAdmin flag
  const isSuperAdmin = Boolean(user?.is_superadmin || user?.role === 'SUPERADMIN');

  // Initialize view states based on user role (SuperAdmin uses separate portal)
  const [showDashboard, setShowDashboard] = useState(() => !isSuperAdmin && user?.role === 'ADMIN');
  const [showRPDashboard, setShowRPDashboard] = useState<false | 'rp' | 'team_leader'>(() => {
    if (isSuperAdmin) return false;
    if (user?.role === 'RP') return 'rp';
    if (user?.role === 'TEAM_LEADER') return 'team_leader';
    return false;
  });
  const [showStaffApp, setShowStaffApp] = useState(() => !isSuperAdmin && user?.role === 'STAFF');

  // State to force re-render on navigation (must be before useClubAccess)
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Verify club access
  const { hasAccess, isLoading, clubName, role: verifiedRole, points: verifiedPoints, memberSince: verifiedMemberSince } = useClubAccess(user?.id, currentPath);

  // Set up push notifications right after a session is established (fresh
  // login or restored from localStorage) — not tied to any specific screen.
  // Ask for permission the first time; on every later visit (already granted)
  // just re-attach the foreground listener, since that's per-page-load, not
  // something that sticks around from the original grant.
  useEffect(() => {
    if (!user?.id) return;

    if (Capacitor.isNativePlatform()) {
      enablePushNotifications();
      return;
    }

    if (typeof Notification === 'undefined') return;

    if (Notification.permission === 'default') {
      enablePushNotifications();
    } else if (Notification.permission === 'granted') {
      listenForForegroundMessages();
    }
  }, [user?.id]);

  // Update user role and points in context if verified (fixes issue where login on landing page has no role/points)
  useEffect(() => {
    if (user && verifiedRole) {
      let hasUpdates = false;
      const updatedUser = { ...user };

      if (!user.role || user.role !== verifiedRole) {
        updatedUser.role = verifiedRole;
        hasUpdates = true;
      }

      if (verifiedPoints !== null && user.points !== verifiedPoints) {
        updatedUser.points = verifiedPoints;
        hasUpdates = true;
      }

      if (verifiedMemberSince && user.member_since !== verifiedMemberSince) {
        updatedUser.member_since = verifiedMemberSince;
        hasUpdates = true;
      }

      if (hasUpdates) {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  }, [user, verifiedRole, verifiedPoints, verifiedMemberSince]);

  // Effect to sync states if user changes (e.g. login/logout)
  useEffect(() => {
    if (user) {
      if (isSuperAdmin) {
        setShowDashboard(false);
        setShowRPDashboard(false);
        setShowStaffApp(false);
        return;
      }
      const effectiveRole = verifiedRole || user.role;
      if (effectiveRole === 'ADMIN') setShowDashboard(true);
      else if (effectiveRole === 'RP') setShowRPDashboard('rp');
      else if (effectiveRole === 'TEAM_LEADER') setShowRPDashboard('team_leader');
      else if (effectiveRole === 'STAFF') setShowStaffApp(true);
    } else {
      setShowDashboard(false);
      setShowRPDashboard(false);
      setShowStaffApp(false);
    }
  }, [user, verifiedRole, isSuperAdmin]);

  // Global Network Error Listener
  useEffect(() => {
    const handleNetworkError = (e: any) => {
      const message = e.detail?.message || 'Sem ligação à internet.';
      toast.error(message, {
        id: 'network-error-toast', // prevents duplicate toasts
        duration: 4000
      });
    };

    window.addEventListener('networkError', handleNetworkError);
    return () => window.removeEventListener('networkError', handleNetworkError);
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setShowAuth(false); // Close auth modal
    if (userData.is_superadmin || userData.role === 'SUPERADMIN') {
      setShowDashboard(false);
      setShowRPDashboard(false);
      setShowStaffApp(false);
    } else if (userData.role === 'ADMIN') {
      setShowDashboard(true);
    } else if (userData.role === 'RP' || userData.role === 'TEAM_LEADER') {
      setShowRPDashboard(userData.role === 'TEAM_LEADER' ? 'team_leader' : 'rp');
    } else if (userData.role === 'STAFF') {
      setShowStaffApp(true);
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    clearAllAccessCache(); // Clear all access cache on logout
    setUser(null);
    setShowDashboard(false);
    setShowRPDashboard(false);
    setShowStaffApp(false);
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    setTimeout(() => setIsLoggingOut(false), 500);
  };

  const handleReturnHome = () => {
    // Only navigate, do not log out
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Listen to popstate (back/forward browser buttons)
  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Show SuperAdmin Portal when navigating to /superadmin or for superadmin
  if (user && isSuperAdmin && currentPath === '/superadmin') {
    return <SuperAdminPortal user={user} onLogout={handleLogout} onBack={handleReturnHome} />;
  }

  // Detect if we have a club in the URL (using currentPath state to ensure reactivity)
  const pathSegments = currentPath.split('/').filter(Boolean);
  const hasClubInUrl = pathSegments.length > 0 && pathSegments[0] !== '';

  // Check if accessing guest profile (/guest/rpname)
  const isGuestProfile = pathSegments.length >= 2 && pathSegments[0] === 'guest';
  const rpUsername = isGuestProfile ? pathSegments[1] : null;

  // Show guest profile (public access, no authentication needed)
  if (isGuestProfile && rpUsername) {
    return <RPPublicProfilePage rpname={rpUsername} />;
  }

  // Show loading while verifying access
  if (user && isLoading && hasClubInUrl) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-6 animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#FFD700] p-0.5 shadow-[0_0_40px_rgba(212,175,55,0.35)]">
            <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
              <span className="text-xl font-black text-[#D4AF37]">V</span>
            </div>
          </div>
          <div className="space-y-2 text-center">
            <div className="h-5 w-48 bg-white/10 rounded-lg mx-auto"></div>
            <div className="h-3.5 w-32 bg-white/5 rounded-md mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if no access
  if (user && !hasAccess && !isLoading && hasClubInUrl && !isLoggingOut) {
    return <AccessDenied clubName={clubName || 'Unknown Club'} onGoBack={handleReturnHome} />;
  }

  // IMPORTANT: Prevent dashboard access without club in URL
  // If user is logged in but URL has no club (e.g., just "/"), stay on landing page
  if (user && !hasClubInUrl) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
        <InteractiveBackground />
        {/* Ambient glow effects in background */}
        <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)' }}></div>
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.10) 0%, transparent 70%)' }}></div>
        <div className="absolute bottom-0 left-1/2 w-[450px] h-[450px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(184,134,11,0.12) 0%, transparent 70%)' }}></div>
        <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(218,165,32,0.08) 0%, transparent 70%)' }}></div>
        </div>

        <div className="relative z-10">
          {/* Modified Header with SuperAdmin Button & Logout */}
          <Header
            onLoginClick={handleLogout}
            isLoggedIn={true}
            userName={user.name}
            isSuperAdmin={isSuperAdmin}
            onSuperAdminClick={() => handleNavigate('/superadmin')}
          />

          {/* Show My Clubs instead of Hero for logged in users */}
          <MyClubs user={user} onNavigate={handleNavigate} />
        </div>
      </div>
    );
  }

  // Show Staff App (does NOT need a club in URL)
  if (showStaffApp) {
    return <DoorOpsApp onLogout={handleLogout} />;
  }

  // Show dashboard - admin or superadmin (entering any club with full permissions)
  if ((showDashboard || isSuperAdmin) && hasAccess && hasClubInUrl) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  // Show RP dashboard (only if has access AND club in URL)
  if (showRPDashboard && hasAccess && hasClubInUrl) {
    return <RPDashboard userRole={showRPDashboard} user={user} onLogout={handleLogout} />;
  }

  // Show Client Dashboard (only if has access AND club in URL)
  const effectiveRole = verifiedRole || user?.role;
  const isClient = effectiveRole && (effectiveRole.toUpperCase() === 'CLIENT');

  if (user && isClient && hasAccess && hasClubInUrl) {
    return <ClientDashboard user={user} onLogout={handleLogout} />;
  }

  // Show auth screen
  if (showAuth) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  // Show landing page
  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      <InteractiveBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header onLoginClick={() => setShowAuth(true)} />
        <HeroSection onLoginClick={() => setShowAuth(true)} />
        <Marquee />
        <FeaturesGrid />
      </div>
    </div>
  );
}