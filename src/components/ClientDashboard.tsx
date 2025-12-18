import { useState } from 'react';
import { ClientDashboardLayout } from './client/ClientDashboardLayout';
import { ClientHome } from './client/pages/ClientHome';
import { ClientWallet } from './client/pages/ClientWallet';
import { ClientProfile } from './client/pages/ClientProfile';
import { QrCode } from 'lucide-react';

interface ClientDashboardProps {
  user?: any;
  onLogout?: () => void;
}

export function ClientDashboard({ user, onLogout }: ClientDashboardProps) {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <ClientHome />;
      case 'wallet':
        return <ClientWallet />;
      case 'qr':
        return <ClientQRCode />;
      case 'history':
        return <ClientHistory />;
      case 'profile':
        return <ClientProfile />;
      default:
        return <ClientHome />;
    }
  };

  return (
    <ClientDashboardLayout
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      user={user}
      onLogout={onLogout}
    >
      {renderPage()}
    </ClientDashboardLayout>
  );
}

// QR Code Screen (Placeholder)
function ClientQRCode() {
  return (
    <div className="h-full flex items-center justify-center overflow-hidden" style={{ background: '#0a0a0a' }}>
      <div
        className="max-w-md w-full mx-4 p-10 rounded-3xl text-center space-y-6"
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(255, 215, 0, 0.2) 100%)',
          backdropFilter: 'blur(30px)',
          border: '2px solid rgba(212, 175, 55, 0.5)',
          boxShadow: '0 0 60px rgba(212, 175, 55, 0.4)',
        }}
      >
        {/* QR Code Display */}
        <div
          className="w-64 h-64 mx-auto rounded-2xl flex items-center justify-center"
          style={{
            background: '#ffffff',
          }}
        >
          <QrCode className="w-48 h-48 text-black" strokeWidth={1} />
        </div>

        <div className="space-y-2">
          <h2
            className="text-2xl font-black"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Your Check-in QR
          </h2>
          <p className="text-gray-300 text-sm">
            Show this at the entrance or bar to accumulate points
          </p>
        </div>

        {/* User Info */}
        <div
          className="p-4 rounded-xl"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <p className="text-white">André Silva</p>
          <p className="text-sm text-[#D4AF37]">Gold Member · 5,420 pts</p>
        </div>
      </div>
    </div>
  );
}

// History Screen (Placeholder)
function ClientHistory() {
  return (
    <div className="min-h-screen p-4 lg:p-8" style={{ background: '#0a0a0a' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-white mb-6">History</h1>
        <div
          className="p-8 rounded-2xl text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <p className="text-gray-400">Full history timeline coming soon...</p>
        </div>
      </div>
    </div>
  );
}