import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{
        background: 'linear-gradient(90deg, rgba(42, 42, 42, 0.5) 25%, rgba(60, 60, 60, 0.6) 50%, rgba(42, 42, 42, 0.5) 75%)',
        backgroundSize: '400% 100%',
        animation: 'shimmer 1.5s infinite linear',
        ...style,
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default Skeleton;
