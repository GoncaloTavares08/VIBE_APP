import { useState, useEffect } from 'react';
import { QrCode, Link as LinkIcon, Copy, Share2, Search, CheckCircle2, Clock, Star, Download, Calendar } from 'lucide-react';
import QRCode from 'qrcode';
import { apiFetch } from '../../../services/api';

interface GuestEntry {
  guestlist_id: string;
  guest_user_id: number;
  name: string;
  status: 'checked_in' | 'confirmed' | 'expired';
  added_date: string; // From DB created_at
  checkin_time?: string;
  event_name: string;
  event_date: string;
}

export function RPGuestlist() {
  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Get user info
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const [username, setUsername] = useState(user?.username || '');

  // Get user info
  // const username = user?.username || 'user'; // Removed static fallback

  const getClubSlug = () => {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    return pathSegments[0] || localStorage.getItem('clubSlug') || '';
  };

  const rpLink = username
    ? `https://vibe.infinityfree.me/guest/${username}`
    : 'A carregar...';

  // Generate QR Code once when username is available
  useEffect(() => {
    if (username && username !== 'A carregar...') {
      const link = `https://vibe.infinityfree.me/guest/${username}`;
      QRCode.toDataURL(link, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
        .then(url => {
          setQrCodeUrl(url);
        })
        .catch(err => {
          console.error('Error generating QR code:', err);
        });
    }
  }, [username]);

  useEffect(() => {
    const fetchGuestlistUrl = async () => {
      if (!user?.id) return;

      try {
        const clubSlug = getClubSlug();
        console.log("Fetching guestlist for:", { userId: user.id, clubSlug });

        // Fetch guestlist entries
        const guestResult = await apiFetch('/controllers/rp_guestlist_manage.php', {
          method: 'POST',
          body: JSON.stringify({ user_id: user.id }),
        });

        if (guestResult.status === 'success') {
          setGuests(guestResult.data);
        } else {
          console.error("API returned error (Guestlist):", guestResult.message);
        }

        // Fetch RP Profile to get correct username
        const profileResult = await apiFetch('/controllers/rp_profile_manage.php?action=get', {
          method: 'POST',
          body: JSON.stringify({ user_id: user.id }),
        });

        if (profileResult.status === 'success' && profileResult.data?.username) {
          setUsername(profileResult.data.username);
        }

      } catch (error) {
        console.error("Error fetching RP data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuestlistUrl();
  }, [user?.id]);


  const filteredGuests = guests.filter(guest => {
    const matchesSearch = (guest.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'entered' && guest.status === 'checked_in') ||
      (filterStatus === 'confirmed' && guest.status === 'confirmed') ||
      (filterStatus === 'expired' && guest.status === 'expired');
    return matchesSearch && matchesFilter;
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(rpLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-code-${username}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return {
          bg: 'rgba(34, 197, 94, 0.2)',
          border: 'rgba(34, 197, 94, 0.3)',
          color: '#22c55e',
          label: 'Entered',
          icon: CheckCircle2,
        };
      case 'vip': // If added in future
        return {
          bg: 'rgba(212, 175, 55, 0.2)',
          border: 'rgba(212, 175, 55, 0.3)',
          color: '#D4AF37',
          label: 'VIP',
          icon: Star,
        };
      case 'expired':
        return {
          bg: 'rgba(239, 68, 68, 0.2)',
          border: 'rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          label: 'Expired',
          icon: Clock,
        };
      case 'confirmed':
      default:
        return {
          bg: 'rgba(59, 130, 246, 0.2)',
          border: 'rgba(59, 130, 246, 0.3)',
          color: '#3b82f6',
          label: 'Guestlist',
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
            className="aspect-square rounded-2xl mb-4 flex items-center justify-center overflow-hidden"
            style={{
              background: '#ffffff',
            }}
          >
            <div className="text-center p-4 w-full h-full flex items-center justify-center">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="RP Public Profile QR"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-400 text-sm">A gerar QR Code...</div>
              )}
            </div>
          </div>

          <button
            onClick={handleDownloadQR}
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
              <div className="text-2xl text-white mb-1">{guests.length}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-[#D4AF37] mb-1">
                {guests.filter(g => g.status === 'checked_in').length}
              </div>
              <div className="text-xs text-gray-400">Entered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-white mb-1">
                {guests.length > 0 ? Math.round((guests.filter(g => g.status === 'checked_in').length / guests.length) * 100) : 0}%
              </div>
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-white">Guest List ({filteredGuests.length})</h2>
          {loading && <div className="text-sm text-[#D4AF37]">Updating...</div>}
        </div>

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
              onClick={() => setFilterStatus('expired')}
              className="px-4 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
              style={{
                background: filterStatus === 'expired' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                color: filterStatus === 'expired' ? '#ef4444' : '#888888',
                border: filterStatus === 'expired' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              Expired
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-sm text-gray-400 pb-4">Name</th>
                <th className="text-left text-sm text-gray-400 pb-4">Event</th>
                <th className="text-left text-sm text-gray-400 pb-4">Status</th>
                <th className="text-left text-sm text-gray-400 pb-4">Date Added</th>
                <th className="text-left text-sm text-gray-400 pb-4">Time Added</th>
                <th className="text-left text-sm text-gray-400 pb-4">Entry Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">Nenhum convidado encontrado.</td></tr>
              ) : filteredGuests.map((guest) => {
                const status = getStatusBadge(guest.status);
                const StatusIcon = status.icon;
                return (
                  <tr key={guest.guestlist_id} className="border-b border-white/5">
                    <td className="py-4 text-white font-medium">{guest.name}</td>
                    <td className="py-4 text-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-[#D4AF37]" />
                        <span className="text-sm">{guest.event_name}</span>
                      </div>
                    </td>
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
                    <td className="py-4 text-gray-400 text-xs">
                      {new Date(guest.added_date).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="py-4 text-gray-400 text-xs">
                      {new Date(guest.added_date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 text-gray-400 text-xs">
                      {guest.checkin_time ? new Date(guest.checkin_time).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {filteredGuests.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Nenhum convidado encontrado.</div>
          ) : filteredGuests.map((guest) => {
            const status = getStatusBadge(guest.status);
            const StatusIcon = status.icon;
            return (
              <div
                key={guest.guestlist_id}
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-white font-semibold mb-1">{guest.name}</h3>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3 h-3 text-[#D4AF37]" />
                      <p className="text-xs text-[#D4AF37] font-medium">{guest.event_name}</p>
                    </div>
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
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 text-xs text-gray-500">
                  <span>Added: {new Date(guest.added_date).toLocaleDateString('pt-PT')}</span>
                  {guest.checkin_time && <span>Entry: {new Date(guest.checkin_time).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
