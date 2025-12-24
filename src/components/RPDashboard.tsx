import { useState } from 'react';
import { RPDashboardLayout } from './rp/RPDashboardLayout';
import { RPOverview } from './rp/pages/RPOverview';
import { RPGuestlist } from './rp/pages/RPGuestlist';
import { RPTeam } from './rp/pages/RPTeam';
import { RPLeaderboard } from './rp/pages/RPLeaderboard';
import { RPProfile } from './rp/pages/RPProfile';
import { ClientWallet } from './client/pages/ClientWallet';

interface RPDashboardProps {
    userRole: 'rp' | 'team_leader';
    user?: any;
    onLogout?: () => void;
}

export function RPDashboard({ userRole, user, onLogout }: RPDashboardProps) {
    const [currentPage, setCurrentPage] = useState('overview');

    const renderPage = () => {
        switch (currentPage) {
            case 'overview':
                return <RPOverview />;
            case 'guestlist':
                return <RPGuestlist />;
            case 'team':
                // Pass isTeamLeader based on the userRole
                return <RPTeam isTeamLeader={userRole === 'team_leader'} />;
            case 'leaderboard':
                return <RPLeaderboard />;
            case 'wallet':
                return <ClientWallet />;
            case 'profile':
                return <RPProfile />;
            default:
                return <RPOverview />;
        }
    };

    return (
        <RPDashboardLayout
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            rpName={user?.name || "João Silva"}
            onLogout={onLogout}
        >
            {renderPage()}
        </RPDashboardLayout>
    );
}
