import { TrendingUp, Users, DollarSign, MousePointerClick, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from '../../ui/GlassCard';

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
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-black mb-2" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
        }}>
          {greeting}, João! 👋
        </h1>
        <p className="text-gray-400 font-medium">Aqui está a tua performance hoje</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks */}
        <GlassCard className="p-6" interactive>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <MousePointerClick className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm font-bold bg-green-400/10 px-2 py-1 rounded-full">
              <ArrowUp className="w-3 h-3" />
              <span>12%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">2,847</div>
          <div className="text-sm text-gray-400 font-medium">Cliques no Link</div>
        </GlassCard>

        {/* Guestlist Entries */}
        <GlassCard className="p-6" interactive>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <Users className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm font-bold bg-green-400/10 px-2 py-1 rounded-full">
              <ArrowUp className="w-3 h-3" />
              <span>24%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">156</div>
          <div className="text-sm text-gray-400 font-medium">Entradas Guestlist</div>
        </GlassCard>

        {/* Revenue */}
        <GlassCard variant="gold" className="p-6" interactive>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' }}>
              <DollarSign className="w-6 h-6 text-black" />
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm font-bold bg-green-400/10 px-2 py-1 rounded-full">
              <ArrowUp className="w-3 h-3" />
              <span>18%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">€2,240</div>
          <div className="text-sm text-[#D4AF37] opacity-80 font-medium">Receita Total</div>
        </GlassCard>

        {/* Conversion Rate */}
        <GlassCard className="p-6" interactive>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="flex items-center gap-1 text-red-400 text-sm font-bold bg-red-400/10 px-2 py-1 rounded-full">
              <ArrowDown className="w-3 h-3" />
              <span>3%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">5.48%</div>
          <div className="text-sm text-gray-400 font-medium">Taxa de Conversão</div>
        </GlassCard>
      </div>

      {/* Performance Graph */}
      <GlassCard className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Tendência de Entradas</h2>
            <p className="text-sm text-gray-400">Últimos 7 dias de performance</p>
          </div>
          <div className="flex gap-2 mt-4 lg:mt-0 p-1 bg-white/5 rounded-[1.5rem] border border-white/10 w-fit">
            <button className="px-5 py-2 rounded-2xl text-sm font-bold transition-all shadow-lg" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)', color: '#000' }}>
              7 Dias
            </button>
            <button className="px-5 py-2 rounded-2xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              30 Dias
            </button>
            <button className="px-5 py-2 rounded-2xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              90 Dias
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
              <XAxis dataKey="date" stroke="#666" tickLine={false} axisLine={false} dy={10} style={{ fontSize: '12px', fontWeight: 500 }} />
              <YAxis stroke="#666" tickLine={false} axisLine={false} dx={-10} style={{ fontSize: '12px', fontWeight: 500 }} />
              <Tooltip
                contentStyle={{ background: 'rgba(10, 10, 10, 0.95)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '16px', color: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
                cursor={{ stroke: 'rgba(212, 175, 55, 0.2)', strokeWidth: 2, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="entries" stroke="#D4AF37" strokeWidth={3} fill="url(#goldGradient)" activeDot={{ r: 6, fill: '#D4AF37', stroke: '#000', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <GlassCard className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6">Progresso Mensal</h2>
          <div className="space-y-5">
            {weeklyData.map((week, index) => (
              <div key={week.week} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">{week.week}</span>
                  <span className="text-sm font-bold text-white">{week.entries} entradas</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden bg-white/5 border border-white/5">
                  <div className="h-full rounded-full transition-all duration-1000 relative" style={{ width: `${(week.entries / 200) * 100}%`, background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)' }}>
                     <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/30 blur-[4px]"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Achievements */}
        <GlassCard className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6">Conquistas Recentes</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-3xl flex items-center gap-4 transition-all hover:bg-white/5 border border-transparent hover:border-white/10 group cursor-pointer" style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' }}>
                <span className="text-2xl">🏆</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold mb-1">Top Performer</h3>
                <p className="text-sm text-gray-400">Maior número de entries esta semana</p>
              </div>
            </div>

            <div className="p-4 rounded-3xl flex items-center gap-4 transition-all hover:bg-white/5 border border-white/5 group cursor-pointer bg-black/20">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                <span className="text-2xl">🔥</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold mb-1">Hot Streak</h3>
                <p className="text-sm text-gray-400">5 dias consecutivos com metas atingidas</p>
              </div>
            </div>

            <div className="p-4 rounded-3xl flex items-center gap-4 transition-all hover:bg-white/5 border border-white/5 group cursor-pointer bg-black/20">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                <span className="text-2xl">⭐</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold mb-1">VIP Status</h3>
                <p className="text-sm text-gray-400">Alcançaste o tier VIP Promoter</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
