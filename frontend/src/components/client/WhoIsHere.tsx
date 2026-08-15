import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'motion/react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { apiFetch } from '../../services/api';
import { X, Heart, Sparkles, Info } from 'lucide-react';
import Skeleton from '../ui/Skeleton';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dragStart = useRef<number | null>(null);
  
  // Framer Motion Drag values
  const x = useMotionValue(0);
  // When swiping left (negative x), rotate counter-clockwise. Right, clockwise.
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  // Opacity decreases as card is swiped far
  const opacity = useTransform(x, [-300, 0, 300], [0.3, 1, 0.3]);
  // Visual indicators (red overlay for pass, green/gold for like)
  const passOpacity = useTransform(x, [-150, -50], [1, 0]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);

  const controls = useAnimation();

  const currentPerson = people[currentIndex];

  // Fetch people in same event
  const fetchPeople = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const response = await apiFetch(`/networking/who-is-here`);

      if (response.status === 'success') {
        const freshPeople = response.data || [];

        if (isBackground) {
          setPeople(prev => {
            // Filter out people we already have in our deck
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = freshPeople.filter((p: Person) => !existingIds.has(p.id));

            if (newOnes.length > 0) {
              console.log(`[WhoIsHere] Found ${newOnes.length} new people!`);
              return [...prev, ...newOnes];
            }
            return prev;
          });
        } else {
          setPeople(freshPeople);
          setError(null);
        }
      } else {
        if (!isBackground) {
          setError(response.message || 'Erro ao carregar pessoas');
          setPeople([]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching people:', err);
      if (!isBackground) {
        setError(err.message || 'Erro ao conectar ao servidor');
        setPeople([]);
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPeople(false);

      // Poll every 15 seconds for new people
      const intervalId = setInterval(() => {
        fetchPeople(true);
      }, 15000);

      return () => clearInterval(intervalId);
    }
  }, [userId]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    setSwipeDirection(direction);

    // Call backend to save like/pass
    try {
      const response = await apiFetch('/networking/swipe', {
        method: 'POST',
        body: JSON.stringify({
          liked_id: currentPerson.id,
          action: direction === 'right' ? 'like' : 'pass'
        })
      });

      if (response.status === 'success' && response.is_match) {
        window.dispatchEvent(new CustomEvent('newMatch', { detail: currentPerson }));
        onMatch?.(currentPerson);
        // Continue to move to next
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

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold || info.velocity.x > 800) {
      await controls.start({ x: window.innerWidth, transition: { duration: 0.2 } });
      handleSwipe('right');
      x.set(0);
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -800) {
      await controls.start({ x: -window.innerWidth, transition: { duration: 0.2 } });
      handleSwipe('left');
      x.set(0);
    } else {
      // Snap back
      controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  const triggerButtonSwipe = async (direction: 'left' | 'right') => {
    const targetX = direction === 'right' ? window.innerWidth : -window.innerWidth;
    await controls.start({ x: targetX, transition: { duration: 0.3 } });
    handleSwipe(direction);
    x.set(0);
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
      <div className="relative max-w-md mx-auto flex flex-col h-[77dvh] min-h-[400px] max-h-[750px]">
        <Skeleton className="w-full h-full rounded-3xl" />
        {/* Skeleton overlays to simulate the card's text area */}
        <div className="absolute bottom-20 left-0 right-0 p-6 z-20 flex flex-col gap-3">
          <Skeleton className="w-2/3 h-8 bg-[#333333] opacity-60 rounded-lg" />
          <Skeleton className="w-1/3 h-4 bg-[#333333] opacity-60 rounded-lg" />
          <Skeleton className="w-1/2 h-4 bg-[#333333] opacity-60 rounded-lg" />
        </div>
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center py-16 px-4 space-y-6"
      >
        <div className="relative w-24 h-24 flex items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.8) 0%, transparent 70%)' }}
          />
          <div className="relative z-10 w-20 h-20 rounded-full bg-black/50 border border-[#D4AF37]/30 flex items-center justify-center backdrop-blur-md">
            <span className="text-4xl">👻</span>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white tracking-wide">A procurar VIBEs...</h3>
          <p className="text-sm text-gray-400 max-w-[250px] mx-auto leading-relaxed">
            Não há mais ninguém visível na festa. Tenta novamente mais tarde ou vai beber um copo ao bar! 🥂
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative max-w-md mx-auto flex flex-col h-[77dvh] min-h-[400px] max-h-[750px]">
      {/* Swipeable Card */}
      <motion.div
        key={currentPerson.id}
        className="relative touch-none select-none cursor-grab active:cursor-grabbing z-10 flex-1 min-h-0"
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        animate={controls}
      >
        <div
          className="relative overflow-hidden rounded-[2rem] w-full h-full"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Action Overlays */}
          <motion.div 
            className="absolute inset-0 z-20 pointer-events-none"
            style={{ 
              background: 'linear-gradient(to right, rgba(239, 68, 68, 0.4), transparent)',
              opacity: passOpacity 
            }}
          >
            <div className="absolute top-10 right-10 border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-1 rounded-xl rotate-12">PASS</div>
          </motion.div>
          <motion.div 
            className="absolute inset-0 z-20 pointer-events-none"
            style={{ 
              background: 'linear-gradient(to left, rgba(212, 175, 55, 0.4), transparent)',
              opacity: likeOpacity 
            }}
          >
            <div className="absolute top-10 left-10 border-4 border-[#D4AF37] text-[#D4AF37] font-black text-4xl px-4 py-1 rounded-xl -rotate-12">VIBE</div>
          </motion.div>

          {/* Photo with click zones */}
          <div className="relative w-full h-full" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const posX = e.clientX - rect.left;
            if (posX < rect.width / 2) {
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
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 20%, transparent 50%, rgba(0,0,0,0.95) 100%)',
              }}
            />

            {/* Photo Indicators */}
            <div className="absolute top-4 left-0 right-0 flex gap-1.5 px-4 z-30 pointer-events-none">
              {currentPerson.photos.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{
                    background: i === currentPhotoIndex
                      ? 'rgba(255, 255, 255, 1)'
                      : 'rgba(255, 255, 255, 0.3)',
                    boxShadow: i === currentPhotoIndex ? '0 0 10px rgba(255,255,255,0.5)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Info Overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 p-6 space-y-3 cursor-pointer z-30"
            onPointerDown={(e) => e.stopPropagation()} // Stop drag when clicking info
            onClick={() => onPersonClick?.(currentPerson)}
          >
            {/* Name & Age */}
            <div className="flex items-end gap-2">
              <h2 className="text-4xl font-black text-white leading-none drop-shadow-lg">
                {currentPerson.name}
              </h2>
              <span className="text-3xl font-light text-gray-200 leading-none drop-shadow-md">
                {currentPerson.age}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-bold text-[#D4AF37] tracking-wider">{currentPerson.vibes} VIBES</span>
              </div>
              {currentPerson.distance && (
                 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                   <span className="text-xs font-bold text-gray-300 tracking-wider">{currentPerson.distance}</span>
                 </div>
              )}
            </div>

            {/* Bio */}
            {currentPerson.bio && (
              <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed drop-shadow-md">{currentPerson.bio}</p>
            )}
            
            <div className="pt-2 flex justify-center">
              <div className="flex flex-col items-center">
                <Info className="w-5 h-5 text-gray-400 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex justify-center items-center gap-6 mt-auto pt-4 z-10 relative shrink-0">
        {/* Pass Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => triggerButtonSwipe('left')}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, #222 0%, #111 100%)',
            border: '2px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-20 transition-opacity" />
          <X className="w-7 h-7 text-red-500" strokeWidth={3} />
        </motion.button>

        {/* Like Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => triggerButtonSwipe('right')}
          className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
            boxShadow: '0 10px 40px rgba(212, 175, 55, 0.4)',
          }}
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-30 transition-opacity" />
          <Heart className="w-10 h-10 text-black" fill="black" strokeWidth={1} />
        </motion.button>
      </div>


    </div>
  );
}
