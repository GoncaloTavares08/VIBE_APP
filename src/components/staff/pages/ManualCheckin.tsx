import { useState, useEffect } from 'react';
import { Search, X, CheckCircle, Clock, Users, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../../../services/api';

interface ManualCheckinProps {
  onClose: () => void;
  embedded?: boolean;
}

interface Guest {
  id: string;
  name: string;
  photo: string;
  rpName: string;
  ticketType: 'VIP' | 'Guestlist' | 'Table';
  status: 'pending' | 'checked-in';
  checkInTime?: string;
  eventName?: string;
}

export function ManualCheckin({ onClose, embedded = false }: ManualCheckinProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.id);
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
      }
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        fetchGuests(searchTerm);
      } else {
        setGuests([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchGuests = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/controllers/staff_scan.php?action=search_guestlist&query=${encodeURIComponent(query)}&user_id=${userId}`);

      if (response.status === 'success') {
        setGuests(response.data);
      } else {
        setGuests([]);
      }
    } catch (err: any) {
      console.error('Error searching guests:', err);
      // setError('Erro de conexão');
      setGuests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (guestId: string) => {
    try {
      const response = await apiFetch(`/controllers/staff_scan.php?action=manual_checkin&user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: guestId })
      });

      if (response.status === 'success') {
        // Update local state
        setGuests((prev) =>
          prev.map((g) =>
            g.id === guestId
              ? {
                ...g,
                status: 'checked-in' as const,
                checkInTime: response.checkInTime || new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
              }
              : g
          )
        );
      } else {
        alert(response.message || 'Erro ao fazer check-in');
      }
    } catch (err: any) {
      console.error('Check-in error:', err);
      alert('Erro ao processar check-in');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'VIP':
        return {
          bg: 'rgba(212, 175, 55, 0.2)',
          border: 'rgba(212, 175, 55, 0.3)',
          color: '#D4AF37',
        };
      case 'Table':
        return {
          bg: 'rgba(168, 85, 247, 0.2)',
          border: 'rgba(168, 85, 247, 0.3)',
          color: '#a855f7',
        };
      case 'Guestlist':
        return {
          bg: 'rgba(59, 130, 246, 0.2)',
          border: 'rgba(59, 130, 246, 0.3)',
          color: '#3b82f6',
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.1)',
          border: 'rgba(255, 255, 255, 0.2)',
          color: '#888888',
        };
    }
  };

  const pendingCount = guests.filter((g) => g.status === 'pending').length;
  // checkedInCount logic might be limited to search results, which is fine
  const checkedInCount = guests.filter((g) => g.status === 'checked-in').length;

  const content = (
    <div className="h-full flex flex-col" style={{ background: embedded ? 'transparent' : '#0a0a0a' }}>
      {/* Header */}
      <div className={`${embedded ? 'p-8 pb-6' : 'p-6'} border-b`} style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-white font-bold ${embedded ? 'text-2xl' : 'text-xl'}`}>Manual Check-in</h2>
            <p className="text-sm text-gray-400 mt-1">
              Pesquisar por Nome ou RP
            </p>
          </div>
          {!embedded && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
          }}
        >
          <Search className="w-5 h-5 text-[#D4AF37]" />
          <input
            type="text"
            placeholder="Nome cliente ou RP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-white outline-none placeholder-gray-500"
            autoFocus={!embedded}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Guest List */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
          </div>
        ) : guests.length > 0 ? (
          <div className="space-y-3">
            {guests.map((guest) => {
              const typeStyle = getTypeColor(guest.ticketType);

              return (
                <div
                  key={guest.id}
                  className="p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: guest.status === 'checked-in' || guest.status === 'checked_in' as any // Handle both cases just in case
                      ? 'rgba(0, 0, 0, 0.3)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: guest.status === 'checked-in' || guest.status === 'checked_in' as any
                      ? '1px solid rgba(34, 197, 94, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Photo */}
                    <img
                      src={guest.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(guest.name)}&background=random`}
                      alt={guest.name}
                      className="w-14 h-14 rounded-full object-cover"
                      style={{
                        border: '2px solid rgba(212, 175, 55, 0.3)',
                      }}
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(guest.name)}&background=random`;
                      }}
                    />

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{guest.name}</h3>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-400">RP: {guest.rpName}</span>
                        </div>
                        {guest.eventName && (
                          <div className="text-xs text-[#D4AF37]/80">
                            {guest.eventName}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Badge */}
                    <div
                      className="px-3 py-1 rounded-lg"
                      style={{
                        background: typeStyle.bg,
                        border: `1px solid ${typeStyle.border}`,
                      }}
                    >
                      <span className="text-xs font-semibold" style={{ color: typeStyle.color }}>
                        {guest.ticketType}
                      </span>
                    </div>

                    {/* Status / Action */}
                    {guest.status === 'checked-in' || guest.status === 'checked_in' as any ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div className="text-right">
                          <p className="text-xs text-green-400 font-semibold">Entrou</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {guest.checkInTime}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(guest.id)}
                        className="px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
                        style={{
                          background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                          color: '#000000',
                        }}
                      >
                        <span className="font-semibold text-sm">Entrar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : searchTerm.length >= 2 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum resultado encontrado.</p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Pesquise para encontrar convidados</p>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  // Mobile Modal
  return (
    <div
      className="fixed inset-0 z-50 flex items-end animate-slideUp"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="w-full h-[90vh] rounded-t-3xl overflow-hidden"
        style={{
          background: 'rgba(10, 10, 10, 0.98)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {content}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.5);
        }
      `}</style>
    </div>
  );
}
