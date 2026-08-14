import { useState, useEffect } from 'react';
import { RPPublicProfile } from '../components/RPPublicProfile';

interface RPPublicProfilePageProps {
    rpname: string;
}

import { apiFetch } from '../services/api';

interface RPProfileData {
    id: number;
    name: string;
    username: string;
    bio: string;
    instagram: string;
    profile_image_url: string;
    stats: {
        totalEvents: number;
        totalGuests: number;
        rating: number;
        reviewCount: number;
    };
    events: Array<{
        id: number;
        name: string;
        club: string;
        club_slug: string;
        date: string;
        start_time: string;
        end_time: string;
        location: string;
        image_url: string;
    }>;
}

export function RPPublicProfilePage({ rpname }: RPPublicProfilePageProps) {
    const [data, setData] = useState<RPProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!rpname) {
            setError('Username não fornecido');
            setLoading(false);
            return;
        }

        apiFetch(`/rp/${encodeURIComponent(rpname)}`)
            .then(response => {
                if (response.status === 'success') {
                    setData(response.data);
                } else {
                    setError(response.message || 'Perfil não encontrado');
                }
            })
            .catch(err => {
                console.error('Error fetching RP profile:', err);
                setError('Erro ao carregar perfil. Por favor tente novamente.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [rpname]);

    if (loading) {
        return (
            <div
                className="min-h-screen relative overflow-hidden"
                style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #121212 100%)' }}
            >
                {/* Header Skeleton */}
                <div className="pt-24 pb-12 px-4 relative z-10">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 animate-pulse">
                        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/10 shrink-0"></div>
                        <div className="flex-1 text-center md:text-left space-y-4 w-full">
                            <div className="h-10 bg-white/10 rounded-xl w-3/4 mx-auto md:mx-0"></div>
                            <div className="h-6 bg-white/5 rounded-lg w-1/2 mx-auto md:mx-0"></div>
                            <div className="flex gap-4 justify-center md:justify-start mt-6">
                                <div className="h-12 bg-white/10 rounded-2xl w-32"></div>
                                <div className="h-12 bg-white/10 rounded-2xl w-32"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Skeleton */}
                <div className="max-w-7xl mx-auto px-4 pb-24 relative z-10">
                    <div className="h-8 bg-white/10 rounded-xl w-48 mb-8 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div
                className="min-h-screen flex items-center justify-center p-4"
                style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #121212 100%)' }}
            >
                <div className="text-center max-w-md">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '2px solid rgba(239, 68, 68, 0.3)',
                        }}
                    >
                        <span className="text-4xl">😕</span>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Perfil não encontrado</h2>
                    <p className="text-gray-400 mb-6">
                        {error || 'O perfil que procura não existe ou não está disponível.'}
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 rounded-xl font-bold transition-all duration-300"
                        style={{
                            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                            color: '#000',
                        }}
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
        );
    }

    return <RPPublicProfile data={data} />;
}
