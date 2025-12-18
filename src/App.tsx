import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { InteractiveBackground } from './components/InteractiveBackground';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { FeaturesGrid } from './components/FeaturesGrid';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { RPDashboard } from './components/RPDashboard';
import { DoorOpsApp } from './components/staff/StaffApp';
import { useState, useEffect } from 'react';
import './styles/globals.css';

export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showRPDashboard, setShowRPDashboard] = useState<false | 'rp' | 'team_leader'>(false);
  const [showStaffApp, setShowStaffApp] = useState(false);
  const [user, setUser] = useState<any>(null);

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
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setShowDashboard(false);
    setShowRPDashboard(false);
    setShowStaffApp(false);
  };

  // Show dashboard (simulate logged in admin)
  if (showDashboard) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  // Show RP dashboard
  if (showRPDashboard) {
    return <RPDashboard userRole={showRPDashboard} user={user} onLogout={handleLogout} />;
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