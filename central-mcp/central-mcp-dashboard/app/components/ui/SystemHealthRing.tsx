'use client';

interface SystemHealthRingProps {
  health: number;
  size?: 'small' | 'medium' | 'large';
}

export function SystemHealthRing({ health, size = 'medium' }: SystemHealthRingProps) {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };

  const strokeWidth = size === 'small' ? 4 : size === 'medium' ? 6 : 8;
  const radius = 50 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (health / 100) * circumference;

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'oklch(0.65 0.18 145)'; // Green
    if (health >= 70) return 'oklch(0.75 0.15 90)'; // Yellow
    return 'oklch(0.65 0.22 25)'; // Red
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="oklch(0.20 0.005 270)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={getHealthColor(health)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`font-bold ${size === 'small' ? 'text-sm' : size === 'medium' ? 'text-2xl' : 'text-4xl'}`}>
            {Math.round(health)}%
          </div>
          {size !== 'small' && (
            <div className="text-xs text-text-secondary">Health</div>
          )}
        </div>
      </div>
    </div>
  );
}
