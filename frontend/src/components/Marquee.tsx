import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

export function Marquee() {
    const [clubs, setClubs] = useState<string[]>([
        "LICK", "ESKADA", "LUST IN RIO", "LUX FRÁGIL", 
        "MOME", "KREMLIN", "BLISS", "BOSQ", "MANDARIM"
    ]);

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                const response = await apiFetch('/clubs/active');
                if (response.status === 'success' && response.data.length > 0) {
                    setClubs(response.data);
                }
            } catch (error) {
                console.error('Error fetching clubs for marquee:', error);
            }
        };
        fetchClubs();
    }, []);

    // Create a large enough base list to fill ultra-wide screens
    const baseList = Array(10).fill(clubs).flat();

    return (
        <div 
            className="w-full overflow-hidden py-10 relative z-10 opacity-60"
            style={{
                maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
            }}
        >
            <div className="flex whitespace-nowrap">
                <motion.div
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 300 // Much longer duration for the huge array
                    }}
                    className="flex shrink-0 gap-16 md:gap-24 px-8 md:px-12 items-center"
                >
                    {/* Double the massive list to create seamless infinite loop effect */}
                    {[...baseList, ...baseList].map((club, index) => (
                        <div 
                            key={index} 
                            className="text-2xl md:text-4xl font-black text-white/50 tracking-widest uppercase flex items-center gap-16 md:gap-24"
                        >
                            <span>{club}</span>
                            {/* Separator dot */}
                            <span className="w-2 h-2 rounded-full bg-[#D4AF37]/30" />
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
