import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { Sparkles, Gift, TrendingUp, TrendingDown, ArrowRight, X, Check, QrCode, Clock, Info, Award, CreditCard } from 'lucide-react';
import { apiFetch } from '../../../services/api';
import Skeleton from '../../ui/Skeleton';

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

  const getRank = (pts: number) => {
    if (pts >= 20000) return { name: 'Diamond Member', color: '#B9F2FF', bg: 'linear-gradient(135deg, #0A192F 0%, #000000 100%)', mesh: '#B9F2FF', glow: '#B9F2FF' };
    if (pts >= 5000) return { name: 'Platinum Member', color: '#E5E4E2', bg: 'linear-gradient(135deg, #1A1A1A 0%, #000000 100%)', mesh: '#E5E4E2', glow: '#E5E4E2' };
    if (pts >= 1500) return { name: 'Gold Member', color: '#FFD700', bg: 'linear-gradient(135deg, #1A1600 0%, #000000 100%)', mesh: '#D4AF37', glow: '#D4AF37' };
    if (pts >= 250) return { name: 'Silver Member', color: '#C0C0C0', bg: 'linear-gradient(135deg, #111111 0%, #000000 100%)', mesh: '#C0C0C0', glow: '#C0C0C0' };
    return { name: 'Bronze Member', color: '#CD7F32', bg: 'linear-gradient(135deg, #241408 0%, #000000 100%)', mesh: '#CD7F32', glow: '#CD7F32' };
  };

  const currentRank = getRank(userPoints);

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

  const fetchMyRedemptions = async (silent = false) => {
    if (!userId) return;

    if (!silent) setRedemptionsLoading(true);
    try {
      const data = await apiFetch('/rewards/my-redemptions');

      if (data.status === 'success') {
        setRedemptions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    } finally {
      if (!silent) setRedemptionsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMyRedemptions();
      
      const pollInterval = setInterval(() => {
        fetchMyRedemptions(true);
      }, 3000); // Polling silent every 3 seconds

      return () => clearInterval(pollInterval);
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
      <div className="max-w-6xl mx-auto space-y-8 p-4 pt-8">
        {/* Wallet Balance Card Skeleton */}
        <Skeleton className="w-full h-64 rounded-[2rem]" />
        
        {/* Rewards Tabs Skeleton */}
        <div className="flex gap-4">
          <Skeleton className="w-32 h-10 rounded-full" />
          <Skeleton className="w-32 h-10 rounded-full" />
        </div>
        
        {/* Rewards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="w-full h-72 rounded-2xl" />
          <Skeleton className="w-full h-72 rounded-2xl" />
          <Skeleton className="w-full h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${currentRank.color}30 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.2) 0%, transparent 50%)`,
        }}
      />

      <div className="relative max-w-6xl mx-auto space-y-8 z-10">
        {/* Premium Balance Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden rounded-[2rem] p-8 md:p-10 cursor-pointer shadow-2xl"
          style={{
            background: currentRank.bg,
            border: `1px solid ${currentRank.color}40`,
            boxShadow: `0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
          }}
        >
          {/* Metallic Mesh Background */}
          <div 
            className="absolute inset-0 opacity-[0.04]"
            style={{ 
              backgroundImage: `radial-gradient(${currentRank.mesh} 1px, transparent 1px)`,
              backgroundSize: '20px 20px' 
            }}
          />

          {/* Dynamic Shimmer Effect */}
          <motion.div
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 4,
              ease: "easeInOut"
            }}
            className="absolute top-0 left-0 w-[150%] h-full opacity-10 pointer-events-none"
            style={{
              background: `linear-gradient(115deg, transparent 20%, rgba(255, 255, 255, 0.6) 45%, ${currentRank.color}80 55%, transparent 80%)`,
              transform: 'skewX(-20deg)',
            }}
          />

          {/* Ambient Glows */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 opacity-30 rounded-full" style={{ background: `radial-gradient(circle, ${currentRank.glow} 0%, transparent 70%)` }} />
          <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 opacity-20 rounded-full" style={{ background: `radial-gradient(circle, ${currentRank.color} 0%, transparent 70%)` }} />

          {/* Card Content */}
          <div className="relative z-10 space-y-8">
            {/* Top Row */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>VIBE Balance</p>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight"
                    style={{
                      backgroundImage: `linear-gradient(135deg, #FFFFFF 0%, ${currentRank.color} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      display: 'inline-block'
                    }}
                  >
                    {userPoints.toLocaleString()}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-gray-400">PTS</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <CreditCard className="w-8 h-8" style={{ color: currentRank.color }} />
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex items-end justify-between pt-4">
              <div>
                <p className="text-white text-lg font-medium tracking-wide uppercase">{userName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{
                      color: currentRank.color,
                    }}
                  >
                    {currentRank.name}
                  </p>
                  <button onClick={() => setShowRanksModal(true)} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                    <Info className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Member Since</p>
                <p className="text-sm text-gray-300 font-medium">{formatMemberSince(memberSince)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <motion.div
            whileHover={{ y: -4 }}
            className="p-4 md:p-5 rounded-2xl text-center group"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            {weeklyPoints >= 0 ? (
              <TrendingUp className="w-6 h-6 mx-auto mb-3 text-green-400 group-hover:scale-110 transition-transform" />
            ) : (
              <TrendingDown className="w-6 h-6 mx-auto mb-3 text-red-400 group-hover:scale-110 transition-transform" />
            )}
            <p className="text-xl md:text-2xl font-black text-white">
              {weeklyPoints > 0 ? '+' : ''}{weeklyPoints}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mt-1">This Week</p>
          </motion.div>
          <motion.div
            whileHover={{ y: -4 }}
            className="p-4 md:p-5 rounded-2xl text-center group"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            <Gift className="w-6 h-6 mx-auto mb-3 text-[#D4AF37] group-hover:scale-110 transition-transform" />
            <p className="text-xl md:text-2xl font-black text-white">{redemptions.length}</p>
            <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mt-1">Redeemed</p>
          </motion.div>
          <motion.div
            whileHover={{ y: -4 }}
            className="p-4 md:p-5 rounded-2xl text-center group"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            <Sparkles className="w-6 h-6 mx-auto mb-3 text-purple-400 group-hover:scale-110 transition-transform" />
            <p className="text-xl md:text-2xl font-black text-white">
              #{userRank > 0 ? userRank : '-'}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mt-1">Ranking</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex p-1.5 rounded-full w-full max-w-md mx-auto lg:mx-0 relative overflow-hidden mt-8 mb-4"
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Animated Background Pill */}
          <div 
            className="absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 ease-out"
            style={{
              width: 'calc(50% - 6px)',
              left: activeTab === 'rewards' ? '6px' : 'calc(50%)',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.1)'
            }}
          />

          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-3 rounded-full text-sm font-black transition-colors relative z-10 ${activeTab === 'rewards'
              ? 'text-[#D4AF37]'
              : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            Prémios Disponíveis
          </button>
          <button
            onClick={() => setActiveTab('myrewards')}
            className={`flex-1 py-3 rounded-full text-sm font-black transition-colors relative z-10 ${activeTab === 'myrewards'
              ? 'text-[#D4AF37]'
              : 'text-gray-500 hover:text-gray-300'
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
                      className="group relative overflow-hidden rounded-[2rem] transition-all duration-300 hover:scale-[1.02] flex flex-col"
                      style={{
                        background: 'linear-gradient(145deg, rgba(30,30,30,0.6) 0%, rgba(15,15,15,0.8) 100%)',
                        border: canAfford
                          ? '1px solid rgba(212, 175, 55, 0.3)'
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        opacity: canAfford ? 1 : 0.6,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      }}
                    >
                      {/* Image */}
                      <div className="relative h-56 w-full overflow-hidden p-2">
                        <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
                          <ImageWithFallback
                            src={reward.image_path ? `/api/serve-image?file=${reward.image_path}` : ''}
                            alt={reward.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                          <div
                            className="absolute inset-0"
                            style={{
                              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                            }}
                          />
                          {/* Stock Badge */}
                          <div
                            className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase"
                            style={{
                              background: 'rgba(0, 0, 0, 0.6)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(212, 175, 55, 0.3)',
                              color: '#D4AF37',
                            }}
                          >
                            {reward.stock} disponível{reward.stock !== 1 ? 's' : ''}
                          </div>
                          
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-white font-black text-xl drop-shadow-md line-clamp-1">{reward.name}</h3>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 pt-2 space-y-4 flex-1 flex flex-col justify-between">
                        <div>
                          {reward.description && (
                            <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">{reward.description}</p>
                          )}
                          <p className="text-[#D4AF37] font-black text-lg mt-3 flex items-center gap-1.5">
                            <Award className="w-5 h-5" />
                            {reward.points.toLocaleString()} pts
                          </p>
                        </div>

                        <button
                          onClick={() => handleRedeemClick(reward)}
                          disabled={!canAfford}
                          className="w-full py-3.5 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] mt-auto"
                          style={{
                            background: canAfford
                              ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
                              : 'rgba(255, 255, 255, 0.05)',
                            color: canAfford ? '#000' : '#888',
                          }}
                        >
                          <span className="font-black text-sm uppercase tracking-wider">
                            {canAfford ? 'Resgatar Prémio' : 'Pontos Insuficientes'}
                          </span>
                        </button>
                      </div>
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
                      className="relative overflow-hidden rounded-[2rem] transition-all duration-300"
                      style={{
                        background: 'linear-gradient(145deg, rgba(30,30,30,0.6) 0%, rgba(15,15,15,0.8) 100%)',
                        border: redemption.status === 'pending'
                          ? '1px solid rgba(212, 175, 55, 0.3)'
                          : '1px solid rgba(34, 197, 94, 0.3)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      }}
                    >
                      <div className="p-6 space-y-5">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-black text-xl mb-1">{redemption.reward_name}</h3>
                            <p className="text-[#D4AF37] font-black flex items-center gap-1.5">
                              <Award className="w-4 h-4" />
                              {Math.floor(redemption.points_spent).toLocaleString()} pts
                            </p>
                          </div>
                          <div
                            className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
                            style={{
                              background: redemption.status === 'pending'
                                ? 'rgba(212, 175, 55, 0.1)'
                                : 'rgba(34, 197, 94, 0.1)',
                              borderColor: redemption.status === 'pending'
                                ? 'rgba(212, 175, 55, 0.3)'
                                : 'rgba(34, 197, 94, 0.3)',
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
                              className="w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                              style={{
                                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                                color: '#000',
                              }}
                            >
                              <QrCode className="w-5 h-5" />
                              <span className="uppercase tracking-wider text-sm">Ver QR Code</span>
                            </button>
                          ) : (
                              <div className="space-y-4">
                                <div
                                  className="p-5 rounded-[1.5rem] text-center flex flex-col items-center justify-center overflow-hidden border border-white/10"
                                  style={{
                                    background: '#FFF',
                                    boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(redemption.qr_code)}`}
                                    alt="Reward QR Code"
                                    className="w-full max-w-[200px] h-auto object-contain"
                                  />
                                </div>
                                
                                {/* Visual rotation indicator */}
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700]" 
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
                                  className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors hover:bg-white/10"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: '#AAA',
                                  }}
                                >
                                  Ocultar QR Code
                                </button>
                              </div>
                          )
                        )}

                        {/* Expiration / Used Date */}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400">
                            {redemption.status === 'used'
                              ? `Utilizado a: ${new Date(redemption.used_at || new Date()).toLocaleDateString('pt-PT')}`
                              : `Expira a: ${new Date(redemption.expires_at).toLocaleDateString('pt-PT')}`
                            }
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
