import { useState } from 'react';
import { Search, X, CheckCircle, Clock, Users } from 'lucide-react';

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
}

const mockGuests: Guest[] = [
  {
    id: '1',
    name: 'Maria Silva',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    rpName: 'João Silva',
    ticketType: 'VIP',
    status: 'pending',
  },
  {
    id: '2',
    name: 'Pedro Costa',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    rpName: 'Ana Ribeiro',
    ticketType: 'Guestlist',
    status: 'checked-in',
    checkInTime: '23:45',
  },
  {
    id: '3',
    name: 'Sofia Santos',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    rpName: 'João Silva',
    ticketType: 'Table',
    status: 'pending',
  },
  {
    id: '4',
    name: 'Miguel Oliveira',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    rpName: 'Maria Costa',
    ticketType: 'VIP',
    status: 'pending',
  },
  {
    id: '5',
    name: 'Ana Pereira',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    rpName: 'Pedro Santos',
    ticketType: 'Guestlist',
    status: 'checked-in',
    checkInTime: '23:30',
  },
  {
    id: '6',
    name: 'Carlos Mendes',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    rpName: 'João Silva',
    ticketType: 'VIP',
    status: 'pending',
  },
  {
    id: '7',
    name: 'Rita Sousa',
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop',
    rpName: 'Ana Ribeiro',
    ticketType: 'Table',
    status: 'pending',
  },
  {
    id: '8',
    name: 'Bruno Lima',
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop',
    rpName: 'Maria Costa',
    ticketType: 'Guestlist',
    status: 'checked-in',
    checkInTime: '23:15',
  },
];

export function ManualCheckin({ onClose, embedded = false }: ManualCheckinProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [guests, setGuests] = useState<Guest[]>(mockGuests);

  const filteredGuests = guests.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.rpName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckIn = (guestId: string) => {
    setGuests((prev) =>
      prev.map((g) =>
        g.id === guestId
          ? {
              ...g,
              status: 'checked-in' as const,
              checkInTime: new Date().toLocaleTimeString('pt-PT', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : g
      )
    );
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
  const checkedInCount = guests.filter((g) => g.status === 'checked-in').length;

  const content = (
    <div className="h-full flex flex-col" style={{ background: embedded ? 'transparent' : '#0a0a0a' }}>
      {/* Header */}
      <div className={`${embedded ? 'p-8 pb-6' : 'p-6'} border-b`} style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-white font-bold ${embedded ? 'text-2xl' : 'text-xl'}`}>Manual Check-in</h2>
            <p className="text-sm text-gray-400 mt-1">
              {pendingCount} pending • {checkedInCount} checked in
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
            placeholder="Search by name or RP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-white outline-none placeholder-gray-500"
          />
        </div>
      </div>

      {/* Guest List */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="space-y-3">
          {filteredGuests.map((guest) => {
            const typeStyle = getTypeColor(guest.ticketType);

            return (
              <div
                key={guest.id}
                className="p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: guest.status === 'checked-in'
                    ? 'rgba(0, 0, 0, 0.3)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: guest.status === 'checked-in'
                    ? '1px solid rgba(34, 197, 94, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Photo */}
                  <img
                    src={guest.photo}
                    alt={guest.name}
                    className="w-14 h-14 rounded-full object-cover"
                    style={{
                      border: '2px solid rgba(212, 175, 55, 0.3)',
                    }}
                  />

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{guest.name}</h3>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-400">RP: {guest.rpName}</span>
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
                  {guest.status === 'checked-in' ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div className="text-right">
                        <p className="text-xs text-green-400 font-semibold">Checked In</p>
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
                      <span className="font-semibold text-sm">Check In</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
