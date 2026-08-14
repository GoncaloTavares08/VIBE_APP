import { useState } from 'react';
import { DashboardLayout } from './dashboard/DashboardLayout';
import { GeneralDashboard } from './dashboard/pages/GeneralDashboard';
import { RPManagement } from './dashboard/pages/RPManagement';
import { NightMetrics } from './dashboard/pages/NightMetrics';
import { Events } from './dashboard/pages/Events';
import { Rewards } from './dashboard/pages/Rewards';
import { Settings } from './dashboard/pages/Settings';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const handleNavigateToEvent = (eventId: number) => {
    setSelectedEventId(eventId);
    setCurrentPage('dashboard');
  };

  const handlePageChange = (page: string) => {
    // Whenever leaving or switching back to dashboard from the menu, reset to latest event
    if (page === 'dashboard') {
      setSelectedEventId(null);
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <GeneralDashboard
            initialEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
          />
        );
      case 'rps':
        return <RPManagement />;
      case 'history':
        return <NightMetrics onSelectEvent={handleNavigateToEvent} />;
      case 'events':
        return <Events />;
      case 'rewards':
        return <Rewards />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <GeneralDashboard
            initialEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
          />
        );
    }
  };

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', width: '100%' }}>
      <DashboardLayout
        currentPage={currentPage}
        onPageChange={handlePageChange}
        user={user}
        onLogout={onLogout}
      >
        {renderPage()}
      </DashboardLayout>
    </div>
  );
}