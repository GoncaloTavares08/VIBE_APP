import { motion } from 'motion/react';
import { Sparkles, Calendar, Star, Crown } from 'lucide-react';

interface HeroSectionProps {
    onLoginClick?: () => void;
}

export function HeroSection({ onLoginClick }: HeroSectionProps) {
    return (
        <section className="relative w-full max-w-7xl mx-auto px-4 py-20 flex flex-col lg:flex-row items-center justify-between z-10 min-h-[60vh]">

            
            {/* Left Column: Typography & CTAs */}
            <div className="w-full lg:w-1/2 flex flex-col space-y-8 z-20 text-center lg:text-left mt-10 lg:mt-0">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-sm font-semibold text-gray-300">A Revolução da Nightlife</span>
                    </div>
                    
                    <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tight">
                        A Tua Noite, <br/>
                        Em <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#ffffff]">Upgrade.</span>
                    </h1>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed"
                >
                    Guestlists automáticas, pontos VIP e acesso sem filas aos clubes mais exclusivos de Portugal. Entra na nova era.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="flex justify-center lg:justify-start pt-4 w-full"
                >
                    <button 
                        onClick={onLoginClick}
                        className="group relative px-8 py-4 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 shadow-[0_0_40px_rgba(212,175,55,0.2)] w-full max-w-[250px]"
                        style={{
                            background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                        }}
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative z-10 text-lg font-bold text-black flex items-center justify-center">
                            Entrar na VIBE
                        </span>
                    </button>
                </motion.div>
            </div>

            {/* Right Column: Phone Mockup Visuals */}
            <div className="w-full lg:w-1/2 relative h-[500px] sm:h-[600px] lg:h-[700px] mt-16 lg:mt-0 flex items-center justify-center">
                
                {/* Central Phone Mockup (CSS CSS CSS) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="relative w-[260px] h-[540px] sm:w-[300px] sm:h-[620px] rounded-[3rem] sm:rounded-[3.5rem] p-[0.35rem] bg-gradient-to-br from-gray-400 via-gray-700 to-gray-900 shadow-[inset_0_0_2px_rgba(255,255,255,0.4),0_0_50px_rgba(212,175,55,0.15)] z-20"
                >
                    {/* Inner Screen */}
                    <div className="w-full h-full rounded-[2.7rem] sm:rounded-[3.15rem] bg-[#0a0a0a] overflow-hidden relative border-4 border-black shadow-inner">
                        
                        {/* Dynamic Island */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-30 flex items-center justify-between px-2">
                            {/* Camera dot */}
                            <div className="w-2 h-2 rounded-full bg-white/10"></div>
                            {/* Sensor pill */}
                            <div className="w-2 h-2 rounded-full bg-white/10"></div>
                        </div>

                        {/* Fake App Header */}
                        <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-[#111] to-transparent z-10 flex items-center justify-center pt-8 pointer-events-none">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                                <span className="text-[#D4AF37] text-sm font-bold tracking-widest">VIBE</span>
                            </div>
                        </div>
                        
                        {/* Fake App Content */}
                        <div className="p-5 pt-24 space-y-5 h-full overflow-hidden">
                            <div className="w-3/4 h-6 bg-white/10 rounded-md"></div>
                            {/* Featured Event Card */}
                            <div className="w-full h-52 bg-gradient-to-tr from-[#D4AF37]/20 to-white/5 rounded-2xl border border-white/10 relative overflow-hidden">
                                <div className="absolute bottom-4 left-4">
                                    <div className="w-32 h-4 bg-white/20 rounded mb-2"></div>
                                    <div className="w-20 h-3 bg-white/10 rounded"></div>
                                </div>
                            </div>
                            <div className="w-2/3 h-5 bg-white/5 rounded-md"></div>
                            <div className="w-full h-24 bg-white/5 rounded-2xl border border-white/5 flex items-center p-4 gap-4">
                                <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/20"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="w-3/4 h-3 bg-white/20 rounded"></div>
                                    <div className="w-1/2 h-2 bg-white/10 rounded"></div>
                                </div>
                            </div>
                            <div className="w-full h-24 bg-white/5 rounded-2xl border border-white/5"></div>
                        </div>
                    </div>
                </motion.div>

                {/* Floating Card 1: Guestlist */}
                <motion.div
                    animate={{ y: [-15, 15, -15], rotate: [-2, 2, -2] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[10%] right-2 sm:right-[5%] bg-[#111111]/90 backdrop-blur-xl border border-[#D4AF37]/30 rounded-2xl p-3 sm:p-4 shadow-2xl z-30 flex items-center gap-3 sm:gap-4 scale-[0.8] sm:scale-100 origin-right"
                >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37]" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-xs sm:text-sm">Guestlist Confirmada</p>
                        <p className="text-[#D4AF37] text-[10px] sm:text-xs font-semibold">Sem Filas Hoje</p>
                    </div>
                </motion.div>

                {/* Floating Card 2: VIP Points */}
                <motion.div
                    animate={{ y: [15, -15, 15], rotate: [2, -2, 2] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[10%] left-2 sm:left-[0%] bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl z-30 flex items-center gap-3 sm:gap-4 scale-[0.8] sm:scale-100 origin-left"
                >
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <Star className="w-6 h-6 text-[#FFD700]" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm">+250 Pontos</p>
                        <p className="text-gray-400 text-xs">Membro Gold</p>
                    </div>
                </motion.div>

                {/* Floating Card 3: Club Crown */}
                <motion.div
                    animate={{ y: [-10, 10, -10], x: [5, -5, 5] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-[40%] left-2 sm:left-[5%] lg:left-[-5%] bg-gradient-to-r from-[#D4AF37]/20 to-transparent backdrop-blur-xl border border-[#D4AF37]/20 rounded-full p-3 sm:p-4 shadow-xl z-10 flex scale-[0.8] sm:scale-100"
                >
                    <Crown className="w-8 h-8 text-[#D4AF37]" />
                </motion.div>

            </div>
        </section>
    );
}