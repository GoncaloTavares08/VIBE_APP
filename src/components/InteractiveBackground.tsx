
import React, { useEffect, useRef } from 'react';

export const InteractiveBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const mouse = { x: -100, y: -100 };
        let lastScrollY = window.scrollY;
        let scrollVelocity = 0;

        const particles: Particle[] = [];
        const particleCount = Math.min(Math.floor((width * height) / 15000), 100); // Responsive count

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            baseX: number;
            baseY: number;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1.5; // Careful speed
                this.vy = (Math.random() - 0.5) * 1.5;
                this.size = Math.random() * 2 + 1;
                this.baseX = this.x;
                this.baseY = this.y;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                // Mouse interaction (repulsion)
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const maxDistance = 150;
                const force = (maxDistance - distance) / maxDistance;
                const directionX = forceDirectionX * force * 5; // Strength
                const directionY = forceDirectionY * force * 5;

                // If mouse is close, push particle away slightly
                if (distance < maxDistance) {
                    this.x -= directionX;
                    this.y -= directionY;
                }

                // Scroll interaction
                this.y -= scrollVelocity * 0.2; // Move particles based on scroll speed
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = 'rgba(212, 175, 55, 0.4)'; // Gold color
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const init = () => {
            particles.length = 0;
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw connecting lines
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    const dx = particles[a].x - particles[b].x;
                    const dy = particles[a].y - particles[b].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        const opacity = 1 - (distance / 150);
                        ctx.strokeStyle = `rgba(212, 175, 55, ${opacity * 0.2})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }

            particles.forEach(p => {
                p.update();
                p.draw();
            });

            // Decay scroll velocity
            scrollVelocity *= 0.95;

            requestAnimationFrame(animate);
        };

        init();
        animate();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            init();
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.x;
            mouse.y = e.y;
        };

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            scrollVelocity = (currentScrollY - lastScrollY) * 0.5; // Sensitivity
            lastScrollY = currentScrollY;
        };

        // Reset mouse when leaving so particles don't get stuck pushed
        const handleMouseLeave = () => {
            mouse.x = -100;
            mouse.y = -100;
        }

        // Modify update to include scroll velocity
        const originalUpdate = Particle.prototype.update;
        // We override or modify existing logic above? 
        // Easier to just paste the whole useEffect body or relevant parts if I can't patch easily.
        // Actually, I can just inject the scrollVelocity usage into the update loop if I access the class instance.
        // But since Particle is defined inside useEffect, I should probably replace the whole useEffect or the relevant parts.
        // However, replace_file_content works best with contiguous blocks.

        // Let's add the listener first
        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseLeave);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: '#0a0a0a' }} // Fallback/Base color
        />
    );
};
