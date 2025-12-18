import { useState } from 'react';
import { Calendar, TrendingUp, Users, Euro, Award, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NightEvent {
  id: number;
  date: string;
  dayOfWeek: string;
  eventName: string;
  totalRevenue: number;
  totalPax: number;
  image: string;
}

const mockNights: NightEvent[] = [
  { id: 1, date: '2024-12-14', dayOfWeek: 'Sábado', eventName: 'Neon Party', totalRevenue: 8950, totalPax: 342, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400' },
  { id: 2, date: '2024-12-13', dayOfWeek: 'Sexta-feira', eventName: 'Gold Rush', totalRevenue: 7240, totalPax: 298, image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400' },
  { id: 3, date: '2024-12-07', dayOfWeek: 'Sábado', eventName: 'Cyber Night', totalRevenue: 9120, totalPax: 356, image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400' },
  { id: 4, date: '2024-12-06', dayOfWeek: 'Sexta-feira', eventName: 'Vibe Sessions', totalRevenue: 6890, totalPax: 276, image: 'https://images.unsplash.com/photo-1571266028243-e4733b1e8116?w=400' },
  { id: 5, date: '2024-11-30', dayOfWeek: 'Sábado', eventName: 'Electric Dreams', totalRevenue: 8450, totalPax: 328, image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400' },
  { id: 6, date: '2024-11-29', dayOfWeek: 'Sexta-feira', eventName: 'Golden Hour', totalRevenue: 7560, totalPax: 302, image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400' },
];

const topPerformers = [
  { rank: 1, name: 'Joana Costa', points: 142, revenue: 2840, avatar: 'JC' },
  { rank: 2, name: 'Pedro Alves', points: 128, revenue: 2560, avatar: 'PA' },
  { rank: 3, name: 'Miguel Torres', points: 115, revenue: 2300, avatar: 'MT' },
  { rank: 4, name: 'Sofia Almeida', points: 98, revenue: 1960, avatar: 'SA' },
  { rank: 5, name: 'Ana Silva', points: 87, revenue: 1740, avatar: 'AS' },
];

export function NightMetrics() {
  const [selectedNight, setSelectedNight] = useState<NightEvent | null>(null);

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
              src={selectedNight.image}
              alt={selectedNight.eventName}
              className="w-32 h-32 rounded-2xl object-cover"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-2">{selectedNight.dayOfWeek}, {selectedNight.date}</p>
              <h1
                className="text-4xl font-black mb-4"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {selectedNight.eventName}
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
            <p className="text-4xl font-black text-white">€{selectedNight.totalRevenue}</p>
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
            <p className="text-4xl font-black text-white">{selectedNight.totalPax}</p>
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
            <p className="text-4xl font-black text-white">€{Math.round(selectedNight.totalRevenue / selectedNight.totalPax)}</p>
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

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockNights.map((night) => (
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
                src={night.image}
                alt={night.eventName}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(10, 10, 10, 0.9) 0%, transparent 60%)',
                }}
              ></div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs text-gray-300 mb-1">{night.dayOfWeek}</p>
                <p className="text-xl font-black text-white">{night.eventName}</p>
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
                <span className="font-black text-[#D4AF37]">€{night.totalRevenue}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Pax Total</span>
                <span className="font-black text-white">{night.totalPax}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
