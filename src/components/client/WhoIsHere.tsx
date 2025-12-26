import { useState, useEffect } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { apiFetch } from '../../services/api';
import { X, Heart, Sparkles } from 'lucide-react';

interface Person {
  id: number;
  name: string;
  age: number;
  bio: string;
  vibes: number;
  photos: string[];
  distance: string;
  instagram?: string;
}

interface WhoIsHereProps {
  userId: number;
  onMatch?: (person: Person) => void;
  onPersonClick?: (person: Person) => void;
}

export function WhoIsHere({ userId, onMatch, onPersonClick }: WhoIsHereProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPerson = people[currentIndex];

  // Fetch people in same event
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(`/controllers/client_who_is_here.php?user_id=${userId}`);

        if (response.status === 'success') {
          setPeople(response.data || []);
          setError(null);
        } else {
          setError(response.message || 'Erro ao carregar pessoas');
          setPeople([]);
        }
      } catch (err: any) {
        console.error('Error fetching people:', err);
        setError(err.message || 'Erro ao conectar ao servidor');
        setPeople([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPeople();
    }
  }, [userId]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    setSwipeDirection(direction);

    // Call backend to save like/pass
    try {
      const response = await apiFetch('/controllers/client_event_likes.php?action=swipe', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          liked_id: currentPerson.id,
          action: direction === 'right' ? 'like' : 'pass'
        })
      });

      if (response.status === 'success' && response.is_match) {
        // Show match animation - will close when user clicks
        setTimeout(() => {
          setShowMatchAnimation(true);
          onMatch?.(currentPerson);
        }, 300);
        return;
      }
    } catch (error) {
      console.error('Swipe error:', error);
    }

    // Move to next person
    setTimeout(() => {
      moveToNext();
    }, 300);
  };

  const moveToNext = () => {
    setSwipeDirection(null);
    setCurrentPhotoIndex(0);

    setPeople(prevPeople => {
      const newPeople = [...prevPeople];
      newPeople.splice(currentIndex, 1);

      // Adjust index if we removed the last item
      if (currentIndex >= newPeople.length && newPeople.length > 0) {
        setCurrentIndex(newPeople.length - 1);
      } else if (newPeople.length === 0) {
        setCurrentIndex(0);
      }

      return newPeople;
    });
  };


  const nextPhoto = () => {
    if (currentPerson && currentPhotoIndex < currentPerson.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-gray-400 py-8">
        {error}
      </div>
    );
  }

  if (!currentPerson || people.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        Ainda não há ninguém visível na festa... 👻
      </div>
    );
  }

  return (
    <div className="relative max-w-md mx-auto">
      {/* Match Animation */}
      {showMatchAnimation && currentPerson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.95)' }}
          onClick={() => {
            setShowMatchAnimation(false);
            moveToNext();
          }}
        >
          <div className="text-center space-y-6 max-w-md mx-4 p-8 rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%)',
              border: '2px solid rgba(212, 175, 55, 0.5)',
            }}
          >
            <div className="text-8xl">✨</div>
            <h2
              className="text-5xl font-black"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              It's a Match!
            </h2>
            <p className="text-gray-300">
              Tu e {currentPerson.name} deram like um no outro
            </p>

            {/* Show Instagram */}
            {currentPerson.instagram && (
              <div
                className="mt-4 p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <p className="text-sm text-gray-400 mb-1">Instagram desbloqueado:</p>
                <p className="text-2xl font-black text-[#D4AF37]">
                  @{currentPerson.instagram}
                </p>
              </div>
            )}

            <p className="text-sm text-gray-400 mt-4">
              Toca para continuar
            </p>
          </div>
        </div>
      )}

      {/* Swipeable Card */}
      <div
        className={`relative transition-all duration-300 ${swipeDirection === 'left' ? 'translate-x-[-150%] rotate-[-20deg] opacity-0' : ''
          } ${swipeDirection === 'right' ? 'translate-x-[150%] rotate-[20deg] opacity-0' : ''
          }`}
      >
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{
            height: '600px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Photo with click zones */}
          <div className="relative w-full h-full" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width / 2) {
              prevPhoto();
            } else {
              nextPhoto();
            }
          }}>
            <ImageWithFallback
              src={currentPerson.photos[currentPhotoIndex]}
              alt={currentPerson.name}
              className="w-full h-full object-cover"
            />

            {/* Gradient Overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(0,0,0,0.9) 100%)',
              }}
            />

            {/* Photo Indicators */}
            <div className="absolute top-4 left-0 right-0 flex gap-2 px-4">
              {currentPerson.photos.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full transition-all"
                  style={{
                    background: i === currentPhotoIndex
                      ? 'rgba(212, 175, 55, 0.9)'
                      : 'rgba(255, 255, 255, 0.3)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Info Overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 p-6 space-y-3 cursor-pointer transition-colors hover:bg-black/20"
            onClick={(e) => {
              e.stopPropagation(); // Prevent photo navigation
              onPersonClick?.(currentPerson);
            }}
          >
            {/* Name & Age */}
            <div>
              <h2
                className="text-4xl font-black"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {currentPerson.name}, {currentPerson.age}
              </h2>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm text-[#D4AF37]">{currentPerson.vibes} VIBES</span>
              </div>
            </div>

            {/* Bio */}
            <p className="text-white text-sm">{currentPerson.bio}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-6 mt-6">
        {/* Pass Button */}
        <button
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
          }}
        >
          <X className="w-8 h-8 text-red-400" strokeWidth={3} />
        </button>

        {/* Like Button */}
        <button
          onClick={() => handleSwipe('right')}
          className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
            boxShadow: '0 8px 30px rgba(212, 175, 55, 0.5)',
          }}
        >
          <Heart className="w-10 h-10 text-black" fill="black" strokeWidth={0} />
        </button>
      </div>

      {/* Counter */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-400">
          {currentIndex + 1} / {people.length}
        </p>
      </div>
    </div>
  );
}
