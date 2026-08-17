import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface Match {
    id: number;
    name: string;
    age: number;
    bio: string;
    vibes: number;
    photos: string[];
    instagram?: string;
}

interface MyMatchesProps {
    userId: number;
    onPersonClick?: (person: any) => void;
}

export function MyMatches({ userId, onPersonClick }: MyMatchesProps) {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                setLoading(true);
                const response = await apiFetch(`/networking/matches?user_id=${userId}`);

                if (response.status === 'success') {
                    setMatches(response.matches || []);
                }
            } catch (err) {
                console.error('Error fetching matches:', err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchMatches();
        }
    }, [userId]);

    if (loading) {
        return null; // Don't show anything while loading
    }

    if (matches.length === 0) {
        return null; // Don't show section if no matches
    }

    return (
        <div
            className="p-6 rounded-2xl space-y-4"
            style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-black flex items-center gap-2">
                    <Heart className="w-5 h-5 text-[#D4AF37]" fill="currentColor" />
                    Meus Matches
                </h3>
                <span className="text-sm text-gray-400">{matches.length}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {matches.map((match) => (
                    <div
                        key={match.id}
                        className="relative rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105 aspect-[3/4]"
                        style={{
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                        }}
                        onClick={() => onPersonClick?.(match)}
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <ImageWithFallback
                                src={match.photos[0]}
                                alt={match.name}
                                className="w-full h-full object-cover"
                            />
                            {/* Gradient Overlay */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.9) 100%)'
                                }}
                            />
                        </div>

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                            <h4 className="font-black text-lg leading-tight mb-1">{match.name}</h4>
                            {match.bio && (
                                <p className="text-xs text-gray-300 line-clamp-2">{match.bio}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
