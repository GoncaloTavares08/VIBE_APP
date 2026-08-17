import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Users, Plus, Trash2, TrendingUp, Loader2, Edit2, Euro, UploadCloud, Link as LinkIcon, Image as ImageIcon, X } from 'lucide-react';
import { apiFetch } from '../../../services/api';
import { processHeicFile } from '../../../utils/imageUtils';

const formatImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `/${cleanPath}`;
};

interface Event {
  id: number;
  name: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  organizer_name?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  guestlist_count?: number;
  checked_in_count?: number;
  bar_revenue?: number;
  occupancy_percent?: number;
}

interface EventStats {
  upcoming_count: number;
  ongoing_count: number;
  completed_count: number;
  total_events: number;
  total_entries: number;
  total_guestlist: number;
  total_bar_revenue: number;
  average_occupancy: number;
  avg_entries_per_event?: number;
  last_event_name?: string | null;
  last_event_date?: string | null;
  last_event_entries?: number;
  last_event_bar_revenue?: number;
  last_event_occupancy?: number;
  next_event_name?: string | null;
  next_event_date?: string | null;
}

interface EventFormData {
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  organizer_name: string;
  image_url: string;
}

export function Events() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Flyer Image Upload States
  const [imageUploadMode, setImageUploadMode] = useState<'file' | 'url'>('file');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.id);
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
      }
    }
  }, []);

  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    capacity: 0,
    organizer_name: '',
    image_url: '',
  });

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch(`/events`, {
        method: 'GET',
      });

      if (response.status === 'success') {
        setEvents(response.data || []);
        if (response.stats) {
          setStats(response.stats);
        }
      } else {
        setError(response.message || 'Erro ao carregar eventos');
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    try {
      setUploadingImage(true);
      setError(null);
      
      let processedFile = file;
      try {
        processedFile = await processHeicFile(file);
      } catch (err) {
        setError('Erro ao converter formato da imagem do iPhone');
        setUploadingImage(false);
        return;
      }

      const data = new FormData();
      data.append('banner', processedFile);

      const response = await apiFetch('/events/upload-banner', {
        method: 'POST',
        body: data,
      });

      if (response.status === 'success' && response.image_url) {
        setFormData((prev) => ({ ...prev, image_url: response.image_url }));
      } else {
        setError(response.message || 'Erro ao enviar imagem.');
      }
    } catch (err: any) {
      console.error('Error uploading banner:', err);
      setError('Falha ao enviar imagem para o servidor.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.date || !formData.start_time || !formData.end_time || !formData.capacity) {
      setError('Por favor preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify({ ...formData, user_id: userId }),
      });

      if (response.status === 'success') {
        setShowCreateModal(false);
        setFormData({
          name: '',
          description: '',
          date: '',
          start_time: '',
          end_time: '',
          capacity: 0,
          organizer_name: '',
          image_url: '',
        });
        fetchEvents(); // Reload events
      } else {
        setError(response.message || 'Erro ao criar evento');
      }
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError('Erro ao criar evento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Tem certeza que deseja eliminar este evento?')) {
      return;
    }

    try {
      const response = await apiFetch(`/events/${eventId}`, {
        method: 'DELETE',
        body: JSON.stringify({ id: eventId, user_id: userId }),
      });

      if (response.status === 'success') {
        fetchEvents(); // Reload events
      } else {
        setError(response.message || 'Erro ao eliminar evento');
      }
    } catch (err: any) {
      console.error('Error deleting event:', err);
      setError('Erro ao eliminar evento');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      name: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      capacity: 0,
      organizer_name: '',
      image_url: '',
    });
    setImagePreview(null);
    setImageUploadMode('file');
    setShowCreateModal(true);
  };

  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description || '',
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      capacity: event.capacity,
      organizer_name: event.organizer_name || '',
      image_url: event.image_url || '',
    });
    setImagePreview(event.image_url ? formatImageUrl(event.image_url) : null);
    setImageUploadMode(event.image_url?.startsWith('http') ? 'url' : 'file');
    setSelectedEvent(null);
    setShowCreateModal(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingEvent) return;

    if (!formData.name || !formData.date || !formData.start_time || !formData.end_time || !formData.capacity) {
      setError('Por favor preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await apiFetch(`/events/${editingEvent.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...formData, user_id: userId }),
      });

      if (response.status === 'success') {
        setShowCreateModal(false);
        setEditingEvent(null);
        setFormData({
          name: '',
          description: '',
          date: '',
          start_time: '',
          end_time: '',
          capacity: 0,
          organizer_name: '',
          image_url: '',
        });
        setImagePreview(null);
        fetchEvents(); // Reload events
      } else {
        setError(response.message || 'Erro ao atualizar evento');
      }
    } catch (err: any) {
      console.error('Error updating event:', err);
      setError('Erro ao atualizar evento');
    } finally {
      setSubmitting(false);
    }
  };

  const ongoingEvents = events.filter((e) => e.status === 'ongoing');
  const upcomingEvents = events.filter((e) => e.status === 'upcoming');
  const completedEvents = events.filter((e) => e.status === 'completed');

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl text-red-300 bg-red-500/10 border border-red-500/20 text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Gestão de Eventos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
            Cria e gere as festas, capacidades e noites temáticas do clube
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg self-start sm:self-auto"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
            color: '#000000',
            boxShadow: '0 0 25px rgba(212, 175, 55, 0.35)',
          }}
        >
          <Plus className="w-5 h-5" />
          <span>Criar Evento</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Próximas Festas & Ativas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Festas Agendadas</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">{stats?.upcoming_count ?? upcomingEvents.length}</div>
            <p className="text-[10px] text-gray-400 font-medium mt-1 truncate">
              {stats?.ongoing_count && stats.ongoing_count > 0 ? (
                <span className="text-green-400 font-bold">🟢 {stats.ongoing_count} a decorrer agora</span>
              ) : stats?.next_event_name ? (
                `Próximo: ${stats.next_event_name}`
              ) : (
                `${completedEvents.length} festas realizadas`
              )}
            </p>
          </div>
        </div>

        {/* Card 2: Entradas Último Evento */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Entradas Último Evento</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {stats?.last_event_entries !== undefined ? `${stats.last_event_entries.toLocaleString('pt-PT')} pax` : '0 pax'}
            </div>
            <p className="text-[10px] text-green-400/90 font-medium mt-1 truncate">
              {stats?.last_event_name ? `${stats.last_event_name} (${stats.last_event_occupancy || 0}% lotação)` : 'Histórico de eventos'}
            </p>
          </div>
        </div>

        {/* Card 3: Média de Afluência */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Média por Festa</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-500/15 border border-green-500/30 text-green-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {stats?.avg_entries_per_event !== undefined && stats.avg_entries_per_event > 0
                ? `${stats.avg_entries_per_event.toLocaleString('pt-PT')} pax`
                : `${stats?.average_occupancy ?? 0}%`}
            </div>
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              {stats?.average_occupancy ?? 0}% de lotação média
            </p>
          </div>
        </div>

        {/* Card 4: Consumo Bar Último Evento */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Bar Último Evento</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
              <Euro className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#D4AF37]">
              €{(stats?.last_event_bar_revenue ?? 0).toLocaleString('pt-PT')}
            </div>
            <p className="text-[10px] text-gray-400 font-medium mt-1 truncate">
              {stats?.last_event_name ? `Faturação em ${stats.last_event_name}` : 'Consumo do último evento'}
            </p>
          </div>
        </div>
      </div>

      {/* Ongoing Events */}
      {ongoingEvents.length > 0 && (
        <div
          className="p-6 sm:p-8 rounded-[2rem] border border-red-500/30 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.12) 0%, rgba(15, 15, 15, 0.9) 100%)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Eventos a Decorrer (AO VIVO)
            </h2>
          </div>

          <div className="space-y-4">
            {ongoingEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="rounded-[1.75rem] transition-all duration-300 hover:scale-[1.01] cursor-pointer overflow-hidden flex flex-col md:flex-row border border-red-500/20 bg-black/60 group"
              >
                {/* Event Image */}
                {event.image_url && (
                  <div className="w-full md:w-72 h-48 md:h-auto relative overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                    <img
                      src={formatImageUrl(event.image_url)}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-3 left-3 z-20">
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm">
                        AO VIVO AGORA
                      </span>
                    </div>
                  </div>
                )}

                {/* Event Info */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-xl sm:text-2xl text-white font-black">{event.name}</h3>
                      <span className="text-red-400 font-bold text-sm bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 whitespace-nowrap">
                        Até {event.end_time}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-gray-400 line-clamp-2 mb-4 text-xs sm:text-sm">{event.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#D4AF37]" />
                        <span>Check-ins: <b className="text-white">{event.checked_in_count || 0} / {event.capacity} pax</b></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span>Ocupação: <b className="text-green-400">{event.occupancy_percent || 0}%</b></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Euro className="w-4 h-4 text-[#D4AF37]" />
                        <span>Bar: <b className="text-[#D4AF37]">€{(event.bar_revenue || 0).toLocaleString('pt-PT')}</b></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-center border-t md:border-t-0 md:border-l border-white/5 bg-white/[0.02]">
                  <button className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors">
                    Gerir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div
        className="p-6 sm:p-8 rounded-[2rem] border border-white/10"
        style={{
          background: 'rgba(15, 15, 15, 0.75)',
          backdropFilter: 'blur(25px)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            Próximos Eventos ({upcomingEvents.length})
          </h2>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            Nenhum evento futuro agendado. Clica em "Criar Evento" para agendar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.02] hover:border-[#D4AF37]/40 transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden group shadow-lg flex flex-col justify-between"
              >
                {/* Image */}
                {event.image_url ? (
                  <div className="h-44 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                    <img
                      src={formatImageUrl(event.image_url)}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 z-20">
                      <span className="bg-black/60 border border-white/20 text-[#D4AF37] text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md">
                        {event.start_time} - {event.end_time}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center border-b border-white/5">
                    <Calendar className="w-8 h-8 text-gray-600" />
                  </div>
                )}

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors mb-1">{event.name}</h3>
                    <p className="text-xs text-[#D4AF37] font-medium mb-3">
                      {new Date(event.date).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {event.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{event.description}</p>
                    )}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-white/5 text-[11px] text-gray-400">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Capacidade: <b>{event.capacity} pax</b></span>
                      </div>
                      <span className="text-green-400 font-bold">{event.guestlist_count || 0} na guestlist</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Events */}
      {completedEvents.length > 0 && (
        <div
          className="p-6 sm:p-8 rounded-[2rem] border border-white/10"
          style={{
            background: 'rgba(15, 15, 15, 0.75)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h2 className="text-lg sm:text-xl font-black text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            Eventos Anteriores ({completedEvents.length})
          </h2>

          <div className="space-y-3">
            {completedEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 flex-shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{event.name}</h3>
                    <p className="text-xs text-gray-400">
                      {new Date(event.date).toLocaleDateString('pt-PT')} • {event.start_time} - {event.end_time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto text-xs">
                  <div className="text-right">
                    <span className="text-white font-bold block">{event.checked_in_count || 0} / {event.capacity} pax</span>
                    <span className="text-[10px] text-gray-400">{event.occupancy_percent || 0}% lotação</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#D4AF37] font-black block">€{(event.bar_revenue || 0).toLocaleString('pt-PT')}</span>
                    <span className="text-[10px] text-gray-400">Consumo Bar</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/20">
                    Concluído
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(15px)' }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-full max-w-xl rounded-[2rem] overflow-hidden border border-[#D4AF37]/30 shadow-2xl"
            style={{
              background: 'rgba(15, 15, 15, 0.95)',
              backdropFilter: 'blur(30px)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedEvent.image_url && (
              <div className="h-56 sm:h-64 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                <img src={formatImageUrl(selectedEvent.image_url)} alt={selectedEvent.name} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl text-white font-black mb-2">{selectedEvent.name}</h2>
              {selectedEvent.description && (
                <p className="text-gray-400 text-xs sm:text-sm mb-6 leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" /><span>Data</span>
                  </div>
                  <div className="text-white text-xs sm:text-sm font-bold">
                    {new Date(selectedEvent.date).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1 text-xs">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" /><span>Horário</span>
                  </div>
                  <div className="text-white text-xs sm:text-sm font-bold">{selectedEvent.start_time} - {selectedEvent.end_time}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1 text-xs">
                    <Users className="w-3.5 h-3.5 text-[#D4AF37]" /><span>Capacidade</span>
                  </div>
                  <div className="text-white text-xs sm:text-sm font-bold">{selectedEvent.capacity} pessoas</div>
                </div>
                {selectedEvent.organizer_name && (
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="text-gray-400 mb-1 text-xs">Organizador</div>
                    <div className="text-white text-xs sm:text-sm font-bold">{selectedEvent.organizer_name}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    handleEditClick(selectedEvent);
                  }}
                  className="px-5 py-3 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold hover:bg-[#D4AF37]/30 transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />Editar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteEvent(selectedEvent.id); setSelectedEvent(null); }}
                  className="px-5 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/25 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Event Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(15px)' }}
          onClick={() => { setShowCreateModal(false); setEditingEvent(null); }}
        >
          <div
            className="w-full max-w-xl p-6 sm:p-8 rounded-[2rem] border border-[#D4AF37]/30 shadow-2xl"
            style={{
              background: 'rgba(15, 15, 15, 0.95)',
              backdropFilter: 'blur(30px)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl sm:text-2xl font-black text-white mb-5">{editingEvent ? 'Editar Evento' : 'Criar Novo Evento'}</h2>
            <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nome do Evento *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                  placeholder="Ex: Electric Gold Night"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                  placeholder="Descrição da noite e atrações..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Data *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hora Início *</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hora Fim *</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lotação (Pessoas) *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                    placeholder="500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Organizador</label>
                  <input
                    type="text"
                    value={formData.organizer_name}
                    onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                    placeholder="VIBE Club"
                  />
                </div>
              </div>

              {/* Flyer / Poster Upload Section */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Flyer / Imagem do Evento
                </label>

                {/* Upload Mode Switcher */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setImageUploadMode('file')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      imageUploadMode === 'file'
                        ? 'bg-[#D4AF37] text-black shadow-md'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Ficheiro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUploadMode('url')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      imageUploadMode === 'url'
                        ? 'bg-[#D4AF37] text-black shadow-md'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Link / URL</span>
                  </button>
                </div>

                {imageUploadMode === 'file' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      className="hidden"
                    />

                    {imagePreview || formData.image_url ? (
                      <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/30 bg-black/60 group h-44 flex items-center justify-center">
                        <img
                          src={imagePreview || formatImageUrl(formData.image_url)}
                          alt="Flyer Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md transition-all flex items-center gap-1.5"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            Trocar Ficheiro
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData((prev) => ({ ...prev, image_url: '' }));
                            }}
                            className="p-2 rounded-xl bg-red-500/30 hover:bg-red-500/50 text-red-300 backdrop-blur-md transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {uploadingImage && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
                            <span className="text-xs text-white font-bold">A enviar imagem...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/15 hover:border-[#D4AF37]/50 rounded-2xl p-6 text-center cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                      >
                        {uploadingImage ? (
                          <div className="flex flex-col items-center justify-center gap-2 py-4">
                            <Loader2 className="w-7 h-7 animate-spin text-[#D4AF37]" />
                            <p className="text-xs text-white font-bold">A processar ficheiro...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 py-2">
                            <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center mb-1">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-white">Clica para carregar imagem do computador</p>
                            <p className="text-[11px] text-gray-400">Suporta JPG, PNG ou WebP (máx. 10MB)</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                      placeholder="https://exemplo.com/flyer.jpg"
                    />
                    {formData.image_url && (
                      <div className="mt-2 h-36 rounded-xl overflow-hidden border border-white/10">
                        <img
                          src={formData.image_url}
                          alt="Preview URL"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingEvent(null);
                    setImagePreview(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
                  disabled={submitting || uploadingImage}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-xs transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000000',
                  }}
                  disabled={submitting || uploadingImage}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{editingEvent ? 'A guardar...' : 'A criar...'}</span>
                    </>
                  ) : (
                    editingEvent ? 'Confirmar Alterações' : 'Criar Evento'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
