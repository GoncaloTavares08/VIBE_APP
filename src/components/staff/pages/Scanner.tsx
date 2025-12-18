import { useState, useEffect } from 'react';
import { ScanQrCode, CheckCircle, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScannerProps {
  onOpenManual: () => void;
}

interface ScanResult {
  type: 'success' | 'error';
  name: string;
  photo: string;
  rpName: string;
  message?: string;
}

export function Scanner({ onOpenManual }: ScannerProps) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const simulateScan = (success: boolean) => {
    if (success) {
      setScanResult({
        type: 'success',
        name: 'Maria Silva',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
        rpName: 'João Silva',
      });
    } else {
      setScanResult({
        type: 'error',
        name: 'Pedro Santos',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
        rpName: 'Unknown',
        message: 'Not on guestlist',
      });
    }

    setTimeout(() => {
      setScanResult(null);
    }, 4000);
  };

  return (
    <div className="h-full relative overflow-hidden">
      {/* Camera Background Simulation */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
        }}
      >
        {/* Scanning Grid Overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(212, 175, 55, 0.1) 0px, transparent 1px, transparent 30px), repeating-linear-gradient(90deg, rgba(212, 175, 55, 0.1) 0px, transparent 1px, transparent 30px)',
          }}
        />

        {/* Animated Scan Line */}
        <div
          className="absolute left-0 right-0 h-1 animate-scan"
          style={{
            background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.8)',
          }}
        />
      </div>

      {/* Scanner Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
        {!isMobile && (
          <h2 className="text-2xl text-white font-bold mb-8">Live Scanner</h2>
        )}

        {/* QR Frame */}
        <div className="w-64 h-64 lg:w-80 lg:h-80 relative mb-8">
          {/* Gold Corner Frames */}
          <div
            className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 rounded-tl-3xl"
            style={{ borderColor: '#D4AF37' }}
          />
          <div
            className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 rounded-tr-3xl"
            style={{ borderColor: '#D4AF37' }}
          />
          <div
            className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 rounded-bl-3xl"
            style={{ borderColor: '#D4AF37' }}
          />
          <div
            className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 rounded-br-3xl"
            style={{ borderColor: '#D4AF37' }}
          />

          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <ScanQrCode className="w-20 h-20 lg:w-24 lg:h-24 text-[#D4AF37] opacity-50 animate-pulse" />
          </div>
        </div>

        <p className="text-white text-xl font-semibold mb-2">Ready to Scan</p>
        <p className="text-gray-400 mb-8 text-center">Position QR code within frame</p>

        {/* Test Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => simulateScan(true)}
            className="px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: '#ffffff',
            }}
          >
            <span className="font-semibold">Test Success</span>
          </button>
          <button
            onClick={() => simulateScan(false)}
            className="px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
            }}
          >
            <span className="font-semibold">Test Error</span>
          </button>
        </div>
      </div>

      {/* Scan Result Toast/Popup using AnimatePresence */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed z-50 ${isMobile ? 'top-8 left-4 right-4' : 'top-1/2 left-1/2'
              }`}
            style={{
              // IMPORTANT: For framer motion to handle X positioning on desktop correctly without conflict,
              // we set x in 'animate' prop. But we need to ensure the base position is correct.
              // Mobile: top-8 left-4 right-4 -> positioned by inset.
              // Desktop: top-1/2 left-1/2 -> we use translateX(-50%) to center.
              // Since 'x' in motion covers transform, we just need to ensure initial placement.
              minWidth: isMobile ? 'auto' : '400px',
              // Using 'y' in translate (-50%) for vertical centering on desktop is tricky if animating 'y'.
              // So, let's center using marginTop or just adjust y animation values.
              // Standard center transform is translate(-50%, -50%).
              // If we animate 'y', Framer Motion overrides 'transform'.
              // So we should include the centering offset in the 'y' and 'x' values of the animation.
            }}
            // Correct logic for Framer Motion Centering:
            // Mobile: No centering needed, fixed positions.
            // Desktop: needs -50% -50%.
            // Let's adjust the variants to be explicit.
            variants={{
              mobile: { opacity: 1, y: 0, x: 0 },
              mobileInitial: { opacity: 0, y: -50, x: 0 },
              desktop: { opacity: 1, y: '-50%', x: '-50%' },
              desktopInitial: { opacity: 0, y: '-60%', x: '-50%' },
            }}
            initial={isMobile ? "mobileInitial" : "desktopInitial"}
            animate={isMobile ? "mobile" : "desktop"}
            exit={isMobile ? "mobileInitial" : "desktopInitial"}
          >
            <div
              className="rounded-3xl p-6 transition-all duration-300"
              style={{
                background: 'rgba(10, 10, 10, 0.95)',
                backdropFilter: 'blur(30px)',
                border: scanResult.type === 'success'
                  ? '2px solid rgba(34, 197, 94, 0.6)'
                  : '2px solid rgba(239, 68, 68, 0.6)',
                boxShadow: scanResult.type === 'success'
                  ? '0 0 60px rgba(34, 197, 94, 0.4)'
                  : '0 0 60px rgba(239, 68, 68, 0.4)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {scanResult.type === 'success' ? (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '2px solid rgba(34, 197, 94, 0.5)',
                      }}
                    >
                      <CheckCircle className="w-7 h-7 text-green-400" />
                    </div>
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '2px solid rgba(239, 68, 68, 0.5)',
                      }}
                    >
                      <XCircle className="w-7 h-7 text-red-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-bold text-xl">
                      {scanResult.type === 'success' ? 'Access Granted' : 'Access Denied'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {scanResult.type === 'success' ? 'Valid Entry' : scanResult.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setScanResult(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Client Info */}
              <div
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <img
                  src={scanResult.photo}
                  alt={scanResult.name}
                  className="w-16 h-16 rounded-full object-cover"
                  style={{
                    border: '2px solid rgba(212, 175, 55, 0.5)',
                  }}
                />
                <div className="flex-1">
                  <p className="text-white font-bold text-lg">{scanResult.name}</p>
                  <p className="text-sm text-gray-400">RP: {scanResult.rpName}</p>
                </div>
                {scanResult.type === 'success' && (
                  <div
                    className="px-3 py-1 rounded-lg"
                    style={{
                      background: 'rgba(212, 175, 55, 0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                    }}
                  >
                    <span className="text-[#D4AF37] text-sm font-semibold">VIP</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
