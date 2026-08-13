import { useState, useEffect } from 'react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { Sparkles, Gift, TrendingUp, TrendingDown, ArrowRight, X, Check, QrCode, Clock, Info, Award } from 'lucide-react';
import { apiFetch } from '../../../services/api';

const RANKS = [
  {
    name: 'Bronze',
    points: '0€ - 250€',
    color: '#CD7F32',
    benefits: ['Acesso à Comunidade', 'Acumulação de VIBE']
  },
  {
    name: 'Silver',
    points: '250€ - 1.500€',
    color: '#C0C0C0',
    benefits: ['Prioridade na Guestlist', 'Badge de Perfil Exclusivo']
  },
  {
    name: 'Gold',
    points: '1.500€ - 5.000€',
    color: '#FFD700',
    benefits: ['Entrada Prioritária (Fast Track)', 'Acesso ao Bar Gold']
  },
  {
    name: 'Platinum',
    points: '5.000€ - 20.000€',
    color: '#E5E4E2',
    benefits: ['Entrada Imediata', 'Acesso Área VIP', 'Welcome Drink']
  },
  {
    name: 'Diamond',
    points: '+20.000€',
    color: '#B9F2FF',
    benefits: ['Mesa VIP Sempre Disponível', 'Gestor de Conta Privado', 'Acesso Total']
  }
];



interface Reward {
  id: number;
  name: string;
  description: string;
  points: number;
  stock: number;
  image_path: string | null;
}

interface Redemption {
  id: number;
  reward_id: number;
  reward_name: string;
  points_spent: number;
  status: string;
  qr_code: string;
  redeemed_at: string;
  expires_at: string;
  used_at: string | null;
  event_id: number | null;
  image_path: string | null;
  description: string | null;
}

interface ClientWalletProps {
  user?: any;
}

