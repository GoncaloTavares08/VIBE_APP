import { useState } from 'react';
import { TrendingUp, Heart } from 'lucide-react';

interface Person {
  id: number;
  name: string;
  age: number;
  bio: string;
  vibes: number;
  points: number;
  photos: string[];
  distance: string;
  instagram?: string;
}

interface LeaderboardProps {
  onPersonClick: (person: Person) => void;
}

const mockLeaderboard: Person[] = [
  {
    id: 1,
    name: 'Miguel Torres',
    age: 27,
    bio: 'Always at the best parties 🌙',
    points: 12420,
    vibes: 521,
    distance: '8m away',
    photos: ['https://images.unsplash.com/photo-1632958983989-49773325c326?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMGZhc2hpb258ZW58MXx8fHwxNzY2MDY4NzM0fDA&ixlib=rb-4.1.0&q=80&w=1080'],
    instagram: '@migueltorres',
  },
  {
    id: 2,
    name: 'Sofia Alves',
    age: 24,
    bio: 'Techno addict 🎧 | Love good vibes ✨',
    points: 11850,
    vibes: 689,
    distance: '12m away',
    photos: ['https://images.unsplash.com/photo-1760595968567-c5b981a8d6df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwcG9ydHJhaXQlMjBuaWdodHxlbnwxfHx8fDE3NjYwNjg3MzR8MA&ixlib=rb-4.1.0&q=80&w=1080'],
    instagram: '@sofiaalves',
  },
  {
    id: 3,
    name: 'Ricardo Lima',
    age: 26,
    bio: 'VIP enthusiast 👑',
    points: 10200,
    vibes: 445,
    distance: '5m away',
    photos: ['https://images.unsplash.com/photo-1632958983989-49773325c326?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMGZhc2hpb258ZW58MXx8fHwxNzY2MDY4NzM0fDA&ixlib=rb-4.1.0&q=80&w=1080'],
    instagram: '@ricardolima',
  },
  {
    id: 4,
    name: 'Carolina',
    age: 23,
    bio: 'Dance floor queen 👑',
    points: 9750,
    vibes: 712,
    distance: '15m away',
    photos: ['https://images.unsplash.com/photo-1665700301643-def92acad454?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGNsdWIlMjBvdXRmaXR8ZW58MXx8fHwxNzY2MDY4NzM0fDA&ixlib=rb-4.1.0&q=80&w=1080'],
    instagram: '@carolinamartins',
  },
  {
    id: 5,
    name: 'João Silva',
    age: 25,
    bio: 'Music lover 🎵',
    points: 8920,
    vibes: 556,
    distance: '10m away',
    photos: ['https://images.unsplash.com/photo-1632958983989-49773325c326?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMGZhc2hpb258ZW58MXx8fHwxNzY2MDY4NzM0fDA&ixlib=rb-4.1.0&q=80&w=1080'],
    instagram: '@joaosilva',
  },
];

export function Leaderboard({ onPersonClick }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'points' | 'vibes'>('points');

  const sortedLeaderboard = [...mockLeaderboard].sort((a, b) => {
    if (activeTab === 'points') {
      return b.points - a.points;
    }
    return b.vibes - a.vibes;
  });

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return 'rgba(212, 175, 55, 0.3)';
    }
  };

  return (
    <div
      className="p-6 rounded-2xl space-y-4"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">Tonight's Leaderboard</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('points')}
          className="flex-1 py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
          style={{
            background: activeTab === 'points'
              ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(255, 215, 0, 0.2) 100%)'
              : 'rgba(255, 255, 255, 0.03)',
            border: activeTab === 'points'
              ? '1px solid rgba(212, 175, 55, 0.5)'
              : '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <TrendingUp className={`w-4 h-4 ${activeTab === 'points' ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
          <span className={activeTab === 'points' ? 'text-[#D4AF37]' : 'text-gray-400'}>
            Points
          </span>
        </button>

        <button
          onClick={() => setActiveTab('vibes')}
          className="flex-1 py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
          style={{
            background: activeTab === 'vibes'
              ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(219, 39, 119, 0.2) 100%)'
              : 'rgba(255, 255, 255, 0.03)',
            border: activeTab === 'vibes'
              ? '1px solid rgba(236, 72, 153, 0.5)'
              : '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Heart className={`w-4 h-4 ${activeTab === 'vibes' ? 'text-pink-400' : 'text-gray-400'}`} />
          <span className={activeTab === 'vibes' ? 'text-pink-400' : 'text-gray-400'}>
            Likes
          </span>
        </button>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {sortedLeaderboard.map((person, index) => {
          const rank = index + 1;
          const isTopThree = rank <= 3;
          const medalColor = getMedalColor(rank);
          const score = activeTab === 'points' ? person.points : person.vibes;

          return (
            <button
              key={person.id}
              onClick={() => onPersonClick(person)}
              className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: isTopThree
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.02)',
                border: isTopThree
                  ? `1px solid ${medalColor}40`
                  : '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {/* Rank Badge */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-black flex-shrink-0"
                style={{
                  background: isTopThree ? medalColor : 'rgba(255, 255, 255, 0.1)',
                  color: isTopThree ? '#000' : '#888',
                  boxShadow: isTopThree ? `0 0 20px ${medalColor}60` : 'none',
                }}
              >
                #{rank}
              </div>

              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-white truncate">{person.name}</p>
                <p className="text-sm text-gray-400">
                  {score.toLocaleString()} {activeTab === 'points' ? 'pts' : 'likes'}
                </p>
              </div>

              {/* View Profile Hint */}
              <div className="text-xs text-gray-500 flex-shrink-0">
                Tap to view
              </div>
            </button>
          );
        })}
      </div>

      {/* Current User Rank */}
      <div
        className="p-4 rounded-xl text-center"
        style={{
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
        }}
      >
        <p className="text-[#D4AF37]">
          You are <span className="font-black">#12</span> · 500 {activeTab === 'points' ? 'pts' : 'likes'} to top 10
        </p>
      </div>
    </div>
  );
}
