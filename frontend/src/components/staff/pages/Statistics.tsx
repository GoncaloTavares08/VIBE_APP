import { useState, useEffect } from 'react';
import { Users, TrendingUp, UserCheck, Loader2 } from 'lucide-react';
import { apiFetch } from '../../../services/api';

export function Statistics() {
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [stats, setStats] = useState({
    currentOccupancy: 0,
    maxCapacity: 500,
    occupancyPercentage: 0,
    genderRatio: { male: 50, female: 50 },
    entriesData: [] as { time: string; count: number }[],
    totalEntries: 0,
    avgEntryTime: '--:--',
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiFetch('/staff/statistics');
        if (response.status === 'success' && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch statistics', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const {
    currentOccupancy,
    maxCapacity,
    occupancyPercentage,
    genderRatio,
    entriesData,
    totalEntries,
    avgEntryTime
  } = stats;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (isMobile) {
    // Mobile: Stacked vertical cards
    return (
      <div className="relative h-full overflow-y-auto p-4 pb-24 z-10">
        <h2 className="text-2xl text-white font-bold mb-6">Live Statistics</h2>

        <div className="space-y-4">
          {/* Real-time Occupancy */}
          <GlassCard>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Real-time Occupancy</p>
                <h3 className="text-3xl text-white font-bold">{currentOccupancy}</h3>
                <p className="text-sm text-gray-500">of {maxCapacity} capacity</p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <Users className="w-6 h-6 text-[#D4AF37]" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${occupancyPercentage}%`,
                  background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
                  boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
                }}
              />
            </div>
            <p className="text-sm text-[#D4AF37] mt-2 text-right">{occupancyPercentage.toFixed(0)}% Full</p>
          </GlassCard>

          {/* Gender Ratio */}
          <GlassCard>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Gender Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl text-white font-bold">{genderRatio.male}%</span>
                  <span className="text-lg text-gray-400">/</span>
                  <span className="text-3xl text-white font-bold">{genderRatio.female}%</span>
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(168, 85, 247, 0.2)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                }}
              >
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>

            {/* Gender Ratio Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Male</span>
                  <span className="text-sm text-white font-semibold">{genderRatio.male}%</span>
                </div>
                <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                  <div
                    className="absolute top-0 left-0 h-full rounded-full"
                    style={{
                      width: `${genderRatio.male}%`,
                      background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Female</span>
                  <span className="text-sm text-white font-semibold">{genderRatio.female}%</span>
                </div>
                <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                  <div
                    className="absolute top-0 left-0 h-full rounded-full"
                    style={{
                      width: `${genderRatio.female}%`,
                      background: 'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)',
                    }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Total Entries */}
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Entries</p>
                <h3 className="text-3xl text-white font-bold">{totalEntries}</h3>
                <p className="text-sm text-gray-500">Avg time: {avgEntryTime}</p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                <UserCheck className="w-6 h-6 text-green-400" />
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar pb-2 pt-4">
              <div className="flex items-end justify-between gap-2.5 h-36 min-w-[340px]">
                {entriesData.map((entry, index) => {
                  const maxCount = Math.max(...entriesData.map(e => e.count), 1);
                  const heightPercentage = entry.count > 0 ? Math.min(85, (entry.count / maxCount) * 75 + 10) : 4;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1.5 min-w-[32px]">
                      <div 
                        className="relative w-full cursor-pointer group flex flex-col justify-end" 
                        style={{ height: '110px' }}
                        onClick={() => setActiveBarIndex(activeBarIndex === index ? null : index)}
                      >
                        {/* Static/Active Count badge */}
                        <div 
                          className={`text-[10px] font-black text-center transition-all duration-200 mb-1 ${
                            entry.count > 0 || activeBarIndex === index ? 'opacity-100 text-[#D4AF37]' : 'opacity-0 text-transparent'
                          }`}
                        >
                          {entry.count}
                        </div>

                        <div
                          className="w-full rounded-t-lg transition-all duration-500"
                          style={{
                            height: `${heightPercentage}%`,
                            background: entry.count > 0 
                              ? 'linear-gradient(180deg, #D4AF37 0%, rgba(212, 175, 55, 0.5) 100%)' 
                              : 'rgba(255, 255, 255, 0.08)',
                            boxShadow: entry.count > 0 ? '0 0 15px rgba(212, 175, 55, 0.3)' : 'none',
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400">{entry.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Desktop: Grid layout
  return (
    <div className="relative h-full overflow-y-auto p-8 z-10">
      <h2 className="text-3xl text-white font-bold mb-8">Live Statistics</h2>

      {/* Top Row: Occupancy + Gender Ratio */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Real-time Occupancy */}
        <GlassCard>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-gray-400 mb-2">Real-time Occupancy</p>
              <h3 className="text-4xl text-white font-bold mb-1">{currentOccupancy}</h3>
              <p className="text-sm text-gray-500">of {maxCapacity} capacity</p>
            </div>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <Users className="w-8 h-8 text-[#D4AF37]" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
              style={{
                width: `${occupancyPercentage}%`,
                background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
              }}
            />
          </div>
          <p className="text-sm text-[#D4AF37] mt-3 text-right font-semibold">{occupancyPercentage.toFixed(0)}% Full</p>
        </GlassCard>

        {/* Gender Balance */}
        <GlassCard>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-gray-400 mb-2">Gender Balance</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl text-white font-bold">{genderRatio.male}%</span>
                <span className="text-2xl text-gray-400">/</span>
                <span className="text-4xl text-white font-bold">{genderRatio.female}%</span>
              </div>
            </div>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          {/* Gender Ratio Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Male</span>
                <span className="text-sm text-white font-semibold">{genderRatio.male}%</span>
              </div>
              <div className="relative w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${genderRatio.male}%`,
                    background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Female</span>
                <span className="text-sm text-white font-semibold">{genderRatio.female}%</span>
              </div>
              <div className="relative w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${genderRatio.female}%`,
                    background: 'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)',
                  }}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Bottom Row: Entries Chart (Full Width) */}
      <GlassCard>
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-sm text-gray-400 mb-2">Entries Over Time</p>
            <h3 className="text-4xl text-white font-bold mb-1">{totalEntries}</h3>
            <p className="text-sm text-gray-500">Total entries • Avg time: {avgEntryTime}</p>
          </div>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            <UserCheck className="w-8 h-8 text-green-400" />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="overflow-x-auto custom-scrollbar pb-2 pt-4">
          <div className="flex items-end justify-between gap-4 h-64 min-w-[500px]">
            {entriesData.map((entry, index) => {
              const maxCount = Math.max(...entriesData.map(e => e.count), 1);
              const heightPercentage = entry.count > 0 ? Math.min(85, (entry.count / maxCount) * 75 + 10) : 4;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 min-w-[40px]">
                  <div 
                    className="relative w-full cursor-pointer group flex flex-col justify-end" 
                    style={{ height: '180px' }}
                    onClick={() => setActiveBarIndex(activeBarIndex === index ? null : index)}
                  >
                    {/* Hover/Click Tooltip / Value Badge */}
                    <div 
                      className={`text-xs font-black text-center transition-all duration-200 mb-1.5 ${
                        entry.count > 0 || activeBarIndex === index ? 'opacity-100 text-[#D4AF37]' : 'opacity-0 text-transparent'
                      }`}
                    >
                      {entry.count}
                    </div>

                    <div
                      className="w-full rounded-t-xl transition-all duration-500"
                      style={{
                        height: `${heightPercentage}%`,
                        background: entry.count > 0 
                          ? 'linear-gradient(180deg, #D4AF37 0%, rgba(212, 175, 55, 0.5) 100%)' 
                          : 'rgba(255, 255, 255, 0.08)',
                        boxShadow: entry.count > 0 ? '0 0 20px rgba(212, 175, 55, 0.3)' : 'none',
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 font-medium">{entry.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-6 md:p-8 rounded-[2rem] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] hover:border-[#D4AF37]/30"
      style={{
        background: 'rgba(25, 25, 25, 0.5)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      {children}
    </div>
  );
}
