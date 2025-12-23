import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, Trash2, TrendingUp, Loader2, Edit2 } from 'lucide-react';
import { apiFetch } from '../../../services/api';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      const response = await apiFetch('/controllers/events.php', {
        method: 'GET',
      });

      if (response.status === 'success') {
        setEvents(response.data || []);
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.date || !formData.start_time || !formData.end_time || !formData.capacity) {
      setError('Por favor preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await apiFetch('/controllers/events.php', {
        method: 'POST',
        body: JSON.stringify(formData),
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
      const response = await apiFetch('/controllers/events.php', {
        method: 'DELETE',
        body: JSON.stringify({ id: eventId }),
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

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingEvent || !formData.name || !formData.date || !formData.start_time || !formData.end_time || !formData.capacity) {
      setError('Por favor preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await apiFetch('/controllers/events.php', {
        method: 'PUT',
        body: JSON.stringify({
          id: editingEvent.id,
          ...formData
        }),
      });

      if (response.status === 'success') {
        // Fechar o modal de edição
        setShowCreateModal(false);
        setEditingEvent(null);

        // Recarregar eventos
        await fetchEvents();

        // Encontrar o evento atualizado e abrir o modal de detalhes
        const updatedEvent = {
          ...editingEvent,
          ...formData
        };
        setSelectedEvent(updatedEvent);

        // Limpar o formulário
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

  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const completedEvents = events.filter(e => e.status === 'completed');

  const totalCapacity = upcomingEvents.reduce((sum, e) => sum + e.capacity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div
          className="p-4 rounded-xl text-white bg-red-500/20 border border-red-500/50"
        >
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white mb-2">Events Management</h1>
          <p className="text-gray-400">Gere eventos e noites temáticas</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
            color: '#000000',
            boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
          }}
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Criar Evento</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          className="p-6 rounded-2xl backdrop-blur-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Upcoming Events</span>
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="text-3xl text-white">{upcomingEvents.length}</div>
        </div>

        <div
          className="p-6 rounded-2xl backdrop-blur-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Total Capacity</span>
            <Users className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="text-3xl text-white">{totalCapacity}</div>
        </div>

        <div
          className="p-6 rounded-2xl backdrop-blur-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Completed Events</span>
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="text-3xl text-white">{completedEvents.length}</div>
        </div>

        <div
          className="p-6 rounded-2xl backdrop-blur-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">This Month</span>
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="text-3xl text-white">{events.length}</div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div
        className="p-6 rounded-2xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h2 className="text-xl text-white mb-6">Upcoming Events</h2>
        <div className="space-y-4">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum evento agendado
            </div>
          ) : (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                }}
              >
                {/* Event Image */}
                {event.image_url && (
                  <div style={{ height: '200px' }}>
                    <img
                      src={event.image_url}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Event Info */}
                <div className="p-4">
                  <h3 className="text-xl text-white font-bold mb-1">{event.name}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(event.date).toLocaleDateString('pt-PT')} • {event.start_time}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Past Events */}
      <div
        className="p-6 rounded-2xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h2 className="text-xl text-white mb-6">Past Events</h2>
        <div className="space-y-4">
          {completedEvents.map((event) => (
            <div
              key={event.id}
              className="p-5 rounded-xl"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg text-white">{event.name}</h3>
                    <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                      Completed
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400 mb-1 text-xs">Data</div>
                      <div className="text-white">{new Date(event.date).toLocaleDateString('pt-PT')}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1 text-xs">Horário</div>
                      <div className="text-white">{event.start_time} - {event.end_time}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1 text-xs">Capacidade</div>
                      <div className="text-white">{event.capacity}</div>
                    </div>
                    {event.organizer_name && (
                      <div>
                        <div className="text-gray-400 mb-1 text-xs">Organizador</div>
                        <div className="text-white">{event.organizer_name}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
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
            {selectedEvent.image_url && (
              <div style={{ height: '300px' }}>
                <img src={selectedEvent.image_url} alt={selectedEvent.name} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-8">
              <h2 className="text-3xl text-white font-bold mb-2">{selectedEvent.name}</h2>
              {selectedEvent.description && <p className="text-gray-400 mb-6" style={{ whiteSpace: 'pre-wrap' }}>{selectedEvent.description}</p>}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Calendar className="w-5 h-5" /><span className="text-sm">Data</span>
                  </div>
                  <div className="text-white text-lg font-semibold">
                    {new Date(selectedEvent.date).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Clock className="w-5 h-5" /><span className="text-sm">Horário</span>
                  </div>
                  <div className="text-white text-lg font-semibold">{selectedEvent.start_time} - {selectedEvent.end_time}</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Users className="w-5 h-5" /><span className="text-sm">Capacidade</span>
                  </div>
                  <div className="text-white text-lg font-semibold">{selectedEvent.capacity} pessoas</div>
                </div>
                {selectedEvent.organizer_name && (
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <div className="text-gray-400 mb-2 text-sm">Organizador</div>
                    <div className="text-white text-lg font-semibold">{selectedEvent.organizer_name}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button onClick={() => setSelectedEvent(null)} className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                  Fechar
                </button>
                <button
                  onClick={() => {
                    setEditingEvent(selectedEvent);
                    setFormData({
                      name: selectedEvent.name,
                      description: selectedEvent.description || '',
                      date: selectedEvent.date,
                      start_time: selectedEvent.start_time,
                      end_time: selectedEvent.end_time,
                      capacity: selectedEvent.capacity,
                      organizer_name: selectedEvent.organizer_name || '',
                      image_url: selectedEvent.image_url || '',
                    });
                    setSelectedEvent(null);
                    setShowCreateModal(true);
                  }}
                  className="px-6 py-3 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/30 transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-5 h-5" />Editar
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(selectedEvent.id); setSelectedEvent(null); }} className="px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => { setShowCreateModal(false); setEditingEvent(null); }}
        >
          <div
            className="w-full max-w-2xl p-8 rounded-2xl backdrop-blur-xl"
            style={{
              background: 'rgba(10, 10, 10, 0.95)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl text-white mb-6">{editingEvent ? 'Editar Evento' : 'Criar Novo Evento'}</h2>
            <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Nome do Evento *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none"
                  placeholder="Electric Fridays"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none"
                  placeholder="Descrição do evento..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Data *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">Hora de Início *</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Hora de Fim *</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">Capacidade (Pessoas) *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none"
                    placeholder="500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Organizador</label>
                  <input
                    type="text"
                    value={formData.organizer_name}
                    onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none"
                    placeholder="João Silva"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-2">URL da Imagem *</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none"
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
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
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000000',
                    boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
                  }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{editingEvent ? 'Guardando...' : 'Criando...'}</span>
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
