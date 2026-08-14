import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { Clock, Lock, MapPin, QrCode, TrendingUp, Users, Heart, Award, Calendar, Flame, Trophy } from 'lucide-react';
import { apiFetch } from '../../../services/api';
import { WhoIsHere } from '../WhoIsHere';
import { PersonProfileModal } from '../PersonProfileModal';
import { Leaderboard } from '../Leaderboard';
import { MyMatches } from '../MyMatches'
import { createPortal } from 'react-dom';

type PartyState = 'no-guestlist' | 'has-guestlist' | 'live-party';

interface Event {
  id: number;
  name: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  organizer_name?: string;
  image_url?: string;
  status: 'upcoming' | 'completed';
}

interface Person {
  id: number;
  name: string;
  age: number;
  bio: string;
  vibes: number;
  photos: string[];
  distance: string;
  points?: number;
  instagram?: string;
}

export function ClientHome() {
  const [partyState, setPartyState] = useState<PartyState>('no-guestlist');
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch status from backend
  const fetchStatus = async () => {
    try {
      // Get user ID from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const response = await apiFetch('/guestlist/status', {
        method: 'GET'
      });

      if (response.status === 'success') {
        const backendStatus = response.computed_status as PartyState; // 'no-guestlist' | 'has-guestlist' | 'live-party'
        setPartyState(backendStatus || 'no-guestlist');
        setActiveEvent(response.event || null);
      }
    } catch (error) {
      console.error('Error fetching home status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(212, 175, 55, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.2) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 space-y-6">

        {/* Variation A: No Guestlist */}
        {partyState === 'no-guestlist' && <NoGuestlistView initialEvent={activeEvent} onRefresh={fetchStatus} />}

        {/* Variation B: Has Guestlist */}
        {partyState === 'has-guestlist' && <HasGuestlistView event={activeEvent} />}

        {/* Variation C: Live Party */}
        {partyState === 'live-party' && <LivePartyView event={activeEvent} />}
      </div>
    </div>
  );
}

