import { useState, useEffect } from 'react';
import {
  Users,
  Trophy,
  Target,
  MessageSquare,
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Gift,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

interface Challenge {
  id: number;
  name: string;
  target: number;
  current: number;
  reward: string;
  startDate?: string;
  endDate: string;
  status: string;
}

interface RPTeamProps {
  isTeamLeader?: boolean;
}

export function RPTeam({ isTeamLeader: _isTeamLeader = false }: RPTeamProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [myRank, setMyRank] = useState<number>(1);
  const [myEntries, setMyEntries] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Challenge creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingChallenge, setCreatingChallenge] = useState(false);
  const [challengeMessage, setChallengeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    target: '',
    reward: '',
    start_date: todayStr,
    end_date: ''
  });

  // Direct messaging state
  const [selectedRecipient, setSelectedRecipient] = useState<TeamMember | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAllData = async () => {
    try {
      const [teamRes, challengesRes] = await Promise.all([
        apiFetch('/rp/team', { method: 'GET' }),
        apiFetch('/rp/challenges', { method: 'GET' })
      ]);

      if (teamRes.status === 'success') {
        setTeamMembers(teamRes.data.teamMembers || []);
        setMyRank(teamRes.data.myRank || 1);
        setMyEntries(teamRes.data.myEntries || 0);
      }

      if (challengesRes.status === 'success') {
        setChallenges(challengesRes.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados da equipa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOpenMessageModal = (member: TeamMember) => {
    setSelectedRecipient(member);
    setMessageText('');
    setMessageFeedback(null);
  };

  const handleSendMessage = async () => {
    if (!selectedRecipient || !messageText.trim()) return;

    setSendingMessage(true);
    setMessageFeedback(null);

    try {
      const response = await apiFetch('/rp/team/message', {
        method: 'POST',
        body: JSON.stringify({
          recipient_id: selectedRecipient.id,
          message: messageText.trim()
        })
      });

      if (response.status === 'success') {
        setMessageFeedback({ type: 'success', text: `Notificação enviada com sucesso para ${selectedRecipient.name}!` });
        setTimeout(() => {
          setSelectedRecipient(null);
          setMessageText('');
          setMessageFeedback(null);
        }, 1500);
      } else {
        setMessageFeedback({ type: 'error', text: response.message || 'Erro ao enviar notificação.' });
      }
    } catch (err: any) {
      setMessageFeedback({ type: 'error', text: err.message || 'Erro de conexão ao enviar.' });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteChallenge = async (id: number) => {
    if (!window.confirm('Tens a certeza que queres eliminar este desafio?')) return;
    try {
      const res = await apiFetch(`/rp/challenges/${id}`, { method: 'DELETE' });
      if (res.status === 'success') {
        setChallenges(prev => prev.filter(c => c.id !== id));
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao eliminar desafio.');
    }
  };


  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChallenge.title || !newChallenge.target || !newChallenge.reward || !newChallenge.start_date || !newChallenge.end_date) {
      setChallengeMessage({ type: 'error', text: 'Por favor preencha todos os campos.' });
      return;
    }

    setCreatingChallenge(true);
    setChallengeMessage(null);

    try {
      const res = await apiFetch('/rp/challenges', {
        method: 'POST',
        body: JSON.stringify({
          title: newChallenge.title,
          target: parseInt(newChallenge.target, 10),
          reward: newChallenge.reward,
          start_date: newChallenge.start_date,
          end_date: newChallenge.end_date
        })
      });

      if (res.status === 'success') {
        setChallengeMessage({ type: 'success', text: 'Desafio criado com sucesso!' });
        setNewChallenge({ title: '', target: '', reward: '', start_date: todayStr, end_date: '' });
        await loadAllData();
        setTimeout(() => {
          setShowCreateModal(false);
          setChallengeMessage(null);
        }, 1200);
      } else {
        setChallengeMessage({ type: 'error', text: res.message || 'Erro ao criar desafio.' });
      }
    } catch (err: any) {
      setChallengeMessage({ type: 'error', text: err.message || 'Erro ao criar desafio.' });
    } finally {
      setCreatingChallenge(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-64 bg-white/5 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white/5 rounded-[2rem] border border-white/5"></div>
          ))}
        </div>
        <div className="h-64 bg-white/5 rounded-[2rem] border border-white/5"></div>
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

  const teamTotalEntries = teamMembers.reduce((sum, member) => sum + member.entries, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white mb-2" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Equipa & Metas</h1>
          <p className="text-gray-400 font-medium">Acompanha a tua equipa, membros e desafios ativos</p>
        </div>
        <button
          onClick={() => {
            setChallengeMessage(null);
            setShowCreateModal(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] whitespace-nowrap"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)',
            color: '#000000',
          }}
        >
          <Plus className="w-5 h-5" />
          <span>Criar Desafio</span>
        </button>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <div className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Membros da Equipa</div>
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
          <div className="text-4xl font-black text-white mb-1">{teamTotalEntries}</div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Entradas da Equipa</div>
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
          <div className="text-4xl font-black text-white mb-1">#{myRank}</div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">A Minha Posição ({myEntries} entradas)</div>
        </GlassCard>
      </div>

      {/* SECTION 1: Active Challenges & Goals */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-[#D4AF37]" />
            <h2 className="text-2xl font-bold text-white">Desafios & Metas</h2>
          </div>
        </div>

        {challenges.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => {
              const progress = challenge.target > 0
                ? Math.min(Math.round((challenge.current / challenge.target) * 100), 100)
                : 0;

              return (
                <GlassCard
                  key={challenge.id}
                  className="p-6 md:p-8 flex flex-col h-full hover:-translate-y-1 transition-all duration-300 relative group rounded-[2rem]"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{
                        background: 'rgba(212, 175, 55, 0.15)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                      }}
                    >
                      <Target className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: '#4ade80',
                          border: '1px solid rgba(34, 197, 94, 0.2)'
                        }}
                      >
                        Ativo
                      </div>
                      <button
                        onClick={() => handleDeleteChallenge(challenge.id)}
                        className="p-2 rounded-xl text-gray-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 transition-all opacity-70 group-hover:opacity-100"
                        title="Eliminar Desafio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{challenge.name}</h3>
                    <div className="text-xs text-gray-400 font-medium mb-6 flex items-center gap-1.5 bg-black/30 px-3 py-2 rounded-xl border border-white/5">
                      <span className="text-[#D4AF37]">Período:</span>
                      <span>{challenge.startDate || 'Início'} — {challenge.endDate}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-400">Entradas Validadas</span>
                      <span className="text-sm font-black text-white">{challenge.current} / {challenge.target}</span>
                    </div>
                    <div
                      className="h-3 rounded-full overflow-hidden"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{
                          background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                          boxShadow: '0 0 10px rgba(212, 175, 55, 0.5)'
                        }}
                      ></motion.div>
                    </div>
                    <p className="text-xs font-medium text-[#D4AF37] opacity-80 mt-2 text-right">{progress}% completo</p>
                  </div>

                  {/* Reward */}
                  <div
                    className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{
                      background: 'rgba(212, 175, 55, 0.1)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                    }}
                  >
                    <Gift className="w-5 h-5 text-[#D4AF37]" />
                    <span className="text-sm font-bold text-white">{challenge.reward}</span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        ) : (
          <GlassCard className="p-8 text-center text-gray-400 font-medium rounded-[2rem]">
            Nenhum desafio ativo no momento. Cria um desafio para motivar a equipa!
          </GlassCard>
        )}
      </div>

      {/* SECTION 2: Team Members & Leaderboard */}
      <GlassCard className="p-6 md:p-8 rounded-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-[#D4AF37]" />
            <h2 className="text-2xl font-bold text-white">Membros da Equipa & Classificação</h2>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Posição</th>
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Promotor</th>
                <th className="text-left text-sm font-semibold text-gray-400 pb-4 px-4">Entradas</th>
                <th className="text-right text-sm font-semibold text-gray-400 pb-4 px-4">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
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
                        <span className="font-bold">{member.rank <= 3 ? (member.rank === 1 ? '🥇' : member.rank === 2 ? '🥈' : '🥉') : `#${member.rank}`}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white font-bold">{member.name}</td>
                  <td className="py-4 px-4 text-[#D4AF37] font-bold">{member.entries} {member.entries === 1 ? 'entrada' : 'entradas'}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenMessageModal(member)}
                        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/50 transition-all text-gray-300 hover:text-[#D4AF37] flex items-center gap-2 text-sm font-medium"
                        title={`Enviar mensagem a ${member.name}`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Enviar Mensagem</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className="lg:hidden space-y-4">
          {teamMembers.map((member) => (
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
                    <span className="font-black text-xl">{member.rank <= 3 ? (member.rank === 1 ? '🥇' : member.rank === 2 ? '🥈' : '🥉') : `#${member.rank}`}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg mb-1">{member.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-[#D4AF37] font-medium">
                    <span>{member.entries} {member.entries === 1 ? 'entrada' : 'entradas'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenMessageModal(member)}
                className="w-full p-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar Mensagem</span>
              </button>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* CREATE CHALLENGE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
            }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg p-6 md:p-8 rounded-[2rem] max-h-[90vh] overflow-y-auto"
              style={{
                background: 'rgba(15, 15, 15, 0.95)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 50px rgba(0,0,0,0.5)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">Criar Desafio</h3>
                  <p className="text-xs text-gray-400 font-medium">Define as metas e o período de contagem</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2.5 rounded-2xl transition-all duration-300 hover:bg-white/10 bg-white/5 border border-white/10"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {challengeMessage && (
                <div
                  className="mb-4 p-4 rounded-xl flex items-center gap-3"
                  style={{
                    background: challengeMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: challengeMessage.type === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {challengeMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <p className={challengeMessage.type === 'success' ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
                    {challengeMessage.text}
                  </p>
                </div>
              )}

              <form onSubmit={handleCreateChallenge} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Nome do Desafio</label>
                  <input
                    type="text"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    placeholder="ex: Sprint de Fim de Semana"
                    required
                    className="w-full p-4 rounded-2xl outline-none font-medium transition-all focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Meta (Entradas)</label>
                    <input
                      type="number"
                      min="1"
                      value={newChallenge.target}
                      onChange={(e) => setNewChallenge({ ...newChallenge, target: e.target.value })}
                      placeholder="50"
                      required
                      className="w-full p-4 rounded-2xl outline-none font-medium transition-all focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50"
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Prémio</label>
                    <input
                      type="text"
                      value={newChallenge.reward}
                      onChange={(e) => setNewChallenge({ ...newChallenge, reward: e.target.value })}
                      placeholder="ex: Garrafa VIP"
                      required
                      className="w-full p-4 rounded-2xl outline-none font-medium transition-all focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50"
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Data de Início</label>
                    <input
                      type="date"
                      value={newChallenge.start_date}
                      onChange={(e) => setNewChallenge({ ...newChallenge, start_date: e.target.value })}
                      required
                      className="w-full p-4 rounded-2xl outline-none font-medium transition-all focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50"
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        colorScheme: 'dark'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Data de Fim</label>
                    <input
                      type="date"
                      value={newChallenge.end_date}
                      onChange={(e) => setNewChallenge({ ...newChallenge, end_date: e.target.value })}
                      required
                      className="w-full p-4 rounded-2xl outline-none font-medium transition-all focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50"
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        colorScheme: 'dark'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingChallenge}
                  className="w-full py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02] mt-6 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)',
                    color: '#000000',
                  }}
                >
                  {creatingChallenge ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>A criar...</span>
                    </>
                  ) : (
                    <span>Criar Desafio</span>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DIRECT MESSAGE MODAL */}
      {selectedRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#111] border border-[#D4AF37]/30 rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden bg-black border border-[#D4AF37]/30">
                  {selectedRecipient.avatar ? (
                    <img src={selectedRecipient.avatar} alt={selectedRecipient.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{selectedRecipient.initials}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">Enviar Mensagem</h3>
                  <p className="text-xs text-[#D4AF37] font-semibold">{selectedRecipient.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecipient(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mensagens Rápidas</label>
              <div className="flex flex-wrap gap-2">
                {['⚡ Bora bater a meta!', '🎉 Grande trabalho nas entradas!', '🔥 Contamos contigo esta semana!'].map((quickMsg) => (
                  <button
                    key={quickMsg}
                    type="button"
                    onClick={() => setMessageText(quickMsg)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 text-gray-300 hover:text-white transition-all text-left"
                  >
                    {quickMsg}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mensagem</label>
              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Escreve uma mensagem para ${selectedRecipient.name.split(' ')[0]}...`}
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 font-medium text-sm focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all resize-none"
              />
              <p className="text-[11px] text-gray-500 mt-1.5">A notificação será enviada diretamente para o sininho de {selectedRecipient.name.split(' ')[0]}.</p>
            </div>

            {messageFeedback && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 ${
                messageFeedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {messageFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{messageFeedback.text}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedRecipient(null)}
                disabled={sendingMessage}
                className="flex-1 px-4 py-3.5 rounded-2xl text-gray-400 font-bold hover:bg-white/10 transition-colors border border-white/10 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageText.trim()}
                className="flex-1 px-4 py-3.5 rounded-2xl text-black font-bold transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  boxShadow: '0 0 20px rgba(212,175,55,0.3)'
                }}
              >
                {sendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}