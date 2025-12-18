import { useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Plus, Target, Gift, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Challenge {
  id: number;
  name: string;
  target: number;
  current: number;
  reward: string;
  endDate: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  trend: 'up' | 'down' | 'same';
  avatar: string;
}

const activeChallenges: Challenge[] = [
  { id: 1, name: 'Desafio Semanal: 100 Entradas', target: 100, current: 78, reward: 'Garrafa de Grey Goose', endDate: '20 Dez, 2024' },
  { id: 2, name: 'Objetivo de Receita: €5000', target: 5000, current: 3240, reward: 'Bónus de €200', endDate: '31 Dez, 2024' },
  { id: 3, name: 'Sprint de Equipa: 50 Convidados', target: 50, current: 42, reward: 'Jantar de Equipa', endDate: '18 Dez, 2024' },
];

const leaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Joana Costa', points: 1245, trend: 'up', avatar: 'JC' },
  { rank: 2, name: 'Pedro Alves', points: 1180, trend: 'up', avatar: 'PA' },
  { rank: 3, name: 'Miguel Torres', points: 1095, trend: 'down', avatar: 'MT' },
  { rank: 4, name: 'Sofia Almeida', points: 982, trend: 'up', avatar: 'SA' },
  { rank: 5, name: 'Ana Silva', points: 876, trend: 'same', avatar: 'AS' },
  { rank: 6, name: 'Carlos Mendes', points: 834, trend: 'down', avatar: 'CM' },
  { rank: 7, name: 'Rita Santos', points: 789, trend: 'up', avatar: 'RS' },
  { rank: 8, name: 'Tiago Oliveira', points: 745, trend: 'up', avatar: 'TO' },
  { rank: 9, name: 'Maria Ferreira', points: 698, trend: 'down', avatar: 'MF' },
  { rank: 10, name: 'João Pereira', points: 654, trend: 'same', avatar: 'JP' },
];

export function Competitions() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Competições e Gamificação</h1>
          <p className="text-gray-400">Motive a sua equipa com desafios e prémios</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
            color: '#000000',
            boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
          }}
        >
          <Plus className="w-5 h-5" />
          Criar Desafio
        </button>
      </div>

      {/* Active Challenges */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-white">Desafios Ativos</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {activeChallenges.map((challenge) => {
            const progress = (challenge.current / challenge.target) * 100;

            return (
              <div
                key={challenge.id}
                className="p-6 rounded-3xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'rgba(212, 175, 55, 0.15)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                    }}
                  >
                    <Target className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div
                    className="px-3 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#22c55e',
                    }}
                  >
                    Ativo
                  </div>
                </div>

                <h3 className="text-lg font-black text-white mb-2">{challenge.name}</h3>
                <p className="text-sm text-gray-400 mb-4">Termina: {challenge.endDate}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Progresso</span>
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
                      }}
                    ></motion.div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{Math.round(progress)}% completo</p>
                </div>

                {/* Reward */}
                <div
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                  }}
                >
                  <Gift className="w-5 h-5 text-[#D4AF37]" />
                  <span className="text-sm font-semibold text-white">{challenge.reward}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div
        className="p-8 rounded-3xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-8 h-8 text-[#D4AF37]" />
          <h2 className="text-2xl font-black text-white">Classificação</h2>
        </div>

        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: entry.rank * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{
                background: entry.rank <= 3
                  ? 'rgba(212, 175, 55, 0.1)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: entry.rank <= 3
                  ? '1px solid rgba(212, 175, 55, 0.2)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {/* Rank */}
              <div className="w-12 text-center">
                {entry.rank <= 3 ? (
                  <span className="text-3xl">
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  <span className="text-xl font-black text-gray-400">#{entry.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                style={{
                  background: entry.rank <= 3
                    ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: entry.rank <= 3 ? '#000000' : '#ffffff',
                }}
              >
                {entry.avatar}
              </div>

              {/* Name */}
              <div className="flex-1">
                <p className="font-black text-white">{entry.name}</p>
              </div>

              {/* Points */}
              <div className="text-right">
                <p className="text-xl font-black text-[#D4AF37]">{entry.points}</p>
                <p className="text-xs text-gray-400">pontos</p>
              </div>

              {/* Trend */}
              <div className="w-8">
                {entry.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
                {entry.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
                {entry.trend === 'same' && <div className="w-5 h-0.5 bg-gray-500"></div>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create Challenge Modal */}
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
              className="w-full max-w-md p-8 rounded-3xl"
              style={{
                background: 'rgba(10, 10, 10, 0.95)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-white">Criar Desafio</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Nome do Desafio</label>
                  <input
                    type="text"
                    placeholder="ex: Desafio de Fim de Semana"
                    className="w-full p-3 rounded-xl outline-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Objetivo</label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full p-3 rounded-xl outline-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Prémio</label>
                  <input
                    type="text"
                    placeholder="ex: Garrafa de Champanhe"
                    className="w-full p-3 rounded-xl outline-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Data de Fim</label>
                  <input
                    type="date"
                    className="w-full p-3 rounded-xl outline-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 mt-6"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000000',
                  }}
                >
                  Criar Desafio
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
