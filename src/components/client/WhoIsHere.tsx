import { useState } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { X, Heart, MapPin, Sparkles } from 'lucide-react';

interface Person {
  id: number;
  name: string;
  age: number;
  bio: string;
  vibes: number;
  photos: string[];
  distance: string;
}

const mockPeople: Person[] = [
  {
    id: 1,
    name: 'Sofia',
    age: 24,
    bio: 'Techno addict 🎧 | Love good vibes ✨',
    vibes: 342,
    distance: '12m away',
    photos: [
      'https://images.unsplash.com/photo-1760595968567-c5b981a8d6df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwcG9ydHJhaXQlMjBuaWdodHxlbnwxfHx8fDE3NjYwNjg3MzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1638863342226-7ef651886a62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBwYXJ0eSUyMHNlbGZpZXxlbnwxfHx8fDE3NjYwNjg2OTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
  },
  {
    id: 2,
    name: 'Miguel',
    age: 27,
    bio: 'Always at the best parties 🌙',
    vibes: 521,
    distance: '8m away',
    photos: [
      'https://images.unsplash.com/photo-1632958983989-49773325c326?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMGZhc2hpb258ZW58MXx8fHwxNzY2MDY4NzM0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1763655395450-b070fc4f119b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdodGNsdWIlMjBmcmllbmRzfGVufDF8fHx8MTc2NjA2ODY5MXww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
  },
  {
    id: 3,
    name: 'Carolina',
    age: 23,
    bio: 'Dance floor queen 👑 | Looking for good energy',
    vibes: 287,
    distance: '15m away',
    photos: [
      'https://images.unsplash.com/photo-1665700301643-def92acad454?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGNsdWIlMjBvdXRmaXR8ZW58MXx8fHwxNzY2MDY4NzM0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY2MDIxODU1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
  },
];

interface WhoIsHereProps {
  onMatch?: (person: Person) => void;
  onPersonClick?: (person: Person) => void;
}

export function WhoIsHere({ onMatch, onPersonClick }: WhoIsHereProps) {
  const [people, setPeople] = useState<Person[]>(mockPeople);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);

  const currentPerson = people[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);

    setTimeout(() => {
      if (direction === 'right') {
        // Simulate match 50% of the time
        if (Math.random() > 0.5) {
          setShowMatchAnimation(true);
          onMatch?.(currentPerson);

          setTimeout(() => {
            setShowMatchAnimation(false);
            moveToNext();
          }, 2000);
          return;
        }
      }

      moveToNext();
    }, 300);
  };

  const moveToNext = () => {
    setSwipeDirection(null);
    setCurrentPhotoIndex(0);
    if (currentIndex < people.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // Loop back
    }
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

  if (!currentPerson) {
    return (
      <div className="text-center text-gray-400 py-8">
        No one here right now...
      </div>
    );
  }

  return (
    <div className="relative max-w-md mx-auto">
      {/* Match Animation */}
      {showMatchAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.95)' }}>
          <div className="text-center space-y-6 animate-pulse">
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
            <p className="text-gray-400">
              You and {currentPerson.name} vibed together
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
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">{currentPerson.distance}</span>
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
