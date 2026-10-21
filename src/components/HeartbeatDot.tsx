import React from 'react';

export type HeartbeatColor = 'green' | 'red' | 'amber' | 'sky' | 'purple';

interface HeartbeatDotProps {
  color?: HeartbeatColor;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showWave?: boolean;
  className?: string;
}

const COLOR_CLASSES: Record<HeartbeatColor, { core: string; wave: string }> = {
  green: {
    core: 'bg-emerald-400 heartbeat-green',
    wave: 'bg-emerald-400 heartbeat-wave',
  },
  red: {
    core: 'bg-rose-500 heartbeat-red',
    wave: 'bg-rose-500 heartbeat-wave',
  },
  amber: {
    core: 'bg-amber-400 heartbeat-amber',
    wave: 'bg-amber-400 heartbeat-wave',
  },
  sky: {
    core: 'bg-sky-400 heartbeat-green',
    wave: 'bg-sky-400 heartbeat-wave',
  },
  purple: {
    core: 'bg-purple-400 heartbeat-red',
    wave: 'bg-purple-400 heartbeat-wave',
  },
};

const SIZE_CLASSES = {
  xs: { core: 'w-1.5 h-1.5', wave: 'w-1.5 h-1.5' },
  sm: { core: 'w-2 h-2', wave: 'w-2 h-2' },
  md: { core: 'w-2.5 h-2.5', wave: 'w-2.5 h-2.5' },
  lg: { core: 'w-3 h-3', wave: 'w-3 h-3' },
};

export const HeartbeatDot: React.FC<HeartbeatDotProps> = ({
  color = 'green',
  size = 'sm',
  showWave = true,
  className = '',
}) => {
  const c = COLOR_CLASSES[color] || COLOR_CLASSES.green;
  const s = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  return (
    <span className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}>
      {showWave && (
        <span
          className={`absolute rounded-full pointer-events-none opacity-40 ${s.wave} ${c.wave}`}
        />
      )}
      <span className={`relative rounded-full ${s.core} ${c.core}`} />
    </span>
  );
};
