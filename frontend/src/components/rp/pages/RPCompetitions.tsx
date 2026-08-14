import { useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Plus, Target, Gift, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../../ui/GlassCard';

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

export function RPCompetitions() {
    const [showCreateModal, setShowCreateModal] = useState(false);

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
                    }}>Competições</h1>
                    <p className="text-gray-400 font-medium">Motive a sua equipa com desafios e prémios</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                    style={{
                        background: 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)',
                        color: '#000000',
                    }}
                >
                    <Plus className="w-5 h-5" />
                    <span>Criar Desafio</span>
                </button>
            </div>

            {/* Active Challenges */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Desafios Ativos</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {activeChallenges.map((challenge) => {
                        const progress = (challenge.current / challenge.target) * 100;

                        return (
                            <GlassCard
                                key={challenge.id}
                                className="p-6 md:p-8 flex flex-col h-full hover:-translate-y-2 transition-transform duration-300"
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
                                    <div
                                        className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                                        style={{
                                            background: 'rgba(34, 197, 94, 0.15)',
                                            color: '#4ade80',
                                        }}
                                    >
                                        Ativo
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2">{challenge.name}</h3>
                                    <p className="text-sm text-gray-400 font-medium mb-6">Termina: {challenge.endDate}</p>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-400">Progresso</span>
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
                                    <p className="text-xs font-medium text-[#D4AF37] opacity-80 mt-2 text-right">{Math.round(progress)}% completo</p>
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
            </div>

            {/* Leaderboard */}
            <GlassCard className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-8">
                    <Trophy className="w-8 h-8 text-[#D4AF37]" />
                    <h2 className="text-2xl font-bold text-white">Classificação da Equipa</h2>
                </div>

                <div className="space-y-3">
                    {leaderboard.map((entry) => (
                        <motion.div
                            key={entry.rank}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: entry.rank * 0.05 }}
                            className="flex items-center gap-4 p-4 rounded-[1.5rem] transition-colors hover:bg-white/5"
                            style={{
                                background: entry.rank <= 3
                                    ? 'rgba(212, 175, 55, 0.1)'
                                    : 'rgba(0, 0, 0, 0.3)',
                                border: entry.rank <= 3
                                    ? '1px solid rgba(212, 175, 55, 0.2)'
                                    : '1px solid rgba(255, 255, 255, 0.05)',
                            }}
                        >
                            {/* Rank */}
                            <div className="w-12 text-center flex justify-center">
                                {entry.rank <= 3 ? (
                                    <span className="text-3xl drop-shadow-md">
                                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                                    </span>
                                ) : (
                                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                        <span className="text-white font-bold">#{entry.rank}</span>
                                    </div>
                                )}
                            </div>

                            {/* Avatar */}
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg overflow-hidden shrink-0"
                                style={{
                                    background: entry.rank <= 3
                                        ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
                                        : 'rgba(255, 255, 255, 0.1)',
                                    color: entry.rank <= 3 ? '#000000' : '#ffffff',
                                    border: entry.rank <= 3 ? 'none' : '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                {entry.avatar}
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white text-lg truncate">{entry.name}</p>
                            </div>

                            {/* Points */}
                            <div className="text-right">
                                <p className="text-xl font-black text-[#D4AF37]">{entry.points}</p>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">pontos</p>
                            </div>

                            {/* Trend */}
                            <div className="w-8 flex justify-end">
                                {entry.trend === 'up' && <div className="bg-green-400/10 p-1.5 rounded-full"><TrendingUp className="w-4 h-4 text-green-400" /></div>}
                                {entry.trend === 'down' && <div className="bg-red-400/10 p-1.5 rounded-full"><TrendingDown className="w-4 h-4 text-red-400" /></div>}
                                {entry.trend === 'same' && <div className="bg-gray-500/10 p-1.5 rounded-full"><div className="w-4 h-0.5 bg-gray-400"></div></div>}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </GlassCard>

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
                            className="w-full max-w-md p-8 rounded-[2rem]"
                            style={{
                                background: 'rgba(15, 15, 15, 0.95)',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-bold text-white">Criar Desafio</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2.5 rounded-2xl transition-all duration-300 hover:bg-white/10 bg-white/5 border border-white/10"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <form className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Nome do Desafio</label>
                                    <input
                                        type="text"
                                        placeholder="ex: Desafio de Fim de Semana"
                                        className="w-full p-4 rounded-2xl outline-none font-medium transition-all focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50"
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.4)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: '#ffffff',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Objetivo</label>
                                    <input
                                        type="number"
                                        placeholder="100"
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
                                        placeholder="ex: Garrafa de Champanhe"
                                        className="w-full p-4 rounded-2xl outline-none font-medium transition-all focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50"
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.4)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: '#ffffff',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Data de Fim</label>
                                    <input
                                        type="date"
                                        className="w-full p-4 rounded-2xl outline-none font-medium transition-all focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50"
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.4)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: '#ffffff',
                                            colorScheme: 'dark'
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02] mt-8 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                                    style={{
                                        background: 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)',
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
