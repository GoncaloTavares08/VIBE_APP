import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    Calendar,
    Users,
    Star,
    Clock,
    MapPin,
    Instagram,
    LogOut,
    User as UserIcon,
    Home,
    Check,
    ArrowRight
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { apiFetch } from '../services/api';

interface Event {
    id: number;
    name: string;
    description?: string;
    club: string;
    club_slug: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
    image_url: string;
    capacity?: number;
    organizer_name?: string;
}

interface RPProfileData {
    id: number;
    name: string;
    username: string;
    bio: string;
    instagram: string;
    profile_image_url: string;
    stats: {
        totalEvents: number;
        totalGuests: number;
        rating: number;
        reviewCount: number;
    };
    events: Event[];
}

interface RPPublicProfileProps {
    data: RPProfileData;
}

const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
};

export function RPPublicProfile({ data }: RPPublicProfileProps) {
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userGuestlists, setUserGuestlists] = useState<number[]>([]);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

    const profileImage = data.profile_image_url || '👨‍💼';
    const instagramHandle = data.instagram?.startsWith('@') ? data.instagram : `@${data.instagram}`;

    useEffect(() => {
        const checkLogin = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUser(user);

                try {
                    const profileResponse = await apiFetch('/profile', { method: 'GET' });
                    if (profileResponse.status === 'success' && profileResponse.data?.profile_photo_path) {
                        setProfilePhotoUrl(profileResponse.data.profile_photo_path);
                    } else if (user.photo || user.profile_photo_path) {
                        setProfilePhotoUrl(user.photo || user.profile_photo_path);
                    }
                } catch (e) {
                    console.error("Error fetching profile photo", e);
                }

                if (user.id && data.events.length > 0) {
                    try {
                        const response = await apiFetch('/guestlist', { method: 'GET' });
                        if (response.status === 'success' && Array.isArray(response.data)) {
                            const joinedEventIds = response.data.map((g: any) => g.event_id);
                            setUserGuestlists(joinedEventIds);
                        }
                    } catch (error) {
                        console.error("Error fetching user guestlists", error);
                    }
                }
            }
        };
        checkLogin();
    }, [data.events]);

    useEffect(() => {
        if (showEventModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showEventModal]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setCurrentUser(null);
        setUserGuestlists([]);
        
        // Force full page reload to landing page to clear all React state (including App.tsx)
        window.location.href = '/';
    };

    const isJoined = (eventId: number) => userGuestlists.includes(eventId);

    return (
        <div className="min-h-screen bg-[#050505] text-white relative font-sans selection:bg-[#D4AF37]/30 selection:text-white pb-24">

            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#D4AF37] opacity-5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-[#FFD700] opacity-[0.03] blur-[100px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-overlay"></div>
            </div>

            {/* Navigation Header */}
            <header className="fixed top-0 left-0 w-full z-50 bg-[#050505]/60 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div>
                        {currentUser && (
                            <button
                                onClick={() => {
                                    window.history.pushState({}, '', '/');
                                    window.dispatchEvent(new PopStateEvent('popstate'));
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-gray-300 hover:text-white"
                            >
                                <Home className="w-4 h-4" />
                                <span className="hidden sm:inline">Meus Clubes</span>
                            </button>
                        )}
                    </div>

                    <div>
                        {currentUser ? (
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Logado</span>
                                    <span className="text-sm font-semibold text-white">{(currentUser?.name || 'User').split(' ')[0]}</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#FFD700] p-[2px]">
                                    <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center overflow-hidden">
                                        {profilePhotoUrl ? (
                                            <img src={profilePhotoUrl.startsWith('http') ? profilePhotoUrl : `/api/serve-image?file=${profilePhotoUrl}`} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <span className="text-xs text-[#D4AF37] font-bold">{(currentUser?.name || '?').charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 ml-1 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                    title="Terminar sessão"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    window.history.pushState({}, '', '/');
                                    window.dispatchEvent(new PopStateEvent('popstate'));
                                }}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37] text-black hover:bg-[#FFD700] transition-colors text-sm font-bold shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                            >
                                <UserIcon className="w-4 h-4" />
                                Entrar
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto px-4 pt-16 md:pt-24">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center text-center mb-16"
                >
                    {/* Profile Picture */}
                    <div className="relative mb-6 group">
                        <div className="absolute inset-0 bg-[#D4AF37] blur-3xl opacity-20 rounded-full group-hover:opacity-30 transition-opacity duration-700" />
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] p-1 bg-gradient-to-b from-white/10 to-transparent shadow-2xl">
                            <div className="w-full h-full rounded-[2.3rem] overflow-hidden bg-[#111]">
                                {profileImage.startsWith('http') ? (
                                    <img src={profileImage} alt={data.name} className="w-full h-full object-cover" />
                                ) : profileImage.includes('/') ? (
                                    <img src={`/api/serve-image?file=${profileImage}`} alt={data.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-[#111] to-[#222]">
                                        {profileImage}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tight">
                        {data.name}
                    </h1>

                    <p className="text-lg md:text-xl text-[#D4AF37] font-medium mb-6">
                        VIP Promoter
                    </p>

                    <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
                        {data.bio || 'Criador de experiências noturnas premium. Junta-te à minha guestlist para garantires entrada nos melhores eventos da cidade com acesso exclusivo.'}
                    </p>

                    {data.instagram && (
                        <a
                            href={`https://instagram.com/${data.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-semibold"
                        >
                            <Instagram className="w-4 h-4 text-[#D4AF37]" />
                            {instagramHandle}
                        </a>
                    )}
                </motion.div>

                {/* Stats Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-3xl mx-auto bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-3xl p-6 md:p-8 flex flex-wrap sm:flex-nowrap items-center justify-around gap-6 mb-24 shadow-2xl"
                >
                    <div className="flex flex-col items-center gap-1 w-full sm:w-auto">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Eventos</span>
                        </div>
                        <span className="text-3xl md:text-4xl font-bold text-white">{data.stats.totalEvents}</span>
                    </div>

                    <div className="hidden sm:block w-px h-12 bg-white/10"></div>

                    <div className="flex flex-col items-center gap-1 w-full sm:w-auto">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Convidados</span>
                        </div>
                        <span className="text-3xl md:text-4xl font-bold text-white">{data.stats.totalGuests.toLocaleString()}</span>
                    </div>

                    <div className="hidden sm:block w-px h-12 bg-white/10"></div>

                    <div className="flex flex-col items-center gap-1 w-full sm:w-auto">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Star className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Rating</span>
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="text-3xl md:text-4xl font-bold text-white">{data.stats.rating > 0 ? data.stats.rating.toFixed(1) : '-'}</span>
                            {data.stats.rating > 0 && <span className="text-sm text-gray-500 mb-1">/5</span>}
                        </div>
                    </div>
                </motion.div>

                {/* Events Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                            Eventos <span className="text-[#D4AF37]">Exclusivos</span>
                        </h2>
                    </div>

                    {data.events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/5 rounded-3xl">
                            <Calendar className="w-12 h-12 text-gray-600 mb-4" />
                            <p className="text-gray-400 font-medium">Não há eventos disponíveis neste momento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.events.map((event, index) => {
                                const userIsJoined = isJoined(event.id);

                                return (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                                        onClick={() => {
                                            setSelectedEvent(event);
                                            setShowEventModal(true);
                                        }}
                                        className="group cursor-pointer rounded-[2rem] bg-white/[0.02] border border-white/5 overflow-hidden hover:bg-white/[0.04] transition-all duration-300 hover:border-white/10 hover:-translate-y-1"
                                    >
                                        {/* Image Header */}
                                        <div className="relative h-48 w-full overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
                                            <img
                                                src={event.image_url || 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1000&auto=format&fit=crop'}
                                                alt={event.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            {/* Club Badge */}
                                            <div className="absolute top-4 left-4 z-20">
                                                <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white uppercase tracking-wider">
                                                    {event.club}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 pt-2">
                                            <h3 className="text-xl font-bold text-white mb-4 line-clamp-1 group-hover:text-[#D4AF37] transition-colors">{event.name}</h3>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-[#D4AF37]">
                                                        <Calendar className="w-4 h-4" />
                                                    </div>
                                                    <span>{formatEventDate(event.date)} • {event.start_time.substring(0, 5)}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-[#D4AF37]">
                                                        <MapPin className="w-4 h-4" />
                                                    </div>
                                                    <span className="truncate">{event.location}</span>
                                                </div>
                                            </div>

                                            <button
                                                className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${userIsJoined
                                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                        : 'bg-white/5 text-white border border-white/10 hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37]'
                                                    }`}
                                                onClick={async (e) => {
                                                    e.stopPropagation();

                                                    if (userIsJoined) return;

                                                    try {
                                                        const userStr = localStorage.getItem('user');
                                                        if (!userStr) {
                                                            alert('Por favor, faça login primeiro para entrar na guestlist');
                                                            window.history.pushState({}, '', '/');
                                                            window.dispatchEvent(new PopStateEvent('popstate'));
                                                            return;
                                                        }

                                                        const user = JSON.parse(userStr);

                                                        if (!user.id || user.id === 0) {
                                                            alert('Por favor, crie uma conta para entrar na guestlist');
                                                            window.history.pushState({}, '', '/');
                                                            window.dispatchEvent(new PopStateEvent('popstate'));
                                                            return;
                                                        }

                                                        const rpId = data.id;

                                                        const result = await apiFetch('/guestlist/join', {
                                                            method: 'POST',
                                                            headers: {
                                                                'X-Client-ID': event.club_slug,
                                                            },
                                                            body: JSON.stringify({
                                                                user_id: user.id,
                                                                event_id: event.id,
                                                                rp_id: rpId
                                                            })
                                                        });

                                                        if (result.status === 'success') {
                                                            setUserGuestlists(prev => [...prev, event.id]);
                                                        } else {
                                                            alert(result.message || 'Erro ao entrar na guestlist');
                                                        }
                                                    } catch (error) {
                                                        console.error('Error joining guestlist:', error);
                                                        alert('Erro ao entrar na guestlist. Tenta novamente.');
                                                    }
                                                }}
                                            >
                                                {userIsJoined ? (
                                                    <>
                                                        <Check className="w-4 h-4" /> Adicionado
                                                    </>
                                                ) : (
                                                    <>
                                                        Participar <ArrowRight className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </main>

            {/* Event Detail Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showEventModal && selectedEvent && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                            onClick={() => setShowEventModal(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: "spring", duration: 0.5 }}
                                className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-y-auto shadow-2xl relative max-h-[90vh]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header Image */}
                                <div className="relative h-56 w-full shrink-0">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
                                    <img
                                        src={selectedEvent.image_url || 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1000&auto=format&fit=crop'}
                                        alt={selectedEvent.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={() => setShowEventModal(false)}
                                        className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="p-6 md:p-8 pt-0 relative z-20 -mt-6">
                                    <div className="inline-block px-3 py-1 bg-[#D4AF37] text-black text-xs font-bold rounded-full uppercase tracking-wider mb-3">
                                        {selectedEvent.club}
                                    </div>

                                    <h2 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight">
                                        {selectedEvent.name}
                                    </h2>

                                    {selectedEvent.description && (
                                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                            {selectedEvent.description}
                                        </p>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 mb-8">
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <div className="flex items-center gap-2 text-[#D4AF37] mb-1">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-xs font-semibold uppercase">Data</span>
                                            </div>
                                            <div className="text-sm font-medium text-white">
                                                {formatEventDate(selectedEvent.date)}
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <div className="flex items-center gap-2 text-[#D4AF37] mb-1">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-xs font-semibold uppercase">Horário</span>
                                            </div>
                                            <div className="text-sm font-medium text-white">
                                                {selectedEvent.start_time.substring(0, 5)} - {selectedEvent.end_time.substring(0, 5)}
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 col-span-2">
                                            <div className="flex items-center gap-2 text-[#D4AF37] mb-1">
                                                <MapPin className="w-4 h-4" />
                                                <span className="text-xs font-semibold uppercase">Localização</span>
                                            </div>
                                            <div className="text-sm font-medium text-white">
                                                {selectedEvent.location}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setShowEventModal(false);
                                        }}
                                        className="w-full py-4 rounded-xl font-bold bg-[#D4AF37] text-black hover:bg-[#FFD700] transition-colors shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                                    >
                                        Entendido
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
