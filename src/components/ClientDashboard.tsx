import { useState, useEffect } from 'react';
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

// QR Code Screen - Guestlist Carousel
function ClientQRCode() {
  const [guestlists, setGuestlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchGuestlists = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        const clubSlug = localStorage.getItem('clubSlug') || 'vr';

        const response = await fetch('/api/controllers/client_guestlist.php?action=list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': clubSlug,
          },
          body: JSON.stringify({ user_id: user.id })
        });

        const data = await response.json();
        if (data.status === 'success') {
          setGuestlists(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching guestlists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuestlists();
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : guestlists.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < guestlists.length - 1 ? prev + 1 : 0));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">A carregar guestlists...</p>
        </div>
      </div>
    );
  }

  if (guestlists.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-4 pb-24">
        <div
          className="max-w-md w-full p-10 rounded-3xl text-center space-y-6"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <QrCode className="w-16 h-16 mx-auto text-gray-600" />
          <div>
            <h3 className="text-2xl font-black text-white mb-2">Sem Guestlists</h3>
            <p className="text-gray-400">Ainda não estás em nenhuma lista de convidados</p>
          </div>
        </div>
      </div>
    );
  }

  const currentGuest = guestlists[currentIndex];
  const statusConfig = {
    confirmed: { color: '#22C55E', label: 'Confirmado', icon: '✓' },
    checked_in: { color: '#3B82F6', label: 'Entrada Feita', icon: '✓✓' },
    expired: { color: '#EF4444', label: 'Expirado', icon: '✗' },
  };

  const status = statusConfig[currentGuest.status as keyof typeof statusConfig] || statusConfig.confirmed;

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 pb-20 overflow-y-auto md:pb-0 md:overflow-hidden">
      <div className="max-w-sm w-full space-y-4 md:space-y-6 my-auto">
        {/* Counter */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            {currentIndex + 1} de {guestlists.length} Guestlist{guestlists.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Guestlist Card with Carousel */}
        <div className="relative">
          {guestlists.length > 1 && (
            <>
              {/* Prev Button - Adjusted for mobile visibility */}
              <button
                onClick={handlePrev}
                className="absolute -left-2 md:-left-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{
                  background: 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span className="text-[#D4AF37] text-2xl">‹</span>
              </button>

              {/* Next Button - Adjusted for mobile visibility */}
              <button
                onClick={handleNext}
                className="absolute -right-2 md:-right-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{
                  background: 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span className="text-[#D4AF37] text-2xl">›</span>
              </button>
            </>
          )}

          {/* Main Card - Compact on mobile */}
          <div
            className="p-5 md:p-8 rounded-3xl space-y-5 md:space-y-6 transition-all duration-300 mx-auto w-full"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(20, 20, 20, 0.95) 100%)',
              backdropFilter: 'blur(30px)',
              border: '2px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 0 40px rgba(212, 175, 55, 0.15)',
            }}
          >
            {/* Event Info */}
            <div className="text-center space-y-1 md:space-y-2">
              <h3
                className="text-2xl md:text-3xl font-black px-2 leading-tight break-words"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {currentGuest.event_name}
              </h3>
              <p className="text-gray-300 text-xs md:text-sm">
                {new Date(currentGuest.event_date).toLocaleDateString('pt-PT', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
              <p className="text-gray-400 text-xs md:text-sm font-mono">
                {currentGuest.start_time.substring(0, 5)} - {currentGuest.end_time.substring(0, 5)}
              </p>
            </div>

            {/* QR Code Area - Clean & Simple */}
            <div className="bg-white p-4 md:p-6 rounded-2xl mx-auto w-48 h-48 md:w-60 md:h-60 flex flex-col items-center justify-center shadow-lg relative z-10 overflow-hidden">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${btoa('VIBE_SECURE:' + currentGuest.qr_code)}`}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 md:px-5 md:py-2 rounded-full"
                style={{
                  background: `${status.color}20`,
                  border: `1px solid ${status.color}40`,
                }}
              >
                <div
                  className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-pulse"
                  style={{ background: status.color }}
                />
                <span style={{ color: status.color }} className="text-xs md:text-sm font-bold truncate max-w-[150px]">
                  {status.icon} {status.label}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <p className="text-center text-[10px] md:text-xs text-gray-500 uppercase tracking-widest">
              Mostra à entrada
            </p>
          </div>
        </div>

        {/* Dots Indicator */}
        {guestlists.length > 1 && (
          <div className="flex justify-center gap-2">
            {guestlists.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className="h-1.5 md:h-2 rounded-full transition-all"
                style={{
                  background: i === currentIndex ? '#D4AF37' : 'rgba(255, 255, 255, 0.2)',
                  width: i === currentIndex ? '20px' : '6px',
                }}
              />
            ))}
          </div>
        )}
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