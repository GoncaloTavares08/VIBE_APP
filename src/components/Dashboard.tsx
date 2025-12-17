import { useState } from 'react';
import { DashboardLayout } from './dashboard/DashboardLayout';
import { GeneralDashboard } from './dashboard/pages/GeneralDashboard';
import { RPManagement } from './dashboard/pages/RPManagement';
import { NightMetrics } from './dashboard/pages/NightMetrics';
import { Events } from './dashboard/pages/Events';
import { Competitions } from './dashboard/pages/Competitions';
import { Rewards } from './dashboard/pages/Rewards';
import { Settings } from './dashboard/pages/Settings';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <GeneralDashboard />;
      case 'rps':
        return <RPManagement />;
      case 'history':
        return <NightMetrics />;
      case 'events':
        return <Events />;
      case 'competitions':
        return <Competitions />;
      case 'rewards':
        return <Rewards />;
      case 'settings':
        return <Settings />;
      default:
        return <GeneralDashboard />;
    }
  };

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', width: '100%' }}>
      <DashboardLayout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        user={user}
        onLogout={onLogout}
      >
        {renderPage()}
      </DashboardLayout>
    </div>
  );
}