import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Plus, Target, Gift, X, Loader2, CheckCircle2, AlertCircle, Trash2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../../ui/GlassCard';
import { apiFetch } from '../../../services/api';

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

interface LeaderboardEntry {
    id: number;
    rank: number;
    name: string;
    entries: number;
    revenue: number;
    trend: 'up' | 'down' | 'same';
    initials: string;
    avatar: string | null;
}

export function RPCompetitions() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const [newChallenge, setNewChallenge] = useState({
        title: '',
        target: '',
        reward: '',
        start_date: todayStr,
        end_date: ''
    });

    const loadData = async () => {
        try {
            const [challengesRes, leaderboardRes] = await Promise.all([
                apiFetch('/rp/challenges', { method: 'GET' }),
                apiFetch('/rp/leaderboard', { method: 'GET' })
            ]);

            if (challengesRes.status === 'success') {
                setChallenges(challengesRes.data || []);
            }

            if (leaderboardRes.status === 'success') {
                setLeaderboard(leaderboardRes.data || []);
            }
        } catch (err) {
            console.error('Error fetching competitions data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

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

    const applyPreset = (title: string, target: number, reward: string, daysAhead: number) => {
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + daysAhead);

        setNewChallenge({
            title,
            target: target.toString(),
            reward,
            start_date: start.toISOString().split('T')[0],
            end_date: end.toISOString().split('T')[0]
        });
    };

    const handleCreateChallenge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChallenge.title || !newChallenge.target || !newChallenge.reward || !newChallenge.start_date || !newChallenge.end_date) {
            setFormMessage({ type: 'error', text: 'Por favor preencha todos os campos incluindo as datas de início e fim.' });
            return;
        }

        setCreating(true);
        setFormMessage(null);

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
                setFormMessage({ type: 'success', text: 'Desafio criado com sucesso!' });
                setNewChallenge({ title: '', target: '', reward: '', start_date: todayStr, end_date: '' });
                await loadData();
                setTimeout(() => {
                    setShowCreateModal(false);
                    setFormMessage(null);
                }, 1200);
            } else {
                setFormMessage({ type: 'error', text: res.message || 'Erro ao criar desafio.' });
            }
        } catch (err: any) {
            setFormMessage({ type: 'error', text: err.message || 'Erro ao criar desafio.' });
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-12 w-64 bg-white/5 rounded-2xl"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white/5 rounded-[2rem] border border-white/5"></div>
                    ))}
                </div>
                <div className="h-96 bg-white/5 rounded-[2rem] border border-white/5"></div>
            </div>
        );
    }

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
                    <p className="text-gray-400 font-medium">Desafios de equipa e prémios por performance</p>
                </div>
                <button
                    onClick={() => {
                        setFormMessage(null);
                        setShowCreateModal(true);
                    }}
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
                {challenges.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {challenges.map((challenge) => {
                            const progress = challenge.target > 0 
                                ? Math.min(Math.round((challenge.current / challenge.target) * 100), 100) 
                                : 0;

                            return (
                                <GlassCard
                                    key={challenge.id}
                                    className="p-6 md:p-8 flex flex-col h-full hover:-translate-y-1 transition-all duration-300 relative group"
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
                                            <span className="text-sm font-medium text-gray-400">Progresso Pessoal</span>
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
                    <GlassCard className="p-8 text-center text-gray-400 font-medium">
                        Nenhum desafio ativo no momento. Cria o primeiro desafio acima!
                    </GlassCard>
                )}
            </div>

            {/* Leaderboard */}
            <GlassCard className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-8">
                    <Trophy className="w-8 h-8 text-[#D4AF37]" />
                    <h2 className="text-2xl font-bold text-white">Classificação dos Promotores</h2>
                </div>

                {leaderboard.length > 0 ? (
                    <div className="space-y-3">
                        {leaderboard.map((entry) => (
                            <motion.div
                                key={entry.id}
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
                                    {entry.avatar ? (
                                        <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{entry.initials}</span>
                                    )}
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-lg truncate">{entry.name}</p>
                                </div>

                                {/* Entries */}
                                <div className="text-right">
                                    <p className="text-xl font-black text-[#D4AF37]">{entry.entries}</p>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">entradas</p>
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
                ) : (
                    <div className="text-center py-8 text-gray-400 font-medium">
                        Sem dados na classificação este mês
                    </div>
                )}
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

                            {/* Quick Presets */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                                    <span>Modelos Rápidos</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => applyPreset('⚡ Sprint Fim de Semana', 20, 'Bónus VIP', 3)}
                                        className="p-2.5 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 text-left transition-all"
                                    >
                                        <p className="text-xs font-bold text-white">Sprint 3 Dias</p>
                                        <p className="text-[10px] text-gray-400">20 Entradas</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyPreset('🏆 Meta Mensal', 50, 'Garrafa de Oferta VIP', 30)}
                                        className="p-2.5 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 text-left transition-all"
                                    >
                                        <p className="text-xs font-bold text-white">Meta do Mês</p>
                                        <p className="text-[10px] text-gray-400">50 Entradas</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyPreset('👑 Top Promoter VIP', 100, 'Jantar de Equipa', 30)}
                                        className="p-2.5 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 text-left transition-all"
                                    >
                                        <p className="text-xs font-bold text-white">Top Equipa</p>
                                        <p className="text-[10px] text-gray-400">100 Entradas</p>
                                    </button>
                                </div>
                            </div>

                            {formMessage && (
                                <div
                                    className="mb-4 p-4 rounded-xl flex items-center gap-3"
                                    style={{
                                        background: formMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: formMessage.type === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                                    }}
                                >
                                    {formMessage.type === 'success' ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    )}
                                    <p className={formMessage.type === 'success' ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
                                        {formMessage.text}
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
                                    disabled={creating}
                                    className="w-full py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02] mt-6 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2"
                                    style={{
                                        background: 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)',
                                        color: '#000000',
                                    }}
                                >
                                    {creating ? (
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
        </div>
    );
}
