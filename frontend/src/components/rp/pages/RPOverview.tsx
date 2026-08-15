import { useState, useEffect } from 'react';
import { TrendingUp, Users, MousePointerClick, ArrowUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Skeleton from '../../ui/Skeleton';
import { GlassCard } from '../../ui/GlassCard';
import { apiFetch } from '../../../services/api';

interface OverviewData {
  name: string;
  monthName?: string;
  stats: {
    clicks: number;
    guestlistEntries: number;
    thisMonthEntries: number;
    checkedInEntries: number;
    revenue: number;
    conversionRate: number;
  };
  performanceGraphs: {
    [key: string]: Array<{
      date: string;
      fullDate: string;
      entries: number;
    }>;
  };
  weeklyProgress: Array<{
    weekNumber: number;
    week: string;
    dateRange: string;
    entries: number;
    isCurrent: boolean;
    isPast: boolean;
  }>;
}

export function RPOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<'7' | '30' | '90'>('7');

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const firstName = (data?.name || user?.name || 'Promotor').split(' ')[0];

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await apiFetch('/rp/overview', { method: 'GET' });
        if (response.status === 'success' && response.data) {
          setData(response.data);
        }
      } catch (err) {
        console.error('Error fetching RP overview data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const chartData = data?.performanceGraphs?.[selectedRange] || [];
  const maxWeeklyEntries = Math.max(...(data?.weeklyProgress?.map(w => w.entries) || [1]), 50);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 rounded-2xl mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-36 rounded-[2rem]" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-[2rem]" />
        <Skeleton className="h-80 rounded-[2rem]" />
      </div>
    );
  }

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
          {greeting}, {firstName}! 👋
        </h1>
        <p className="text-gray-400 font-medium">Aqui está a tua performance em tempo real</p>
      </div>

      {/* Quick Stats (3 Real Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Total Clicks */}
        <GlassCard className="p-6" interactive>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <MousePointerClick className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-400/10 px-2.5 py-1 rounded-full">
              <ArrowUp className="w-3 h-3" />
              <span>Link Ativo</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {data?.stats?.clicks?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-400 font-medium">Cliques no Link</div>
        </GlassCard>

        {/* Guestlist Entries */}
        <GlassCard className="p-6" interactive>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <Users className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="flex items-center gap-1 text-[#D4AF37] text-xs font-bold bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/20">
              <span>{data?.stats?.checkedInEntries || 0} confirmados</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {data?.stats?.guestlistEntries?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-400 font-medium">Entradas Guestlist</div>
        </GlassCard>

        {/* Conversion Rate */}
        <GlassCard className="p-6" interactive>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-400/10 px-2.5 py-1 rounded-full">
              <span>Cliques → Entradas</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {data?.stats?.conversionRate || 0}%
          </div>
          <div className="text-sm text-gray-400 font-medium">Taxa de Conversão</div>
        </GlassCard>
      </div>

      {/* Performance Graph */}
      <GlassCard className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Tendência de Entradas</h2>
            <p className="text-sm text-gray-400">Evolução do número de convidados ao longo do tempo</p>
          </div>
          <div className="flex gap-2 mt-4 lg:mt-0 p-1 bg-white/5 rounded-[1.5rem] border border-white/10 w-fit">
            <button 
              onClick={() => setSelectedRange('7')}
              className={`px-5 py-2 rounded-2xl text-sm font-bold transition-all ${
                selectedRange === '7'
                  ? 'shadow-lg text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              style={{
                background: selectedRange === '7' ? 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)' : 'transparent'
              }}
            >
              7 Dias
            </button>
            <button 
              onClick={() => setSelectedRange('30')}
              className={`px-5 py-2 rounded-2xl text-sm font-bold transition-all ${
                selectedRange === '30'
                  ? 'shadow-lg text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              style={{
                background: selectedRange === '30' ? 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)' : 'transparent'
              }}
            >
              30 Dias
            </button>
            <button 
              onClick={() => setSelectedRange('90')}
              className={`px-5 py-2 rounded-2xl text-sm font-bold transition-all ${
                selectedRange === '90'
                  ? 'shadow-lg text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              style={{
                background: selectedRange === '90' ? 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)' : 'transparent'
              }}
            >
              90 Dias
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
              <XAxis dataKey="date" stroke="#666" tickLine={false} axisLine={false} dy={10} style={{ fontSize: '12px', fontWeight: 500 }} />
              <YAxis stroke="#666" tickLine={false} axisLine={false} dx={-10} style={{ fontSize: '12px', fontWeight: 500 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(10, 10, 10, 0.95)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '16px', color: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
                cursor={{ stroke: 'rgba(212, 175, 55, 0.2)', strokeWidth: 2, strokeDasharray: '4 4' }}
                formatter={(value: any) => [`${value} entradas`, 'Convidados']}
              />
              <Area type="monotone" dataKey="entries" stroke="#D4AF37" strokeWidth={3} fill="url(#goldGradient)" activeDot={{ r: 6, fill: '#D4AF37', stroke: '#000', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Monthly Progress */}
      <GlassCard className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-0.5">Progresso Mensal</h2>
            <p className="text-xs text-gray-400 font-medium">{data?.monthName || 'Mês Atual'}</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold">
            {data?.stats?.thisMonthEntries || 0} Entradas este mês
          </div>
        </div>

        <div className="space-y-5">
          {data?.weeklyProgress && data.weeklyProgress.length > 0 ? (
            data.weeklyProgress.map((week) => {
              const percent = Math.min(Math.round((week.entries / maxWeeklyEntries) * 100), 100);
              return (
                <div key={week.week} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors">{week.week}</span>
                      <span className="text-xs text-gray-400 font-medium">({week.dateRange})</span>
                      {week.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                          Atual
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-white">{week.entries} {week.entries === 1 ? 'entrada' : 'entradas'}</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden bg-white/5 border border-white/5">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 relative" 
                      style={{ 
                        width: `${Math.max(percent, week.entries > 0 ? 8 : 2)}%`, 
                        background: week.isCurrent 
                          ? 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)' 
                          : week.entries > 0 
                          ? 'linear-gradient(90deg, rgba(212,175,55,0.7) 0%, rgba(255,215,0,0.7) 100%)'
                          : 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                       {week.entries > 0 && <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/30 blur-[4px]"></div>}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">Sem dados este mês</div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
