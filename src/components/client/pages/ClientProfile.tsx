import { useState } from 'react';
import { User, Eye, EyeOff, Calendar, TrendingUp, Award, Edit, Instagram, Plus, X } from 'lucide-react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';

const partyHistory = [
  {
    id: 1,
    name: 'Friday Madness',
    date: '2024-12-15',
    venue: 'Main Club',
    vibeScore: 2840,
    rank: 8,
  },
  {
    id: 2,
    name: 'Saturday Night Fever',
    date: '2024-12-09',
    venue: 'Urban Beat',
    vibeScore: 3120,
    rank: 5,
  },
  {
    id: 3,
    name: 'Techno Thursday',
    date: '2024-12-05',
    venue: 'Warehouse 23',
    vibeScore: 1980,
    rank: 12,
  },
  {
    id: 4,
    name: 'Weekend Warriors',
    date: '2024-11-30',
    venue: 'Main Club',
    vibeScore: 2650,
    rank: 9,
  },
];

export function ClientProfile() {
  const [ghostMode, setGhostMode] = useState(false);
  const [isEditingInstagram, setIsEditingInstagram] = useState(false);
  const [instagramHandle, setInstagramHandle] = useState('@andresilva');
  const [photos, setPhotos] = useState([
    'https://images.unsplash.com/photo-1638863342226-7ef651886a62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBwYXJ0eSUyMHNlbGZpZXxlbnwxfHx8fDE3NjYwNjg2OTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1763655395450-b070fc4f119b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdodGNsdWIlMjBmcmllbmRzfGVufDF8fHx8MTc2NjA2ODY5MXww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY2MDIxODU1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  ]);

  return (
    <div className="min-h-screen p-4 lg:p-8" style={{ background: '#0a0a0a' }}>
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(212, 175, 55, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.2) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div
          className="relative overflow-hidden rounded-3xl p-8"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  boxShadow: '0 0 40px rgba(212, 175, 55, 0.5)',
                }}
              >
                <User className="w-16 h-16 text-black" />
              </div>
              {/* Edit Button */}
              <button
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: '#0a0a0a',
                  border: '2px solid #D4AF37',
                }}
              >
                <Edit className="w-5 h-5 text-[#D4AF37]" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <h1
                className="text-3xl font-black"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                André Silva
              </h1>
              <p className="text-gray-400">@andresilva · Gold Member</p>
              <p className="text-sm text-gray-500 max-w-md">
                Night enthusiast 🌙 | Techno lover 🎧 | Always on the guestlist ✨
              </p>

              {/* Stats */}
              <div className="flex gap-6 pt-4 justify-center md:justify-start">
                <div>
                  <p className="text-2xl font-black text-[#D4AF37]">24</p>
                  <p className="text-xs text-gray-400">Parties</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#D4AF37]">5,420</p>
                  <p className="text-xs text-gray-400">Total Points</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#D4AF37]">#12</p>
                  <p className="text-xs text-gray-400">Global Rank</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instagram Handle */}
        <div
          className="p-6 rounded-2xl space-y-4"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Instagram className="w-5 h-5 text-[#D4AF37]" />
              Instagram
            </h2>
            <button
              onClick={() => setIsEditingInstagram(!isEditingInstagram)}
              className="text-[#D4AF37] text-sm flex items-center gap-1"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>

          {isEditingInstagram ? (
            <div className="space-y-3">
              <input
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  outline: 'none',
                }}
                placeholder="@username"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingInstagram(false)}
                  className="flex-1 py-3 rounded-xl transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingInstagram(false);
                    setInstagramHandle('@andresilva');
                  }}
                  className="px-6 py-3 rounded-xl transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#888',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="p-4 rounded-xl flex items-center gap-3"
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <Instagram className="w-6 h-6 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-lg">{instagramHandle}</span>
            </div>
          )}

          <p className="text-xs text-gray-400">
            💡 Your Instagram will be shared with people you match with
          </p>
        </div>

        {/* Photo Gallery */}
        <div
          className="p-6 rounded-2xl space-y-4"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white">My Photos</h2>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                color: '#D4AF37',
              }}
            >
              <Plus className="w-4 h-4" />
              Add Photo
            </button>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, i) => (
              <div
                key={i}
                className="group relative aspect-square rounded-xl overflow-hidden"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <ImageWithFallback
                  src={photo}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(239, 68, 68, 0.9)',
                    }}
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add Photo Placeholder */}
            {photos.length < 6 && (
              <button
                className="aspect-square rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '2px dashed rgba(212, 175, 55, 0.3)',
                }}
              >
                <Plus className="w-8 h-8 text-[#D4AF37]" />
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400">
            ✨ Add up to 6 photos. These will be shown to other party-goers.
          </p>
        </div>

        {/* Privacy Settings */}
        <div
          className="p-6 rounded-2xl space-y-4"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            {ghostMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            Privacy Control
          </h2>

          {/* Ghost Mode Toggle */}
          <div
            className="p-4 rounded-xl flex items-center justify-between"
            style={{
              background: ghostMode
                ? 'rgba(147, 51, 234, 0.1)'
                : 'rgba(255, 255, 255, 0.03)',
              border: ghostMode
                ? '1px solid rgba(147, 51, 234, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div>
              <p className="text-white font-black">Visibility in Party</p>
              <p className="text-sm text-gray-400">
                {ghostMode
                  ? "You're hidden from 'Who is Here' list"
                  : "Your presence is visible to others"}
              </p>
            </div>
            <button
              onClick={() => setGhostMode(!ghostMode)}
              className="relative w-16 h-8 rounded-full p-1 transition-all duration-300"
              style={{
                background: ghostMode
                  ? 'linear-gradient(135deg, #9333ea 0%, #c084fc 100%)'
                  : 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <div
                className="w-6 h-6 bg-white rounded-full transition-transform duration-300"
                style={{
                  transform: ghostMode ? 'translateX(32px)' : 'translateX(0)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}
              />
            </button>
          </div>

          {ghostMode && (
            <div
              className="p-3 rounded-lg flex items-start gap-3"
              style={{
                background: 'rgba(147, 51, 234, 0.1)',
                border: '1px solid rgba(147, 51, 234, 0.3)',
              }}
            >
              <EyeOff className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <p className="text-sm text-purple-300">Ghost Mode Active</p>
                <p className="text-xs text-purple-400 mt-1">
                  You'll still earn points, but others won't see you in the live party section.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div
          className="p-6 rounded-2xl space-y-4"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D4AF37]" />
            Achievements
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Early Bird', icon: '🌅', unlocked: true },
              { name: 'Night Owl', icon: '🦉', unlocked: true },
              { name: 'Social King', icon: '👑', unlocked: true },
              { name: 'VIP Legend', icon: '⭐', unlocked: false },
            ].map((achievement, i) => (
              <div
                key={i}
                className="p-4 rounded-xl text-center transition-all duration-300 hover:scale-105"
                style={{
                  background: achievement.unlocked
                    ? 'rgba(212, 175, 55, 0.1)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: achievement.unlocked
                    ? '1px solid rgba(212, 175, 55, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  opacity: achievement.unlocked ? 1 : 0.4,
                }}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <p className={`text-sm ${achievement.unlocked ? 'text-[#D4AF37]' : 'text-gray-500'}`}>
                  {achievement.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Party History Timeline */}
        <div
          className="p-6 rounded-2xl space-y-4"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Party History
          </h2>

          {/* Timeline */}
          <div className="space-y-4">
            {partyHistory.map((party, index) => (
              <div
                key={party.id}
                className="relative pl-8 pb-6 last:pb-0"
              >
                {/* Timeline Line */}
                {index !== partyHistory.length - 1 && (
                  <div
                    className="absolute left-[11px] top-6 bottom-0 w-0.5"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(212, 175, 55, 0.5) 0%, rgba(212, 175, 55, 0.1) 100%)',
                    }}
                  />
                )}

                {/* Timeline Dot */}
                <div
                  className="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    boxShadow: '0 0 15px rgba(212, 175, 55, 0.5)',
                  }}
                >
                  <div className="w-2 h-2 bg-black rounded-full" />
                </div>

                {/* Event Card */}
                <div
                  className="p-4 rounded-xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-black">{party.name}</h3>
                      <p className="text-sm text-gray-400">{party.venue}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(party.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-sm text-[#D4AF37] font-black">
                        {party.vibeScore.toLocaleString()} pts
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">
                        Rank #{party.rank}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <button
            className="w-full py-3 rounded-xl transition-all duration-300 hover:scale-105"
            style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: '#D4AF37',
            }}
          >
            View All History
          </button>
        </div>
      </div>
    </div>
  );
}