export function ClientWallet({ user }: ClientWalletProps) {
  const [userPoints, setUserPoints] = useState(0);
  const [userId, setUserId] = useState(0);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rewards' | 'myrewards'>('rewards');

  const [memberSince, setMemberSince] = useState<string | null>(null);

  // Rewards tab state
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [rewardsError, setRewardsError] = useState<string | null>(null);

  // My Rewards tab state
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);
  const [visibleQRCodes, setVisibleQRCodes] = useState<{ [key: number]: boolean }>({});

  // Modal state
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [showRanksModal, setShowRanksModal] = useState(false);
  const [weeklyPoints, setWeeklyPoints] = useState(0);
  const [userRank, setUserRank] = useState(0);

  const memberLevel = 'Gold Member';

  const formatMemberSince = (dateString: string | null) => {
    if (!dateString) return 'Jan 2024'; // Fallback
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch (e) {
      return 'Jan 2024';
    }
  };

  const toggleQRCode = (redemptionId: number) => {
    setVisibleQRCodes(prev => ({
      ...prev,
      [redemptionId]: !prev[redemptionId]
    }));
  };

  const getClubSlug = () => {
    // Priority: User's saved slug > LocalStorage > URL (careful with subdirs) > Default
    if (user?.club_slug) return user.club_slug;

    const stored = localStorage.getItem('clubSlug');
    if (stored) return stored;

    // Check URL. If we are at /rp/wallet, this might fail to give a club slug.
    // However, if the user logged in correctly, user.club_slug SHOULD be populated.
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0 && pathSegments[0] !== 'rp' && pathSegments[0] !== 'admin') {
      return pathSegments[0];
    }

    return '';
  };

  useEffect(() => {
    // Priority: Prop > LocalStorage
    const userData = user || JSON.parse(localStorage.getItem('user') || '{}');

    if (userData && userData.id) {
      setUserName(userData.name || 'Guest');
      setUserPoints(userData.points || 0);
      setUserId(userData.id || 0);
      setMemberSince(userData.member_since || userData.created_at || null);

      // Fetch fresh data from API to get latest points
      const fetchFreshData = async () => {
        try {
          const data = await apiFetch(`/profile`, {
            method: 'GET'
          });

          if (data.debug) {
            console.log('API Debug:', data.debug);
          }
          if (data.status === 'success' && data.data) {
            const freshPoints = data.data.points;
            if (freshPoints !== undefined) {
              setUserPoints(freshPoints);
              if (data.data.weekly_points !== undefined) setWeeklyPoints(data.data.weekly_points);
              if (data.data.global_rank !== undefined) setUserRank(data.data.global_rank);

              // Update local storage to keep it in sync
              const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
              storedUser.points = freshPoints;
              localStorage.setItem('user', JSON.stringify(storedUser));
            }
          }
        } catch (error) {
          console.error('Error fetching fresh user data:', error);
        }
      };

      fetchFreshData();
    }
    setLoading(false);
  }, [user]); // React to user prop changes!

  useEffect(() => {
    // Fetch rewards from API
    const fetchRewards = async () => {
      try {
        const data = await apiFetch(`/rewards`);

        if (data.status === 'success') {
          setRewards(data.data || []);
          setRewardsError(null);
        } else {
          setRewardsError(data.message || 'Erro ao carregar prémios');
        }
      } catch (error) {
        console.error('Error fetching rewards:', error);
        setRewardsError('Erro ao carregar prémios');
      } finally {
        setRewardsLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const fetchMyRedemptions = async () => {
    if (!userId) return;

    setRedemptionsLoading(true);
    try {
      const data = await apiFetch('/rewards/my-redemptions');

      if (data.status === 'success') {
        setRedemptions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    } finally {
      setRedemptionsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMyRedemptions();
      
      const rotationInterval = setInterval(() => {
        fetchMyRedemptions();
      }, 45000);

      return () => clearInterval(rotationInterval);
    }
  }, [userId]);

  const handleRedeemClick = (reward: Reward) => {
    setSelectedReward(reward);
    setShowRedeemModal(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward || !userId) return;

    setRedeeming(true);
    try {
      const data = await apiFetch('/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward_id: selectedReward.id })
      });

      if (data.status === 'success') {
        // Update user points
        const newPoints = data.data.new_points;
        setUserPoints(newPoints);

        // Update localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.points = newPoints;
          localStorage.setItem('user', JSON.stringify(user));
        }

        // Refresh rewards list
        const rewardsData = await apiFetch('/rewards');
        if (rewardsData.status === 'success') {
          setRewards(rewardsData.data || []);
        }

        // Close modal
        setShowRedeemModal(false);
        setSelectedReward(null);

        // Refresh my redemptions
        await fetchMyRedemptions();

        // Switch to my rewards tab
        setActiveTab('myrewards');
      } else {
        alert(data.message || 'Erro ao resgatar prémio');
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert('Erro ao resgatar prémio');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">A carregar carteira...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8" style={{ background: '#0a0a0a' }}>
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(212, 175, 55, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.2) 0%, transparent 50%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto space-y-8">
        {/* Premium Balance Card */}
        <div
          className="relative overflow-hidden rounded-3xl p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(255, 215, 0, 0.2) 100%)',
            backdropFilter: 'blur(30px)',
            border: '2px solid rgba(212, 175, 55, 0.5)',
            boxShadow: '0 20px 60px rgba(212, 175, 55, 0.3)',
          }}
        >
          {/* Card Shine Effect */}
          <div
            className="absolute top-0 left-0 w-full h-full opacity-30"
            style={{
              background: 'linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
              transform: 'translateX(-100%)',
              animation: 'shine 3s infinite',
            }}
          />

          {/* Card Content */}
          <div className="relative z-10 space-y-6">
            {/* Top Row */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-1">VIBE Balance</p>
                <p
                  className="text-6xl font-black tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFF 50%, #FFD700 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {userPoints.toLocaleString()}
                </p>
                <p className="text-sm text-gray-300 mt-1">POINTS</p>
              </div>
              <Sparkles className="w-8 h-8 text-[#D4AF37]" />
            </div>

            {/* Bottom Row */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white text-lg">{userName}</p>
                <div className="flex items-center gap-2">
                  <p
                    className="text-sm"
                    style={{
                      color: '#D4AF37',
                    }}
                  >
                    {memberLevel}
                  </p>
                  <button onClick={() => setShowRanksModal(true)}>
                    <Info className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Member Since</p>
                <p className="text-sm text-white">{formatMemberSince(memberSince)}</p>
              </div>
            </div>
          </div>

          {/* Card Pattern */}
          <div
            className="absolute bottom-0 right-0 w-64 h-64 opacity-10"
            style={{
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className="p-4 rounded-xl text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {weeklyPoints >= 0 ? (
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-400" />
            ) : (
              <TrendingDown className="w-6 h-6 mx-auto mb-2 text-red-400" />
            )}
            <p className="text-2xl font-black text-white">
              {weeklyPoints > 0 ? '+' : ''}{weeklyPoints}
            </p>
            <p className="text-xs text-gray-400">This Week</p>
          </div>
          <div
            className="p-4 rounded-xl text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Gift className="w-6 h-6 mx-auto mb-2 text-[#D4AF37]" />
            <p className="text-2xl font-black text-white">{redemptions.length}</p>
            <p className="text-xs text-gray-400">Redeemed</p>
          </div>
          <div
            className="p-4 rounded-xl text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <p className="text-2xl font-black text-white">
              #{userRank > 0 ? userRank : '-'}
            </p>
            <p className="text-xs text-gray-400">Ranking</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`pb-4 px-2 font-black text-sm transition-all ${activeTab === 'rewards'
              ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
              : 'text-gray-500'
              }`}
          >
            Prémios Disponíveis
          </button>
          <button
            onClick={() => setActiveTab('myrewards')}
            className={`pb-4 px-2 font-black text-sm transition-all ${activeTab === 'myrewards'
              ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
              : 'text-gray-500'
              }`}
          >
            Meus Prémios
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">Resgatar Prémios</h2>
              <button className="text-sm text-[#D4AF37] flex items-center gap-1">
                Ver Todos
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Loading State */}
            {rewardsLoading && (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">A carregar prémios...</p>
              </div>
            )}

            {/* Error State */}
            {!rewardsLoading && rewardsError && (
              <div className="text-center py-12">
                <p className="text-red-400">{rewardsError}</p>
              </div>
            )}

            {/* Empty State */}
            {!rewardsLoading && !rewardsError && rewards.length === 0 && (
              <div className="text-center py-12">
                <Gift className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">Nenhum prémio disponível no momento</p>
              </div>
            )}

            {/* Rewards Grid */}
            {!rewardsLoading && !rewardsError && rewards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map((reward) => {
                  const canAfford = userPoints >= reward.points;

                  return (
                    <div
                      key={reward.id}
                      className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        border: canAfford
                          ? '1px solid rgba(212, 175, 55, 0.4)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        opacity: canAfford ? 1 : 0.6,
                      }}
                    >
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden">
                        <ImageWithFallback
                          src={reward.image_path ? `/api/serve-image?file=${reward.image_path}` : ''}
                          alt={reward.name}
                          className="w-full h-full object-cover"
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%)',
                          }}
                        />
                        {/* Stock Badge */}
                        <div
                          className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs"
                          style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(10px)',
                            color: '#D4AF37',
                          }}
                        >
                          {reward.stock} disponível{reward.stock !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="text-white font-black">{reward.name}</h3>
                          {reward.description && (
                            <p className="text-gray-400 text-xs mt-1 line-clamp-2">{reward.description}</p>
                          )}
                          <p className="text-[#D4AF37] text-sm mt-2">{reward.points.toLocaleString()} pts</p>
                        </div>

                        <button
                          onClick={() => handleRedeemClick(reward)}
                          disabled={!canAfford}
                          className="w-full py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: canAfford
                              ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
                              : 'rgba(255, 255, 255, 0.1)',
                            color: canAfford ? '#000' : '#888',
                          }}
                        >
                          <span className="font-black">
                            {canAfford ? 'Resgatar' : 'Pontos Insuficientes'}
                          </span>
                        </button>
                      </div>

                      {/* Hover Glow */}
                      {canAfford && (
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          style={{
                            background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, transparent 70%)',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My Rewards Tab */}
        {activeTab === 'myrewards' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">Meus Prémios Ativos</h2>

            {redemptionsLoading && (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">A carregar...</p>
              </div>
            )}

            {!redemptionsLoading && redemptions.length === 0 && (
              <div className="text-center py-12">
                <Gift className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">Ainda não tens prémios resgatados</p>
                <button
                  onClick={() => setActiveTab('rewards')}
                  className="mt-4 px-6 py-3 rounded-xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000',
                  }}
                >
                  Ver Prémios Disponíveis
                </button>
              </div>
            )}

            {!redemptionsLoading && redemptions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {redemptions.map((redemption) => {
                  const showQR = visibleQRCodes[redemption.id] || false;

                  return (
                    <div
                      key={redemption.id}
                      className="relative overflow-hidden rounded-2xl"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        border: redemption.status === 'pending'
                          ? '1px solid rgba(212, 175, 55, 0.4)'
                          : '1px solid rgba(34, 197, 94, 0.4)',
                      }}
                    >
                      <div className="p-6 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-black text-lg">{redemption.reward_name}</h3>
                            <p className="text-gray-400 text-sm">{Math.floor(redemption.points_spent).toLocaleString()} pontos</p>
                          </div>
                          <div
                            className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{
                              background: redemption.status === 'pending'
                                ? 'rgba(212, 175, 55, 0.2)'
                                : 'rgba(34, 197, 94, 0.2)',
                              color: redemption.status === 'pending' ? '#D4AF37' : '#22C55E',
                            }}
                          >
                            {redemption.status === 'pending' ? 'Pendente' : 'Usado'}
                          </div>
                        </div>

                        {/* QR Code - Hidden by default, and never shown if already used */}
                        {redemption.status !== 'used' && (
                          !showQR ? (
                            <button
                              onClick={() => toggleQRCode(redemption.id)}
                              className="w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all hover:scale-105"
                              style={{
                                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                                color: '#000',
                              }}
                            >
                              <QrCode className="w-5 h-5" />
                              Ver QR Code
                            </button>
                          ) : (
                              <div className="space-y-3">
                                <div
                                  className="p-4 rounded-xl text-center flex flex-col items-center justify-center overflow-hidden"
                                  style={{
                                    background: '#FFF',
                                  }}
                                >
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(redemption.qr_code)}`}
                                    alt="Reward QR Code"
                                    className="w-full max-w-[200px] h-auto object-contain"
                                  />
                                </div>
                                
                                {/* Visual rotation indicator */}
                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2">
                                  <div 
                                    className="h-full bg-[#D4AF37]" 
                                    style={{
                                      animation: 'shrink 45s linear infinite'
                                    }}
                                  />
                                  <style>{`
                                    @keyframes shrink {
                                      from { width: 100%; }
                                      to { width: 0%; }
                                    }
                                  `}</style>
                                </div>

                                <button
                                  onClick={() => toggleQRCode(redemption.id)}
                                  className="w-full py-2 rounded-lg text-sm font-bold"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#888',
                                  }}
                                >
                                  Ocultar QR Code
                                </button>
                              </div>
                            )
                        )}

                        {/* Expiration */}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400">
                            Expira em: {new Date(redemption.expires_at).toLocaleDateString('pt-PT')}
                          </span>
                        </div>

                        {redemption.status === 'pending' && !showQR && (
                          <p className="text-xs text-gray-500 text-center">
                            Clica em "Ver QR Code" para mostrar ao staff
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ranks Info Modal */}
      {showRanksModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => setShowRanksModal(false)}
        >
          <div
            className="relative max-w-md w-full rounded-2xl p-6 space-y-6 max-h-[80vh] overflow-y-auto"
            style={{
              background: 'rgba(10, 10, 10, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowRanksModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Níveis de Membro</h3>
              <p className="text-gray-400 text-sm">Aumenta o teu investimento total para desbloquear status exclusivo.</p>
            </div>

            <div className="space-y-4">
              {RANKS.map((rank) => (
                <div
                  key={rank.name}
                  className="p-4 rounded-xl flex gap-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${rank.color}40`,
                  }}
                >
                  {/* Circle Indicator */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${rank.color}20 0%, ${rank.color}05 100%)`,
                      border: `2px solid ${rank.color}`,
                      boxShadow: `0 0 10px ${rank.color}30`
                    }}
                  >
                    <Award className="w-6 h-6" style={{ color: rank.color }} />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-lg" style={{ color: rank.color }}>{rank.name}</h4>
                      <span className="text-xs font-mono text-gray-400">{rank.points}</span>
                    </div>
                    <ul className="space-y-1">
                      {rank.benefits.map((benefit, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowRanksModal(false)}
              className="w-full py-3 rounded-xl font-bold"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Redeem Confirmation Modal */}
      {showRedeemModal && selectedReward && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => !redeeming && setShowRedeemModal(false)}
        >
          <div
            className="relative max-w-md w-full rounded-2xl p-6 space-y-4"
            style={{
              background: 'rgba(10, 10, 10, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => !redeeming && setShowRedeemModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              disabled={redeeming}
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-black text-white">Confirmar Resgate</h3>

            <div className="space-y-3">
              <p className="text-gray-300">
                Tens a certeza que queres resgatar:
              </p>
              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <p className="text-white font-black text-lg">{selectedReward.name}</p>
                <p className="text-[#D4AF37] text-sm">{selectedReward.points} pontos</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Pontos atuais:</span>
                  <span className="text-white font-bold">{userPoints}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Custo:</span>
                  <span className="text-red-400 font-bold">-{selectedReward.points}</span>
                </div>
                <div className="h-px bg-gray-700"></div>
                <div className="flex justify-between text-gray-400">
                  <span>Novo saldo:</span>
                  <span className="text-[#D4AF37] font-bold">{userPoints - selectedReward.points}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                O prémio ficará disponível na aba "Meus Prémios" por 30 dias. Mostra o QR code a um membro do staff para ativar.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRedeemModal(false)}
                disabled={redeeming}
                className="flex-1 py-3 rounded-xl font-black"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#888',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRedeem}
                disabled={redeeming}
                className="flex-1 py-3 rounded-xl font-black flex items-center justify-center gap-2"
                style={{
                  background: redeeming
                    ? 'rgba(212, 175, 55, 0.5)'
                    : 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  color: '#000',
                }}
              >
                {redeeming ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    A resgatar...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
