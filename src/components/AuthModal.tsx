import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export function AuthModal() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-md mx-auto">
        {/* Section title */}
        <div className="text-center mb-8 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-[#bd00ff]" />
            <h2 
              className="text-3xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #bd00ff 0%, #00d4ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Unified Login
            </h2>
          </div>
          <p className="text-gray-400">
            Acesso rápido à experiência VIP
          </p>
        </div>

        {/* Auth modal card */}
        <div 
          className="relative p-8 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Glow effect */}
          <div 
            className="absolute -inset-1 opacity-30 blur-2xl rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, #bd00ff 0%, #00d4ff 50%, #ff0080 100%)',
            }}
          ></div>

          <div className="relative z-10 space-y-6">
            {/* Toggle */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <button
                onClick={() => setIsSignUp(false)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  !isSignUp 
                    ? 'text-white' 
                    : 'text-gray-500'
                }`}
                style={!isSignUp ? {
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                } : {}}
              >
                Login
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  isSignUp 
                    ? 'text-white' 
                    : 'text-gray-500'
                }`}
                style={isSignUp ? {
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                } : {}}
              >
                Criar Conta
              </button>
            </div>

            {/* Email input */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Email</label>
              <input
                type="email"
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#bd00ff] transition-colors"
              />
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#bd00ff] transition-colors"
              />
            </div>

            {/* Submit button */}
            <button 
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #bd00ff 0%, #00d4ff 100%)',
              }}
            >
              {isSignUp ? 'Criar Conta' : 'Entrar'}
            </button>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-sm text-gray-500 bg-transparent">ou</span>
              </div>
            </div>

            {/* Social login */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                className="py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                Google
              </button>
              <button 
                className="py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                Apple
              </button>
            </div>

            {/* Footer text */}
            <p className="text-center text-xs text-gray-500 pt-4">
              Ao continuar, aceitas os nossos{' '}
              <span className="text-[#00d4ff] hover:underline cursor-pointer">
                Termos
              </span>{' '}
              e{' '}
              <span className="text-[#00d4ff] hover:underline cursor-pointer">
                Política de Privacidade
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
