// src/components/AccessDenied.tsx
import { Lock, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface AccessDeniedProps {
    clubName: string;
    onGoBack: () => void;
}

export function AccessDenied({ clubName, onGoBack }: AccessDeniedProps) {
    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
            {/* Ambient golden glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)' }}></div>
                <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)' }}></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 max-w-md w-full mx-4"
            >
                <div
                    className="rounded-3xl p-8 md:p-10 text-center"
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    <div
                        className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                        style={{
                            background: 'rgba(212, 175, 55, 0.1)',
                            border: '2px solid rgba(212, 175, 55, 0.3)',
                        }}
                    >
                        <Lock className="w-10 h-10 text-[#D4AF37]" />
                    </div>

                    <h1
                        className="text-2xl md:text-3xl font-black mb-4"
                        style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Acesso Negado
                    </h1>

                    <p className="text-gray-300 mb-2">
                        Não tens acesso ao clube
                    </p>
                    <p className="text-[#D4AF37] font-semibold text-lg mb-6">
                        {clubName}
                    </p>

                    <p className="text-sm text-gray-400 mb-8">
                        Para teres acesso a este clube, precisas de criar uma conta ou fazer login através da página do clube.
                    </p>

                    <button
                        onClick={onGoBack}
                        className="w-full py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                        style={{
                            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                            color: '#000000',
                        }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Voltar
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
