import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, MapPin, Search, Star, Users, ChevronDown } from 'lucide-react';
import { apiFetch } from '../services/api';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Club {
    id: number;
    name: string;
    slug: string;
    location: string;
}

interface Event {
    id: number;
    name: string;
    description: string | null;
    date: string;
    start_time: string;
    end_time: string;
    capacity: number;
    image_url: string | null;
    club: Club;
}

interface RP {
    name: string;
    username: string;
    avatar: string | null;
    points: number;
}

export function DiscoverEvents() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCity, setActiveCity] = useState<string>('Todas');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [rpList, setRpList] = useState<RP[]>([]);
    const [loadingRps, setLoadingRps] = useState(false);
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const [citySearch, setCitySearch] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Fetch upcoming global events
                const response = await apiFetch('/events?status=upcoming');
                if (response.status === 'success') {
                    setEvents(response.data || []);
                }
            } catch (error) {
                console.error('Error fetching global events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Extract unique cities from events and sort alphabetically
    const availableCities = Array.from(new Set(events.filter(e => e.club?.location).map(e => e.club.location))).sort();
    const cities = ['Todas', ...availableCities];
    
    const filteredCities = cities.filter(c => 
        c.toLowerCase().includes(citySearch.toLowerCase())
    );

    const filteredEvents = activeCity === 'Todas' 
        ? events 
        : events.filter(e => e.club?.location === activeCity);

    const handleEventClick = async (event: Event) => {
        setSelectedEvent(event);
        setLoadingRps(true);
        try {
            const response = await apiFetch(`/events/${event.id}/rps`);
            if (response.status === 'success') {
                setRpList(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching RPs for event:', error);
            setRpList([]);
        } finally {
            setLoadingRps(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20 relative z-10">
                <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-20 space-y-4 relative z-10">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-2xl font-black text-white">Sem Eventos Próximos</h3>
                <p className="text-gray-400">De momento não existem eventos agendados nos clubes VIBE.</p>
            </div>
        );
    }

    return (
        <section className="py-20 relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-black mb-4"
                        style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                        Descobrir Eventos
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Encontra as melhores festas e entra nas guestlists dos clubes mais exclusivos.
                    </p>
                </div>

                {/* City Dropdown */}
                {cities.length > 2 && (
                    <div className="flex justify-center mb-12 relative z-20">
                        <div className="relative w-full max-w-xs">
                            <button
                                onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                                className="w-full flex items-center justify-between px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 transition-colors duration-300"
                            >
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-[#D4AF37]" />
                                    <span className="font-bold text-white">
                                        {activeCity === 'Todas' ? 'Todas as Cidades' : activeCity}
                                    </span>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isCityDropdownOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-10" 
                                            onClick={() => setIsCityDropdownOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-[#111111] border border-white/10 rounded-2xl shadow-xl z-20 overflow-hidden flex flex-col"
                                        >
                                            <div className="p-3 border-b border-white/5 shrink-0">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                    <input
                                                        type="text"
                                                        placeholder="Pesquisar cidade..."
                                                        value={citySearch}
                                                        onChange={(e) => setCitySearch(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-56 overflow-y-auto custom-scrollbar p-2">
                                                {filteredCities.length === 0 ? (
                                                    <p className="text-center text-sm text-gray-500 py-4">Nenhuma cidade encontrada.</p>
                                                ) : (
                                                    filteredCities.map((city) => (
                                                        <button
                                                            key={city}
                                                            onClick={() => {
                                                                setActiveCity(city);
                                                                setIsCityDropdownOpen(false);
                                                                setCitySearch('');
                                                            }}
                                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                                                                activeCity === city 
                                                                ? 'bg-[#D4AF37]/20 text-[#D4AF37]' 
                                                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                                            }`}
                                                        >
                                                            {city === 'Todas' ? 'Todas as Cidades' : city}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredEvents.map((event, index) => (
                            <motion.div
                                key={event.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="group cursor-pointer"
                                onClick={() => handleEventClick(event)}
                            >
                                <div className="relative rounded-3xl overflow-hidden aspect-[4/5] bg-[#0a0a0a] border border-white/10 group-hover:border-[#D4AF37]/50 transition-all duration-500">
                                    <div className="absolute inset-0">
                                        <ImageWithFallback
                                            src={event.image_url || `https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxuaWdodGNsdWIlMjBwYXJ0eXxlbnwwfHx8fDE3MjMzOTQzMTR8MA&ixlib=rb-4.1.0&q=80&w=1080`}
                                            alt={event.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
                                    </div>

                                    {/* Club Badge */}
                                    <div className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 flex justify-between items-start">
                                        <div className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 md:gap-2">
                                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#D4AF37]" />
                                            <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-wider truncate max-w-[100px] md:max-w-none">{event.club?.name || 'VIBE Club'}</span>
                                        </div>
                                        <div className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-gray-300">
                                            <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#D4AF37]" />
                                            {event.club?.location || 'Local'}
                                        </div>
                                    </div>

                                    {/* Content Info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 space-y-3 md:space-y-4 transform md:translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <h3 className="text-xl md:text-2xl font-black text-white leading-tight line-clamp-2">
                                            {event.name}
                                        </h3>
                                        
                                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-300">
                                            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg backdrop-blur-md">
                                                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#D4AF37]" />
                                                {new Date(event.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg backdrop-blur-md">
                                                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#D4AF37]" />
                                                {event.start_time.substring(0, 5)}
                                            </div>
                                        </div>

                                        <div className="pt-1 md:pt-2 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500 md:delay-100 hidden md:block">
                                            <div className="w-full py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black font-black text-center shadow-[0_0_20px_rgba(212,175,55,0.4)] text-sm md:text-base">
                                                Juntar à Guestlist
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* RP Selector Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                        onClick={() => setSelectedEvent(null)}
                    >
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-[#111111] rounded-3xl border border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-hidden flex flex-col max-h-[85vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/10 shrink-0">
                                <h3 className="text-2xl font-black text-white text-center">Escolher Promotor</h3>
                                <p className="text-gray-400 text-sm text-center mt-2">
                                    Seleciona um RP do <span className="text-[#D4AF37] font-bold">{selectedEvent.club?.name}</span> para aceder à lista do evento <span className="text-white font-bold">{selectedEvent.name}</span>.
                                </p>
                            </div>

                            {/* Modal Body (Scrollable) */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                {loadingRps ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-gray-500 text-sm">A procurar os melhores RPs...</p>
                                    </div>
                                ) : rpList.length === 0 ? (
                                    <div className="text-center py-10">
                                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400">Nenhum RP público disponível neste clube.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {rpList.map((rp, i) => (
                                            <div
                                                key={rp.username}
                                                onClick={() => window.location.href = `/guest/${rp.username}`}
                                                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#D4AF37]/40 hover:bg-white/10 cursor-pointer transition-all duration-300 group"
                                            >
                                                <div className="relative">
                                                    {i < 3 && (
                                                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] flex items-center justify-center border-2 border-[#111] z-10 shadow-lg">
                                                            <Star className="w-3 h-3 text-black fill-black" />
                                                        </div>
                                                    )}
                                                    <ImageWithFallback
                                                        src={rp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rp.name)}&background=D4AF37&color=000`}
                                                        alt={rp.name}
                                                        className="w-14 h-14 rounded-full object-cover border border-white/10 group-hover:border-[#D4AF37]/50 transition-colors"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-white font-bold truncate group-hover:text-[#D4AF37] transition-colors">{rp.name}</h4>
                                                    <p className="text-gray-400 text-sm truncate">@{rp.username}</p>
                                                </div>
                                                
                                                <div className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1.5 rounded-full">
                                                    Escolher
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* Modal Footer */}
                            <div className="p-4 border-t border-white/10 shrink-0">
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="w-full py-3 rounded-xl bg-white/5 text-gray-300 font-bold hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}
