import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MapPin, Calendar, Star } from 'lucide-react';

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
                const response = await fetch(`/api/controllers/user_clubs.php?user_id=${user.id}`);
                const data = await response.json();
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
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (clubs.length === 0) {
        return (
            <section className="py-20 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div
                            className="rounded-3xl p-12 text-center"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(20px)',
                            }}
                        >
                            <div
                                className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                                style={{
                                    background: 'rgba(212, 175, 55, 0.1)',
                                    border: '2px solid rgba(212, 175, 55, 0.3)',
                                }}
                            >
                                <MapPin className="w-12 h-12 text-[#D4AF37]" />
                            </div>

                            <h2
                                className="text-3xl md:text-4xl font-black mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Ainda sem clubes
                            </h2>

                            <p className="text-gray-300 mb-6 leading-relaxed">
                                Ainda não tens acesso a nenhum clube VIBE.<br />
                                Para te juntares a um clube, visita a página de um RP e entra numa guestlist.
                            </p>

                            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                                <Star className="w-4 h-4 text-[#D4AF37]" />
                                <span>Entra num guestlist de algum RP do clube para obteres acesso ao mesmo.</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20 relative z-10">
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
    );
}
