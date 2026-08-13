import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export const InteractiveBackground = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        // Desktop mouse tracking
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            if (!isHovering) setIsHovering(true);
        };

        window.addEventListener('mousemove', handleMouseMove);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [isHovering]);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#050505]">
            
            {/* Ambient Orb 1 - Top Left */}
            <motion.div
                animate={{
                    x: [0, 80, -40, 0],
                    y: [0, -60, 60, 0],
                    scale: [1, 1.4, 0.8, 1],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-[-10%] left-[-20%] md:left-0 w-[120vw] md:w-[50vw] h-[120vw] md:h-[50vw] rounded-full opacity-40 md:opacity-20"
                style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
            />
            
            {/* Ambient Orb 2 - Bottom Right */}
            <motion.div
                animate={{
                    x: [0, -80, 50, 0],
                    y: [0, 80, -50, 0],
                    scale: [1, 1.3, 0.9, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                className="absolute bottom-[-10%] right-[-20%] md:right-0 w-[140vw] md:w-[50vw] h-[140vw] md:h-[50vw] rounded-full opacity-30 md:opacity-10"
                style={{ background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)' }}
            />

            {/* Ambient Orb 3 - Center (Mobile focus) */}
            <motion.div
                animate={{
                    x: [0, -40, 40, -20, 0],
                    y: [0, 40, -20, 50, 0],
                    scale: [0.8, 1.2, 0.9, 1.1, 0.8],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 4
                }}
                className="absolute top-[20%] left-[10%] w-[100vw] md:w-[40vw] h-[100vw] md:h-[40vw] rounded-full opacity-25 md:opacity-0"
                style={{ background: 'radial-gradient(circle, #B8860B 0%, transparent 70%)' }}
            />

            {/* Mouse Follower (Desktop only) */}
            <motion.div
                animate={{
                    x: mousePosition.x - 250,
                    y: mousePosition.y - 250,
                    opacity: isHovering ? 0.3 : 0
                }}
                transition={{
                    type: "spring",
                    damping: 30,
                    stiffness: 150,
                    mass: 0.8
                }}
                className="absolute w-[500px] h-[500px] rounded-full hidden md:block"
                style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 60%)' }}
            />

            {/* Tech Grid Overlay */}
            <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{ 
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Film Grain / Noise Overlay */}
            <div 
                className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
            />
        </div>
    );
};
