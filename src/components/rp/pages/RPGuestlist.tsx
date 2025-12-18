import { useState } from 'react';
import { QrCode, Link as LinkIcon, Copy, Share2, Search, Filter, CheckCircle2, Clock, Star, Download } from 'lucide-react';

interface Guest {
  id: string;
  name: string;
  phone: string;
  status: 'entered' | 'guestlist' | 'vip';
  addedDate: string;
  entryTime?: string;
}

const mockGuests: Guest[] = [
  {
    id: '1',
    name: 'Maria Silva',
    phone: '+351 912 345 678',
    status: 'entered',
    addedDate: '2025-12-18',
    entryTime: '23:45',
  },
  {
    id: '2',
    name: 'Pedro Costa',
    phone: '+351 913 456 789',
    status: 'vip',
    addedDate: '2025-12-18',
    entryTime: '23:30',
  },
  {
    id: '3',
    name: 'Ana Santos',
    phone: '+351 914 567 890',
    status: 'guestlist',
    addedDate: '2025-12-18',
  },
  {
    id: '4',
    name: 'João Oliveira',
    phone: '+351 915 678 901',
    status: 'entered',
    addedDate: '2025-12-17',
    entryTime: '00:15',
  },
  {
    id: '5',
    name: 'Sofia Pereira',
    phone: '+351 916 789 012',
    status: 'guestlist',
    addedDate: '2025-12-17',
  },
];

export function RPGuestlist() {
  const [guests] = useState<Guest[]>(mockGuests);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  const rpLink = 'vibe.app/rp/joaosilva';

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.phone.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || guest.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(rpLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'entered':
        return {
          bg: 'rgba(34, 197, 94, 0.2)',
          border: 'rgba(34, 197, 94, 0.3)',
          color: '#22c55e',
          label: 'Entered',
          icon: CheckCircle2,
        };
      case 'vip':
        return {
          bg: 'rgba(212, 175, 55, 0.2)',
          border: 'rgba(212, 175, 55, 0.3)',
          color: '#D4AF37',
          label: 'VIP',
          icon: Star,
        };
      case 'guestlist':
        return {
          bg: 'rgba(59, 130, 246, 0.2)',
          border: 'rgba(59, 130, 246, 0.3)',
          color: '#3b82f6',
          label: 'Guestlist',
          icon: Clock,
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.1)',
          border: 'rgba(255, 255, 255, 0.2)',
          color: '#888888',
          label: 'Unknown',
          icon: Clock,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl text-white mb-2">Smart Guestlist</h1>
        <p className="text-gray-400">Gere os teus links e lista de convidados</p>
      </div>

      {/* QR Code & Link Section - Desktop Split / Mobile Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code Card */}
        <div
          className="lg:col-span-1 p-6 rounded-3xl backdrop-blur-xl"
          style={{
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              }}
            >
              <QrCode className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-xl text-white">Your QR Code</h2>
              <p className="text-sm text-gray-400">Partilha para entrada rápida</p>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div
            className="aspect-square rounded-2xl mb-4 flex items-center justify-center"
            style={{
              background: '#ffffff',
            }}
          >
            <div className="text-center p-8">
              <QrCode className="w-32 h-32 mx-auto text-black mb-2" />
              <p className="text-xs text-gray-600">Scan to join guestlist</p>
            </div>
          </div>

          <button
            className="w-full px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              color: '#000000',
            }}
          >
            <Download className="w-5 h-5" />
            <span className="font-semibold">Download QR</span>
          </button>
        </div>

        {/* Link Sharing Card */}
        <div
          className="lg:col-span-2 p-6 rounded-3xl backdrop-blur-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <LinkIcon className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl text-white">Your Personal Link</h2>
              <p className="text-sm text-gray-400">Partilha nas redes sociais</p>
            </div>
          </div>

          {/* Link Display */}
          <div
            className="p-4 rounded-2xl mb-4 flex items-center gap-3"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <LinkIcon className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
            <input
              type="text"
              value={rpLink}
              readOnly
              className="flex-1 bg-transparent text-white outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyLink}
              className="px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              style={{
                background: copiedLink ? 'rgba(34, 197, 94, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                color: copiedLink ? '#22c55e' : '#D4AF37',
                border: copiedLink ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span className="font-semibold">Copy Link</span>
                </>
              )}
            </button>
            <button
              className="px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                color: '#000000',
              }}
            >
              <Share2 className="w-5 h-5" />
              <span className="font-semibold">Share</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl text-white mb-1">2,847</div>
              <div className="text-xs text-gray-400">Clicks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-[#D4AF37] mb-1">156</div>
              <div className="text-xs text-gray-400">Sign-ups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-white mb-1">5.48%</div>
              <div className="text-xs text-gray-400">Conversion</div>
            </div>
          </div>
        </div>
      </div>

      {/* Guest List Section */}
      <div
        className="p-6 rounded-3xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h2 className="text-xl text-white mb-6">Guest List ({filteredGuests.length})</h2>

        {/* Search & Filter */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div
            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Procurar por nome ou telemóvel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-white outline-none placeholder-gray-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className="px-4 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
              style={{
                background: filterStatus === 'all' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                color: filterStatus === 'all' ? '#D4AF37' : '#888888',
                border: filterStatus === 'all' ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('entered')}
              className="px-4 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
              style={{
                background: filterStatus === 'entered' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                color: filterStatus === 'entered' ? '#22c55e' : '#888888',
                border: filterStatus === 'entered' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              Entered
            </button>
            <button
              onClick={() => setFilterStatus('vip')}
              className="px-4 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
              style={{
                background: filterStatus === 'vip' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                color: filterStatus === 'vip' ? '#D4AF37' : '#888888',
                border: filterStatus === 'vip' ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              VIP
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-sm text-gray-400 pb-4">Name</th>
                <th className="text-left text-sm text-gray-400 pb-4">Phone</th>
                <th className="text-left text-sm text-gray-400 pb-4">Status</th>
                <th className="text-left text-sm text-gray-400 pb-4">Added</th>
                <th className="text-left text-sm text-gray-400 pb-4">Entry Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => {
                const status = getStatusBadge(guest.status);
                const StatusIcon = status.icon;
                return (
                  <tr key={guest.id} className="border-b border-white/5">
                    <td className="py-4 text-white">{guest.name}</td>
                    <td className="py-4 text-gray-400">{guest.phone}</td>
                    <td className="py-4">
                      <span
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                        style={{
                          background: status.bg,
                          border: `1px solid ${status.border}`,
                          color: status.color,
                        }}
                      >
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-4 text-gray-400">
                      {new Date(guest.addedDate).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="py-4 text-gray-400">
                      {guest.entryTime || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {filteredGuests.map((guest) => {
            const status = getStatusBadge(guest.status);
            const StatusIcon = status.icon;
            return (
              <div
                key={guest.id}
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold mb-1">{guest.name}</h3>
                    <p className="text-sm text-gray-400">{guest.phone}</p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs"
                    style={{
                      background: status.bg,
                      border: `1px solid ${status.border}`,
                      color: status.color,
                    }}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Added: {new Date(guest.addedDate).toLocaleDateString('pt-PT')}</span>
                  {guest.entryTime && <span>Entry: {guest.entryTime}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
