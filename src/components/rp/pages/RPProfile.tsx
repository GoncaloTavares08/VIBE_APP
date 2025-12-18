import { useState } from 'react';
import { ExternalLink, Edit, Share2, Instagram, Copy, CheckCircle2, Calendar, MapPin, Music } from 'lucide-react';

export function RPProfile() {
  const [copiedBio, setCopiedBio] = useState(false);

  const rpData = {
    name: 'João Silva',
    username: 'joaosilva',
    bio: 'VIP Promoter @ VIBE • Lisboa Nightlife 🌃 • DM for guestlist access ✨',
    profileImage: 'J',
    instagram: '@joaosilva_vibe',
    publicLink: 'vibe.app/rp/joaosilva',
    totalEntries: 2847,
    eventsHosted: 24,
  };

  const upcomingEvents = [
    {
      id: '1',
      name: 'Electric Fridays',
      date: '2025-12-20',
      time: '23:00',
      venue: 'VIBE Club',
      flyer: '🎉',
    },
    {
      id: '2',
      name: 'Neon Nights',
      date: '2025-12-27',
      time: '22:00',
      venue: 'VIBE Club',
      flyer: '✨',
    },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(rpData.publicLink);
    setCopiedBio(true);
    setTimeout(() => setCopiedBio(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl text-white mb-2">My Public Profile</h1>
        <p className="text-gray-400">Preview da tua página pública para clientes</p>
      </div>

      {/* Profile Preview Card */}
      <div
        className="p-6 lg:p-8 rounded-3xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl text-white">Public Landing Page</h2>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:scale-105 flex items-center gap-2"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                color: '#D4AF37',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              className="px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:scale-105 flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                color: '#000000',
              }}
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">View Live</span>
            </button>
          </div>
        </div>

        {/* Profile Header */}
        <div
          className="p-6 lg:p-8 rounded-2xl mb-6"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            {/* Avatar */}
            <div
              className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                boxShadow: '0 0 40px rgba(212, 175, 55, 0.4)',
              }}
            >
              <span className="text-5xl lg:text-6xl text-black font-black">{rpData.profileImage}</span>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl text-white mb-2">{rpData.name}</h1>
              <p className="text-[#D4AF37] mb-4">@{rpData.username}</p>
              <p className="text-gray-300 mb-6 max-w-2xl">{rpData.bio}</p>

              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mb-6">
                <div>
                  <div className="text-2xl text-white font-bold">{rpData.totalEntries.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Total Entries</div>
                </div>
                <div>
                  <div className="text-2xl text-white font-bold">{rpData.eventsHosted}</div>
                  <div className="text-sm text-gray-400">Events Hosted</div>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <a
                  href={`https://instagram.com/${rpData.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <Instagram className="w-4 h-4" />
                  <span>{rpData.instagram}</span>
                </a>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-8 text-center">
            <button
              className="px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                color: '#000000',
                boxShadow: '0 0 40px rgba(212, 175, 55, 0.4)',
              }}
            >
              <span className="text-lg font-bold">Join My Guestlist</span>
            </button>
          </div>
        </div>

        {/* Public Link */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Your Public Link</label>
          <div
            className="p-4 rounded-xl flex items-center gap-2 sm:gap-3"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <ExternalLink className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
            <input
              type="text"
              value={rpData.publicLink}
              readOnly
              className="flex-1 bg-transparent text-white outline-none min-w-0"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
              style={{
                background: copiedBio ? 'rgba(34, 197, 94, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                color: copiedBio ? '#22c55e' : '#D4AF37',
                border: copiedBio ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              {copiedBio ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-semibold">Copy</span>
                </>
              )}
            </button>
            <button
              className="px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                color: '#000000',
              }}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-semibold">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div
        className="p-6 rounded-3xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-white">Your Upcoming Events</h2>
          <button
            className="px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:scale-105"
            style={{
              background: 'rgba(212, 175, 55, 0.2)',
              color: '#D4AF37',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
          >
            <span className="font-semibold">Manage Events</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl"
                  style={{
                    background: 'rgba(212, 175, 55, 0.2)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                  }}
                >
                  {event.flyer}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg text-white font-semibold mb-3">{event.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Music className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{event.venue}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Customization */}
      <div
        className="p-6 rounded-3xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h2 className="text-xl text-white mb-6">Customize Your Profile</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Display Name</label>
            <input
              type="text"
              defaultValue={rpData.name}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Username</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">vibe.app/rp/</span>
              <input
                type="text"
                defaultValue={rpData.username}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Bio</label>
            <textarea
              defaultValue={rpData.bio}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Instagram Handle</label>
            <input
              type="text"
              defaultValue={rpData.instagram}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              className="px-6 py-3 rounded-xl transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#888888',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              Cancel
            </button>
            <button
              className="px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                color: '#000000',
              }}
            >
              <span className="font-semibold">Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
