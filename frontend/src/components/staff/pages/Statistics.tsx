import { useState, useEffect } from 'react';
import { Users, TrendingUp, UserCheck, Clock } from 'lucide-react';

export function Statistics() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mock data
  const currentOccupancy = 342;
  const maxCapacity = 500;
  const occupancyPercentage = (currentOccupancy / maxCapacity) * 100;

  const genderRatio = {
    male: 58,
    female: 42,
  };

  const entriesData = [
    { time: '22:00', count: 45 },
    { time: '23:00', count: 89 },
    { time: '00:00', count: 142 },
    { time: '01:00', count: 98 },
    { time: '02:00', count: 67 },
  ];

  const totalEntries = 342;
  const avgEntryTime = '23:45';

  if (isMobile) {
    // Mobile: Stacked vertical cards
    return (
      <div className="h-full overflow-y-auto p-4 pb-24" style={{ background: '#0a0a0a' }}>
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

            {/* Mini Bar Chart */}
            <div className="flex items-end justify-between gap-2 h-32">
              {entriesData.map((entry, index) => {
                const maxCount = Math.max(...entriesData.map(e => e.count));
                const heightPercentage = (entry.count / maxCount) * 100;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full" style={{ height: '100px' }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${heightPercentage}%`,
                          background: 'linear-gradient(180deg, #D4AF37 0%, rgba(212, 175, 55, 0.5) 100%)',
                          boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{entry.time}</span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Desktop: Grid layout
  return (
    <div className="h-full overflow-y-auto p-8" style={{ background: '#0a0a0a' }}>
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
        <div className="flex items-end justify-between gap-4 h-64">
          {entriesData.map((entry, index) => {
            const maxCount = Math.max(...entriesData.map(e => e.count));
            const heightPercentage = (entry.count / maxCount) * 100;

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-3">
                <div className="relative w-full" style={{ height: '200px' }}>
                  <div
                    className="absolute bottom-0 w-full rounded-t-xl transition-all duration-500 group cursor-pointer"
                    style={{
                      height: `${heightPercentage}%`,
                      background: 'linear-gradient(180deg, #D4AF37 0%, rgba(212, 175, 55, 0.5) 100%)',
                      boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
                    }}
                  >
                    {/* Hover Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div
                        className="px-3 py-2 rounded-lg whitespace-nowrap"
                        style={{
                          background: 'rgba(10, 10, 10, 0.95)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                        }}
                      >
                        <p className="text-white font-bold">{entry.count}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-400 font-medium">{entry.time}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-6 rounded-3xl transition-all duration-300 hover:shadow-2xl"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      {children}
    </div>
  );
}
