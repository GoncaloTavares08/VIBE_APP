import { Trophy, Crown, Loader2, Sparkles, Flame } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { apiFetch } from '../../../services/api';

interface LeaderboardEntry {
  id: number;
  rank: number;
  name: string;
  avatar: string | null;
  initials: string;
  entries: number;
  revenue: number;
  trend: 'up' | 'down';
}

const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const clean = url.replace(/^\/?api\/serve-image\?file=/, '').replace(/^\/?storage\//, '');
  return `/api/serve-image?file=${clean}`;
};

export function RPLeaderboard() {
  const [period, setPeriod] = useState<'all_time' | 'this_year' | 'this_month'>('all_time');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(`/rp/leaderboard?period=${period}`, { method: 'GET' });
        if (response.status === 'success') {
          setLeaderboard(response.data || []);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const others = leaderboard.slice(3);
  const myPosition = leaderboard.find(entry => entry.id === user?.id);

  if (loading && leaderboard.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500 font-bold bg-red-500/10 px-6 py-4 rounded-[2rem] border border-red-500/20">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Global Leaderboard
            </h1>
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
            Compete com os melhores promotores do clube
          </p>
        </div>

        {/* Period Tabs Selector */}
        <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative w-full sm:w-auto">
          {[
            { id: 'all_time', label: 'All Time' },
            { id: 'this_year', label: 'This Year' },
            { id: 'this_month', label: 'This Month' },
          ].map((tab) => {
            const isActive = period === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id as any)}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 relative z-10 ${
                  isActive ? 'text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activePeriodLeaderboard"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#FFD700] shadow-[0_0_15px_rgba(212,175,55,0.3)] z-[-1]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top 3 Visual Podium Card */}
      {top1 && (
        <div
          className="p-6 sm:p-8 rounded-[2rem] relative overflow-hidden border border-[#D4AF37]/20"
          style={{
            background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(15, 15, 15, 0.8) 100%)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(212, 175, 55, 0.05)',
          }}
        >
          {/* Subtle gold ambient light in background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#D4AF37] opacity-15 blur-[80px] rounded-full pointer-events-none" />

          <h2 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] text-center mb-8">
            👑 Hall of Fame
          </h2>

          {/* 3-Column Podium Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto pt-6 pb-2">
            {/* 2nd Place (Silver - Medium size, slightly raised above 3rd) */}
            {top2 ? (
              <div className="flex flex-col items-center text-center -translate-y-2 sm:-translate-y-3 group">
                <div className="relative mb-3">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-slate-300/70 shadow-[0_0_20px_rgba(200,200,200,0.25)] bg-black/50 transition-transform duration-300 group-hover:scale-105">
                    {top2.avatar ? (
                      <img src={getImageUrl(top2.avatar)} alt={top2.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-lg sm:text-2xl text-slate-200">
                        {top2.initials}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-slate-200 to-slate-400 text-black font-black text-[10px] sm:text-xs shadow-md border border-white/40">
                    #2
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[90px] sm:max-w-[130px] mt-1">
                  {top2.name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs sm:text-base font-black text-slate-300">{top2.entries}</span>
                  <span className="text-[10px] sm:text-xs text-gray-400">entradas</span>
                </div>
              </div>
            ) : <div />}

            {/* 1st Place (Gold Champion - Tallest, largest avatar & elevated highest) */}
            {top1 && (
              <div className="flex flex-col items-center text-center -translate-y-6 sm:-translate-y-8 group">
                <div className="relative mb-3">
                  {/* Floating Crown */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 animate-bounce">
                    <Crown className="w-7 h-7 sm:w-9 sm:h-9 text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.9)]" />
                  </div>
                  <div className="w-20 h-20 sm:w-26 sm:h-26 md:w-30 md:h-30 rounded-full overflow-hidden border-2 border-[#FFD700] shadow-[0_0_35px_rgba(255,215,0,0.4)] bg-black/50 transition-transform duration-300 group-hover:scale-105">
                    {top1.avatar ? (
                      <img src={getImageUrl(top1.avatar)} alt={top1.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-2xl sm:text-4xl text-[#FFD700]">
                        {top1.initials}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black font-black text-[11px] sm:text-xs shadow-lg border border-white/40">
                    #1
                  </div>
                </div>
                <p className="text-sm sm:text-base font-black text-white truncate max-w-[100px] sm:max-w-[160px] mt-1">
                  {top1.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                  <Flame className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-xs sm:text-base font-black text-[#D4AF37]">{top1.entries}</span>
                  <span className="text-[10px] sm:text-xs text-gray-300">entradas</span>
                </div>
              </div>
            )}

            {/* 3rd Place (Bronze - Smallest avatar, base level) */}
            {top3 ? (
              <div className="flex flex-col items-center text-center translate-y-0 group">
                <div className="relative mb-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-amber-700/60 shadow-[0_0_15px_rgba(180,83,9,0.2)] bg-black/50 transition-transform duration-300 group-hover:scale-105">
                    {top3.avatar ? (
                      <img src={getImageUrl(top3.avatar)} alt={top3.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-base sm:text-xl text-amber-500">
                        {top3.initials}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black text-[10px] sm:text-xs shadow-md border border-white/20">
                    #3
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[90px] sm:max-w-[130px] mt-1">
                  {top3.name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs sm:text-base font-black text-amber-400">{top3.entries}</span>
                  <span className="text-[10px] sm:text-xs text-gray-400">entradas</span>
                </div>
              </div>
            ) : <div />}
          </div>
        </div>
      )}

      {/* Rankings List (#4 onwards) */}
      <div
        className="p-6 sm:p-8 rounded-[2rem] border border-white/10"
        style={{
          background: 'rgba(15, 15, 15, 0.7)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#D4AF37]" />
            Rankings
          </h2>
          <span className="text-xs text-gray-400">
            {leaderboard.length} promotores no clube
          </span>
        </div>

        {others.length > 0 ? (
          <div className="space-y-2.5">
            {others.map((entry) => {
              const isMe = entry.id === user?.id;
              return (
                <div
                  key={entry.id}
                  className={`p-3.5 sm:p-4 rounded-2xl flex items-center gap-3.5 transition-all duration-300 ${
                    isMe
                      ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                      : 'bg-white/[0.03] border border-white/5 hover:border-white/15 hover:bg-white/[0.06]'
                  }`}
                >
                  {/* Rank Position */}
                  <div className="w-8 sm:w-10 text-center flex-shrink-0">
                    <span className={`text-sm sm:text-base font-black ${isMe ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                      #{entry.rank}
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex-shrink-0 bg-black/40 border border-white/10">
                    {entry.avatar ? (
                      <img src={getImageUrl(entry.avatar)} alt={entry.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-sm text-gray-400">
                        {entry.initials}
                      </div>
                    )}
                  </div>

                  {/* Name and Tag */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm sm:text-base truncate ${isMe ? 'text-[#D4AF37]' : 'text-white'}`}>
                        {entry.name}
                      </p>
                      {isMe && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D4AF37] text-black uppercase tracking-wider">
                          Tu
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {entry.entries} entradas registadas
                    </p>
                  </div>

                  {/* Entries Metric Badge */}
                  <div className="text-right flex-shrink-0">
                    <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5">
                      <span className="text-sm sm:text-base font-black text-white">{entry.entries}</span>
                      <span className="text-[10px] sm:text-xs text-gray-400">pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            {leaderboard.length <= 3 ? 'Todos os promotores estão no pódio acima! 🏆' : 'Sem promotores adicionais neste período.'}
          </div>
        )}
      </div>

      {/* Your Position Footer (Fixed/Highlighted) */}
      {myPosition && (
        <div
          className="p-5 sm:p-6 rounded-[2rem] border border-[#D4AF37]/40 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(20, 20, 20, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 shadow-lg"
                style={{
                  background: myPosition.rank === 1
                    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                    : 'rgba(212, 175, 55, 0.2)',
                  color: myPosition.rank === 1 ? '#000000' : '#D4AF37',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                }}
              >
                #{myPosition.rank}
              </div>
              <div>
                <p className="text-white font-bold text-base sm:text-lg">
                  {myPosition.rank === 1
                    ? 'Estás em 1º Lugar! 👑'
                    : myPosition.rank <= 3
                    ? 'Estás no Pódio! 🥈'
                    : 'A Tua Posição Atual'}
                </p>
                <p className="text-xs text-gray-400">
                  {myPosition.rank === 1
                    ? 'Continua o excelente ritmo para manter a liderança'
                    : `Faltam poucas entradas para subires no ranking do clube`}
                </p>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-2xl sm:text-3xl font-black text-[#D4AF37]">{myPosition.entries}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Entradas</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
