import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Gift, User, AlertTriangle, Camera, CameraOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner';
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
  const [isCameraActive, setIsCameraActive] = useState(() => {
    const stored = sessionStorage.getItem('isCameraActive');
    return stored ? JSON.parse(stored) : true;
  });
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    sessionStorage.setItem('isCameraActive', JSON.stringify(isCameraActive));
  }, [isCameraActive]);

  const handleTurnOffCamera = () => {
    // If the scanner library exposes the video element or stream, try to stop tracks directly
    if (scannerRef.current) {
      // The library exposes `getStream()` on the ref
      const stream = typeof scannerRef.current.getStream === 'function' ? scannerRef.current.getStream() : null;
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    }
    setIsCameraActive(false);
  };

  const [cameraPermission, setCameraPermission] = useState<'checking' | 'granted' | 'denied' | 'prompt'>('checking');
  const [userId, setUserId] = useState<number | null>(null);
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.id);
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
      }
    }
  }, []);

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

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

  const onScanSuccess = async (decodedText: string) => {
    if (!isScanning) return;

    console.log(`Scan result: ${decodedText}`);
    handleProcessCode(decodedText);
  };

  const handleProcessCode = async (qrCode: string) => {
    setIsScanning(false);

    try {
      const data = await apiFetch(`/staff/scan`, {
        method: 'POST',
        body: JSON.stringify({ qr_code: qrCode, confirm: true })
      });

      // BAR QR: Prompt for purchase amount
      if (data.status === 'awaiting_payment') {
        setPaymentData(data.data);
        setShowPaymentModal(true);
        return;
      }

      // ENTRY QR: Already checked in — just show green info, no payment
      if (data.status === 'already_in') {
        setScanResult({
          type: 'warning',
          category: 'guestlist',
          name: data.data?.client?.name || 'Cliente',
          photo: data.data?.client?.photo || null,
          details: `RP: ${data.data?.rp_name || 'N/A'}`,
          message: data.message || 'Já entrou.'
        });
        return;
      }

      let resultType: ScanResult['type'] = 'error';
      if (data.status === 'success') resultType = 'success';
      if (data.status === 'warning') resultType = 'warning';
      if (data.status === 'info') resultType = 'info';

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
  };

  const resetScanner = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  const handleConfirmPayment = async () => {
    if (!paymentAmount || isNaN(parseFloat(paymentAmount))) {
      alert("Por favor insira um valor válido");
      return;
    }

    setProcessingPayment(true);
    try {
      const response = await apiFetch(`/staff/purchase`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: paymentData.client.id, // Client ID
          amount: parseFloat(paymentAmount),
          event_id: paymentData.event?.id || null
        })
      });

      if (response.status === 'success') {
        const points = response.data?.points_awarded || 0;
        setScanResult({
          type: 'success',
          category: 'reward', // Using reward category for points award visualization
          name: paymentData.client.name || 'Cliente',
          photo: paymentData.client.photo,
          details: `Compra de ${paymentAmount}€`,
          message: `+${points} Pontos Adicionados!`
        });
        handleClosePayment();
      } else {
        alert(response.message || "Erro ao processar pagamento");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Erro de conexão ao processar pagamento");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleClosePayment = () => {
    setShowPaymentModal(false);
    setPaymentAmount('');
    setPaymentData(null);
  };

  const handleCancelPayment = () => {
    handleClosePayment();
    setIsScanning(true); // Restart scanner when cancelled
  };

  const handleQuickAmount = (amount: number) => {
    setPaymentAmount(amount.toString());
  };

  return (
    <div className="h-full relative overflow-hidden bg-black flex flex-col">
      {/* Scanner Container */}
      {isScanning && (
        <div className="flex-1 relative flex flex-col p-4 pb-8 gap-4">
          {/* QR Scanner Component */}
          <div 
            className="w-full flex-1 mx-auto rounded-[2rem] overflow-hidden shadow-2xl relative flex flex-col justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)'
            }}
          >
            {isCameraActive ? (
              <>
                <QrScanner
                  ref={scannerRef}
                  onScan={(result) => {
                    if (result && result.length > 0) {
                      onScanSuccess(result[0].rawValue);
                    }
                  }}
                  onError={(error) => console.log(error?.message)}
                  styles={{
                    container: { width: '100%', height: '100%', paddingTop: 0 },
                    video: { objectFit: 'cover' }
                  }}
                />
                <button
                  onClick={handleTurnOffCamera}
                  className="absolute top-4 right-4 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors z-10"
                >
                  <CameraOff className="w-6 h-6" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <CameraOff className="w-16 h-16 text-gray-600 mb-2" />
                <p className="text-gray-400 font-medium">Câmara Desligada</p>
                <button
                  onClick={() => setIsCameraActive(true)}
                  className="px-6 py-3 rounded-full font-black text-black flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_4px_20px_rgba(212,175,55,0.3)]"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
                  }}
                >
                  <Camera className="w-5 h-5" />
                  Ligar Câmara
                </button>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <button 
              onClick={onOpenManual}
              className="w-full py-5 rounded-full font-black text-xl text-black transition-transform shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
              }}
            >
              Check-in Manual
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && paymentData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <div 
              className="w-full max-w-sm rounded-[2rem] p-8 relative overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(20,20,20,0.95) 0%, rgba(10,10,10,0.98) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
            >
              {/* Close Button */}
              <button
                onClick={handleCancelPayment}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <XCircle className="w-8 h-8" />
              </button>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Adicionar Pontos</h2>
                <p className="text-[#D4AF37]">Cliente: {paymentData.client?.name || 'Desconhecido'}</p>
              </div>

              {/* Amount Input */}
              <div className="mb-6 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-[#D4AF37]">€</span>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border-2 border-[#D4AF37]/30 rounded-xl py-4 pl-12 pr-4 text-3xl font-bold text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>

              {/* Quick Amounts */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[5, 10, 20, 50, 100, 200].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickAmount(amount)}
                    className="py-3 rounded-2xl transition-all"
                    style={{
                      background: paymentAmount === amount.toString() ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: paymentAmount === amount.toString() ? '1px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: paymentAmount === amount.toString() ? '#D4AF37' : '#ffffff',
                      fontWeight: paymentAmount === amount.toString() ? 'bold' : 'normal',
                    }}
                  >
                    {amount}€
                  </button>
                ))}
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmPayment}
                disabled={processingPayment || !paymentAmount}
                className="w-full py-4 rounded-full font-black text-lg text-black transition-all disabled:opacity-50 disabled:grayscale"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)'
                }}
              >
                {processingPayment ? 'Processando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


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
              className="w-full max-w-sm rounded-[2rem] p-8 text-center relative overflow-hidden"
              style={{
                background: 'rgba(10, 10, 10, 0.8)',
                backdropFilter: 'blur(30px)',
                border: scanResult.type === 'success'
                  ? '1px solid rgba(34, 197, 94, 0.5)'
                  : scanResult.type === 'warning'
                    ? '1px solid rgba(234, 179, 8, 0.5)'
                    : '1px solid rgba(239, 68, 68, 0.5)',
                boxShadow: scanResult.type === 'success'
                  ? '0 30px 60px rgba(34, 197, 94, 0.15)'
                  : scanResult.type === 'warning'
                    ? '0 30px 60px rgba(234, 179, 8, 0.15)'
                    : '0 30px 60px rgba(239, 68, 68, 0.15)',
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
                  onClick={() => {
                    setScanResult(null);
                    setIsScanning(true);
                  }}
                  className="w-full py-4 mt-8 rounded-[2rem] font-black text-lg text-black transition-all"
                  style={{
                    background: scanResult.type === 'success'
                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                      : scanResult.type === 'warning'
                        ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
                        : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  }}
                >
                  Próximo (Scanner)
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
          /* Force reader container to fill available space */
          #reader {
            min-height: 250px;
            display: flex !important;
            flex-direction: column !important;
          }
          
          /* Make video fill the reader container */
          #reader video {
            width: 100% !important;
            height: 100% !important;
            min-height: 250px !important;
            object-fit: cover !important;
            flex: 1 !important;
          }
          
          /* Make scan region fill container */
          #reader__scan_region {
            width: 100% !important;
            height: 100% !important;
            min-height: 250px !important;
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
          
          /* Style camera selector dropdown - Better Mobile Appearance */
          #reader__camera_selection {
            margin: 10px 0 !important;
            text-align: center !important;
          }
          
          #reader__camera_selection select {
            background: rgba(0, 0, 0, 0.8) !important;
            color: white !important;
            border: 2px solid #D4AF37 !important;
            padding: 12px 20px !important;
            border-radius: 12px !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            margin: 0 auto !important;
            min-width: 200px !important;
            max-width: 90% !important;
            cursor: pointer !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            background-image: linear-gradient(45deg, transparent 50%, #D4AF37 50%), linear-gradient(135deg, #D4AF37 50%, transparent 50%) !important;
            background-position: calc(100% - 20px) center, calc(100% - 12px) center !important;
            background-size: 8px 8px, 8px 8px !important;
            background-repeat: no-repeat !important;
          }
          
          #reader__camera_selection select:focus {
            outline: none !important;
            border-color: #FFD700 !important;
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2) !important;
          }
          
          #reader__camera_selection label {
            color: #D4AF37 !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            margin-bottom: 8px !important;
            display: block !important;
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
          
          /* Hide "Scan an image file" option */
          #html5-qrcode-button-file-selection,
          #html5-qrcode-anchor-scan-type-change {
            display: none !important;
          }
          
          /* Hide any file input */
          input[type="file"] {
            display: none !important;
          }
      `}</style>
    </div>
  );
}
