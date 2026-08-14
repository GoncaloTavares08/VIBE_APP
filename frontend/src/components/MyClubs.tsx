import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MapPin, Calendar, Star } from 'lucide-react';
import { apiFetch } from '../services/api';
import { DiscoverEvents } from './DiscoverEvents';

interface Club {
    id: number;
    name: string;
    slug: string;
    location: string;
    joined_at: string;
    role: string;
    points: number;
}

interface MyClubsProps {
    user: any;
    onNavigate: (path: string) => void;
}

export function MyClubs({ user, onNavigate }: MyClubsProps) {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                const data = await apiFetch(`/user/clubs/${user.id}`, { method: 'GET' });
                if (data.status === 'success') {
                    setClubs(data.data);
                }
            } catch (error) {
                console.error('Error fetching clubs:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchClubs();
        }
    }, [user]);


    const formatRole = (role: string) => {
        const roles: { [key: string]: string } = {
            'CLIENT': 'Cliente',
            'STAFF': 'Staff',
            'ADMIN': 'Administrador',
            'TEAM_LEADER': 'Team Leader',
            'RP': 'RP'
        };
        return roles[role] || role;
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <section className="pt-20 pb-10 relative z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mb-12 text-center animate-pulse">
                            <div className="h-10 bg-white/10 rounded-xl w-64 mx-auto mb-4"></div>
                            <div className="h-4 bg-white/5 rounded-lg w-96 mx-auto"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map((skeleton) => (
                                <div
                                    key={skeleton}
                                    className="relative h-full rounded-3xl p-1 overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                                        backdropFilter: 'blur(20px)',
                                    }}
                                >
                                    <div className="bg-[#0a0a0a] rounded-[1.4rem] h-full flex flex-col justify-between">
                                        <div className="p-6 md:p-8 animate-pulse">
                                            {/* Icon Skeleton */}
                                            <div className="w-14 h-14 bg-white/10 rounded-2xl mb-6"></div>
                                            {/* Title Skeleton */}
                                            <div className="h-8 bg-white/10 rounded-xl w-3/4 mb-4"></div>
                                            {/* Location Skeleton */}
                                            <div className="h-4 bg-white/10 rounded-lg w-1/2 mb-6"></div>
                                        </div>
                                        {/* Bottom Bar Skeleton */}
                                        <div className="p-4 border-t border-white/5 bg-white/5 flex items-center justify-between animate-pulse">
                                            <div className="h-4 bg-white/10 rounded-lg w-24"></div>
                                            <div className="w-5 h-5 bg-white/10 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {clubs.length > 0 && (
                <section className="pt-20 pb-10 relative z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-12 text-center"
                        >
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                                Meus <span className="text-[#D4AF37]">Clubes</span>
                            </h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                Acede rapidamente aos espaços onde és membro exclusivo VIBE.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {clubs.map((club, index) => (
                                <motion.div
                                    key={club.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group relative"
                                >
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                                    />

                                    <div
                                        className="relative h-full rounded-3xl p-1 overflow-hidden transition-transform duration-500 group-hover:-translate-y-2"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                                            backdropFilter: 'blur(20px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                        }}
                                    >
                                        <div className="relative h-full bg-[#0a0a0a]/80 rounded-[22px] p-6 flex flex-col">
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h3 className="text-2xl font-black text-white mb-1 group-hover:text-[#D4AF37] transition-colors">
                                                        {club.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                        <MapPin className="w-4 h-4 text-[#D4AF37]" />
                                                        {club.location}
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 uppercase">
                                                    {formatRole(club.role)}
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-4 mb-8">
                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                    <p className="text-xs text-gray-400 mb-1">Pontos</p>
                                                    <p className="text-xl font-bold text-white flex items-center gap-2">
                                                        {club.points}
                                                        <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                                                    </p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                    <p className="text-xs text-gray-400 mb-1">Membro desde</p>
                                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        {new Date(club.joined_at).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action */}
                                            <div className="mt-auto">
                                                <button
                                                    onClick={() => onNavigate(`/${club.slug}`)}
                                                    className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-black transition-all group-hover:scale-[1.02] cursor-pointer"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                                                    }}
                                                >
                                                    Entrar no Clube
                                                    <ArrowRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <DiscoverEvents />
        </div>
    );
}