// Variation A: No Guestlist
function NoGuestlistView({ initialEvent, onRefresh }: { initialEvent: Event | null, onRefresh: () => void }) {
  const [nextEvent, setNextEvent] = useState<Event | null>(initialEvent);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [recommendedRps, setRecommendedRps] = useState<any[]>([]);
  const [guestlistSummary, setGuestlistSummary] = useState<{total_count: number, photos: string[]}>({total_count: 0, photos: []});

  const [isJoining, setIsJoining] = useState(false);

  // Sync if prop changes (e.g. after refresh)
  useEffect(() => {
    if (initialEvent) {
      setNextEvent(initialEvent);
    }
  }, [initialEvent]);

  // Fetch Recommended RPs & Guestlist Summary for the next event
  useEffect(() => {
    if (nextEvent) {
      apiFetch(`/events/${nextEvent.id}/rps`)
        .then(res => {
          if (res.status === 'success' && res.data) {
            // Take top 3 RPs
            setRecommendedRps(res.data.slice(0, 3));
          }
        })
        .catch(err => console.error("Error fetching recommended RPs:", err));
        
      apiFetch(`/events/${nextEvent.id}/guestlist-summary`)
        .then(res => {
          if (res.status === 'success' && res.data) {
            setGuestlistSummary(res.data);
          }
        })
        .catch(err => console.error("Error fetching guestlist summary:", err));
    }
  }, [nextEvent]);

  const handleJoinGuestlist = async (rpId?: number) => {
    if (!selectedEvent || isJoining) return;
    setIsJoining(true);
    try {
      const payload: any = { event_id: selectedEvent.id };
      if (rpId) {
        payload.rp_id = rpId;
      }
      
      const res = await apiFetch('/guestlist/join', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (res.status === 'success') {
        setSelectedEvent(null);
        onRefresh(); // This will trigger fetchStatus in parent, transitioning to has-guestlist
      } else {
        alert(res.message || 'Erro ao entrar na guestlist.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de ligação. Tenta novamente.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      {/* Hero: Next Event Card */}
      <div
        className="relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transform: 'translateZ(0)',
          isolation: 'isolate'
        }}
        onClick={() => nextEvent && setSelectedEvent(nextEvent)}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src={nextEvent?.image_url || "https://images.unsplash.com/photo-1744314080490-ed41f6319475?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdodGNsdWIlMjBwYXJ0eSUyMGNyb3dkfGVufDF8fHx8MTc2NjA2ODIwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"}
            alt={nextEvent?.name || "Party"}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.9) 100%)',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 p-8 space-y-6">
          {!nextEvent ? (
            <div className="text-center text-gray-400 py-10">Nenhum evento próximo</div>
          ) : (
            <>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Próximo Evento</p>
                <h2
                  className="text-4xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {nextEvent.name}
                </h2>
                <p className="text-gray-300 mt-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(nextEvent.date).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {nextEvent.start_time} - {nextEvent.end_time}
                </p>
              </div>

              {/* CTA */}
              <button
                className="w-full py-4 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  boxShadow: '0 8px 30px rgba(212, 175, 55, 0.4)',
                }}
              >
                <span className="text-black font-black text-lg">Entrar na Lista</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Engagement & VIP Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* FOMO / Who's Going Card */}
        <div 
          className="p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[160px]"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="relative z-10">
            <h3 className="text-xl font-black text-white mb-1">Guestlist a encher 🔥</h3>
            <p className="text-gray-400 text-sm mb-4">Já <span className="text-[#D4AF37] font-bold">{guestlistSummary.total_count} pessoas</span> garantiram entrada.</p>
            
            <div className="flex items-center">
              {/* Blurred avatars overlapping */}
              {guestlistSummary.photos.map((img, i) => (
                <div 
                  key={i} 
                  className="w-10 h-10 rounded-full border-2 border-[#121212] overflow-hidden bg-[#1a1a1a]"
                  style={{ marginLeft: i === 0 ? 0 : '-12px', zIndex: 10 - i }}
                >
                <ImageWithFallback src={img} alt="User" className="w-full h-full object-cover filter blur-[2px] opacity-80" />
                </div>
              ))}
              
              {guestlistSummary.total_count > guestlistSummary.photos.length && (
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-[#121212] flex items-center justify-center text-xs font-bold text-[#D4AF37] bg-[#1a1a1a]"
                    style={{ marginLeft: '-12px', zIndex: 5 }}
                  >
                    +{guestlistSummary.total_count - guestlistSummary.photos.length}
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* VIP & Tables Card */}
        <div 
          className="p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[160px] group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(20, 20, 20, 0.8) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/20 rounded-full filter blur-[40px] group-hover:bg-[#D4AF37]/40 transition-all duration-500"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-black text-[#D4AF37]">VIP & Mesas</h3>
                <Award className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <p className="text-gray-300 text-sm max-w-[80%]">
                Eleva a tua noite. Reserva uma área privada ou pede garrafas exclusivas.
              </p>
            </div>
            
            <div className="mt-4">
              <button 
                className="px-5 py-2 rounded-xl text-sm font-bold text-black transition-all"
                style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' }}
              >
                Ver Preçário (Brevemente)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl backdrop-blur-xl overflow-hidden"
            style={{
              background: 'rgba(10, 10, 10, 0.95)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedEvent.image_url && (
              <div style={{ height: '300px' }}>
                <img src={selectedEvent.image_url} alt={selectedEvent.name} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-8">
              <h2 className="text-3xl text-white font-bold mb-2">{selectedEvent.name}</h2>
              {selectedEvent.description && <p className="text-gray-400 mb-6" style={{ whiteSpace: 'pre-wrap' }}>{selectedEvent.description}</p>}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Calendar className="w-5 h-5" /><span className="text-sm">Data</span>
                  </div>
                  <div className="text-white text-lg font-semibold">
                    {new Date(selectedEvent.date).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Clock className="w-5 h-5" /><span className="text-sm">Horário</span>
                  </div>
                  <div className="text-white text-lg font-semibold">{selectedEvent.start_time} - {selectedEvent.end_time}</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Users className="w-5 h-5" /><span className="text-sm">Capacidade</span>
                  </div>
                  <div className="text-white text-lg font-semibold">{selectedEvent.capacity} pessoas</div>
                </div>
                {selectedEvent.organizer_name && (
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <div className="text-gray-400 mb-2 text-sm">Organizador</div>
                    <div className="text-white text-lg font-semibold">{selectedEvent.organizer_name}</div>
                  </div>
                )}
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="text-white font-bold mb-4">Escolhe o RP para entrar na Guestlist:</h3>
                
                {recommendedRps.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {recommendedRps.map((rp, i) => (
                      <button 
                        key={i}
                        onClick={() => handleJoinGuestlist(rp.id || rp.user_id)}
                        disabled={isJoining}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] group ${isJoining ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(212, 175, 55, 0.2)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {rp.avatar ? (
                          <ImageWithFallback src={rp.avatar || undefined} alt={rp.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold">
                              {rp.name.charAt(0)}
                            </div>
                          )}
                          <div className="text-left">
                            <p className="text-white text-sm font-semibold group-hover:text-[#D4AF37] transition-colors">{rp.name}</p>
                            <p className="text-xs text-gray-400">@{rp.username}</p>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-black px-4 py-2 rounded-full transition-all" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' }}>
                          Entrar
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mb-6">
                    <p className="text-gray-400 mb-4 text-sm">Nenhum RP disponível para este evento de momento. Não é possível entrar sem RP associado.</p>
                  </div>
                )}

                <button onClick={() => setSelectedEvent(null)} className="w-full px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                  Fechar Janela
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Variation B: Has Guestlist (Locked)
function HasGuestlistView({ event }: { event?: Event | null }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="max-w-md w-full p-10 rounded-3xl text-center space-y-6"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Lock Icon */}
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(212, 175, 55, 0.2)',
              border: '2px solid rgba(212, 175, 55, 0.4)',
              boxShadow: '0 0 40px rgba(212, 175, 55, 0.3)',
            }}
          >
            <Lock className="w-10 h-10 text-[#D4AF37]" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h3
            className="text-2xl font-black"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Estás na guestlist para
            <br />
            {event?.name || 'Próximo Evento'}
          </h3>
          <p className="text-gray-400">
            Esta área desbloqueia quando entrares na festa.
            <br />
            Até lá, prepara o teu VIBE.
          </p>
        </div>

        {/* Status Badge */}
        <div
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full"
          style={{
            background: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
          }}
        >
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm">Guestlist Confirmada</span>
        </div>
      </div>
    </div>
  );
}

// Variation C: Live Party (WOW FACTOR!)
function LivePartyView({ event }: { event: Event | null }) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [matches, setMatches] = useState<number[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'networking' | 'leaderboard' | 'matches'>('networking');

  // Get current user ID
  const userId = (() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return 0;
      const user = JSON.parse(userStr);
      return user.id || 0;
    } catch {
      return 0;
    }
  })();

  // Fetch QR code text when modal opens
  useEffect(() => {
    if (!showQRModal || !userId) return;

    const fetchQRCode = async () => {
      setQrLoading(true);
      try {
        const response = await apiFetch(`/guestlist/qr-code`);
        if (response.status === 'success' && response.qr_code) {
          setQrCode(response.qr_code);
        } else {
          console.error('No QR code found');
        }
      } catch (error) {
        console.error('Error fetching QR code:', error);
      } finally {
        setQrLoading(false);
      }
    };

    fetchQRCode();
    
    // Set up 15-second rotation
    const rotationInterval = setInterval(() => {
      fetchQRCode();
    }, 15000);

    return () => clearInterval(rotationInterval);
  }, [userId, showQRModal]);

  // Fetch matches on mount to ensure unlocked status
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await apiFetch(`/networking/matches`);
        if (response.status === 'success') {
          // The backend returns an array of Match objects, but our state wants an array of IDs
          setMatches((response.matches || []).map((m: any) => m.id));
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };

    if (userId) {
      fetchMatches();
    }
  }, [userId]);

  const handleMatch = (person: Person) => {
    setMatches(prev => [...prev, person.id]);
  };

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
  };

  return (
    <>
      {/* Live Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-500 font-black uppercase tracking-wider">Live</span>
        </div>
        <span className="text-white">at {event?.name || 'Main Club'}</span>
        <MapPin className="w-4 h-4 text-gray-400" />
      </div>

      {/* Bar QR Card */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="p-8 rounded-[2rem] text-center space-y-4 cursor-pointer relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 10px 40px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
        onClick={() => setShowQRModal(true)}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-20 blur-[50px] rounded-full pointer-events-none" />
        <QrCode className="w-16 h-16 mx-auto text-[#D4AF37]" />
        <div>
          <p className="text-[#D4AF37] font-black text-2xl tracking-tight">Show Bar QR</p>
          <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest">Accumulate Points</p>
        </div>
      </motion.div>

      {/* Pill Navigation Hub */}
      <div className="flex p-1.5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative mt-6">
        {['networking', 'leaderboard', 'matches'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className="flex-1 py-2 md:py-3 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider relative z-10 transition-colors flex flex-col items-center gap-1 md:flex-row md:justify-center"
            style={{ color: activeTab === tab ? '#000' : '#888' }}
          >
            {tab === 'networking' && <Flame className="w-4 h-4 md:w-5 md:h-5" />}
            {tab === 'leaderboard' && <Trophy className="w-4 h-4 md:w-5 md:h-5" />}
            {tab === 'matches' && <Heart className="w-4 h-4 md:w-5 md:h-5" />}
            <span>{tab === 'networking' ? 'Descobrir' : tab === 'leaderboard' ? 'Classificação' : tab}</span>
          </button>
        ))}
        {/* Active Pill Indicator */}
        <motion.div
          layout
          className="absolute top-1.5 bottom-1.5 rounded-[1.25rem] z-0"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
            left: activeTab === 'networking' ? '0.375rem' : activeTab === 'leaderboard' ? 'calc(33.333% + 0.1rem)' : 'calc(66.666% - 0.2rem)',
            width: 'calc(33.333% - 0.25rem)',
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>

      {/* Content Area */}
      <div className="mt-6 min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'networking' && (
            <motion.div
              key="networking"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <WhoIsHere userId={userId} onMatch={handleMatch} onPersonClick={handlePersonClick} />
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Leaderboard onPersonClick={handlePersonClick} />
            </motion.div>
          )}

          {activeTab === 'matches' && (
            <motion.div
              key="matches"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MyMatches userId={userId} onPersonClick={handlePersonClick} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Person Profile Modal */}
      {selectedPerson && createPortal(
        <PersonProfileModal
          person={selectedPerson}
          isMatch={matches.includes(selectedPerson.id)}
          onClose={() => setSelectedPerson(null)}
        />,
        document.body
      )}

      {/* QR Code Modal */}
      {showQRModal && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(20px)' }}
          onClick={() => setShowQRModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-8 text-center space-y-6"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)',
              backdropFilter: 'blur(40px)',
              border: '2px solid rgba(212, 175, 55, 0.5)',
              boxShadow: '0 0 80px rgba(212, 175, 55, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <div className="space-y-2">
              <h2
                className="text-3xl font-black"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Teu QR Code
              </h2>
              <p className="text-gray-400 font-medium">Mostra este código no bar para acumular pontos</p>
            </div>

            {/* QR Code Image Placeholder */}
            <div className="bg-white p-4 md:p-6 rounded-[2rem] mx-auto w-full aspect-square max-w-[320px] flex flex-col items-center justify-center shadow-2xl shadow-white/5 relative group overflow-hidden">
              <div className="absolute inset-0 bg-[#D4AF37] opacity-0 group-hover:opacity-20 transition-opacity rounded-[2rem]" />
              {qrLoading ? (
                 <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl relative z-10">
                   <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                 </div>
              ) : qrCode ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrCode)}`}
                  alt="My QR Code"
                  className="w-full h-full object-contain relative z-10"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl relative z-10">
                   <p className="text-gray-500 text-sm">QR Code indisponível</p>
                 </div>
              )}
            </div>

            {/* Event Context Card */}
            {event && (
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(212, 175, 55, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                }}
              >
                <h3 className="text-[#D4AF37] font-bold text-lg">{event.name}</h3>
                <p className="text-sm text-gray-400 mt-1">Válido apenas para esta festa</p>
              </div>
            )}

            {/* Expiration bar (Visual only) */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#D4AF37]"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 15, ease: 'linear', repeat: Infinity }}
              />
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-4 rounded-2xl text-black font-black text-lg transition-transform hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              }}
            >
              Fechar
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}