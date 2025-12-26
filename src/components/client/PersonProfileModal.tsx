import { X, Instagram, Sparkles, Lock } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface Person {
  id: number;
  name: string;
  age: number;
  bio: string;
  vibes: number;
  points?: number;
  photos: string[];
  distance: string;
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
          <div className="relative h-96 select-none">
            <ImageWithFallback
              src={person.photos[currentPhotoIndex]}
              alt={person.name}
              className="w-full h-full object-cover"
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
                className="text-3xl font-black"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {person.name}, {person.age}
              </h2>
            </div>

            {/* Stats */}
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                <p className="text-2xl font-black text-[#D4AF37]">{person.vibes || 0}</p>
                <span className="text-sm text-gray-400">VIBES ✨</span>
              </div>
            </div>

            {/* Bio */}
            <div>
              <h3 className="text-white font-black mb-2">About</h3>
              <p className="text-gray-300">{person.bio}</p>
            </div>

            {/* Instagram */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-[#D4AF37]" />
                  <span className="text-white">Instagram</span>
                </div>

                {isMatch ? (
                  <span className="text-[#D4AF37]">{person.instagram || '@username'}</span>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Match to unlock</span>
                  </div>
                )}
              </div>
            </div>

            {/* Match Status */}
            {isMatch && (
              <div
                className="p-4 rounded-xl text-center"
                style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <p className="text-[#D4AF37] font-black">✨ You matched with {person.name}!</p>
                <p className="text-sm text-gray-400 mt-1">
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
