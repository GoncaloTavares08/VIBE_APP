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
import { useClubAccess } from './hooks/useClubAccess';
import { clearAllAccessCache } from './utils/clearAccessCache';
import { useState, useEffect } from 'react';
import './styles/globals.css';

export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showRPDashboard, setShowRPDashboard] = useState<false | 'rp' | 'team_leader'>(false);
  const [showStaffApp, setShowStaffApp] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Verify club access
  const { hasAccess, isLoading, clubName } = useClubAccess(user?.id);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.role === 'ADMIN') {
        setShowDashboard(true);
      } else if (parsedUser.role === 'RP' || parsedUser.role === 'TEAM_LEADER') {
        setShowRPDashboard(parsedUser.role === 'TEAM_LEADER' ? 'team_leader' : 'rp');
      } else if (parsedUser.role === 'STAFF') {
        setShowStaffApp(true);
      } else if (parsedUser.role === 'CLIENT') {
        // Just ensures we have user state, the render logic handles the rest
        setUser(parsedUser);
      }
    }
  }, []);

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
    handleLogout();
    // Redirect to home or login
  };

  // Detect if we have a club in the URL
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const hasClubInUrl = pathSegments.length > 0 && pathSegments[0] !== '';

  // Show loading while verifying access
  if (user && isLoading && hasClubInUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-white">A verificar acesso...</div>
      </div>
    );
  }

  // Show access denied if no access
  if (user && !hasAccess && !isLoading && hasClubInUrl) {
    return <AccessDenied clubName={clubName || 'Unknown Club'} onGoBack={handleGoBack} />;
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
          <HeroSection onLoginClick={() => { }} />
          <FeaturesGrid />
        </div>
      </div>
    );
  }

  // Show dashboard (admin doesn't need access check - has global access)
  if (showDashboard && hasClubInUrl) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  // Show RP dashboard (only if has access AND club in URL)
  if (showRPDashboard && hasAccess && hasClubInUrl) {
    return <RPDashboard userRole={showRPDashboard} user={user} onLogout={handleLogout} />;
  }

  // Show Client Dashboard (only if has access AND club in URL)
  if (user && user.role === 'CLIENT' && hasAccess && hasClubInUrl) {
    return <ClientDashboard user={user} onLogout={handleLogout} />;
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