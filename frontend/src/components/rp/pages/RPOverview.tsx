import { TrendingUp, Users, DollarSign, MousePointerClick, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const performanceData = [
  { date: 'Mon', entries: 12 },
  { date: 'Tue', entries: 19 },
  { date: 'Wed', entries: 15 },
  { date: 'Thu', entries: 25 },
  { date: 'Fri', entries: 42 },
  { date: 'Sat', entries: 58 },
  { date: 'Sun', entries: 35 },
];

const weeklyData = [
  { week: 'Week 1', entries: 85, revenue: 1200 },
  { week: 'Week 2', entries: 102, revenue: 1450 },
  { week: 'Week 3', entries: 118, revenue: 1680 },
  { week: 'Week 4', entries: 156, revenue: 2240 },
];

export function RPOverview() {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl lg:text-4xl text-white mb-2">{greeting}, João! 👋</h1>
        <p className="text-gray-400">Aqui está a tua performance hoje</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks */}
        <div
          className="p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <MousePointerClick className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUp className="w-4 h-4" />
              <span>12%</span>
            </div>
          </div>
          <div className="text-3xl text-white mb-1">2,847</div>
          <div className="text-sm text-gray-400">Link Clicks</div>
        </div>

        {/* Guestlist Entries */}
        <div
          className="p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <Users className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUp className="w-4 h-4" />
              <span>24%</span>
            </div>
          </div>
          <div className="text-3xl text-white mb-1">156</div>
          <div className="text-sm text-gray-400">Guestlist Entries</div>
        </div>

        {/* Revenue */}
        <div
          className="p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              }}
            >
              <DollarSign className="w-6 h-6 text-black" />
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUp className="w-4 h-4" />
              <span>18%</span>
            </div>
          </div>
          <div className="text-3xl text-white mb-1">€2,240</div>
          <div className="text-sm text-gray-400">Total Revenue</div>
        </div>

        {/* Conversion Rate */}
        <div
          className="p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <ArrowDown className="w-4 h-4" />
              <span>3%</span>
            </div>
          </div>
          <div className="text-3xl text-white mb-1">5.48%</div>
          <div className="text-sm text-gray-400">Conversion Rate</div>
        </div>
      </div>

      {/* Performance Graph */}
      <div
        className="p-6 rounded-3xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-xl text-white mb-1">Entry Trends</h2>
            <p className="text-sm text-gray-400">Últimos 7 dias de performance</p>
          </div>
          <div className="flex gap-2 mt-4 lg:mt-0">
            <button
              className="px-4 py-2 rounded-xl text-sm transition-colors"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                color: '#D4AF37',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              7 Days
            </button>
            <button
              className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:bg-white/5 transition-colors"
              style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              30 Days
            </button>
            <button
              className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:bg-white/5 transition-colors"
              style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              90 Days
            </button>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis
                dataKey="date"
                stroke="#888888"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#888888"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10, 10, 10, 0.95)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '12px',
                  color: '#ffffff',
                }}
              />
              <Area
                type="monotone"
                dataKey="entries"
                stroke="#D4AF37"
                strokeWidth={2}
                fill="url(#goldGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <div
          className="p-6 rounded-3xl backdrop-blur-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2 className="text-xl text-white mb-6">Monthly Progress</h2>
          <div className="space-y-4">
            {weeklyData.map((week, index) => (
              <div key={week.week}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{week.week}</span>
                  <span className="text-sm text-white">{week.entries} entries</span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
                      width: `${(week.entries / 200) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Achievements */}
        <div
          className="p-6 rounded-3xl backdrop-blur-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2 className="text-xl text-white mb-6">Recent Achievements</h2>
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl flex items-center gap-4"
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                }}
              >
                <span className="text-2xl">🏆</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold mb-1">Top Performer</h3>
                <p className="text-sm text-gray-400">Maior número de entries esta semana</p>
              </div>
            </div>

            <div
              className="p-4 rounded-2xl flex items-center gap-4"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <span className="text-2xl">🔥</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold mb-1">Hot Streak</h3>
                <p className="text-sm text-gray-400">5 dias consecutivos com metas atingidas</p>
              </div>
            </div>

            <div
              className="p-4 rounded-2xl flex items-center gap-4"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <span className="text-2xl">⭐</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold mb-1">VIP Status</h3>
                <p className="text-sm text-gray-400">Alcançaste o tier VIP Promoter</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
