import { InteractiveBackground } from './components/InteractiveBackground';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { FeaturesGrid } from './components/FeaturesGrid';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { RPDashboard } from './components/RPDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { DoorOpsApp } from './components/staff/StaffApp';
import { AccessDenied } from './components/AccessDenied';
import { RPPublicProfilePage } from './pages/RPPublicProfilePage';
import { useClubAccess } from './hooks/useClubAccess';
import { clearAllAccessCache } from './utils/clearAccessCache';
import { useState, useEffect } from 'react';
import './styles/globals.css';
import { MyClubs } from './components/MyClubs';

export default function App() {
  const [user, setUser] = useState<any>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [showAuth, setShowAuth] = useState(false);

  // Initialize view states based on user role immediately
  const [showDashboard, setShowDashboard] = useState(() => user?.role === 'ADMIN');
  const [showRPDashboard, setShowRPDashboard] = useState<false | 'rp' | 'team_leader'>(() => {
    if (user?.role === 'RP') return 'rp';
    if (user?.role === 'TEAM_LEADER') return 'team_leader';
    return false;
  });
  const [showStaffApp, setShowStaffApp] = useState(() => user?.role === 'STAFF');

  // Verify club access
  const { hasAccess, isLoading, clubName, role: verifiedRole, points: verifiedPoints, memberSince: verifiedMemberSince } = useClubAccess(user?.id);

  // Update user role and points in context if verified (fixes issue where login on landing page has no role/points)
  useEffect(() => {
    if (user && verifiedRole) {
      let hasUpdates = false;
      const updatedUser = { ...user };

      if (!user.role || user.role !== verifiedRole) {
        console.log('[App Debug] Patching user role:', verifiedRole);
        updatedUser.role = verifiedRole;
        hasUpdates = true;
      }

      if (verifiedPoints !== null && user.points !== verifiedPoints) {
        console.log('[App Debug] Patching user points:', verifiedPoints);
        updatedUser.points = verifiedPoints;
        hasUpdates = true;
      }

      if (verifiedMemberSince && user.member_since !== verifiedMemberSince) {
        console.log('[App Debug] Patching member since:', verifiedMemberSince);
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
      // Use verifiedRole if available, otherwise fallback to user.role
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
  }, [user, verifiedRole]);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setShowAuth(false); // Close auth modal
    if (userData.role === 'ADMIN') {
      setShowDashboard(true);
    } else if (userData.role === 'RP' || userData.role === 'TEAM_LEADER') {
      setShowRPDashboard(userData.role === 'TEAM_LEADER' ? 'team_leader' : 'rp');
    } else if (userData.role === 'STAFF') {
      setShowStaffApp(true);
    } else if (userData.role === 'CLIENT') {
      // Logic handled by render condition
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    clearAllAccessCache(); // Clear all access cache on logout
    setUser(null);
    setShowDashboard(false);
    setShowRPDashboard(false);
    setShowStaffApp(false);
  };

  const handleGoBack = () => {
    // Just go home, don't logout
    window.location.href = '/';
  };

  // State to force re-render on navigation
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    // Also update useClubAccess if needed (it polls, so it should catch up, but we can force it if we want)
  };

  // Listen to popstate (back/forward browser buttons)
  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-white">A verificar acesso...</div>
      </div>
    );
  }

  // Show access denied if no access
  // Pass error to AccessDenied for debugging
  if (user && !hasAccess && !isLoading && hasClubInUrl) {
    return <AccessDenied clubName={clubName || 'Unknown Club'} onGoBack={handleGoBack} />;
    // Note: You might want to update AccessDenied to show the error prop if you haven't yet, 
    // but the user said they aren't seeing this screen, so priority is navigation.
  }

  // IMPORTANT: Prevent dashboard access without club in URL
  // If user is logged in but URL has no club (e.g., just "/"), stay on landing page
  if (user && !hasClubInUrl) {
    // Logged in but no club selected - show landing page with logout
    return (
      <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
        <InteractiveBackground />
        {/* Ambient glow effects in background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#D4AF37] opacity-15 blur-[150px] rounded-full"></div>
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-[#FFD700] opacity-10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-1/2 w-[450px] h-[450px] bg-[#B8860B] opacity-12 blur-[140px] rounded-full"></div>
          <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] bg-[#DAA520] opacity-8 blur-[100px] rounded-full"></div>
        </div>

        <div className="relative z-10">
          {/* Modified Header with Logout */}
          <Header onLoginClick={handleLogout} isLoggedIn={true} userName={user.name} />

          {/* Show My Clubs instead of Hero for logged in users */}
          <MyClubs user={user} onNavigate={handleNavigate} />

          {/* Optional: still show features or maybe less prominent */}
          {/* <HeroSection onLoginClick={() => { }} /> */}
          {/* Keeping HeroSection might be confusing, MyClubs is the main action now */}
        </div>
      </div>
    );
  }

  // Show dashboard (admin doesn't need access check - has global access)
  if (showDashboard && hasAccess && hasClubInUrl) {
    return <Dashboard user={user} onLogout={handleGoBack} />;
  }

  // Show RP dashboard (only if has access AND club in URL)
  if (showRPDashboard && hasAccess && hasClubInUrl) {
    return <RPDashboard userRole={showRPDashboard} user={user} onLogout={handleGoBack} />;
  }

  // Show Client Dashboard (only if has access AND club in URL)
  // Fix: make role check case-insensitive and safer
  const effectiveRole = verifiedRole || user?.role;
  const isClient = effectiveRole && (effectiveRole.toUpperCase() === 'CLIENT');

  if (user) {
    console.log('[App Debug] State:', {
      userRole: user.role,
      verifiedRole,
      isClient,
      hasAccess,
      hasClubInUrl,
      clubName
    });
  }

  if (user && isClient && hasAccess && hasClubInUrl) {
    return <ClientDashboard user={user} onLogout={handleGoBack} />;
  }

  // Show Staff App
  if (showStaffApp) {
    return <DoorOpsApp onLogout={handleLogout} />;
  }

  // Show auth screen
  if (showAuth) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  // Show landing page
  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      <InteractiveBackground />
      {/* Ambient glow effects in background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#D4AF37] opacity-15 blur-[150px] rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-[#FFD700] opacity-10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-1/2 w-[450px] h-[450px] bg-[#B8860B] opacity-12 blur-[140px] rounded-full"></div>
        <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] bg-[#DAA520] opacity-8 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-10">
        <Header onLoginClick={() => setShowAuth(true)} />
        <HeroSection onLoginClick={() => setShowAuth(true)} />
        <FeaturesGrid />
      </div>
    </div>
  );
}