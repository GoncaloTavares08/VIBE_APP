import { useState } from 'react';
import { Users, TrendingUp, Trophy, Target, MessageSquare, Edit } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  entries: number;
  goal: number;
  revenue: number;
  rank: number;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'João Silva',
    avatar: 'J',
    entries: 156,
    goal: 150,
    revenue: 2240,
    rank: 1,
  },
  {
    id: '2',
    name: 'Maria Costa',
    avatar: 'M',
    entries: 142,
    goal: 150,
    revenue: 2040,
    rank: 2,
  },
  {
    id: '3',
    name: 'Pedro Santos',
    avatar: 'P',
    entries: 128,
    goal: 120,
    revenue: 1840,
    rank: 3,
  },
  {
    id: '4',
    name: 'Ana Ribeiro',
    avatar: 'A',
    entries: 98,
    goal: 100,
    revenue: 1410,
    rank: 4,
  },
];

interface RPTeamProps {
  isTeamLeader: boolean;
}

export function RPTeam({ isTeamLeader }: RPTeamProps) {
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers);

  const teamGoal = 500;
  const teamProgress = teamMembers.reduce((sum, member) => sum + member.entries, 0);
  const teamProgressPercent = Math.round((teamProgress / teamGoal) * 100);

  // SCENARIO A: Regular RP View
  if (!isTeamLeader) {
    const myRank = 1; // Current user's rank
    const myEntries = 156;
    const myGoal = 150;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl lg:text-4xl text-white mb-2">My Team Status</h1>
          <p className="text-gray-400">Acompanha o progresso da tua equipa</p>
        </div>

        {/* Team Progress Card */}
        <div
          className="p-6 rounded-3xl backdrop-blur-xl"
          style={{
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              }}
            >
              <Trophy className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-xl text-white">Golden Squad Goal</h2>
              <p className="text-sm text-gray-400">Meta coletiva da equipa</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-xl text-white font-semibold">{teamProgressPercent}%</span>
            </div>
            <div
              className="h-4 rounded-full overflow-hidden"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
                  width: `${teamProgressPercent}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div
              className="p-4 rounded-2xl text-center"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="text-2xl text-white mb-1">{teamProgress}</div>
              <div className="text-xs text-gray-400">Team Entries</div>
            </div>
            <div
              className="p-4 rounded-2xl text-center"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="text-2xl text-[#D4AF37] mb-1">{teamGoal}</div>
              <div className="text-xs text-gray-400">Team Goal</div>
            </div>
          </div>
        </div>

        {/* My Position */}
        <div
          className="p-6 rounded-3xl backdrop-blur-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2 className="text-xl text-white mb-6">My Position in Team</h2>

          <div
            className="p-5 rounded-2xl mb-4"
            style={{
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                }}
              >
                <span className="text-black font-black text-2xl">#{myRank}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-1">You're in {myRank}st Place!</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[#D4AF37]">{myEntries} entries</span>
                  <span className="text-gray-400">Goal: {myGoal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Leaderboard */}
        <div
          className="p-6 rounded-3xl backdrop-blur-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2 className="text-xl text-white mb-6">Team Leaderboard</h2>

          <div className="space-y-3">
            {teamMembers.map((member, index) => (
              <div
                key={member.id}
                className="p-4 rounded-2xl flex items-center gap-4"
                style={{
                  background: index === 0 ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                  border: index === 0 ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: index === 0 ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
                    color: index === 0 ? '#000000' : '#ffffff',
                  }}
                >
                  <span className="font-black">#{member.rank}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{member.name}</h3>
                  <p className="text-sm text-gray-400">{member.entries} entries</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#D4AF37]">{Math.round((member.entries / member.goal) * 100)}%</div>
                  <div className="text-xs text-gray-500">of goal</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SCENARIO B: Team Leader View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl text-white mb-2">Team Management</h1>
        <p className="text-gray-400">Gere a tua equipa de RPs</p>
      </div>

      {/* Squad Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="p-6 rounded-3xl backdrop-blur-xl"
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
              <Users className="w-6 h-6 text-black" />
            </div>
          </div>
          <div className="text-3xl text-white mb-1">{teamMembers.length}</div>
          <div className="text-sm text-gray-400">Team Members</div>
        </div>

        <div
          className="p-6 rounded-3xl backdrop-blur-xl"
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
              <Target className="w-6 h-6 text-[#D4AF37]" />
            </div>
          </div>
          <div className="text-3xl text-white mb-1">{teamProgress}</div>
          <div className="text-sm text-gray-400">Total Entries</div>
        </div>

        <div
          className="p-6 rounded-3xl backdrop-blur-xl"
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
          </div>
          <div className="text-3xl text-white mb-1">
            €{teamMembers.reduce((sum, m) => sum + m.revenue, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Total Revenue</div>
        </div>

        <div
          className="p-6 rounded-3xl backdrop-blur-xl"
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
              <Trophy className="w-6 h-6 text-[#D4AF37]" />
            </div>
          </div>
          <div className="text-3xl text-white mb-1">{teamProgressPercent}%</div>
          <div className="text-sm text-gray-400">Goal Progress</div>
        </div>
      </div>

      {/* Team Goal Progress */}
      <div
        className="p-6 rounded-3xl backdrop-blur-xl"
        style={{
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl text-white mb-1">Team Goal: {teamGoal} Entries</h2>
            <p className="text-sm text-gray-400">Current: {teamProgress} entries ({teamProgressPercent}%)</p>
          </div>
          <button
            className="px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              color: '#000000',
            }}
          >
            <span className="font-semibold">Edit Goal</span>
          </button>
        </div>
        <div
          className="h-4 rounded-full overflow-hidden"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
              width: `${Math.min(teamProgressPercent, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Team Members List */}
      <div
        className="p-6 rounded-3xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h2 className="text-xl text-white mb-6">Team Members</h2>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-sm text-gray-400 pb-4">Rank</th>
                <th className="text-left text-sm text-gray-400 pb-4">Name</th>
                <th className="text-left text-sm text-gray-400 pb-4">Entries</th>
                <th className="text-left text-sm text-gray-400 pb-4">Goal</th>
                <th className="text-left text-sm text-gray-400 pb-4">Progress</th>
                <th className="text-left text-sm text-gray-400 pb-4">Revenue</th>
                <th className="text-right text-sm text-gray-400 pb-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => {
                const progress = Math.round((member.entries / member.goal) * 100);
                return (
                  <tr key={member.id} className="border-b border-white/5">
                    <td className="py-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: member.rank === 1 ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
                          color: member.rank === 1 ? '#000000' : '#ffffff',
                        }}
                      >
                        <span className="font-bold">#{member.rank}</span>
                      </div>
                    </td>
                    <td className="py-4 text-white">{member.name}</td>
                    <td className="py-4 text-white">{member.entries}</td>
                    <td className="py-4 text-gray-400">{member.goal}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-24 h-2 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              background: progress >= 100 ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
                              width: `${Math.min(progress, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-[#D4AF37]">{progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 text-[#D4AF37]">€{member.revenue.toLocaleString()}</td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                          title="Edit Goal"
                        >
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                          title="Message"
                        >
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {teamMembers.map((member) => {
            const progress = Math.round((member.entries / member.goal) * 100);
            return (
              <div
                key={member.id}
                className="p-4 rounded-2xl"
                style={{
                  background: member.rank === 1 ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                  border: member.rank === 1 ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: member.rank === 1 ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
                      color: member.rank === 1 ? '#000000' : '#ffffff',
                    }}
                  >
                    <span className="font-black">#{member.rank}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold mb-1">{member.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>{member.entries} / {member.goal} entries</span>
                      <span className="text-[#D4AF37]">€{member.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Progress</span>
                    <span className="text-sm text-[#D4AF37]">{progress}%</span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: progress >= 100 ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
                        width: `${Math.min(progress, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(212, 175, 55, 0.2)',
                      color: '#D4AF37',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Goal</span>
                  </button>
                  <button
                    className="flex-1 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#888888',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}