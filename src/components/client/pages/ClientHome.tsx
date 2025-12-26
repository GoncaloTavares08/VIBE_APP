import { useState, useEffect } from 'react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { Clock, Lock, MapPin, QrCode, TrendingUp, Users, Heart, Award, Calendar } from 'lucide-react';
import { apiFetch } from '../../../services/api';
import { WhoIsHere } from '../WhoIsHere';
import { PersonProfileModal } from '../PersonProfileModal';
import { Leaderboard } from '../Leaderboard';
import { MyMatches } from '../MyMatches'

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

      const response = await apiFetch('/controllers/client_guestlist.php?action=next_event_status', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id })
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
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(212, 175, 55, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.2) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 p-4 lg:p-8 space-y-6">

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

  // Sync if prop changes (e.g. after refresh)
  useEffect(() => {
    if (initialEvent) {
      setNextEvent(initialEvent);
    }
  }, [initialEvent]);


  return (
    <>
      {/* Hero: Next Event Card */}
      <div
        className="relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
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
                className="w-full py-4 rounded-xl transition-all duration-300 opacity-50 cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  boxShadow: 'none',
                }}
                disabled={true}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-black font-black">Entrar na Lista (Em Breve)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Recommended RPs */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-white">Recommended RPs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Carlos Mendes', status: 'Gold RP' },
            { name: 'Maria Santos', status: 'Platinum RP' },
            { name: 'João Costa', status: 'Diamond RP' },
          ].map((rp, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  }}
                />
                <div>
                  <p className="text-white">{rp.name}</p>
                  <p className="text-xs text-gray-400">{rp.status}</p>
                </div>
              </div>
              <button
                className="w-full py-3 rounded-lg transition-all"
                style={{
                  background: 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  color: '#D4AF37',
                }}
              >
                Enter List
              </button>
            </div>
          ))}
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

              <div className="flex gap-4">
                <button onClick={() => setSelectedEvent(null)} className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                  Fechar
                </button>
                <button
                  className="flex-1 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    boxShadow: '0 8px 30px rgba(212, 175, 55, 0.4)',
                  }}
                >
                  <span className="text-black font-black">Entrar na Lista</span>
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
function LivePartyView({ event }: { event?: Event | null }) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [matches, setMatches] = useState<number[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [qrLoading, setQrLoading] = useState(false);

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
        const response = await apiFetch(`/controllers/client_guestlist.php?action=get_qr_code&user_id=${userId}`);
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
  }, [userId, showQRModal]);

  // Fetch matches on mount to ensure unlocked status
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await apiFetch(`/controllers/client_event_likes.php?action=my_matches&user_id=${userId}`);
        if (response.status === 'success' && response.matches) {
          setMatches(response.matches.map((m: any) => m.id));
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
      <div
        className="p-8 rounded-3xl text-center space-y-4 transition-all duration-300 hover:scale-105 cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(255, 215, 0, 0.2) 100%)',
          backdropFilter: 'blur(30px)',
          border: '2px solid rgba(212, 175, 55, 0.5)',
          boxShadow: '0 0 60px rgba(212, 175, 55, 0.4)',
        }}
        onClick={() => setShowQRModal(true)}
      >
        <QrCode className="w-24 h-24 mx-auto text-[#D4AF37]" />
        <p className="text-[#D4AF37] font-black text-xl">Show Bar QR</p>
        <p className="text-sm text-gray-300">Tap to accumulate points</p>
      </div>

      {/* My Matches Section */}
      <MyMatches userId={userId} onPersonClick={handlePersonClick} />

      {/* Who is Here - Tinder Style */}
      <div
        className="p-6 rounded-2xl space-y-4"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-black">Who is Here</h3>
          <Users className="w-5 h-5 text-gray-400" />
        </div>
        <WhoIsHere userId={userId} onMatch={handleMatch} onPersonClick={handlePersonClick} />
      </div>

      {/* Leaderboard with Tabs */}
      <Leaderboard onPersonClick={handlePersonClick} />

      {/* Person Profile Modal */}
      {selectedPerson && (
        <PersonProfileModal
          person={selectedPerson}
          isMatch={matches.includes(selectedPerson.id)}
          onClose={() => setSelectedPerson(null)}
        />
      )}

      {/* QR Code Modal */}
      {showQRModal && (
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
                  backgroundClip: 'text'
                }}
              >
                Teu QR Code
              </h2>
              <p className="text-gray-400 text-sm">Mostra este código no bar para acumular pontos</p>
            </div>

            {/* QR Code */}
            <div
              className="bg-white p-6 rounded-2xl mx-auto"
              style={{
                boxShadow: '0 0 40px rgba(212, 175, 55, 0.3)',
              }}
            >
              {qrLoading ? (
                <div className="flex items-center justify-center" style={{ minHeight: '300px' }}>
                  <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : qrCode ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${btoa('VIBE_SECURE:' + qrCode)}`}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center" style={{ minHeight: '300px' }}>
                  <p className="text-gray-600">QR Code não disponível</p>
                </div>
              )}
            </div>

            {/* Event Info */}
            <div
              className="py-3 px-4 rounded-xl"
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <p className="text-[#D4AF37] font-semibold">{event?.name || 'Evento Atual'}</p>
              <p className="text-gray-400 text-xs mt-1">Válido apenas para esta festa</p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-4 rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                boxShadow: '0 8px 30px rgba(212, 175, 55, 0.4)',
              }}
            >
              <span className="text-black font-black">Fechar</span>
            </button>
          </div>
        </div>
      )}


    </>
  );
}