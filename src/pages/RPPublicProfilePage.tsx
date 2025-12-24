import { useState, useEffect } from 'react';
import { RPPublicProfile } from '../components/RPPublicProfile';

interface RPPublicProfilePageProps {
    rpname: string;
}

interface RPProfileData {
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

        fetch(`/api/controllers/rp_public_profile.php?username=${encodeURIComponent(rpname)}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Erro ao carregar perfil');
                }
                return res.json();
            })
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
                className="min-h-screen flex items-center justify-center"
                style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #121212 100%)' }}
            >
                <div className="text-center">
                    <div
                        className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4"
                        style={{
                            borderColor: 'rgba(212, 175, 55, 0.3)',
                            borderTopColor: '#D4AF37',
                        }}
                    ></div>
                    <p className="text-gray-400">A carregar perfil...</p>
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
