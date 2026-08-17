import { X, Instagram, Sparkles, Lock } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Person {
  id: number;
  name: string;
  age: number;
  bio: string;
  vibes: number;
  points?: number;
  photos: string[];
  instagram?: string;
}

interface PersonProfileModalProps {
  person: Person;
  isMatch: boolean;
  onClose: () => void;
}

export function PersonProfileModal({ person, isMatch, onClose }: PersonProfileModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const nextPhoto = () => {
    if (person.photos && currentPhotoIndex < person.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextPhoto();
    }
    if (isRightSwipe) {
      prevPhoto();
    }
  };

  // Preload next and previous images
  useEffect(() => {
    if (person.photos) {
      // Preload next
      if (currentPhotoIndex < person.photos.length - 1) {
        const img = new Image();
        img.src = person.photos[currentPhotoIndex + 1];
      }
      // Preload previous
      if (currentPhotoIndex > 0) {
        const img = new Image();
        img.src = person.photos[currentPhotoIndex - 1];
      }
    }
  }, [currentPhotoIndex, person.photos]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm flex flex-col max-h-[80vh] rounded-[2rem] overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(10, 10, 10, 0.98)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header with Close Button */}
        <div className="absolute top-0 left-0 right-0 z-50 p-6 pointer-events-none flex justify-end">
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full flex items-center justify-center pointer-events-auto transition-transform active:scale-95 shadow-lg"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 overscroll-contain no-scrollbar">

          {/* Photo Gallery */}
          <div 
            className={`relative ${isMatch ? 'h-64' : 'h-96'} select-none bg-black transition-all duration-500 ease-out`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <ImageWithFallback
              key={`photo-${person.id}-${currentPhotoIndex}`} // Force re-render on photo change
              src={person.photos[currentPhotoIndex]}
              alt={person.name}
              className="w-full h-full object-cover animate-in fade-in duration-300"
              loading="eager" // Prioritize loading
            />

            {/* Tap Zones */}
            <div className="absolute inset-0 flex z-20">
              <div
                className="flex-1 active:bg-black/5 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
              />
              <div
                className="flex-1 active:bg-black/5 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
              />
            </div>

            {/* Gradient Overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, transparent 0%, rgba(10, 10, 10, 0.9) 100%)',
              }}
            />

            {/* Photo Indicators */}
            {person.photos.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex gap-2 justify-center px-4 pointer-events-none z-30">
                {person.photos.map((_, i) => (
                  <div
                    key={i}
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: i === currentPhotoIndex ? '32px' : '8px',
                      background: i === currentPhotoIndex
                        ? 'rgba(212, 175, 55, 0.9)'
                        : 'rgba(255, 255, 255, 0.3)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
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
                {person.name}, <span className="text-3xl text-gray-300 font-bold">{person.age}</span>
              </h2>
            </div>

            {/* Stats */}
            <div
              className="p-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(145deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              }}
            >
              <Sparkles className="w-6 h-6 text-[#D4AF37]" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-[#D4AF37] leading-none">{person.vibes || 0}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">VIBES Recebidas</span>
              </div>
            </div>

            {/* Bio */}
            <div 
              className="p-5 rounded-[1.5rem] space-y-2"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest">Sobre mim</h3>
              <p className="text-gray-200 leading-relaxed font-medium">
                {person.bio || "Sem biografia disponível."}
              </p>
            </div>

            {/* Instagram */}
            {isMatch ? (
              <a
                href={`https://instagram.com/${person.instagram?.replace('@', '') || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-[1.5rem] transition-all flex items-center justify-between gap-4 active:scale-95"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  boxShadow: '0 4px 20px rgba(212, 175, 55, 0.1)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-black/40">
                    <Instagram className="w-5 h-5 text-pink-500" />
                  </div>
                  <span className="text-white font-bold">Instagram</span>
                </div>
                <span className="text-[#D4AF37] font-bold underline-offset-4 decoration-1 hover:underline">
                  @{person.instagram?.replace('@', '') || 'username'}
                </span>
              </a>
            ) : (
              <div
                className="p-5 rounded-[1.5rem] transition-all flex items-center justify-between gap-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-black/40">
                    <Instagram className="w-5 h-5 text-pink-500" />
                  </div>
                  <span className="text-white font-bold">Instagram</span>
                </div>
                <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/5 flex-shrink-0">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Match to unlock</span>
                </div>
              </div>
            )}

            {/* Match Status */}
            {isMatch && (
              <div
                className="p-5 rounded-[1.5rem] text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                <p className="text-[#22C55E] font-black text-lg">✨ You matched with {person.name}!</p>
                <p className="text-sm text-gray-400 mt-1 font-medium">
                  Start a conversation or say hi in person
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
