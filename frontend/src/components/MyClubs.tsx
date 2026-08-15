import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MapPin, Calendar, Star, Crown } from 'lucide-react';
import { apiFetch } from '../services/api';
import { DiscoverEvents } from './DiscoverEvents';

interface Club {
    id: number;
    name: string;
    logo_url?: string;
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
                        {/* Title Header Skeleton */}
                        <div className="mb-12 text-center animate-pulse space-y-4">
                            <div className="h-10 sm:h-12 bg-white/10 rounded-2xl w-64 sm:w-80 mx-auto"></div>
                            <div className="h-4 sm:h-5 bg-white/5 rounded-xl w-72 sm:w-[420px] mx-auto"></div>
                        </div>

                        {/* VIP Cards Skeleton Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map((skeleton) => (
                                <div
                                    key={skeleton}
                                    className="relative h-full rounded-3xl p-1 overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
                                        backdropFilter: 'blur(20px)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                    }}
                                >
                                    <div className="relative h-full bg-[#111111] rounded-[22px] overflow-hidden flex flex-col justify-between animate-pulse">
                                        {/* Cover Banner Skeleton */}
                                        <div className="relative h-44 sm:h-48 w-full bg-white/[0.05] border-b border-white/5 overflow-hidden">
                                            {/* Role Pill Skeleton */}
                                            <div className="absolute top-3 right-3">
                                                <div className="h-6 w-24 rounded-full bg-black/80 border border-[#D4AF37]/20"></div>
                                            </div>
                                        </div>

                                        {/* Card Body Skeleton */}
                                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                            <div>
                                                <div className="flex items-baseline justify-between gap-2 mb-2">
                                                    <div className="h-6 bg-white/15 rounded-lg w-36"></div>
                                                    <div className="h-4 bg-[#D4AF37]/20 rounded-md w-14"></div>
                                                </div>
                                                <div className="h-3.5 bg-white/10 rounded w-24"></div>
                                            </div>

                                            {/* Stats Grid Skeleton */}
                                            <div className="grid grid-cols-2 gap-2.5">
                                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                                                    <div className="h-3 bg-white/10 rounded w-12"></div>
                                                    <div className="h-5 bg-white/15 rounded w-16"></div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                                                    <div className="h-3 bg-white/10 rounded w-16"></div>
                                                    <div className="h-4 bg-white/15 rounded w-20"></div>
                                                </div>
                                            </div>

                                            {/* Button Skeleton */}
                                            <div className="h-12 w-full bg-gradient-to-r from-[#D4AF37]/20 to-[#FFD700]/10 border border-[#D4AF37]/20 rounded-xl"></div>
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
            {/* SuperAdmin Global Portal Banner */}
            {user?.is_superadmin && (
                <section className="pt-20 pb-6 relative z-10">
                    <div className="max-w-4xl mx-auto px-4">
                        <div
                            className="p-6 sm:p-8 rounded-[2rem] border border-[#D4AF37]/30 text-center relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(255, 215, 0, 0.05) 100%)',
                                backdropFilter: 'blur(25px)',
                                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(212, 175, 55, 0.15)',
                            }}
                        >
                            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-black shadow-lg">
                                <Crown className="w-7 h-7 fill-black" />
                            </div>
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 mb-3 inline-block">
                                Administrador Global
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                                Painel de Controlo SuperAdmin
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto mb-6">
                                Como SuperAdmin, tens gestão centralizada sobre todos os clubes da plataforma, criação de novos estabelecimentos e atribuição de permissões de administradores.
                            </p>
                            <button
                                onClick={() => onNavigate('/superadmin')}
                                className="px-8 py-3.5 rounded-xl font-black text-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl cursor-pointer inline-flex items-center gap-2"
                                style={{
                                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                                    color: '#000000',
                                }}
                            >
                                <Crown className="w-4 h-4 fill-black" />
                                <span>Abrir Painel SuperAdmin</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </section>
            )}

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
                                         <div className="relative h-full bg-[#111111] rounded-[22px] overflow-hidden flex flex-col justify-between">
                                             {/* Full Bleed Top Cover Banner */}
                                             <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-black border-b border-white/5">
                                                 {club.logo_url ? (
                                                     <>
                                                         <img
                                                             src={club.logo_url}
                                                             alt={club.name}
                                                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                             onError={(e) => {
                                                                 (e.target as HTMLElement).style.display = 'none';
                                                             }}
                                                         />
                                                         {/* Bottom gradient overlay for seamless blending */}
                                                         <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/30 to-black/30 pointer-events-none" />
                                                     </>
                                                 ) : (
                                                     <div className="w-full h-full bg-gradient-to-br from-[#1c1c1c] via-[#141414] to-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
                                                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,transparent_70%)] pointer-events-none" />
                                                         <div className="w-20 h-20 rounded-3xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center shadow-2xl">
                                                             <span className="text-3xl font-black text-[#D4AF37]">
                                                                 {club.name.charAt(0).toUpperCase()}
                                                             </span>
                                                         </div>
                                                     </div>
                                                 )}

                                                 {/* Role Badge floating top right */}
                                                 <div className="absolute top-3 right-3 z-10">
                                                     <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-black/80 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/30 uppercase tracking-wider shadow-lg">
                                                         {formatRole(club.role)}
                                                     </span>
                                                 </div>
                                             </div>

                                             {/* Card Body */}
                                             <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                                 <div>
                                                     <div className="flex items-baseline justify-between gap-2">
                                                         <h3 className="text-xl font-bold text-white group-hover:text-[#D4AF37] transition-colors truncate">
                                                             {club.name}
                                                         </h3>
                                                         <span className="text-[11px] font-mono text-[#D4AF37]/70 shrink-0 font-medium">/{club.slug}</span>
                                                     </div>
                                                     <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
                                                         <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                                                         <span>{club.location}</span>
                                                     </div>
                                                 </div>

                                                 {/* Stats Grid */}
                                                 <div className="grid grid-cols-2 gap-2.5">
                                                     <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                                                         <p className="text-[10px] text-gray-400 font-medium">Pontos</p>
                                                         <p className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                                                             {club.points}
                                                             <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                                                         </p>
                                                     </div>
                                                     <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                                                         <p className="text-[10px] text-gray-400 font-medium">Membro desde</p>
                                                         <p className="text-xs font-semibold text-white flex items-center gap-1.5 mt-1">
                                                             <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                             {new Date(club.joined_at).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })}
                                                         </p>
                                                     </div>
                                                 </div>

                                                 {/* Action Button */}
                                                 <button
                                                     onClick={() => onNavigate(`/${club.slug}`)}
                                                     className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs text-black transition-all group-hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:scale-[1.02] cursor-pointer"
                                                     style={{
                                                         background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                                                     }}
                                                 >
                                                     <span>Entrar no Clube</span>
                                                     <ArrowRight className="w-3.5 h-3.5" />
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

            {!user?.is_superadmin && <DiscoverEvents />}
        </div>
    );
}


