import { useState, useEffect } from 'react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { Sparkles, Gift, TrendingUp, ArrowRight } from 'lucide-react';

const rewards = [
  {
    id: 1,
    title: 'Grey Goose Bottle',
    cost: 5000,
    image: 'https://images.unsplash.com/photo-1759912316272-a414bf146476?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2b2RrYSUyMGJvdHRsZSUyMGx1eHVyeXxlbnwxfHx8fDE3NjYwNjgyMDh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Premium',
  },
  {
    id: 2,
    title: 'Moët Champagne',
    cost: 7500,
    image: 'https://images.unsplash.com/photo-1743184579851-5ec9972100b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFtcGFnbmUlMjBib3R0bGUlMjBsdXh1cnklMjBnb2xkfGVufDF8fHx8MTc2NjA2ODI3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Luxury',
  },
  {
    id: 3,
    title: '5x Premium Cocktails',
    cost: 2500,
    image: 'https://images.unsplash.com/photo-1683544599381-be284dbd9abf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2NrdGFpbCUyMGRyaW5rJTIwYmFyfGVufDF8fHx8MTc2NTk5MDA4NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Drinks',
  },
  {
    id: 4,
    title: 'VIP Table Upgrade',
    cost: 10000,
    image: 'https://images.unsplash.com/photo-1578760427294-9871d8667bf3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXAlMjB0YWJsZSUyMGNsdWJ8ZW58MXx8fHwxNzY2MDY4Mjc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'VIP',
  },
  {
    id: 5,
    title: 'Skip Queue Pass',
    cost: 1000,
    image: 'https://images.unsplash.com/photo-1744314080490-ed41f6319475?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdodGNsdWIlMjBwYXJ0eSUyMGNyb3dkfGVufDF8fHx8MTc2NjA2ODIwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Access',
  },
  {
    id: 6,
    title: 'Free Entry +1',
    cost: 1500,
    image: 'https://images.unsplash.com/photo-1744314080490-ed41f6319475?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdodGNsdWIlMjBwYXJ0eSUyMGNyb3dkfGVufDF8fHx8MTc2NjA2ODIwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Access',
  },
];

export function ClientWallet() {
  const [userPoints, setUserPoints] = useState(0);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const memberLevel = 'Gold Member';

  useEffect(() => {
    // Load user data from localStorage (saved during login)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'Guest');
        setUserPoints(user.points || 0);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserName('Guest');
        setUserPoints(0);
      }
    }
    setLoading(false);
  }, []);

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

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
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
                <p
                  className="text-sm"
                  style={{
                    color: '#D4AF37',
                  }}
                >
                  {memberLevel}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Member Since</p>
                <p className="text-sm text-white">Jan 2024</p>
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
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-black text-white">+340</p>
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
            <p className="text-2xl font-black text-white">12</p>
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
            <p className="text-2xl font-black text-white">#12</p>
            <p className="text-xs text-gray-400">Ranking</p>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white">Rewards</h2>
            <button className="text-sm text-[#D4AF37] flex items-center gap-1">
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => {
              const canAfford = userPoints >= reward.cost;

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
                      src={reward.image}
                      alt={reward.title}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%)',
                      }}
                    />
                    {/* Category Badge */}
                    <div
                      className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs"
                      style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(10px)',
                        color: '#D4AF37',
                      }}
                    >
                      {reward.category}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-white font-black">{reward.title}</h3>
                      <p className="text-[#D4AF37] text-sm">{reward.cost.toLocaleString()} pts</p>
                    </div>

                    <button
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
                        {canAfford ? 'Redeem' : 'Insufficient Points'}
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
        </div>
      </div>

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
