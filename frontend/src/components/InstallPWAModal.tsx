import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Share, PlusSquare, MoreVertical } from 'lucide-react';

export function InstallPWAModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already dismissed the modal
    const hideModal = localStorage.getItem('hideInstallModal');
    
    // Check if app is already installed (PWA standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;

    if (!hideModal && !isStandalone) {
      // Show the modal after a short delay to not interrupt the initial load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleDontShowAgain = () => {
    localStorage.setItem('hideInstallModal', 'true');
    setIsVisible(false);
  };

  // Detect OS for specific instructions
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm rounded-[2rem] p-8 text-center overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            {/* Background Glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#D4AF37] opacity-20 blur-[50px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#D4AF37] opacity-10 blur-[50px] rounded-full pointer-events-none" />

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                }}
              >
                <Smartphone className="w-8 h-8 text-[#D4AF37]" />
              </div>

              <h2 className="text-2xl font-black text-white mb-3">
                Instale a Nossa App
              </h2>
              
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                Para a melhor experiência VIBE, adicione este site ao seu ecrã principal como aplicação. É rápido, ocupa pouco espaço e fica super fluido!
              </p>

              {isIOS && (
                <div className="flex items-center gap-3 mb-6 p-4 rounded-xl w-full text-left"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <Share className="w-5 h-5 text-gray-400 shrink-0" />
                  <p className="text-xs text-gray-400">
                    Toque em <strong className="text-white">Partilhar</strong> e depois em <strong className="text-white">Ecrã Principal</strong>
                  </p>
                  <PlusSquare className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
              )}

              {isAndroid && (
                <div className="flex items-center gap-3 mb-6 p-4 rounded-xl w-full text-left"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <MoreVertical className="w-5 h-5 text-gray-400 shrink-0" />
                  <p className="text-xs text-gray-400">
                    Toque nos <strong className="text-white">3 pontos</strong> e depois em <strong className="text-white">Adicionar ao Ecrã Principal</strong>
                  </p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full py-3 mb-3 rounded-xl font-bold text-black transition-transform active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
                }}
              >
                Entendido
              </button>

              <button
                onClick={handleDontShowAgain}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-4"
              >
                Não mostrar novamente
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
