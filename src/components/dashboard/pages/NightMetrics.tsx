import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, Euro, Award, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NightEvent {
  id: number;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  organizer_name: string;
  status: string;
  image_url: string;
  totalPax?: number;
  totalRevenue?: number;
}

const topPerformers = [
  { rank: 1, name: 'Joana Costa', points: 142, revenue: 2840, avatar: 'JC' },
  { rank: 2, name: 'Pedro Alves', points: 128, revenue: 2560, avatar: 'PA' },
  { rank: 3, name: 'Miguel Torres', points: 115, revenue: 2300, avatar: 'MT' },
  { rank: 4, name: 'Sofia Almeida', points: 98, revenue: 1960, avatar: 'SA' },
  { rank: 5, name: 'Ana Silva', points: 87, revenue: 1740, avatar: 'AS' },
];

export function NightMetrics() {
  const [selectedNight, setSelectedNight] = useState<NightEvent | null>(null);
  const [pastEvents, setPastEvents] = useState<NightEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 6;

  // Fetch past events from database
  useEffect(() => {
    fetchPastEvents();
  }, []);

  const fetchPastEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/controllers/events.php', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Client-ID': localStorage.getItem('clubSlug') || 'vr'
        }
      });

      const data = await response.json();

      if (data.status === 'success') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter events that have already passed and sort from newest to oldest
        const past = data.data
          .filter((event: NightEvent) => {
            const eventDate = new Date(event.date);
            return eventDate < today;
          })
          .sort((a: NightEvent, b: NightEvent) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
          });

        // TODO: calcular totalPax e totalRevenue reais
        // Por agora, valores hardcoded para demonstração
        const eventsWithStats = past.map((event: NightEvent) => ({
          ...event,
          totalPax: Math.floor(Math.random() * 200) + 150, // Mock data
          totalRevenue: Math.floor(Math.random() * 5000) + 5000 // Mock data
        }));

        setPastEvents(eventsWithStats);
      } else {
        setError(data.message || 'Erro ao carregar eventos');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  const getDayOfWeek = (dateString: string) => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  // Pagination calculations
  const totalPages = Math.ceil(pastEvents.length / eventsPerPage);
  const currentEvents = pastEvents.slice(
    (currentPage - 1) * eventsPerPage,
    currentPage * eventsPerPage
  );

  if (selectedNight) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-8"
      >
        {/* Back Button */}
        <button
          onClick={() => setSelectedNight(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
          }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Voltar ao Calendário</span>
        </button>

        {/* Night Header */}
        <div
          className="p-8 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <img
              src={selectedNight.image_url}
              alt={selectedNight.name}
              className="w-32 h-32 rounded-2xl object-cover"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-2">{getDayOfWeek(selectedNight.date)}, {selectedNight.date}</p>
              <h1
                className="text-4xl font-black mb-4"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {selectedNight.name}
              </h1>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className="p-6 rounded-3xl"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                <Euro className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm text-gray-400 font-medium">Receita Total</p>
            </div>
            <p className="text-4xl font-black text-white">€{selectedNight.totalRevenue || 0}</p>
          </div>

          <div
            className="p-6 rounded-3xl"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                }}
              >
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-sm text-gray-400 font-medium">Pax Total</p>
            </div>
            <p className="text-4xl font-black text-white">{selectedNight.totalPax || 0}</p>
          </div>

          <div
            className="p-6 rounded-3xl"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <p className="text-sm text-gray-400 font-medium">Ticket Médio</p>
            </div>
            <p className="text-4xl font-black text-white">€{selectedNight.totalRevenue && selectedNight.totalPax ? Math.round(selectedNight.totalRevenue / selectedNight.totalPax) : 0}</p>
          </div>
        </div>

        {/* Top Performers */}
        <div
          className="p-8 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <h2 className="text-2xl font-black text-white mb-6">Top Performance</h2>
          <div className="space-y-4">
            {topPerformers.map((performer) => (
              <div
                key={performer.rank}
                className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-105"
                style={{
                  background: performer.rank <= 3
                    ? 'rgba(212, 175, 55, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: performer.rank <= 3
                    ? '1px solid rgba(212, 175, 55, 0.2)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                {/* Medal */}
                <span className="text-3xl">
                  {performer.rank === 1 ? '🥇' : performer.rank === 2 ? '🥈' : performer.rank === 3 ? '🥉' : `#${performer.rank}`}
                </span>

                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                  style={{
                    background: performer.rank <= 3
                      ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
                      : 'rgba(255, 255, 255, 0.1)',
                    color: performer.rank <= 3 ? '#000000' : '#ffffff',
                  }}
                >
                  {performer.avatar}
                </div>

                {/* Name */}
                <div className="flex-1">
                  <p className="font-black text-white">{performer.name}</p>
                  <p className="text-sm text-gray-400">{performer.points} convidados</p>
                </div>

                {/* Revenue */}
                <p className="text-xl font-black text-[#D4AF37]">€{performer.revenue}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Histórico</h1>
        <p className="text-gray-400">Analise eventos passados e performance</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">A carregar eventos...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center p-6 rounded-2xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <p className="text-white font-semibold mb-2">Erro</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && pastEvents.length === 0 && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center p-6">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">Nenhum evento passado</p>
            <p className="text-gray-400 text-sm">Ainda não existem eventos que já aconteceram.</p>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      {!loading && !error && currentEvents.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentEvents.map((night) => (
              <motion.div
                key={night.id}
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => setSelectedNight(night)}
                className="cursor-pointer rounded-3xl overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={night.image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'}
                    alt={night.name}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to top, rgba(10, 10, 10, 0.9) 0%, transparent 60%)',
                    }}
                  ></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs text-gray-300 mb-1">{getDayOfWeek(night.date)}</p>
                    <p className="text-xl font-black text-white">{night.name}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Data</span>
                    <span className="text-sm font-semibold text-white">{night.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Receita</span>
                    <span className="font-black text-[#D4AF37]">€{night.totalRevenue || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Pax Total</span>
                    <span className="font-black text-white">{night.totalPax || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{
                  background: currentPage === 1 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(212, 175, 55, 0.15)',
                  border: currentPage === 1 ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(212, 175, 55, 0.3)',
                  color: currentPage === 1 ? '#666' : '#D4AF37',
                }}
              >
                <ChevronLeft className="w-5 h-5" />
                Anterior
              </button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className="w-10 h-10 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                    style={{
                      background: currentPage === page ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.05)',
                      border: currentPage === page ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: currentPage === page ? '#000' : '#fff',
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{
                  background: currentPage === totalPages ? 'rgba(255, 255, 255, 0.05)' : 'rgba(212, 175, 55, 0.15)',
                  border: currentPage === totalPages ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(212, 175, 55, 0.3)',
                  color: currentPage === totalPages ? '#666' : '#D4AF37',
                }}
              >
                Próxima
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
