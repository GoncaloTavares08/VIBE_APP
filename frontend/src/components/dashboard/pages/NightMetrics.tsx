import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, Euro, ArrowLeft, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../../../services/api';

interface TopPerformer {
  id: number;
  name: string;
  avatar: string;
  profile_photo?: string | null;
  points: number;
  guest_count: number;
  revenue: number;
  rank: number;
}

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
  topPerformers?: TopPerformer[];
}

interface NightMetricsProps {
  onSelectEvent?: (eventId: number) => void;
}

export function NightMetrics({ onSelectEvent }: NightMetricsProps) {
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
      const data = await apiFetch('/admin/nights-history', {
        method: 'GET'
      });

      if (data.status === 'success') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const past = (data.data || [])
          .filter((event: NightEvent) => {
            const eventDate = new Date(event.date);
            return eventDate <= today;
          })
          .sort((a: NightEvent, b: NightEvent) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          });

        setPastEvents(past);
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

  const totalPages = Math.ceil(pastEvents.length / eventsPerPage);
  const currentEvents = pastEvents.slice(
    (currentPage - 1) * eventsPerPage,
    currentPage * eventsPerPage
  );

  if (selectedNight) {
    const nightPerformers = selectedNight.topPerformers || [];

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-8 max-w-7xl mx-auto"
      >
        {/* Back Button */}
        <button
          onClick={() => setSelectedNight(null)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all duration-300 hover:scale-105 bg-white/5 border border-white/10 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
          <span>Voltar ao Histórico</span>
        </button>

        {/* Night Header */}
        <div
          className="p-6 sm:p-8 rounded-[2rem] border border-white/10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(15, 15, 15, 0.85) 100%)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {selectedNight.image_url ? (
              <img
                src={selectedNight.image_url}
                alt={selectedNight.name}
                className="w-32 h-32 rounded-2xl object-cover border border-white/10 shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37]">
                <Calendar className="w-12 h-12" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-1">
                {getDayOfWeek(selectedNight.date)} • {new Date(selectedNight.date).toLocaleDateString('pt-PT')}
              </p>
              <h1
                className="text-3xl sm:text-4xl font-black mb-2"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {selectedNight.name}
              </h1>
              <p className="text-xs text-gray-400">
                Horário: {selectedNight.start_time} - {selectedNight.end_time} • Lotação Máxima: {selectedNight.capacity} pessoas
              </p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div
            className="p-6 rounded-[2rem] border border-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(15, 15, 15, 0.85) 100%)',
              backdropFilter: 'blur(25px)',
            }}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-500/15 border border-green-500/30 text-green-400">
                <Euro className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Consumo no Bar</p>
                <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full">Originou Pontos</span>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white">€{selectedNight.totalRevenue || 0}</p>
            <p className="text-[11px] text-gray-500 mt-2">Valor total gasto no bar pelos clientes</p>
          </div>

          <div
            className="p-6 rounded-[2rem] border border-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.06) 0%, rgba(15, 15, 15, 0.85) 100%)',
              backdropFilter: 'blur(25px)',
            }}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-500/15 border border-purple-500/30 text-purple-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Pax Total</p>
                <span className="text-[10px] text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full">Check-ins</span>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white">{selectedNight.totalPax || 0} <span className="text-sm font-normal text-gray-400">entradas</span></p>
            <p className="text-[11px] text-gray-500 mt-2">Clientes validados na porta</p>
          </div>

          <div
            className="p-6 rounded-[2rem] border border-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(15, 15, 15, 0.85) 100%)',
              backdropFilter: 'blur(25px)',
            }}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Média Bar / Pax</p>
                <span className="text-[10px] text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">Ticket Médio</span>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white">
              €{selectedNight.totalRevenue && selectedNight.totalPax ? (selectedNight.totalRevenue / selectedNight.totalPax).toFixed(2) : '0.00'}
            </p>
            <p className="text-[11px] text-gray-500 mt-2">Média de consumo em bar por cliente</p>
          </div>
        </div>

        {/* Top Performers */}
        <div
          className="p-6 sm:p-8 rounded-[2rem] border border-white/10"
          style={{
            background: 'rgba(15, 15, 15, 0.75)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D4AF37]" />
            Promotores em Destaque nesta Noite
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            Ranking baseado no consumo de bar gerado pelos convidados e check-ins efetuados
          </p>

          {nightPerformers.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-gray-500 text-xs">
              Sem dados de promotores registados para este evento.
            </div>
          ) : (
            <div className="space-y-3">
              {nightPerformers.map((performer) => (
                <div
                  key={performer.id}
                  className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01] border"
                  style={{
                    background: performer.rank <= 3
                      ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
                      : 'rgba(255, 255, 255, 0.02)',
                    borderColor: performer.rank <= 3
                      ? 'rgba(212, 175, 55, 0.25)'
                      : 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <span className="text-2xl font-black w-8 text-center">
                    {performer.rank === 1 ? '🥇' : performer.rank === 2 ? '🥈' : performer.rank === 3 ? '🥉' : `#${performer.rank}`}
                  </span>

                  {performer.profile_photo ? (
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/20 shadow-md bg-black/40 flex-shrink-0">
                      <img
                        src={performer.profile_photo}
                        alt={performer.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0"
                      style={{
                        background: performer.rank <= 3
                          ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
                          : 'rgba(255, 255, 255, 0.1)',
                        color: performer.rank <= 3 ? '#000000' : '#ffffff',
                      }}
                    >
                      {performer.avatar}
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{performer.name}</p>
                    <p className="text-xs text-gray-400">{performer.points} check-ins validados</p>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-black text-[#D4AF37]">€{performer.revenue}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Consumo Bar</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Histórico e Métricas das Noites
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
          Analisa eventos passados, consumo no bar que originou pontos e ranking de promotores
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-center max-w-md mx-auto">
          <p className="text-white font-bold mb-1">Erro</p>
          <p className="text-gray-400 text-xs">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && pastEvents.length === 0 && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center p-8 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] max-w-md">
            <Calendar className="w-14 h-14 text-gray-600 mx-auto mb-3" />
            <p className="text-white font-bold text-base mb-1">Nenhum evento passado</p>
            <p className="text-gray-400 text-xs">Ainda não existem eventos que já tenham sido concluídos.</p>
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
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => {
                  if (onSelectEvent) {
                    onSelectEvent(night.id);
                  } else {
                    setSelectedNight(night);
                  }
                }}
                className="cursor-pointer rounded-[2rem] overflow-hidden border border-white/10 shadow-xl flex flex-col justify-between"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(15, 15, 15, 0.85) 100%)',
                  backdropFilter: 'blur(25px)',
                }}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-black/40">
                  <img
                    src={night.image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'}
                    alt={night.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to top, rgba(15, 15, 15, 0.95) 0%, transparent 60%)',
                    }}
                  />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[11px] text-[#D4AF37] font-bold uppercase tracking-wider mb-0.5">{getDayOfWeek(night.date)}</p>
                    <p className="text-lg font-black text-white truncate">{night.name}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Data</span>
                    <span className="font-bold text-white">
                      {new Date(night.date).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Consumo no Bar</span>
                    <span className="font-black text-[#D4AF37] text-sm">€{night.totalRevenue || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Pax Total</span>
                    <span className="font-black text-white text-sm">{night.totalPax || 0} pax</span>
                  </div>
                  <div className="pt-2 text-right">
                    <span className="text-[11px] text-[#D4AF37] font-bold">Ver no Painel Geral →</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 flex items-center gap-1.5 bg-white/5 border border-white/10 text-white"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <div className="flex gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black shadow-md'
                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 flex items-center gap-1.5 bg-white/5 border border-white/10 text-white"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
