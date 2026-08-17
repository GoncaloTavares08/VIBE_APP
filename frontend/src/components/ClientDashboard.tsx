import { useState, useEffect, useRef } from 'react';
import { ClientDashboardLayout } from './client/ClientDashboardLayout';
import { ClientHome } from './client/pages/ClientHome';
import { ClientWallet } from './client/pages/ClientWallet';
import { ClientProfile } from './client/pages/ClientProfile';
import { QrCode, Calendar, Gift, Wine, CreditCard, Star, X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../services/api';

interface ClientDashboardProps {
  user?: any;
  onLogout?: () => void;
}

export function ClientDashboard({ user, onLogout }: ClientDashboardProps) {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <ClientHome onNavigate={(page) => setCurrentPage(page)} />;
      case 'wallet':
        return <ClientWallet user={user} />;
      case 'qr':
        return <ClientQRCode />;
      case 'history':
        return <ClientHistory />;
      case 'profile':
        return <ClientProfile onNavigate={(page) => setCurrentPage(page)} />;
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
export function ClientQRCode() {
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

        const data = await apiFetch('/guestlist', {
          method: 'GET'
        });

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
    
    // Set up 45-second rotation to keep entry QR codes fresh (backend allows 60s)
    const rotationInterval = setInterval(() => {
      fetchGuestlists();
    }, 45000);

    return () => clearInterval(rotationInterval);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : guestlists.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < guestlists.length - 1 ? prev + 1 : 0));
  };

  // Swipe support
  const dragStartX = useRef<number | null>(null);

  const handleSwipeStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    dragStartX.current = clientX;
  };

  const handleSwipeEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStartX.current === null) return;
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const diff = clientX - dragStartX.current;
    if (diff > 60) handlePrev();
    else if (diff < -60) handleNext();
    dragStartX.current = null;
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
              {/* Prev Button - hidden on mobile, shown on md+ */}
              <button
                onClick={handlePrev}
                className="hidden md:flex absolute -left-12 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{
                  background: 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span className="text-[#D4AF37] text-2xl">‹</span>
              </button>

              {/* Next Button - hidden on mobile, shown on md+ */}
              <button
                onClick={handleNext}
                className="hidden md:flex absolute -right-12 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full items-center justify-center transition-all hover:scale-110 active:scale-95"
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

          {/* Main Card - swipeable on mobile */}
          <div
            className="p-5 md:p-8 rounded-3xl space-y-5 md:space-y-6 transition-all duration-300 mx-auto w-full touch-pan-y select-none"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(20, 20, 20, 0.95) 100%)',
              backdropFilter: 'blur(30px)',
              border: '2px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 0 40px rgba(212, 175, 55, 0.15)',
            }}
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleSwipeEnd}
            onMouseDown={handleSwipeStart}
            onMouseUp={handleSwipeEnd}
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
            <div className="bg-white p-4 md:p-6 rounded-[2rem] mx-auto w-full aspect-square max-w-[320px] flex flex-col items-center justify-center shadow-lg relative z-10 overflow-hidden">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(currentGuest.qr_code)}`}
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
            <p className="text-center text-[10px] md:text-xs text-gray-400 uppercase tracking-widest mt-4 font-bold flex items-center justify-center gap-1.5">
              {currentGuest.status === 'checked_in' ? (
                <>
                  <Wine className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Mostra no bar
                </>
              ) : (
                'Mostra à entrada'
              )}
            </p>
            
            {/* Visual rotation indicator */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-4">
              <div 
                className="h-full bg-[#D4AF37]" 
                style={{
                  animation: 'shrink 45s linear infinite'
                }}
              />
              <style>{`
                @keyframes shrink {
                  from { width: 100%; }
                  to { width: 0%; }
                }
              `}</style>
            </div>
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

// History Screen (Implemented)
function ClientHistory() {
  const [activeTab, setActiveTab] = useState<'events' | 'points'>('events');
  const [historyData, setHistoryData] = useState<{ events: any; transactions: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;

        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const slug = (pathSegments.length > 0 && !['client', 'staff', 'rp'].includes(pathSegments[0])) ? pathSegments[0] : '';

        const data = await apiFetch('/client/history', {
          method: 'GET',
          headers: {
            'X-Client-ID': slug
          }
        });

        if (data.status === 'success') {
          setHistoryData(data.data);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const events = historyData?.events?.data || historyData?.events || [];
  const transactions = historyData?.transactions?.data || historyData?.transactions || [];

  return (
    <div className="relative p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-black text-white">Atividade</h1>

        {/* Tabs */}
        <div className="flex p-1.5 rounded-full w-full max-w-md mx-auto lg:mx-0 relative overflow-hidden"
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Animated Background Pill */}
          <div 
            className="absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 ease-out"
            style={{
              width: 'calc(50% - 6px)',
              left: activeTab === 'events' ? '6px' : 'calc(50%)',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.1)'
            }}
          />

          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-3 rounded-full text-sm font-black transition-colors relative z-10 ${activeTab === 'events'
              ? 'text-[#D4AF37]'
              : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            Eventos
          </button>
          <button
            onClick={() => setActiveTab('points')}
            className={`flex-1 py-3 rounded-full text-sm font-black transition-colors relative z-10 ${activeTab === 'points'
              ? 'text-[#D4AF37]'
              : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            Pontos
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'events' ? (
            events.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Sem histórico de eventos.</div>
            ) : (
              events.map((event: any, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-white/5 cursor-pointer group"
                  style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#D4AF37]/10 flex items-center justify-center border border-white/10 shrink-0">
                      {event.image_url ? (
                        <img src={event.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      ) : (
                        <Calendar className="w-6 h-6 text-[#D4AF37]" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{event.event_name}</h3>
                      <p className="text-sm text-gray-400">
                        {new Date(event.event_date).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })} •
                        <span className="text-[#D4AF37]"> {event.checked_in_at ? event.checked_in_at.substring(11, 16) : ''}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Sem histórico de pontos.</div>
            ) : (
              transactions.map((tx: any, i: number) => {
                const isPurchase = tx.transaction_type === 'purchase';
                // Purchases add points (+), Redemptions remove points (-)
                const isPositive = isPurchase || tx.points > 0;

                const getIcon = () => {
                  if (tx.transaction_type === 'purchase') return <Wine className="w-5 h-5" />;
                  if (tx.transaction_type === 'reward_redemption') return <Gift className="w-5 h-5" />;
                  if (tx.transaction_type === 'bonus') return <Star className="w-5 h-5" />;
                  return <CreditCard className="w-5 h-5" />;
                };

                return (
                  <div
                    key={i}
                    className="p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-white/5 cursor-pointer"
                    style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
                    onClick={() => setSelectedTx(tx)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border border-white/5 ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {getIcon()}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">
                          {isPurchase ? 'Compra Bar' : (tx.transaction_type === 'reward_redemption' ? 'Prémio Resgatado' : 'Ajuste')}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {tx.event_name ? tx.event_name : (tx.description ? tx.description : 'Geral')}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString('pt-PT')} • {new Date(tx.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-black ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{Math.floor(Number(tx.points)).toString()}
                      </span>
                      {isPurchase && tx.amount_spent && parseFloat(tx.amount_spent) > 0 && (
                        <p className="text-xs font-medium text-gray-400 mt-1">{tx.amount_spent}€</p>
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl p-6 relative overflow-hidden text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(15, 15, 15, 0.95) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden bg-[#D4AF37]/10 flex items-center justify-center mb-6 shadow-xl shadow-[#D4AF37]/5 border border-[#D4AF37]/20">
                {selectedEvent.image_url ? (
                  <img src={selectedEvent.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Calendar className="w-10 h-10 text-[#D4AF37]" />
                )}
              </div>

              <h2 className="text-2xl font-black text-white mb-2">{selectedEvent.event_name}</h2>
              <div className="flex items-center justify-center gap-2 text-gray-400 mb-6">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Clube Atual</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300 font-medium">Data</span>
                  </div>
                  <span className="text-white font-bold">
                    {new Date(selectedEvent.event_date).toLocaleDateString('pt-PT')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300 font-medium">Check-in</span>
                  </div>
                  <span className="text-[#D4AF37] font-black">
                    {selectedEvent.checked_in_at ? selectedEvent.checked_in_at.substring(11, 16) : '--:--'}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}
            onClick={() => setSelectedTx(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl p-6 relative overflow-hidden text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(15, 15, 15, 0.95) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedTx(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 mx-auto rounded-full overflow-hidden flex items-center justify-center mb-6 shadow-xl border border-white/10"
                   style={{
                     background: selectedTx.transaction_type === 'purchase' || selectedTx.points > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                     color: selectedTx.transaction_type === 'purchase' || selectedTx.points > 0 ? '#22c55e' : '#ef4444'
                   }}>
                {selectedTx.transaction_type === 'purchase' ? <Wine className="w-8 h-8" /> : 
                 (selectedTx.transaction_type === 'reward_redemption' ? <Gift className="w-8 h-8" /> :
                 (selectedTx.transaction_type === 'bonus' ? <Star className="w-8 h-8" /> : <CreditCard className="w-8 h-8" />))}
              </div>

              <h2 className="text-2xl font-black text-white mb-2">
                {selectedTx.transaction_type === 'purchase' ? 'Compra no Bar' : 
                (selectedTx.transaction_type === 'reward_redemption' ? 'Prémio Resgatado' : 'Ajuste de Pontos')}
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                {selectedTx.event_name ? selectedTx.event_name : (selectedTx.description ? selectedTx.description : 'Geral')}
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-gray-300 font-medium">Pontos</span>
                  <span className={`text-xl font-black ${(selectedTx.transaction_type === 'purchase' || selectedTx.points > 0) ? 'text-green-500' : 'text-red-500'}`}>
                    {(selectedTx.transaction_type === 'purchase' || selectedTx.points > 0) ? '+' : ''}{Math.floor(Number(selectedTx.points))}
                  </span>
                </div>
                
                {selectedTx.transaction_type === 'purchase' && selectedTx.amount_spent && parseFloat(selectedTx.amount_spent) > 0 && (
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-gray-300 font-medium">Total Gasto</span>
                    <span className="text-white font-bold">{selectedTx.amount_spent}€</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-gray-300 font-medium">Data</span>
                  <span className="text-white font-bold">
                    {new Date(selectedTx.created_at).toLocaleDateString('pt-PT')} • {new Date(selectedTx.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}