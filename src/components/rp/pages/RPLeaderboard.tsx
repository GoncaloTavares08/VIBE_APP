import { Trophy, Medal, Crown, TrendingUp, Users, DollarSign } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  entries: number;
  revenue: number;
  change: number; // Position change from last week
}

const mockLeaderboard: LeaderboardEntry[] = [
  {
    id: '1',
    rank: 1,
    name: 'João Silva',
    avatar: 'J',
    entries: 456,
    revenue: 6540,
    change: 0,
  },
  {
    id: '2',
    rank: 2,
    name: 'Maria Costa',
    avatar: 'M',
    entries: 398,
    revenue: 5720,
    change: 1,
  },
  {
    id: '3',
    rank: 3,
    name: 'Pedro Santos',
    avatar: 'P',
    entries: 367,
    revenue: 5280,
    change: -1,
  },
  {
    id: '4',
    rank: 4,
    name: 'Ana Ribeiro',
    avatar: 'A',
    entries: 342,
    revenue: 4910,
    change: 2,
  },
  {
    id: '5',
    rank: 5,
    name: 'Ricardo Lima',
    avatar: 'R',
    entries: 318,
    revenue: 4570,
    change: 0,
  },
  {
    id: '6',
    rank: 6,
    name: 'Sofia Pereira',
    avatar: 'S',
    entries: 289,
    revenue: 4150,
    change: -2,
  },
  {
    id: '7',
    rank: 7,
    name: 'Miguel Sousa',
    avatar: 'M',
    entries: 267,
    revenue: 3840,
    change: 1,
  },
  {
    id: '8',
    rank: 8,
    name: 'Carolina Dias',
    avatar: 'C',
    entries: 245,
    revenue: 3520,
    change: 0,
  },
];

export function RPLeaderboard() {
  const topThree = mockLeaderboard.slice(0, 3);
  const others = mockLeaderboard.slice(3);

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
                className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
                }}
              >
                <span className="text-3xl text-black font-black">{topThree[1].avatar}</span>
              </div>
              <Medal className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <h3 className="text-xl text-white font-bold mb-2">{topThree[1].name}</h3>
              <div className="text-3xl text-white font-black mb-2">{topThree[1].entries}</div>
              <div className="text-sm text-gray-400">entries</div>
              <div className="text-[#D4AF37] text-lg mt-2">€{topThree[1].revenue.toLocaleString()}</div>
            </div>
          </div>

          {/* 1st Place */}
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
                className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  boxShadow: '0 0 40px rgba(255, 215, 0, 0.5)',
                }}
              >
                <span className="text-4xl text-black font-black">{topThree[0].avatar}</span>
              </div>
              <Crown className="w-16 h-16 mx-auto mb-3 text-[#FFD700]" />
              <h3 className="text-2xl text-white font-black mb-2">{topThree[0].name}</h3>
              <div className="text-4xl text-white font-black mb-2">{topThree[0].entries}</div>
              <div className="text-sm text-gray-400">entries</div>
              <div className="text-[#D4AF37] text-xl mt-2">€{topThree[0].revenue.toLocaleString()}</div>
            </div>
          </div>

          {/* 3rd Place */}
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
                className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)',
                }}
              >
                <span className="text-3xl text-white font-black">{topThree[2].avatar}</span>
              </div>
              <Trophy className="w-12 h-12 mx-auto mb-3 text-orange-700" />
              <h3 className="text-xl text-white font-bold mb-2">{topThree[2].name}</h3>
              <div className="text-3xl text-white font-black mb-2">{topThree[2].entries}</div>
              <div className="text-sm text-gray-400">entries</div>
              <div className="text-[#D4AF37] text-lg mt-2">€{topThree[2].revenue.toLocaleString()}</div>
            </div>
          </div>
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
                    className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: rankStyle.bg,
                      color: rankStyle.textColor,
                    }}
                  >
                    <span className="text-2xl font-black">{entry.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <RankIcon className={`w-5 h-5 ${entry.rank === 1 ? 'text-[#FFD700]' : 'text-gray-400'}`} />
                      <h3 className="text-lg text-white font-bold">{entry.name}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-white">{entry.entries} entries</span>
                      <span className="text-[#D4AF37]">€{entry.revenue.toLocaleString()}</span>
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
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: 'rgba(212, 175, 55, 0.2)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                        }}
                      >
                        <span className="text-[#D4AF37] font-bold">{entry.avatar}</span>
                      </div>
                      <span className="text-white">{entry.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-white">{entry.entries}</td>
                  <td className="py-4 text-[#D4AF37]">€{entry.revenue.toLocaleString()}</td>
                  <td className="py-4">
                    {entry.change > 0 ? (
                      <div className="flex items-center gap-1 text-green-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">+{entry.change}</span>
                      </div>
                    ) : entry.change < 0 ? (
                      <div className="flex items-center gap-1 text-red-400">
                        <TrendingUp className="w-4 h-4 rotate-180" />
                        <span className="text-sm">{entry.change}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
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
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <span className="text-[#D4AF37] font-bold text-lg">{entry.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold mb-1">{entry.name}</h3>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400">{entry.entries} entries</span>
                  <span className="text-[#D4AF37]">€{entry.revenue.toLocaleString()}</span>
                </div>
              </div>
              {entry.change !== 0 && (
                <div
                  className={`text-sm ${entry.change > 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {entry.change > 0 ? `+${entry.change}` : entry.change}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Your Position */}
      <div
        className="p-6 rounded-3xl backdrop-blur-xl"
        style={{
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
        }}
      >
        <h2 className="text-xl text-white mb-4">Your Position</h2>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            }}
          >
            <span className="text-3xl text-black font-black">#1</span>
          </div>
          <div className="flex-1">
            <h3 className="text-white text-lg font-semibold mb-1">You're leading! 🔥</h3>
            <p className="text-sm text-gray-400">Keep up the amazing work to stay #1</p>
          </div>
          <div className="text-right">
            <div className="text-2xl text-white font-bold">456</div>
            <div className="text-sm text-gray-400">entries</div>
          </div>
        </div>
      </div>
    </div>
  );
}
