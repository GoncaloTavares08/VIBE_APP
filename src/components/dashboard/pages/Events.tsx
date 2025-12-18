import { useState } from 'react';
import { Calendar, Clock, Users, Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  actualGuests?: number;
  organizer: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  revenue: number;
}

const mockEvents: Event[] = [
  {
    id: '1',
    name: 'Electric Fridays',
    date: '2025-12-20',
    startTime: '23:00',
    endTime: '06:00',
    capacity: 450,
    actualGuests: 523,
    organizer: 'João Silva',
    status: 'completed',
    revenue: 12450,
  },
  {
    id: '2',
    name: 'Urban Saturdays',
    date: '2025-12-21',
    startTime: '23:30',
    endTime: '06:00',
    capacity: 320,
    actualGuests: 298,
    organizer: 'Maria Costa',
    status: 'completed',
    revenue: 8940,
  },
  {
    id: '3',
    name: 'Neon Nights',
    date: '2025-12-27',
    startTime: '22:00',
    endTime: '05:00',
    capacity: 500,
    organizer: 'Pedro Santos',
    status: 'upcoming',
    revenue: 0,
  },
  {
    id: '4',
    name: 'New Year Countdown',
    date: '2025-12-31',
    startTime: '21:00',
    endTime: '08:00',
    capacity: 800,
    organizer: 'Ana Ribeiro',
    status: 'upcoming',
    revenue: 0,
  },
];

export function Events() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events] = useState<Event[]>(mockEvents);

  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const completedEvents = events.filter(e => e.status === 'completed');

  const totalCapacity = upcomingEvents.reduce((sum, e) => sum + e.capacity, 0);
  const avgAttendance = completedEvents.length > 0
    ? Math.round((completedEvents.reduce((sum, e) => sum + (e.actualGuests || 0), 0) / completedEvents.reduce((sum, e) => sum + e.capacity, 0)) * 100)
    : 0;

  return (
    <div className="space-y-6">
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
            <span className="text-gray-400">Avg Attendance</span>
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="text-3xl text-white">{avgAttendance}%</div>
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
                className="p-5 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl text-white">{event.name}</h3>
                      <span
                        className="px-3 py-1 rounded-full text-xs"
                        style={{
                          background: 'rgba(212, 175, 55, 0.2)',
                          color: '#D4AF37',
                        }}
                      >
                        {event.capacity} pessoas
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs">Data</span>
                        </div>
                        <div className="text-white">{new Date(event.date).toLocaleDateString('pt-PT')}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs">Horário</span>
                        </div>
                        <div className="text-white">{event.startTime} - {event.endTime}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <Users className="w-4 h-4" />
                          <span className="text-xs">Capacidade</span>
                        </div>
                        <div className="text-white">{event.capacity} pessoas</div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1 text-xs">Organizador</div>
                        <div className="text-white">{event.organizer}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      title="Edit Event"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400 mb-1 text-xs">Data</div>
                      <div className="text-white">{new Date(event.date).toLocaleDateString('pt-PT')}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1 text-xs">Horário</div>
                      <div className="text-white">{event.startTime} - {event.endTime}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1 text-xs">Ocupação</div>
                      <div className="text-white">{event.actualGuests} / {event.capacity}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1 text-xs">Attendance</div>
                      <div className="text-[#D4AF37]">
                        {event.actualGuests && Math.round((event.actualGuests / event.capacity) * 100)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1 text-xs">Revenue</div>
                      <div className="text-[#D4AF37]">€{event.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => setShowCreateModal(false)}
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
            <h2 className="text-2xl text-white mb-6">Criar Novo Evento</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Nome do Evento</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none"
                  placeholder="Electric Fridays"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Data</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">Hora de Início</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Hora de Fim</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">Capacidade (Pessoas)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Organizador</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none"
                    placeholder="João Silva"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000000',
                    boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
                  }}
                >
                  Criar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
