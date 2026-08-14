import { Trophy, Medal, Crown, TrendingUp, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../services/api';
import { GlassCard } from '../../ui/GlassCard';

interface LeaderboardEntry {
  id: number;
  rank: number;
  name: string;
  avatar: string | null;
  initials: string;
  entries: number;
  revenue: number;
  trend: 'up' | 'down'; // Position change from last week
}

export function RPLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await apiFetch('/rp/leaderboard', { method: 'GET' });
        if (response.status === 'success') {
          setLeaderboard(response.data);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const topThree = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3);
  const myPosition = leaderboard.find(entry => entry.id === user?.id);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          textColor: '#000000',
          icon: Crown,
          shadow: '0 0 30px rgba(255, 215, 0, 0.4)'
        };
      case 2:
        return {
          bg: 'linear-gradient(135deg, #E0E0E0 0%, #B0B0B0 100%)',
          textColor: '#000000',
          icon: Medal,
          shadow: '0 0 20px rgba(192, 192, 192, 0.3)'
        };
      case 3:
        return {
          bg: 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)',
          textColor: '#ffffff',
          icon: Trophy,
          shadow: '0 0 20px rgba(205, 127, 50, 0.3)'
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.1)',
          textColor: '#ffffff',
          icon: Trophy,
          shadow: 'none'
        };
    }
  };

  if (loading) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-black text-white mb-2" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
        }}>Global Leaderboard 🏆</h1>
        <p className="text-gray-400 font-medium">Compete com os melhores RPs do clube</p>
      </div>

      {/* Podium - Top 3 */}
      <GlassCard className="p-6 md:p-8 pt-8">
        <h2 className="text-xl font-bold text-white mb-10 text-center">Hall of Fame</h2>

        {/* Desktop Podium Layout */}
        <div className="hidden lg:flex items-end justify-center gap-6 mb-8">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="flex-1 max-w-xs relative group cursor-pointer transition-all duration-300 hover:-translate-y-4">
              <div
                className="p-6 rounded-[2rem] mb-4 text-center relative z-10 transition-shadow duration-300"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '2px solid rgba(192, 192, 192, 0.3)',
                  height: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                 <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-[rgba(192,192,192,0.1)] to-transparent pointer-events-none" />
                
                <div
                  className="w-20 h-20 mx-auto rounded-[1.2rem] flex items-center justify-center mb-5 overflow-hidden shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg, #E0E0E0 0%, #B0B0B0 100%)',
                  }}
                >
                  {topThree[1].avatar ? (
                    <img src={topThree[1].avatar} alt={topThree[1].name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-black font-black">{topThree[1].initials}</span>
                  )}
                </div>
                <Medal className="w-12 h-12 mx-auto mb-3 text-gray-300 drop-shadow-md" />
                <h3 className="text-xl text-white font-bold mb-2">{topThree[1].name}</h3>
                <div className="text-3xl text-white font-black mb-1">{topThree[1].entries}</div>
                <div className="text-sm font-medium text-gray-400">entradas</div>
              </div>
               {/* Reflection/Shadow under card */}
               <div className="absolute bottom-0 left-10 right-10 h-4 bg-gray-400/20 blur-xl rounded-full"></div>
            </div>
          )}
          {/* End 2nd Place */}

          {/* 1st Place */}
          {topThree[0] && (
            <div className="flex-1 max-w-xs relative z-20 group cursor-pointer transition-all duration-300 hover:-translate-y-4">
            <div
              className="p-8 rounded-[2rem] mb-4 text-center relative overflow-visible"
              style={{
                background: 'rgba(212, 175, 55, 0.05)',
                border: '2px solid rgba(212, 175, 55, 0.5)',
                height: '360px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: '0 0 40px rgba(212, 175, 55, 0.1)',
              }}
            >
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-[rgba(212,175,55,0.15)] to-transparent pointer-events-none" />

              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-30">
                <div
                  className="px-6 py-1.5 rounded-full text-xs font-black tracking-widest shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: '#000000',
                  }}
                >
                  CHAMPION
                </div>
              </div>
              <div
                className="w-28 h-28 mx-auto rounded-[1.5rem] flex items-center justify-center mb-6 overflow-hidden relative z-20"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)',
                }}
              >
                {topThree[0].avatar ? (
                  <img src={topThree[0].avatar} alt={topThree[0].name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-black font-black">{topThree[0].initials}</span>
                )}
              </div>
              <Crown className="w-16 h-16 mx-auto mb-3 text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
              <h3 className="text-2xl text-white font-black mb-2">{topThree[0].name}</h3>
              <div className="text-5xl text-white font-black mb-1">{topThree[0].entries}</div>
              <div className="text-sm font-medium text-[#D4AF37] opacity-80 mb-3">entradas</div>
            </div>
             {/* Glowing shadow under 1st place */}
             <div className="absolute -bottom-2 left-8 right-8 h-8 bg-[#D4AF37]/30 blur-2xl rounded-full"></div>
          </div>
          )}
          {/* End 1st Place */}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="flex-1 max-w-xs relative group cursor-pointer transition-all duration-300 hover:-translate-y-4">
            <div
              className="p-6 rounded-[2rem] mb-4 text-center relative z-10"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '2px solid rgba(205, 127, 50, 0.4)',
                height: '280px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-[rgba(205,127,50,0.1)] to-transparent pointer-events-none" />

              <div
                className="w-20 h-20 mx-auto rounded-[1.2rem] flex items-center justify-center mb-5 overflow-hidden shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)',
                }}
              >
                {topThree[2].avatar ? (
                  <img src={topThree[2].avatar} alt={topThree[2].name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-white font-black">{topThree[2].initials}</span>
                )}
              </div>
              <Trophy className="w-12 h-12 mx-auto mb-3 text-orange-600 drop-shadow-md" />
              <h3 className="text-xl text-white font-bold mb-2">{topThree[2].name}</h3>
              <div className="text-3xl text-white font-black mb-1">{topThree[2].entries}</div>
              <div className="text-sm font-medium text-gray-400">entradas</div>
            </div>
             {/* Reflection/Shadow under card */}
             <div className="absolute bottom-0 left-10 right-10 h-4 bg-orange-700/20 blur-xl rounded-full"></div>
          </div>
          )}
        </div>

        {/* Mobile Podium Layout */}
        <div className="lg:hidden space-y-4 mb-8 pt-4">
          {topThree.map((entry) => {
            const rankStyle = getRankColor(entry.rank);
            const RankIcon = rankStyle.icon;
            return (
              <div
                key={entry.id}
                className="p-5 rounded-[1.5rem] relative overflow-hidden"
                style={{
                  background: entry.rank === 1 ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: entry.rank === 1 ? '2px solid rgba(212, 175, 55, 0.5)' : `1px solid ${rankStyle.bg.replace('linear-gradient', 'rgba').replace(/\d+%/g, '0.3')}`,
                  boxShadow: rankStyle.shadow
                }}
              >
                 {entry.rank === 1 && (
                     <div className="absolute top-0 right-0 p-2">
                        <Crown className="w-6 h-6 text-[#FFD700] opacity-50" />
                     </div>
                 )}
                <div className="flex items-center gap-4 relative z-10">
                  <div
                    className="w-16 h-16 rounded-[1.2rem] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg"
                    style={{
                      background: rankStyle.bg,
                      color: rankStyle.textColor,
                    }}
                  >
                    {entry.avatar ? (
                      <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black">{entry.initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg text-white font-bold">{entry.name}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <span className="text-white">{entry.entries} entradas</span>
                    </div>
                  </div>
                  <div
                    className="w-12 h-12 rounded-[1rem] flex items-center justify-center shadow-inner"
                    style={{
                      background: rankStyle.bg,
                      color: rankStyle.textColor,
                    }}
                  >
                    <span className="text-2xl font-black">#{entry.rank}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Rest of Leaderboard */}
      <GlassCard className="p-6 md:p-8">
        <h2 className="text-xl font-bold text-white mb-6">Rankings</h2>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Rank</th>
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Promoter</th>
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Entradas</th>
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Receita (Estimada)</th>
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Variação</th>
              </tr>
            </thead>
            <tbody>
              {others.map((entry) => (
                <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="py-4 px-4">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:bg-[#D4AF37]/20 group-hover:border-[#D4AF37]/50 transition-colors">
                      <span className="text-white font-bold group-hover:text-[#D4AF37]">#{entry.rank}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden bg-black/40 border border-white/10">
                        {entry.avatar ? (
                          <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-400 font-bold">{entry.initials}</span>
                        )}
                      </div>
                      <span className="text-white font-bold">{entry.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white font-bold">{entry.entries}</td>
                  <td className="py-4 px-4 text-[#D4AF37] font-medium">€{entry.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-4 px-4">
                    {entry.trend === 'up' ? (
                      <div className="flex items-center gap-1.5 text-green-400 bg-green-400/10 px-2 py-1 rounded-full w-fit">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Subiu</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-400 bg-red-400/10 px-2 py-1 rounded-full w-fit">
                        <TrendingUp className="w-4 h-4 rotate-180" />
                        <span className="text-xs font-bold uppercase tracking-wider">Desceu</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {others.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-[1.5rem] flex items-center gap-3 transition-all hover:bg-white/5"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10">
                <span className="text-white font-black">#{entry.rank}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-black/40 border border-white/10">
                {entry.avatar ? (
                  <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 font-bold text-lg">{entry.initials}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold mb-1">{entry.name}</h3>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <span className="text-gray-400">{entry.entries} entradas</span>
                </div>
              </div>
              {entry.trend === 'up' ? (
                <div className="text-sm text-green-400 flex items-center bg-green-400/10 p-1.5 rounded-full">
                  <TrendingUp className="w-4 h-4" />
                </div>
              ) : (
                <div className="text-sm text-red-400 flex items-center bg-red-400/10 p-1.5 rounded-full">
                  <TrendingUp className="w-4 h-4 rotate-180" />
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Your Position */}
      {myPosition && (
        <GlassCard variant="glow" className="p-6 md:p-8" interactive>
          <h2 className="text-xl font-bold text-white mb-6">A Tua Posição</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
            <div
              className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg"
              style={{
                background: myPosition.rank === 1 ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'rgba(212,175,55,0.2)',
                border: myPosition.rank === 1 ? 'none' : '1px solid rgba(212,175,55,0.4)',
              }}
            >
              <span className={`text-2xl font-black ${myPosition.rank === 1 ? 'text-black' : 'text-[#D4AF37]'}`}>
                #{myPosition.rank}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-white text-lg font-bold mb-1">
                {myPosition.rank === 1 ? "Estás a liderar! 🔥" : "Continua o bom trabalho! 💪"}
              </h3>
              <p className="text-sm text-gray-400 font-medium">
                {myPosition.rank === 1 ? "Mantém o ritmo para continuares em 1º" : `Faltam apenas algumas entradas para subires de rank!`}
              </p>
            </div>
            <div className="sm:text-right bg-white/5 p-4 rounded-2xl border border-white/10 sm:bg-transparent sm:p-0 sm:border-none">
              <div className="text-3xl text-white font-black mb-1">{myPosition.entries}</div>
              <div className="text-sm font-medium text-[#D4AF37] opacity-80 uppercase tracking-widest">Entradas</div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
