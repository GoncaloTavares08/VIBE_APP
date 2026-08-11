import { Trophy, Medal, Crown, TrendingUp, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../services/api';

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
        };
      case 2:
        return {
          bg: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
          textColor: '#000000',
          icon: Medal,
        };
      case 3:
        return {
          bg: 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)',
          textColor: '#ffffff',
          icon: Trophy,
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.1)',
          textColor: '#ffffff',
          icon: Trophy,
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
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl text-white mb-2">Global Leaderboard 🏆</h1>
        <p className="text-gray-400">Compete com os melhores RPs do clube</p>
      </div>

      {/* Podium - Top 3 */}
      <div
        className="p-6 lg:p-8 rounded-3xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h2 className="text-xl text-white mb-6">Hall of Fame</h2>

        {/* Desktop Podium Layout */}
        <div className="hidden lg:flex items-end justify-center gap-6 mb-8">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="flex-1 max-w-xs">
              <div
                className="p-6 rounded-3xl mb-4 text-center"
                style={{
                  background: 'rgba(192, 192, 192, 0.2)',
                  border: '2px solid rgba(192, 192, 192, 0.4)',
                  height: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div
                  className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
                  }}
                >
                  {topThree[1].avatar ? (
                    <img src={topThree[1].avatar} alt={topThree[1].name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-black font-black">{topThree[1].initials}</span>
                  )}
                </div>
                <Medal className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-xl text-white font-bold mb-2">{topThree[1].name}</h3>
                <div className="text-3xl text-white font-black mb-2">{topThree[1].entries}</div>
                <div className="text-sm text-gray-400">entries</div>
                <div className="text-[#D4AF37] text-lg mt-2">€{topThree[1].revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          )}
          {/* End 2nd Place */}

          {/* 1st Place */}
          {topThree[0] && (
            <div className="flex-1 max-w-xs">
            <div
              className="p-6 rounded-3xl mb-4 text-center relative"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                border: '2px solid rgba(212, 175, 55, 0.5)',
                height: '340px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div
                  className="px-4 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: '#000000',
                  }}
                >
                  CHAMPION
                </div>
              </div>
              <div
                className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-4 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  boxShadow: '0 0 40px rgba(255, 215, 0, 0.5)',
                }}
              >
                {topThree[0].avatar ? (
                  <img src={topThree[0].avatar} alt={topThree[0].name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-black font-black">{topThree[0].initials}</span>
                )}
              </div>
              <Crown className="w-16 h-16 mx-auto mb-3 text-[#FFD700]" />
              <h3 className="text-2xl text-white font-black mb-2">{topThree[0].name}</h3>
              <div className="text-4xl text-white font-black mb-2">{topThree[0].entries}</div>
              <div className="text-sm text-gray-400">entries</div>
              <div className="text-[#D4AF37] text-xl mt-2">€{topThree[0].revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          )}
          {/* End 1st Place */}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="flex-1 max-w-xs">
            <div
              className="p-6 rounded-3xl mb-4 text-center"
              style={{
                background: 'rgba(205, 127, 50, 0.2)',
                border: '2px solid rgba(205, 127, 50, 0.4)',
                height: '260px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 overflow-hidden"
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
              <Trophy className="w-12 h-12 mx-auto mb-3 text-orange-700" />
              <h3 className="text-xl text-white font-bold mb-2">{topThree[2].name}</h3>
              <div className="text-3xl text-white font-black mb-2">{topThree[2].entries}</div>
              <div className="text-sm text-gray-400">entries</div>
              <div className="text-[#D4AF37] text-lg mt-2">€{topThree[2].revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          )}
        </div>

        {/* Mobile Podium Layout */}
        <div className="lg:hidden space-y-4 mb-8">
          {topThree.map((entry) => {
            const rankStyle = getRankColor(entry.rank);
            const RankIcon = rankStyle.icon;
            return (
              <div
                key={entry.id}
                className="p-5 rounded-2xl"
                style={{
                  background: entry.rank === 1 ? 'rgba(212, 175, 55, 0.2)' : `${rankStyle.bg.replace('linear-gradient', 'rgba').replace(/\d+%/g, '0.1')}`,
                  border: entry.rank === 1 ? '2px solid rgba(212, 175, 55, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
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
                      <RankIcon className={`w-5 h-5 ${entry.rank === 1 ? 'text-[#FFD700]' : 'text-gray-400'}`} />
                      <h3 className="text-lg text-white font-bold">{entry.name}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-white">{entry.entries} entries</span>
                      <span className="text-[#D4AF37]">€{entry.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: rankStyle.bg,
                      color: rankStyle.textColor,
                    }}
                  >
                    <span className="text-xl font-black">#{entry.rank}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rest of Leaderboard */}
      <div
        className="p-6 rounded-3xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h2 className="text-xl text-white mb-6">Rankings</h2>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-sm text-gray-400 pb-4">Rank</th>
                <th className="text-left text-sm text-gray-400 pb-4">Promoter</th>
                <th className="text-left text-sm text-gray-400 pb-4">Entries</th>
                <th className="text-left text-sm text-gray-400 pb-4">Revenue</th>
                <th className="text-left text-sm text-gray-400 pb-4">Change</th>
              </tr>
            </thead>
            <tbody>
              {others.map((entry) => (
                <tr key={entry.id} className="border-b border-white/5">
                  <td className="py-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <span className="text-white font-bold">#{entry.rank}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                        style={{
                          background: 'rgba(212, 175, 55, 0.2)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                        }}
                      >
                        {entry.avatar ? (
                          <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#D4AF37] font-bold">{entry.initials}</span>
                        )}
                      </div>
                      <span className="text-white">{entry.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-white">{entry.entries}</td>
                  <td className="py-4 text-[#D4AF37]">€{entry.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-4">
                    {entry.trend === 'up' ? (
                      <div className="flex items-center gap-1 text-green-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">Subindo</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-400">
                        <TrendingUp className="w-4 h-4 rotate-180" />
                        <span className="text-sm">Descendo</span>
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
              className="p-4 rounded-2xl flex items-center gap-3"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <span className="text-white font-black">#{entry.rank}</span>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{
                  background: 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                {entry.avatar ? (
                  <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#D4AF37] font-bold text-lg">{entry.initials}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold mb-1">{entry.name}</h3>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400">{entry.entries} entries</span>
                  <span className="text-[#D4AF37]">€{entry.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              {entry.trend === 'up' ? (
                <div className="text-sm text-green-400 flex items-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              ) : (
                <div className="text-sm text-red-400 flex items-center">
                  <TrendingUp className="w-4 h-4 rotate-180" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Your Position */}
      {myPosition && (
        <div
          className="p-6 rounded-3xl backdrop-blur-xl"
          style={{
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          <h2 className="text-xl text-white mb-4">A Tua Posição</h2>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{
                background: myPosition.rank === 1 ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'rgba(255,255,255,0.1)',
              }}
            >
              <span className={`text-3xl font-black ${myPosition.rank === 1 ? 'text-black' : 'text-white'}`}>
                #{myPosition.rank}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-white text-lg font-semibold mb-1">
                {myPosition.rank === 1 ? "Estás a liderar! 🔥" : "Continua o bom trabalho! 💪"}
              </h3>
              <p className="text-sm text-gray-400">
                {myPosition.rank === 1 ? "Mantém o ritmo para continuares em 1º" : `Faltam apenas algumas entradas para subires de rank!`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl text-white font-bold">{myPosition.entries}</div>
              <div className="text-sm text-gray-400">entries</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
