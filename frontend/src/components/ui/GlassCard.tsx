import React from 'react';

type GlassCardVariant = 'default' | 'gold' | 'highlight' | 'glow';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassCardVariant;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  onClick
}: GlassCardProps) {
  
  // Base classes that apply to all variants
  const baseClasses = "rounded-[2rem] backdrop-blur-xl transition-all duration-300 relative overflow-hidden";
  
  // Interactive classes (hover effects)
  const interactiveClasses = interactive 
    ? "cursor-pointer hover:scale-[1.02] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98]" 
    : "";

  // Variant specific styles
  let variantStyles = {};
  
  switch (variant) {
    case 'gold':
      variantStyles = {
        background: 'rgba(212, 175, 55, 0.1)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
      };
      break;
    case 'highlight':
      variantStyles = {
        background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      };
      break;
    case 'glow':
      variantStyles = {
        background: 'rgba(20, 20, 20, 0.6)',
        border: '1px solid rgba(212, 175, 55, 0.4)',
        boxShadow: '0 0 25px rgba(212, 175, 55, 0.15)',
      };
      break;
    case 'default':
    default:
      variantStyles = {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      };
      break;
  }

  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      style={variantStyles}
      onClick={onClick}
    >
      {/* Optional internal gradient mesh effect for highlight variant */}
      {variant === 'highlight' && (
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{
               background: 'radial-gradient(circle at top right, rgba(212,175,55,0.3) 0%, transparent 60%)'
             }} 
        />
      )}
      
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
