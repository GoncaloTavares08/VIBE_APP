import { X, Instagram, Sparkles, MapPin, Lock } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useState } from 'react';

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.95)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-3xl mx-4 my-auto"
        style={{
          background: 'rgba(10, 10, 10, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Photo Gallery */}
        <div className="relative h-96">
          <ImageWithFallback
            src={person.photos[currentPhotoIndex]}
            alt={person.name}
            className="w-full h-full object-cover"
          />

          {/* Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, rgba(10, 10, 10, 0.9) 100%)',
            }}
          />

          {/* Photo Indicators */}
          {person.photos.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex gap-2 justify-center px-4">
              {person.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhotoIndex(i)}
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
          <div className="flex gap-4">
            {person.vibes && (
              <div
                className="flex-1 p-4 rounded-xl text-center"
                style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <Sparkles className="w-5 h-5 mx-auto mb-2 text-[#D4AF37]" />
                <p className="text-2xl font-black text-[#D4AF37]">{person.vibes}</p>
                <p className="text-xs text-gray-400">VIBES</p>
              </div>
            )}
            {person.points && (
              <div
                className="flex-1 p-4 rounded-xl text-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <p className="text-2xl font-black text-white">{person.points.toLocaleString()}</p>
                <p className="text-xs text-gray-400">POINTS</p>
              </div>
            )}
            <div
              className="flex-1 p-4 rounded-xl text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <MapPin className="w-5 h-5 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-white">{person.distance}</p>
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
  );
}
