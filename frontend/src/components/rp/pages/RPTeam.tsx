import { useState, useEffect } from 'react';
import { Users, TrendingUp, Trophy, Target, MessageSquare, Loader2 } from 'lucide-react';
import { apiFetch } from '../../../services/api';
import { GlassCard } from '../../ui/GlassCard';

interface TeamMember {
  id: number;
  name: string;
  avatar: string | null;
  initials: string;
  entries: number;
  revenue: number;
  rank: number;
}

interface RPTeamProps {
  isTeamLeader: boolean;
}

export function RPTeam({ isTeamLeader }: RPTeamProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamGoal, setTeamGoal] = useState<number>(500);
  const [myRank, setMyRank] = useState<number>(1);
  const [myEntries, setMyEntries] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState('');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await apiFetch('/rp/team', { method: 'GET' });
        if (response.status === 'success') {
          setTeamMembers(response.data.teamMembers);
          setTeamGoal(response.data.teamGoal);
          setMyRank(response.data.myRank);
          setMyEntries(response.data.myEntries);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar equipa');
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

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
        <div className="text-red-500 font-bold bg-red-500/10 px-6 py-4 rounded-[2rem] border border-red-500/20">{error}</div>
      </div>
    );
  }

  const handleSaveGoal = async () => {
    const goalVal = parseInt(newGoalInput, 10);
    if (isNaN(goalVal) || goalVal <= 0) return;

    try {
      const response = await apiFetch('/rp/team/goal', {
        method: 'PUT',
        body: JSON.stringify({ goal: goalVal })
      });
      if (response.status === 'success') {
        setTeamGoal(goalVal);
        setIsEditingGoal(false);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar a meta.');
    }
  };

  const teamProgress = teamMembers.reduce((sum, member) => sum + member.entries, 0);
  const teamProgressPercent = teamGoal > 0 ? Math.round((teamProgress / teamGoal) * 100) : 0;

  // SCENARIO A: Regular RP View
  if (!isTeamLeader) {

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-black text-white mb-2" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>My Team Status</h1>
          <p className="text-gray-400 font-medium">Acompanha o progresso da tua equipa</p>
        </div>

        {/* Team Progress Card */}
        <GlassCard variant="gold" className="p-6 md:p-8">
          <div className="flex items-center gap-4 mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              }}
            >
              <Trophy className="w-7 h-7 text-black drop-shadow-sm" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Golden Squad Goal</h2>
              <p className="text-sm text-[#D4AF37] font-medium opacity-80">Meta coletiva da equipa</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Progresso</span>
              <span className="text-2xl font-black text-white drop-shadow-md">{teamProgressPercent}%</span>
            </div>
            <div
              className="h-4 rounded-full overflow-hidden shadow-inner"
              style={{ background: 'rgba(0, 0, 0, 0.4)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out relative"
                style={{
                  background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                  width: `${Math.min(teamProgressPercent, 100)}%`,
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)'
                }}
              >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div
              className="p-5 rounded-[1.5rem] text-center"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="text-3xl font-black text-white mb-1">{teamProgress}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Team Entries</div>
            </div>
            <div
              className="p-5 rounded-[1.5rem] text-center relative overflow-hidden"
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
              }}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/10 to-transparent pointer-events-none"></div>
              <div className="text-3xl font-black text-[#D4AF37] mb-1 relative z-10">{teamGoal}</div>
              <div className="text-xs font-bold text-[#D4AF37]/70 uppercase tracking-widest relative z-10">Team Goal</div>
            </div>
          </div>
        </GlassCard>

        {/* My Position */}
        <GlassCard className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6">A Minha Posição</h2>

          <div
            className="p-6 rounded-[2rem] mb-4 relative overflow-hidden group hover:scale-[1.02] transition-transform"
            style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
          >
              <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/5 to-[#D4AF37]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 w-[200%] translate-x-[-50%] group-hover:translate-x-[0%]"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div
                className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                }}
              >
                <span className="text-black font-black text-4xl">#{myRank}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-2xl mb-1 drop-shadow-sm">Estás em {myRank}º Lugar!</h3>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="text-[#D4AF37] text-lg bg-[#D4AF37]/10 px-3 py-1 rounded-full">{myEntries} entradas</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Team Leaderboard */}
        <GlassCard className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6">Classificação da Equipa</h2>

          <div className="space-y-4">
            {teamMembers.map((member, index) => (
              <div
                key={member.id}
                className="p-5 rounded-[1.5rem] flex items-center gap-5 transition-colors hover:bg-white/5"
                style={{
                  background: index === 0 ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                  border: index === 0 ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: index === 0 ? '0 0 20px rgba(212, 175, 55, 0.1)' : 'none'
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden text-xl"
                  style={{
                    background: index === 0 ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
                    color: index === 0 ? '#000000' : '#ffffff',
                    border: index === 0 ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-black">#{member.rank}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg truncate">{member.name}</h3>
                  <p className="text-sm font-medium text-[#D4AF37] opacity-80">{member.entries} entradas</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  // SCENARIO B: Team Leader View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-black text-white mb-2" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
        }}>Team Management</h1>
        <p className="text-gray-400 font-medium">Gere a tua equipa de RPs</p>
      </div>

      {/* Squad Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="gold" className="p-6 rounded-[2rem] hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              }}
            >
              <Users className="w-6 h-6 text-black" />
            </div>
          </div>
          <div className="text-4xl font-black text-white mb-1">{teamMembers.length}</div>
          <div className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Membros</div>
        </GlassCard>

        <GlassCard className="p-6 rounded-[2rem] hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <Target className="w-6 h-6 text-[#D4AF37]" />
            </div>
          </div>
          <div className="text-4xl font-black text-white mb-1">{teamProgress}</div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Entradas Total</div>
        </GlassCard>

        <GlassCard className="p-6 rounded-[2rem] hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
            </div>
          </div>
          <div className="text-4xl font-black text-white mb-1">
            <span className="text-[#D4AF37]">€</span>{teamMembers.reduce((sum, m) => sum + m.revenue, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Receita Total</div>
        </GlassCard>

        <GlassCard className="p-6 rounded-[2rem] hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <Trophy className="w-6 h-6 text-[#D4AF37]" />
            </div>
          </div>
          <div className="text-4xl font-black text-white mb-1">{teamProgressPercent}%</div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Progresso Meta</div>
        </GlassCard>
      </div>

      {/* Team Goal Progress */}
      <GlassCard variant="gold" className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Team Goal: <span className="text-[#FFD700]">{teamGoal} Entradas</span></h2>
            <p className="text-sm text-gray-300 font-medium">Atual: {teamProgress} entradas ({teamProgressPercent}%)</p>
          </div>
          <button
            onClick={() => {
              setNewGoalInput(teamGoal.toString());
              setIsEditingGoal(true);
            }}
            className="px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] whitespace-nowrap font-bold"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)',
              color: '#000000',
            }}
          >
            Editar Meta
          </button>
        </div>
        <div
          className="h-6 rounded-full overflow-hidden shadow-inner p-1 bg-black/40"
        >
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out relative"
            style={{
              background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
              width: `${Math.min(teamProgressPercent, 100)}%`,
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)'
            }}
          >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </GlassCard>

      {/* Team Members List */}
      <GlassCard className="p-6 md:p-8">
        <h2 className="text-xl font-bold text-white mb-6">Membros da Equipa</h2>
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Rank</th>
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Nome</th>
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Entradas</th>
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Receita (Est.)</th>
                <th className="text-right text-sm font-semibold text-gray-400 pb-4 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => {
                return (
                  <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-[#D4AF37]/50 transition-colors"
                        style={{
                          background: member.rank === 1 ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(0, 0, 0, 0.4)',
                          color: member.rank === 1 ? '#000000' : '#ffffff',
                          boxShadow: member.rank === 1 ? '0 0 20px rgba(212, 175, 55, 0.2)' : 'none'
                        }}
                      >
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold">#{member.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white font-bold">{member.name}</td>
                    <td className="py-4 px-4 text-white font-bold">{member.entries}</td>
                    <td className="py-4 px-4 text-[#D4AF37] font-medium">€{member.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-3 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-transparent hover:border-[#D4AF37]/50 transition-all hover:text-[#D4AF37] text-gray-400"
                          title="Message"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="lg:hidden space-y-4">
          {teamMembers.map((member) => {
            return (
              <div
                key={member.id}
                className="p-5 rounded-[1.5rem] transition-colors"
                style={{
                  background: member.rank === 1 ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                  border: member.rank === 1 ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{
                      background: member.rank === 1 ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
                      color: member.rank === 1 ? '#000000' : '#ffffff',
                    }}
                  >
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-black text-xl">#{member.rank}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg mb-1">{member.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400 font-medium">
                      <span>{member.entries} entradas</span>
                      <span className="text-[#D4AF37]">€{member.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 p-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#888888',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Enviar Mensagem</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {isEditingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111] border border-[#D4AF37]/30 rounded-[2rem] p-8 w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-2xl text-white font-bold mb-6">Editar Meta da Equipa</h3>
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-400 mb-2">Novo Objetivo (Entradas)</label>
              <input
                type="number"
                min="1"
                value={newGoalInput}
                onChange={(e) => setNewGoalInput(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium text-lg focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsEditingGoal(false)}
                className="flex-1 px-4 py-4 rounded-2xl text-gray-400 font-bold hover:bg-white/10 transition-colors border border-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveGoal}
                className="flex-1 px-4 py-4 rounded-2xl text-black font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}