import React from 'react';

export interface BorderChaseProps {
  color?: 'sky' | 'amber' | 'emerald' | 'purple';
  dual?: boolean;
  speed?: 'fast' | 'normal' | 'slow';
  borderWidth?: number;
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * BorderChase: A high-performance, GPU-accelerated chasing highlight runner.
 * The highlight travels strictly along the 4 borders and rounded corners of its container,
 * with zero corner protrusion or outer-clip glitching.
 */
export const BorderChase: React.FC<BorderChaseProps> = ({
  color = 'sky',
  dual = true,
  speed = 'normal',
  borderWidth = 1.5,
  glow = true,
  className = '',
  style,
}) => {
  const modeClass = dual ? `border-chase-dual-${color}` : `border-chase-single-${color}`;
  const speedClass = `border-chase-${speed}`;
  const glowClass = glow ? `border-chase-glow-${color}` : '';

  return (
    <div
      className={`border-chase-root ${modeClass} ${glowClass} ${className}`}
      style={{
        padding: `${borderWidth}px`,
        ...style,
      }}
      aria-hidden="true"
    >
      <div className={`border-chase-rotor ${speedClass}`} />
    </div>
  );
};
