import { ImageWithFallback } from './figma/ImageWithFallback';

interface HeroSectionProps {
  onLoginClick?: () => void;
}

export function HeroSection({ onLoginClick }: HeroSectionProps) {
  return (
    <section className="container mx-auto px-4 py-20 md:py-32">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left: Text content */}
        <div className="text-center md:text-left space-y-6">
          <h1 
            className="text-5xl md:text-7xl font-black leading-tight"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 40%, #FFD700 60%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            A Tua Noite,
            <br />
            Em Upgrade.
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 max-w-lg mx-auto md:mx-0">
            Guestlists automáticas, pontos VIP e acesso sem filas. 
            A app definitiva para a night em Portugal.
          </p>

          <div className="pt-4">
            <button 
              onClick={onLoginClick}
              className="group relative px-8 py-4 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(255, 215, 0, 0.2) 100%)',
                  filter: 'blur(20px)',
                }}
              ></div>
              <span 
                className="relative z-10 text-lg font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Entrar / Login
              </span>
            </button>
          </div>
        </div>

        {/* Right: iPhone mockup */}
        <div className="relative">
          <div className="relative mx-auto max-w-sm">
            {/* Glow effect behind phone */}
            <div 
              className="absolute inset-0 opacity-50 blur-3xl"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #888888 100%)',
              }}
            ></div>
            
            {/* Phone mockup */}
            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1578242174372-e26b3681587f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpUGhvbmUlMjBtb2NrdXAlMjBkYXJrfGVufDF8fHx8MTc2NTkzMzMwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="VIBE APP on iPhone"
                className="w-full h-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}