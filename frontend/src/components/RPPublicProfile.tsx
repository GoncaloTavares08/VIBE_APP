import { motion } from 'motion/react';
import {
    Calendar,
    Users,
    Star,
    Clock,
    MapPin,
    Instagram,
    Sparkles,
    LogOut,
    User as UserIcon, // Alias for user icon
    Home
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

// Helper to format date
const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
};

export function RPPublicProfile({ data }: RPPublicProfileProps) {
    const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userGuestlists, setUserGuestlists] = useState<number[]>([]); // Array of event IDs

    // Get profile image (use URL or fallback to emoji)
    const profileImage = data.profile_image_url || '👨‍💼';
    const instagramHandle = data.instagram?.startsWith('@') ? data.instagram : `@${data.instagram}`;

    // Check login status and fetch guestlists
    useEffect(() => {
        const checkLogin = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUser(user);

                // Fetch user's guestlists to know join status
                if (user.id && data.events.length > 0) {
                    try {
                        const data = await apiFetch('/guestlist', {
                            method: 'GET'
                        });
                        if (data.status === 'success' && Array.isArray(data.data)) {
                            // Store IDs of events user is already in
                            const joinedEventIds = data.data.map((g: any) => g.event_id);
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

    const handleLogout = () => {
        if (window.confirm('Tem a certeza que deseja sair?')) {
            localStorage.removeItem('user');
            setCurrentUser(null);
            setUserGuestlists([]);
            window.location.reload();
        }
    };

    const isJoined = (eventId: number) => userGuestlists.includes(eventId);

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, #0a0a0a 0%, #121212 100%)',
            }}
        >
            {/* My Clubs Navigation Button (Top Left) */}
            <div className="absolute top-0 left-0 p-4 z-50">
                {currentUser && (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => window.location.href = '/'}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all font-semibold text-sm"
                        title="Voltar aos Meus Clubes"
                    >
                        <Home className="w-4 h-4" />
                        <span className="hidden sm:inline">Meus Clubes</span>
                    </motion.button>
                )}
            </div>

            {/* User Login Feedback Header */}
            <div className="absolute top-0 right-0 p-4 z-50">
                {currentUser ? (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-2 pr-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#FFD700] flex items-center justify-center text-black font-bold text-sm">
                            {currentUser.photo ? (
                                <img src={`/api/serve-image?file=${currentUser.photo}`} className="w-full h-full rounded-full object-cover" alt="" />
                            ) : (
                                (currentUser?.name || '?').charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-[#D4AF37] font-medium leading-none mb-0.5">Logado como</span>
                            <span className="text-sm text-white font-bold leading-none">{(currentUser?.name || 'User').split(' ')[0]}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="ml-2 p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                            title="Sair"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </motion.div>
                ) : (
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => window.location.href = '/'}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all font-semibold text-sm backdrop-blur-md"
                    >
                        <UserIcon className="w-4 h-4" />
                        Fazer Login
                    </motion.button>
                )}
            </div>

            {/* Animated Background Particles */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full"
                        style={{
                            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            {/* Ambient Golden Glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#D4AF37] opacity-10 blur-[150px] rounded-full"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#FFD700] opacity-10 blur-[120px] rounded-full"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-20">
                {/* HERO SECTION */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    {/* Profile Photo with Golden Ring Animation */}
                    <div className="relative inline-block mb-6">
                        {/* Animated Golden Ring */}
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: 'conic-gradient(from 0deg, #D4AF37, #FFD700, #D4AF37)',
                                padding: '4px',
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        >
                            <div
                                className="w-full h-full rounded-full"
                                style={{ background: '#0a0a0a' }}
                            />
                        </motion.div>

                        {/* Profile Image */}
                        <motion.div
                            className="relative w-48 h-48 md:w-56 md:h-56 rounded-full flex items-center justify-center text-7xl md:text-8xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(255, 215, 0, 0.2) 100%)',
                                border: '3px solid transparent',
                                boxShadow: '0 0 60px rgba(212, 175, 55, 0.4), inset 0 0 30px rgba(212, 175, 55, 0.1)',
                            }}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                        >
                            {profileImage.startsWith('http') ? (
                                <img src={profileImage} alt={data.name} className="w-full h-full rounded-full object-cover" />
                            ) : profileImage.includes('/') ? (
                                <img src={`/api/serve-image?file=${profileImage}`} alt={data.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span>{profileImage}</span>
                            )}
                        </motion.div>

                        {/* Decorative Sparkles */}
                        <motion.div
                            className="absolute -top-2 -right-2"
                            animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Sparkles className="w-8 h-8 text-[#D4AF37]" fill="#D4AF37" />
                        </motion.div>
                        <motion.div
                            className="absolute -bottom-2 -left-2"
                            animate={{ rotate: [360, 0], scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        >
                            <Sparkles className="w-6 h-6 text-[#FFD700]" fill="#FFD700" />
                        </motion.div>
                    </div>

                    {/* RP Name */}
                    <motion.h1
                        className="text-4xl md:text-5xl font-black mb-2"
                        style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {data.name}
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        className="text-xl md:text-2xl mb-4"
                        style={{ color: '#D4AF37' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        VIP Promoter
                    </motion.p>

                    {/* Instagram Handle */}
                    <motion.a
                        href={`https://instagram.com/${data.instagram?.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            color: '#D4AF37',
                        }}
                        whileHover={{
                            scale: 1.05,
                            background: 'rgba(212, 175, 55, 0.1)',
                            boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <Instagram className="w-5 h-5" />
                        <span className="font-semibold">{instagramHandle}</span>
                    </motion.a>
                </motion.div>

                {/* BIO SECTION */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mb-12"
                >
                    <div
                        className="p-6 md:p-8 rounded-3xl"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        }}
                    >
                        <h2
                            className="text-2xl font-black mb-4"
                            style={{ color: '#D4AF37' }}
                        >
                            About Me
                        </h2>
                        <p
                            className="text-base md:text-lg leading-relaxed"
                            style={{ color: '#9ca3af' }}
                        >
                            {data.bio || 'Premium nightlife curator. Join my guestlist for exclusive access to the hottest events.'}
                        </p>
                    </div>
                </motion.div>

                {/* STATS SECTION */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-16"
                >
                    {/* Total Events */}
                    <motion.div
                        className="p-6 rounded-2xl text-center"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                        }}
                        whileHover={{
                            scale: 1.05,
                            boxShadow: '0 8px 40px rgba(212, 175, 55, 0.2)',
                        }}
                    >
                        <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: '#D4AF37' }} />
                        <div className="text-4xl font-black text-white mb-1">{data.stats.totalEvents}</div>
                        <div className="text-sm" style={{ color: '#6b7280' }}>Total Events</div>
                    </motion.div>

                    {/* Total Guests */}
                    <motion.div
                        className="p-6 rounded-2xl text-center"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                        }}
                        whileHover={{
                            scale: 1.05,
                            boxShadow: '0 8px 40px rgba(212, 175, 55, 0.2)',
                        }}
                    >
                        <Users className="w-10 h-10 mx-auto mb-3" style={{ color: '#D4AF37' }} />
                        <div className="text-4xl font-black text-white mb-1">{data.stats.totalGuests.toLocaleString()}</div>
                        <div className="text-sm" style={{ color: '#6b7280' }}>Total Guests</div>
                    </motion.div>

                    {/* Rating */}
                    <motion.div
                        className="p-6 rounded-2xl text-center"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                        }}
                        whileHover={{
                            scale: 1.05,
                            boxShadow: '0 8px 40px rgba(212, 175, 55, 0.2)',
                        }}
                    >
                        <Star className="w-10 h-10 mx-auto mb-3" style={{ color: '#D4AF37' }} fill="#D4AF37" />
                        <div className="text-4xl font-black text-white mb-1">{data.stats.rating > 0 ? data.stats.rating.toFixed(1) : '-'}</div>
                        <div className="text-sm" style={{ color: '#6b7280' }}>{data.stats.reviewCount} Reviews</div>
                    </motion.div>
                </motion.div>

                {/* EVENTS SECTION */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="mb-16"
                >
                    <h2
                        className="text-3xl md:text-4xl font-black mb-8 text-center"
                        style={{ color: '#D4AF37' }}
                    >
                        Available Events
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.events.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-400 text-lg">Sem eventos disponíveis no momento.</p>
                            </div>
                        ) : (
                            data.events.map((event, index) => {
                                const userIsJoined = isJoined(event.id);

                                return (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                                        onHoverStart={() => setHoveredEvent(event.id)}
                                        onHoverEnd={() => setHoveredEvent(null)}
                                        onClick={() => {
                                            setSelectedEvent(event);
                                            setShowEventModal(true);
                                        }}
                                        className="rounded-2xl overflow-hidden cursor-pointer"
                                        style={{
                                            background: 'rgba(26, 26, 46, 0.6)',
                                            backdropFilter: 'blur(20px)',
                                            border: hoveredEvent === event.id
                                                ? '1px solid rgba(212, 175, 55, 0.6)'
                                                : '1px solid rgba(212, 175, 55, 0.2)',
                                            boxShadow: hoveredEvent === event.id
                                                ? '0 20px 60px rgba(212, 175, 55, 0.3)'
                                                : '0 8px 32px rgba(0, 0, 0, 0.4)',
                                            transform: hoveredEvent === event.id ? 'translateY(-8px)' : 'translateY(0)',
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        {/* Event Image with Gradient Overlay */}
                                        <div
                                            className="relative h-48 flex items-end p-4"
                                            style={{
                                                backgroundImage: event.image_url
                                                    ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url(${event.image_url})`
                                                    : 'linear-gradient(135deg, #D4AF37 0%, #1a1a2e 100%)',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        >
                                            {/* Club Badge */}
                                            <div
                                                className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-black"
                                                style={{
                                                    background: 'rgba(0, 0, 0, 0.7)',
                                                    backdropFilter: 'blur(10px)',
                                                    border: '1px solid rgba(212, 175, 55, 0.5)',
                                                    color: '#D4AF37',
                                                }}
                                            >
                                                {event.club}
                                            </div>

                                            {/* Event Name */}
                                            <h3 className="text-xl font-black text-white">{event.name}</h3>
                                        </div>

                                        {/* Event Details */}
                                        <div className="p-5 space-y-3">
                                            {/* Date & Time */}
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Clock className="w-4 h-4" style={{ color: '#D4AF37' }} />
                                                <span className="text-sm">{formatEventDate(event.date)} • {event.start_time.substring(0, 5)}</span>
                                            </div>

                                            {/* Location */}
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <MapPin className="w-4 h-4" style={{ color: '#D4AF37' }} />
                                                <span className="text-sm">{event.location}</span>
                                            </div>

                                            {/* Join Button */}
                                            <motion.button
                                                className="w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                                                style={{
                                                    background: userIsJoined
                                                        ? 'rgba(34, 197, 94, 0.2)'
                                                        : (hoveredEvent === event.id
                                                            ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
                                                            : 'rgba(212, 175, 55, 0.2)'),
                                                    color: userIsJoined
                                                        ? '#4ade80'
                                                        : (hoveredEvent === event.id ? '#000000' : '#D4AF37'),
                                                    border: userIsJoined
                                                        ? '1px solid rgba(34, 197, 94, 0.4)'
                                                        : '1px solid rgba(212, 175, 55, 0.4)',
                                                    cursor: userIsJoined ? 'default' : 'pointer',
                                                }}
                                                whileHover={!userIsJoined ? {
                                                    scale: 1.02,
                                                    boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
                                                } : {}}
                                                whileTap={!userIsJoined ? { scale: 0.98 } : {}}
                                                onClick={async (e) => {
                                                    e.stopPropagation();

                                                    if (userIsJoined) return;

                                                    try {
                                                        // Check if user is logged in
                                                        const userStr = localStorage.getItem('user');
                                                        if (!userStr) {
                                                            alert('Por favor, faça login primeiro para entrar na guestlist');
                                                            // Redirect to login page
                                                            window.location.href = '/';
                                                            return;
                                                        }

                                                        const user = JSON.parse(userStr);

                                                        // Check if user is guest (not authenticated)
                                                        if (!user.id || user.id === 0) {
                                                            alert('Por favor, crie uma conta para entrar na guestlist');
                                                            window.location.href = '/';
                                                            return;
                                                        }

                                                        // Get RP ID from profile data
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
                                                            // Update joined status locally
                                                            setUserGuestlists(prev => [...prev, event.id]);

                                                            // Check-in logic handled by backend message, but we can't easily know here without extra check
                                                            // Simplified success message for better UX
                                                            alert('✅ Adicionado à guestlist com sucesso!');
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
                                                        <span className="text-lg">✓</span> Já na Guestlist
                                                    </>
                                                ) : (
                                                    'Join Guestlist'
                                                )}
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )
                            })
                        )}
                    </div>
                </motion.div>

                {/* Event Detail Modal */}
                {showEventModal && selectedEvent && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}
                        onClick={() => setShowEventModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-2xl rounded-2xl backdrop-blur-xl overflow-hidden"
                            style={{
                                background: 'rgba(10, 10, 10, 0.95)',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Event Image */}
                            {selectedEvent.image_url && (
                                <div style={{ height: '300px', overflow: 'hidden' }}>
                                    <img
                                        src={selectedEvent.image_url}
                                        alt={selectedEvent.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="p-8">
                                <h2 className="text-3xl text-white font-bold mb-2">{selectedEvent.name}</h2>
                                {selectedEvent.description && <p className="text-gray-400 mb-6" style={{ whiteSpace: 'pre-wrap' }}>{selectedEvent.description}</p>}

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                                            <Calendar className="w-5 h-5" />
                                            <span className="text-sm">Data</span>
                                        </div>
                                        <div className="text-white text-lg font-semibold">
                                            {new Date(selectedEvent.date).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                                            <Clock className="w-5 h-5" />
                                            <span className="text-sm">Horário</span>
                                        </div>
                                        <div className="text-white text-lg font-semibold">
                                            {selectedEvent.start_time} - {selectedEvent.end_time}
                                        </div>
                                    </div>
                                    {selectedEvent.capacity && (
                                        <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                                <Users className="w-5 h-5" />
                                                <span className="text-sm">Capacidade</span>
                                            </div>
                                            <div className="text-white text-lg font-semibold">{selectedEvent.capacity} pessoas</div>
                                        </div>
                                    )}
                                    {selectedEvent.organizer_name && (
                                        <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                                            <div className="text-gray-400 mb-2 text-sm">Organizador</div>
                                            <div className="text-white text-lg font-semibold">{selectedEvent.organizer_name}</div>
                                        </div>
                                    )}
                                    <div className="p-4 rounded-xl col-span-2" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                                            <MapPin className="w-5 h-5" />
                                            <span className="text-sm">Local</span>
                                        </div>
                                        <div className="text-white text-lg font-semibold">{selectedEvent.location}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowEventModal(false)}
                                    className="w-full px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Footer */}
                <div className="relative z-10 text-center py-8 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <p className="text-gray-600 text-sm">
                        Powered by <span style={{ color: '#D4AF37' }}>VIBE</span> • Premium Nightlife Platform
                    </p>
                </div>
            </div>
        </div>
    );
}
