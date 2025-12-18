import { TrendingUp, Flame, Snowflake, Euro, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Mock data
const chartData = [
  { time: '22:00', hoje: 12, ontem: 8 },
  { time: '23:00', hoje: 35, ontem: 28 },
  { time: '00:00', hoje: 78, ontem: 65 },
  { time: '01:00', hoje: 142, ontem: 125 },
  { time: '02:00', hoje: 189, ontem: 168 },
  { time: '03:00', hoje: 215, ontem: 192 },
  { time: '04:00', hoje: 198, ontem: 175 },
];

const recentActivity = [
  { id: 1, name: 'Tiago Silva', rp: 'Joana Costa', time: '2 min atrás', status: 'active' },
  { id: 2, name: 'Maria Santos', rp: 'Pedro Alves', time: '5 min atrás', status: 'active' },
  { id: 3, name: 'João Ferreira', rp: 'Joana Costa', time: '8 min atrás', status: 'active' },
  { id: 4, name: 'Ana Rodrigues', rp: 'Miguel Torres', time: '12 min atrás', status: 'active' },
  { id: 5, name: 'Carlos Mendes', rp: 'Joana Costa', time: '15 min atrás', status: 'active' },
  { id: 6, name: 'Sofia Lima', rp: 'Pedro Alves', time: '18 min atrás', status: 'active' },
];

export function GeneralDashboard() {
  const occupancy = 68;
  const flow = 'fire'; // 'fire' or 'slow'

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Entries */}
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
            <p className="text-sm text-gray-400 font-medium">Entradas Totais</p>
          </div>
          <p className="text-4xl font-black text-white mb-2">215</p>
          <p className="text-sm text-green-400">+24% vs ontem</p>
        </div>

        {/* Current Flow */}
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
                background: flow === 'fire' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                border: flow === 'fire' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              {flow === 'fire' ? (
                <Flame className="w-6 h-6 text-red-500" />
              ) : (
                <Snowflake className="w-6 h-6 text-blue-500" />
              )}
            </div>
            <p className="text-sm text-gray-400 font-medium">Fluxo Atual</p>
          </div>
          <div className="flex items-center gap-2">
            {flow === 'fire' ? (
              <>
                <Flame className="w-6 h-6 text-red-500" />
                <span className="text-2xl font-black text-white">Ao Rubro</span>
              </>
            ) : (
              <>
                <Snowflake className="w-6 h-6 text-blue-500" />
                <span className="text-2xl font-black text-white">Calmo</span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-2">12 entradas/10min</p>
        </div>

        {/* Occupancy */}
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
              <Activity className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Lotação</p>
          </div>
          <div className="relative w-24 h-24 mx-auto mb-2">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#D4AF37"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - occupancy / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-black text-white">{occupancy}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center">215 / 315 capacidade</p>
        </div>

        {/* Live Billing */}
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
            <p className="text-sm text-gray-400 font-medium">Faturação ao Vivo</p>
          </div>
          <p className="text-4xl font-black text-white mb-2">€3,240</p>
          <p className="text-sm text-green-400">€890 na última hora</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div
          className="lg:col-span-2 p-6 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <h2 className="text-xl font-black text-white mb-6">Entradas ao longo do tempo</h2>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tonightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lastNightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#888888" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#888888" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="time" stroke="#888888" />
                <YAxis stroke="#888888" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10, 10, 10, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#ffffff'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="hoje"
                  stroke="#D4AF37"
                  strokeWidth={3}
                  fill="url(#tonightGradient)"
                  name="Hoje"
                />
                <Area
                  type="monotone"
                  dataKey="ontem"
                  stroke="#888888"
                  strokeWidth={2}
                  fill="url(#lastNightGradient)"
                  name="Ontem"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div
          className="p-6 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <h2 className="text-xl font-black text-white mb-6">Atividade Recente</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000000',
                  }}
                >
                  {activity.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{activity.name}</p>
                  <p className="text-xs text-gray-400">entrou via {activity.rp}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                  style={{
                    background: activity.status === 'active' ? '#22c55e' : '#6b7280',
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
