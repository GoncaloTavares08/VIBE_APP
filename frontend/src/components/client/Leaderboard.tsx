import { useState, useEffect } from 'react';
import { TrendingUp, Heart, Loader2 } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface Person {
  id: number;
  name: string;
  rank: number;
  vibes: number;
  points: number;
  photo: string | null;
  photos?: string[];
  instagram?: string;
  bio?: string;
  is_me: boolean;
}

interface LeaderboardProps {
  onPersonClick?: (person: any) => void;
}

export function Leaderboard({ onPersonClick }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'points' | 'vibes'>('points');
  const [leaderboard, setLeaderboard] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<Person | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchLeaderboard = async (isBackground = false) => {
      if (!userId) return;

      try {
        if (!isBackground) setLoading(true);
        const data = await apiFetch(`/leaderboard?sort=${activeTab}`);

        if (data.status === 'success') {
          setLeaderboard(data.data);
          // Use specific my_entry if available, otherwise try to find in list
          const me = data.my_entry || data.data.find((p: Person) => p.is_me);
          setUserRank(me || null);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    fetchLeaderboard();

    // Auto-refresh every 30 seconds
    intervalId = setInterval(() => {
      fetchLeaderboard(true);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [activeTab, userId]);

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
      <div className="space-y-3 min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
            <p className="text-gray-500 text-sm">Counting vibes...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No party people yet! 🎉</p>
          </div>
        ) : (
          leaderboard.map((person) => {
            const isTopThree = person.rank <= 3;
            const medalColor = getMedalColor(person.rank);
            const score = activeTab === 'points' ? person.points : person.vibes;

            return (
              <div
                key={person.id}
                onClick={() => {
                  if (onPersonClick) {
                    onPersonClick({
                      ...person,
                      photos: person.photos && person.photos.length > 0 ? person.photos : (person.photo ? [person.photo] : []),
                      bio: person.bio || 'Adoro boas vibes ✨', // Default text if empty
                      age: 23, // Use random/default age as DB doesn't have birthdate yet
                      distance: 'No Clube'
                    });
                  }
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${onPersonClick ? 'cursor-pointer hover:scale-105' : ''}`}
                style={{
                  background: isTopThree
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isTopThree
                    ? `1px solid ${medalColor}40`
                    : person.is_me
                      ? '1px solid rgba(212, 175, 55, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                {/* Rank Number */}
                <span
                  className="font-black text-xl italic w-10 text-center flex-shrink-0"
                  style={{
                    color: isTopThree ? medalColor : '#888',
                    textShadow: isTopThree ? `0 0 15px ${medalColor}60` : 'none'
                  }}
                >
                  #{person.rank}
                </span>

                {/* Profile Photo */}
                <div
                  className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2"
                  style={{
                    borderColor: isTopThree ? medalColor : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isTopThree ? `0 0 15px ${medalColor}40` : 'none',
                  }}
                >
                  <ImageWithFallback
                    src={person.photo || undefined}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                  <p className={`font-bold leading-tight ${person.is_me ? 'text-[#D4AF37]' : 'text-white'}`}>
                    {person.name} {person.is_me && '(You)'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {score.toLocaleString()} {activeTab === 'points' ? 'pts' : 'likes'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Current User Rank Footer */}
      {userRank && !loading && (
        <div
          className="p-4 rounded-xl text-center animate-in slide-in-from-bottom"
          style={{
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          <p className="text-[#D4AF37]">
            You are <span className="font-black">#{userRank.rank}</span> with <span className="font-bold">{activeTab === 'points' ? userRank.points : userRank.vibes}</span> {activeTab === 'points' ? 'points' : 'likes'}!
          </p>
        </div>
      )}
    </div>
  );
}
