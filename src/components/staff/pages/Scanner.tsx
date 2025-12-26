import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Gift, User, AlertTriangle } from 'lucide-react';
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
  const [isScanning, setIsScanning] = useState(true); // Auto-start scanner
  const [scannerStarted, setScannerStarted] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'checking' | 'granted' | 'denied' | 'prompt'>('checking');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check camera permission status
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('Camera permission status:', result.state);
        setCameraPermission(result.state as 'granted' | 'denied' | 'prompt');

        // Listen for permission changes
        result.addEventListener('change', () => {
          console.log('Camera permission changed to:', result.state);
          setCameraPermission(result.state as 'granted' | 'denied' | 'prompt');
        });
      } catch (error) {
        console.error('Error checking camera permissions:', error);
        setCameraPermission('prompt');
      }
    };

    checkPermissions();
  }, []);

  useEffect(() => {
    // Initialize Scanner with Html5QrcodeScanner
    if (isScanning && !scannerRef.current) {
      const scannerId = "reader";
      const element = document.getElementById(scannerId);
      if (!element) {
        console.error("Scanner element not found");
        return;
      }

      console.log("Initializing Html5QrcodeScanner...");

      try {
        const scanner = new Html5QrcodeScanner(
          scannerId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            showTorchButtonIfSupported: true,
            rememberLastUsedCamera: true
          },
          /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
        console.log("✅ Html5QrcodeScanner initialized");
      } catch (error) {
        console.error("❌ Exception during scanner creation:", error);
        alert(`Erro crítico ao iniciar scanner: ${error}`);
      }
    }

    return () => {
      if (scannerRef.current) {
        console.log("Cleaning up scanner...");
        scannerRef.current.clear().catch((error: any) => {
          console.error("Failed to clear scanner:", error);
        });
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  const onScanFailure = (error: any) => {
    // Ignore frequent scan errors
  };

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    if (!isScanning) return;

    console.log(`Scan result: ${decodedText}`, decodedResult);
    handleProcessCode(decodedText);
  };

  const handleProcessCode = async (qrCode: string) => {
    setIsScanning(false);

    try {
      const data = await apiFetch('/controllers/staff_scan.php?action=validate_qr', {
        method: 'POST',
        body: JSON.stringify({ qr_code: qrCode, confirm: true })
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
        category: 'guestlist',
        name: 'Erro de Leitura',
        photo: null,
        details: 'Tente novamente',
        message: error instanceof Error ? error.message : String(error)
      });
    }

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
        <div className="flex-1 relative flex flex-col p-4">
          {/* HTML5 QR Code Reader Container */}
          <div
            id="reader"
            className="w-full flex-1 rounded-2xl overflow-hidden border-2 border-[#D4AF37]/50 shadow-2xl"
          />

          <p className="mt-4 text-gray-400 text-sm md:text-base text-center">
            Aponte a câmara para o QR Code do cliente
          </p>
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
                  ? '2px solid rgba(34, 197, 94, 0.6)'
                  : scanResult.type === 'warning'
                    ? '2px solid rgba(234, 179, 8, 0.6)'
                    : '2px solid rgba(239, 68, 68, 0.6)',
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
          /* Force reader container to fill available space */
          #reader {
            min-height: 400px;
            display: flex !important;
            flex-direction: column !important;
          }
          
          /* Make video fill the reader container */
          #reader video {
            width: 100% !important;
            height: 100% !important;
            min-height: 400px !important;
            object-fit: cover !important;
            flex: 1 !important;
          }
          
          /* Make scan region fill container */
          #reader__scan_region {
            width: 100% !important;
            height: 100% !important;
            min-height: 400px !important;
            display: flex !important;
            flex-direction: column !important;
          }
          
          /* Style the dashboard section */
          #reader__dashboard_section {
            padding: 20px !important;
            text-align: center !important;
            background: rgba(0, 0, 0, 0.8) !important;
            border-radius: 12px !important;
            margin: 10px !important;
          }
          
          /* Style dashboard buttons */
          #reader__dashboard_section button {
            background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%) !important;
            color: black !important;
            border: none !important;
            padding: 12px 24px !important;
            border-radius: 8px !important;
            font-weight: bold !important;
            font-size: 14px !important;
            cursor: pointer !important;
            transition: transform 0.2s, box-shadow 0.2s !important;
            box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3) !important;
            margin: 8px !important;
          }
          
          #reader__dashboard_section button:hover {
            transform: scale(1.05) !important;
            box-shadow: 0 6px 16px rgba(212, 175, 55, 0.5) !important;
          }
          
          /* Style camera selector if visible */
          #reader__camera_selection select {
            background: rgba(255, 255, 255, 0.1) !important;
            color: white !important;
            border: 2px solid #D4AF37 !important;
            padding: 8px 16px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            margin: 8px !important;
          }
          
          /* Style dashboard text */
          #reader__dashboard_section span {
            color: white !important;
            font-size: 14px !important;
          }
          
          /* Center the qr box overlay */
          #reader__scan_region img {
            margin: auto !important;
          }
      `}</style>
    </div>
  );
}
