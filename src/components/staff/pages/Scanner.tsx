import { useState, useEffect, useRef } from 'react';
import { ScanQrCode, CheckCircle, XCircle, Gift, User, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { apiFetch } from '../../../services/api';

interface ScannerProps {
  onOpenManual: () => void;
}

interface ScanResult {
  type: 'success' | 'error' | 'warning' | 'info';
  category: 'guestlist' | 'reward';
  name: string;
  photo: string | null;
  details: string; // RP Name or Reward Name
  message: string;
}

export function Scanner({ onOpenManual }: ScannerProps) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Initialize Scanner
    // We need to wait for the DOM element 'reader'
    if (isScanning && !scannerRef.current) {
      const scannerId = "reader";
      // Check if element exists
      const element = document.getElementById(scannerId);
      if (!element) return;

      const scanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        },
            /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5-qrcode scanner. ", error);
        });
        scannerRef.current = null;
      }
    };
  }, [isScanning]); // Re-run if isScanning changes to true

  const onScanFailure = (error: any) => {
    // console.warn(`Code scan error = ${error}`);
    // Ignore frequent errors, only care about success
  };

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    if (!isScanning) return;

    // Pause scanning logic implicitly by setting state? 
    // The library keeps running, but we should ignore processing or pause.
    // For better UX, we pause the scanner or stop processing.
    // scannerRef.current?.pause(); // .pause() might be available depending on version, otherwise just ignore.
    // Let's just ignore subsequent calls via a ref or state if needed.
    // But we probably want to keep scanning available or restart it.

    // For now, let's process.
    console.log(`Scan result: ${decodedText}`, decodedResult);
    handleProcessCode(decodedText);
  };

  const handleProcessCode = async (qrCode: string) => {
    // Prevent double submission?
    setIsScanning(false); // Hide scanner UI temporarily or simple block logic

    try {
      const data = await apiFetch('/controllers/staff_scan.php?action=validate_qr', {
        method: 'POST',
        body: JSON.stringify({ qr_code: qrCode, confirm: true }) // Auto-confirm for speed
      });

      let resultType: ScanResult['type'] = 'error';
      if (data.status === 'success') resultType = 'success';
      if (data.status === 'warning') resultType = 'warning';

      const isReward = data.data?.type === 'reward';
      const client = data.data?.client;

      const newResult: ScanResult = {
        type: resultType,
        category: isReward ? 'reward' : 'guestlist',
        name: client?.name || 'Unknown',
        photo: client?.photo || null,
        details: isReward
          ? `Prémio: ${data.data?.reward?.name}`
          : `RP: ${data.data?.rp_name || 'N/A'}`,
        message: data.message || 'Erro desconhecido'
      };

      setScanResult(newResult);

    } catch (error) {
      console.error("Scan API Error:", error);
      setScanResult({
        type: 'error',
        category: 'guestlist', // Default
        name: 'Erro de Leitura',
        photo: null,
        details: 'Tente novamente',
        message: error instanceof Error ? error.message : String(error)
      });
    }

    // Stop the scanner physically if needed, or just overlay covers it.
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (e) { console.error(e) }
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  return (
    <div className="h-full relative overflow-hidden bg-black flex flex-col">
      {/* Scanner Container */}
      {isScanning && (
        <div className="flex-1 relative flex flex-col items-center justify-center p-4">
          {/* HTML5 QR Code Reader Container */}
          <div id="reader" className="w-full max-w-md h-full overflow-hidden rounded-2xl border-2 border-[#D4AF37]/50" />

          <p className="mt-4 text-gray-400 text-sm md:text-base text-center max-w-xs">
            Aponte a câmara para o QR Code do cliente
          </p>

          {/* Overlay for branding */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <ScanQrCode className="w-48 h-48 text-[#D4AF37]/10 animate-pulse" />
          </div>
        </div>
      )}

      {!isScanning && !scanResult && (
        <div className="flex-1 flex items-center justify-center">
          <button onClick={resetScanner} className="px-6 py-3 bg-[#D4AF37] text-black font-bold rounded-xl">
            ReativarScanner
          </button>
        </div>
      )}

      {/* Manual & Mobile UI Elements - Only show if scanning */}
      {isScanning && (
        <div className="absolute top-4 right-4 z-20">
          {/* Additional controls if needed */}
        </div>
      )}


      {/* Scan Result Toast/Popup using AnimatePresence */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed z-[60] top-0 left-0 w-full h-full flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="w-full max-w-sm rounded-3xl p-8 text-center relative overflow-hidden"
              style={{
                background: 'rgba(10, 10, 10, 0.95)',
                border: scanResult.type === 'success'
                  ? '2px solid rgba(34, 197, 94, 0.6)' // Green
                  : scanResult.type === 'warning'
                    ? '2px solid rgba(234, 179, 8, 0.6)' // Yellow
                    : '2px solid rgba(239, 68, 68, 0.6)', // Red
                boxShadow: scanResult.type === 'success'
                  ? '0 0 60px rgba(34, 197, 94, 0.2)'
                  : scanResult.type === 'warning'
                    ? '0 0 60px rgba(234, 179, 8, 0.2)'
                    : '0 0 60px rgba(239, 68, 68, 0.2)',
              }}
            >
              <div className="flex flex-col items-center gap-6">
                {/* Icon */}
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-2"
                  style={{
                    background: scanResult.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : scanResult.type === 'warning' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `2px solid ${scanResult.type === 'success' ? '#22c55e' : scanResult.type === 'warning' ? '#eab308' : '#ef4444'}`,
                  }}
                >
                  {scanResult.type === 'success' && <CheckCircle className="w-12 h-12 text-green-500" />}
                  {scanResult.type === 'warning' && <AlertTriangle className="w-12 h-12 text-yellow-500" />}
                  {scanResult.type === 'error' && <XCircle className="w-12 h-12 text-red-500" />}
                </div>

                {/* Text Info */}
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white">
                    {scanResult.type === 'success' ? 'Aprovado' : scanResult.type === 'warning' ? 'Atenção' : 'Recusado'}
                  </h2>
                  <p className="text-lg text-gray-300 font-medium">{scanResult.message}</p>
                </div>

                {/* User/Reward Card */}
                <div className="w-full bg-white/5 rounded-2xl p-4 flex items-center gap-4 text-left border border-white/10">
                  {scanResult.photo ? (
                    <img src={scanResult.photo} alt={scanResult.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37]" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border-2 border-[#D4AF37]">
                      {scanResult.category === 'reward' ? <Gift className="w-8 h-8 text-[#D4AF37]" /> : <User className="w-8 h-8 text-[#D4AF37]" />}
                    </div>
                  )}

                  <div>
                    <p className="text-white font-bold text-lg leading-tight">{scanResult.name}</p>
                    <p className="text-[#D4AF37] text-sm">{scanResult.details}</p>
                    <div className="mt-1 inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-white/10 text-gray-400">
                      {scanResult.category === 'reward' ? 'REDEMPTION' : 'GUESTLIST'}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={resetScanner}
                  className="w-full py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: 'black',
                    boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)'
                  }}
                >
                  Ler Próximo
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
          #reader video {
              object-fit: cover;
              border-radius: 1rem;
          }
      `}</style>
    </div>
  );
}
