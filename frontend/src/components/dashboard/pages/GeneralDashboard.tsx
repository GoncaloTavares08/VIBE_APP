import { useState, useEffect, useRef, useMemo } from 'react';
import { TrendingUp, Flame, Snowflake, Euro, Activity, Zap, Clock, Users, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiFetch } from '../../../services/api';

interface GeneralDashboardProps {
  initialEventId?: number | null;
  onSelectEvent?: (eventId: number | null) => void;
}

export function GeneralDashboard({ initialEventId, onSelectEvent }: GeneralDashboardProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(initialEventId ?? null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (initialEventId !== undefined) {
      setSelectedEventId(initialEventId);
    }
  }, [initialEventId]);

  const handleSelectEvent = (eventId: number | null) => {
    setSelectedEventId(eventId);
    if (onSelectEvent) {
      onSelectEvent(eventId);
    }
  };

  const fetchMetrics = async (eventId?: number | null, isInitial = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const url = eventId ? `/admin/night-metrics?event_id=${eventId}` : '/admin/night-metrics';
      const response = await apiFetch(url, { method: 'GET' });
      if (response.status === 'success') {
        setMetrics(response.data);
      }
    } catch (err) {
      console.error('Error fetching night metrics:', err);
    } finally {
      isFetchingRef.current = false;
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMetrics(selectedEventId, true);

    const interval = setInterval(() => {
      fetchMetrics(selectedEventId, false);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedEventId]);

  const occupancy = metrics?.capacity > 0 ? Math.round((metrics.total_entries / metrics.capacity) * 100) : 0;
  const flowState = metrics?.flow_state || 'slow';
  const flowLabel = metrics?.flow_label || 'Calmo';
  const flowEmoji = metrics?.flow_emoji || '❄️';
  const flowDescription = metrics?.flow_description || 'Estável';
  const entriesLast30Min = metrics?.entries_last_30_min ?? 0;
  const vsLastEventPercent = metrics?.vs_last_event_percent;
  const lastEventName = metrics?.last_event_name;
  const availableEvents = metrics?.available_events || [];

  const chartData = useMemo(() => metrics?.hourly_flow || [], [metrics?.hourly_flow]);
  const recentActivity = useMemo(() => metrics?.recent_activity || [], [metrics?.recent_activity]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner & Event Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
              Painel de Controlo Geral
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
            Visão geral e fluxo de entradas em tempo real
          </p>
        </div>

        {/* Active Event Selector */}
        {availableEvents.length > 0 && (
          <div className="flex items-center gap-3 bg-[#161616] border border-white/10 p-2 rounded-2xl self-start lg:self-auto">
            <Calendar className="w-4 h-4 text-[#D4AF37] ml-2" />
            <select
              value={selectedEventId ?? metrics?.event_id ?? ''}
              onChange={(e) => handleSelectEvent(e.target.value ? Number(e.target.value) : null)}
              className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer pr-4 py-1"
            >
              {availableEvents.map((ev: any) => (
                <option key={ev.id} value={ev.id} className="bg-black text-white">
                  {ev.name} ({new Date(ev.date).toLocaleDateString('pt-PT')}) {ev.status === 'ongoing' ? '🟢 AO VIVO' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active Event Info Bar */}
      {metrics?.event_name && (
        <div className="p-4 sm:p-5 rounded-2xl border border-[#D4AF37]/20 bg-[#161616]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400 font-medium">A ver estatísticas do evento:</span>
                <span className="text-sm font-black text-white">{metrics.event_name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  metrics.event_status === 'ongoing'
                    ? 'text-green-400 bg-green-500/10 border-green-500/30'
                    : metrics.event_status === 'completed'
                    ? 'text-gray-300 bg-white/5 border-white/10'
                    : 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30'
                }`}>
                  {metrics.event_status === 'ongoing' ? '🟢 A decorrer' : metrics.event_status === 'completed' ? '🏁 Concluído' : '📅 Próximo'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Entries */}
        <div className="p-6 rounded-[2rem] bg-[#141414] border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Entradas Totais</p>
              {vsLastEventPercent !== null && vsLastEventPercent !== undefined ? (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  vsLastEventPercent >= 0
                    ? 'text-green-400 bg-green-500/10 border-green-500/20'
                    : 'text-red-400 bg-red-500/10 border-red-500/20'
                }`}>
                  {vsLastEventPercent >= 0 ? `+${vsLastEventPercent}%` : `${vsLastEventPercent}%`} vs {lastEventName || 'último'}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/10">1º Evento</span>
              )}
            </div>
          </div>
          <p className="text-4xl font-black text-white tracking-tight">{metrics?.total_entries || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Check-ins efetuados na porta</p>
        </div>

        {/* Current Flow */}
        <div className="p-6 rounded-[2rem] bg-[#141414] border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-center gap-3.5 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              flowState === 'fire'
                ? 'bg-red-500/15 border-red-500/40 text-red-500'
                : flowState === 'hot'
                ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                : flowState === 'moderate'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-blue-500/15 border-blue-500/40 text-blue-400'
            }`}>
              {flowState === 'fire' || flowState === 'hot' ? (
                <Flame className="w-6 h-6" />
              ) : flowState === 'moderate' ? (
                <Zap className="w-6 h-6" />
              ) : (
                <Snowflake className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Fluxo Atual</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                flowState === 'fire'
                  ? 'text-red-400 bg-red-500/15 border-red-500/30'
                  : flowState === 'hot'
                  ? 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                  : flowState === 'moderate'
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
              }`}>
                {flowLabel} {flowEmoji}
              </span>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">{flowDescription}</p>
          <p className="text-xs text-gray-500 mt-2">{entriesLast30Min} entradas nos últimos 30 min</p>
        </div>

        {/* Occupancy */}
        <div className="p-6 rounded-[2rem] bg-[#141414] border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Lotação</p>
              <span className="text-[10px] text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                {occupancy}% da capacidade
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-3xl sm:text-4xl font-black text-white">{occupancy}%</p>
              <p className="text-xs text-gray-500 mt-1">{metrics?.total_entries || 0} / {metrics?.capacity || 0} pax</p>
            </div>
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="22" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="5" fill="none" />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  stroke="#D4AF37"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - occupancy / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Live Bar Spend */}
        <div className="p-6 rounded-[2rem] bg-[#141414] border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-500/15 border border-green-500/30 text-green-400">
              <Euro className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Consumo no Bar</p>
              <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Hoje</span>
            </div>
          </div>
          <p className="text-4xl font-black text-white tracking-tight">€{metrics?.total_revenue || 0}</p>
          <p className="text-xs text-green-400/90 mt-2 font-medium">Consumo total registado</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Flow Chart */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-[2rem] bg-[#141414] border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#D4AF37]" />
                Fluxo de Entradas por Hora
              </h2>
              <p className="text-xs text-gray-400 mt-1">Evolução do ritmo de entradas durante o evento</p>
            </div>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tonightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="time" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a1a',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '0.75rem',
                    color: '#ffffff',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="entries"
                  stroke="#D4AF37"
                  strokeWidth={2.5}
                  fill="url(#tonightGradient)"
                  name="Entradas"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="p-6 sm:p-8 rounded-[2rem] bg-[#141414] border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#D4AF37]" />
                Atividade Recente
              </h2>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span>Live 5s</span>
              </div>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="p-3.5 rounded-2xl flex items-center gap-3.5 bg-white/[0.02] border border-white/5 hover:border-white/15 transition-colors"
                  >
                    {activity.profile_photo ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 bg-black/40 flex-shrink-0">
                        <img
                          src={activity.profile_photo}
                          alt={activity.user_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 shadow-md"
                        style={{
                          background: activity.type === 'purchase'
                            ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
                            : activity.type === 'reward_redemption'
                            ? 'linear-gradient(135deg, #A855F7 0%, #C084FC 100%)'
                            : 'rgba(255, 255, 255, 0.1)',
                          color: activity.type === 'purchase' ? '#000000' : '#ffffff',
                        }}
                      >
                        {activity.avatar || activity.user_name?.charAt(0)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white truncate">{activity.user_name}</p>
                        {activity.type === 'check_in' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-green-500/15 text-green-400 font-bold border border-green-500/20">Entrada</span>
                        )}
                        {activity.type === 'purchase' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#D4AF37]/15 text-[#D4AF37] font-bold border border-[#D4AF37]/20">Bar €</span>
                        )}
                        {activity.type === 'reward_redemption' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 font-bold border border-purple-500/20">Prémio</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{activity.title}</p>
                      <p className="text-[10px] text-gray-500 truncate">{activity.subtitle}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-gray-400 font-bold">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 text-xs">Sem atividade recente.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
