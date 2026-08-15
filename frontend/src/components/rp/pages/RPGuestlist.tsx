import { useState, useEffect } from 'react';
import { QrCode, Link as LinkIcon, Copy, Share2, Search, CheckCircle2, Clock, Star, Download, Calendar } from 'lucide-react';
import QRCode from 'qrcode';
import { apiFetch } from '../../../services/api';
import { GlassCard } from '../../ui/GlassCard';

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
  const [clicksCount, setClicksCount] = useState<number>(0);

  // Get user info
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const [username, setUsername] = useState(user?.username || '');

  const getClubSlug = () => {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    return pathSegments[0] || localStorage.getItem('clubSlug') || '';
  };

  const rpLink = loading 
    ? 'A carregar...' 
    : username 
      ? `${window.location.origin}/guest/${username}`
      : 'Cria o teu Perfil Público primeiro para teres um link.';

  // Generate QR Code once when username is available
  useEffect(() => {
    if (username && username !== 'A carregar...') {
      const link = `${window.location.origin}/guest/${username}`;
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
        const guestResult = await apiFetch('/rp/guestlists', {
          method: 'GET'
        });

        if (guestResult.status === 'success') {
          setGuests(guestResult.data);
        } else {
          console.error("API returned error (Guestlist):", guestResult.message);
        }

        // Fetch RP Profile to get correct username and clicks count
        const profileResult = await apiFetch('/rp/profile', {
          method: 'GET'
        });

        if (profileResult.status === 'success' && profileResult.data) {
          if (profileResult.data.username) {
            setUsername(profileResult.data.username);
          }
          if (typeof profileResult.data.clicks_count === 'number') {
            setClicksCount(profileResult.data.clicks_count);
          }
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

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Guestlist • VIBE',
          text: `Entra na minha guestlist no VIBE!`,
          url: rpLink,
        });
      } catch (err) {
        if ((err as any)?.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
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
          bg: 'rgba(34, 197, 94, 0.15)',
          border: 'rgba(34, 197, 94, 0.3)',
          color: '#4ade80',
          label: 'Entered',
          icon: CheckCircle2,
        };
      case 'vip': // If added in future
        return {
          bg: 'rgba(212, 175, 55, 0.15)',
          border: 'rgba(212, 175, 55, 0.3)',
          color: '#D4AF37',
          label: 'VIP',
          icon: Star,
        };
      case 'expired':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          label: 'Expired',
          icon: Clock,
        };
      case 'confirmed':
      default:
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          border: 'rgba(59, 130, 246, 0.3)',
          color: '#60a5fa',
          label: 'Guestlist',
          icon: Clock,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-black text-white mb-2" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
        }}>
          Smart Guestlist
        </h1>
        <p className="text-gray-400 font-medium">Gere os teus links e lista de convidados</p>
      </div>

      {/* QR Code & Link Section - Desktop Split / Mobile Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code Card */}
        <GlassCard variant="gold" className="lg:col-span-1 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' }}>
              <QrCode className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your QR Code</h2>
              <p className="text-sm text-[#D4AF37] opacity-80 font-medium">Partilha para entrada rápida</p>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="aspect-square rounded-[1.5rem] mb-6 flex items-center justify-center overflow-hidden border-4 border-white/10 shadow-2xl bg-white group cursor-pointer hover:scale-[1.02] transition-transform">
            <div className="text-center p-2 w-full h-full flex items-center justify-center">
              {username ? (
                qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="RP Public Profile QR"
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="text-gray-400 font-medium text-sm">A gerar QR Code...</div>
                )
              ) : (
                <div className="text-red-500 font-bold text-sm px-4">
                  ⚠ Vai a "Perfil Público" para criares o teu username.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleDownloadQR}
            disabled={!username}
            className={`w-full px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              username 
                ? 'hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            style={{
              background: username ? 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)' : '#333333',
              color: username ? '#000000' : '#888888',
            }}
          >
            <Download className="w-5 h-5" />
            <span>Download QR</span>
          </button>
        </GlassCard>

        {/* Link Sharing Card */}
        <GlassCard className="lg:col-span-2 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <LinkIcon className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Personal Link</h2>
              <p className="text-sm text-gray-400 font-medium">Partilha nas redes sociais</p>
            </div>
          </div>

          {/* Link Display */}
          <div className="p-4 rounded-[1.5rem] mb-6 flex items-center gap-3 border border-white/10 bg-black/40 focus-within:border-[#D4AF37]/50 focus-within:ring-1 focus-within:ring-[#D4AF37]/50 transition-all">
            <LinkIcon className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
            <input
              type="text"
              value={rpLink}
              readOnly
              className="flex-1 bg-transparent text-white font-medium outline-none w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCopyLink}
              className="px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{
                background: copiedLink ? 'rgba(34, 197, 94, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                color: copiedLink ? '#4ade80' : '#D4AF37',
                border: copiedLink ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
            <button
              onClick={handleShareLink}
              disabled={!username}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-all ${
                username 
                  ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10' 
                  : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
              }`}
            >
              <Share2 className="w-5 h-5" />
              <span>Partilhar</span>
            </button>
          </div>

          {/* Link Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
            <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="text-2xl font-bold text-white mb-1">{clicksCount}</div>
              <div className="text-xs font-medium text-gray-400">Cliques</div>
            </div>
            <div className="text-center p-3 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/20 hover:bg-[#D4AF37]/10 transition-colors">
              <div className="text-2xl font-bold text-[#D4AF37] mb-1">
                {guests.length}
              </div>
              <div className="text-xs font-medium text-[#D4AF37] opacity-80">Guestlist</div>
            </div>
            <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="text-2xl font-bold text-white mb-1">
                {clicksCount > 0 ? Math.min(100, Math.round((guests.length / clicksCount) * 100)) : (guests.length > 0 ? 100 : 0)}%
              </div>
              <div className="text-xs font-medium text-gray-400">Conversão</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Guest List Section */}
      <GlassCard className="p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Guest List <span className="text-gray-400 font-medium">({filteredGuests.length})</span></h2>
          {loading && <div className="text-sm font-medium text-[#D4AF37] animate-pulse">A atualizar...</div>}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-[1.5rem] bg-black/40 border border-white/10 focus-within:border-[#D4AF37]/50 focus-within:ring-1 focus-within:ring-[#D4AF37]/50 transition-all">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Procurar por nome ou telemóvel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-white font-medium outline-none placeholder-gray-500 w-full"
            />
          </div>

          <div className="flex gap-2 p-1 bg-white/5 rounded-[1.5rem] border border-white/10 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setFilterStatus('all')}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap"
              style={{
                background: filterStatus === 'all' ? 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)' : 'transparent',
                color: filterStatus === 'all' ? '#000' : '#888888',
              }}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus('entered')}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap"
              style={{
                background: filterStatus === 'entered' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
                color: filterStatus === 'entered' ? '#fff' : '#888888',
              }}
            >
              Na Discoteca
            </button>
            <button
              onClick={() => setFilterStatus('expired')}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap"
              style={{
                background: filterStatus === 'expired' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
                color: filterStatus === 'expired' ? '#fff' : '#888888',
              }}
            >
              Expirado
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Nome</th>
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Evento</th>
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Estado</th>
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Data Adicionado</th>
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Hora de Entrada</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-500 font-medium">Nenhum convidado encontrado.</td></tr>
              ) : filteredGuests.map((guest) => {
                const status = getStatusBadge(guest.status);
                const StatusIcon = status.icon;
                return (
                  <tr key={guest.guestlist_id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-4 text-white font-bold">{guest.name}</td>
                    <td className="py-4 px-4 text-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#D4AF37] opacity-70 group-hover:opacity-100 transition-opacity" />
                        <span className="text-sm font-medium">{guest.event_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: status.bg,
                          border: `1px solid ${status.border}`,
                          color: status.color,
                        }}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                        <div className="flex flex-col">
                            <span className="text-gray-300 text-sm font-medium">{new Date(guest.added_date).toLocaleDateString('pt-PT')}</span>
                            <span className="text-gray-500 text-xs">{new Date(guest.added_date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300 font-medium">
                      {guest.checkin_time ? new Date(guest.checkin_time).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredGuests.length === 0 ? (
            <div className="py-12 text-center text-gray-500 font-medium">Nenhum convidado encontrado.</div>
          ) : filteredGuests.map((guest) => {
            const status = getStatusBadge(guest.status);
            const StatusIcon = status.icon;
            return (
              <div
                key={guest.guestlist_id}
                className="p-5 rounded-[1.5rem] transition-all duration-300 active:scale-[0.98]"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold mb-1.5 text-lg">{guest.name}</h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <p className="text-xs text-[#D4AF37] font-medium">{guest.event_name}</p>
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{
                      background: status.bg,
                      border: `1px solid ${status.border}`,
                      color: status.color,
                    }}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Adicionado</span>
                        <span className="text-xs text-gray-300">{new Date(guest.added_date).toLocaleDateString('pt-PT')}</span>
                    </div>
                    {guest.checkin_time && (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Entrada</span>
                            <span className="text-xs font-bold text-white">{new Date(guest.checkin_time).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
