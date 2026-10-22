import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { ShieldCheck } from 'lucide-react';
import { BorderChase } from './BorderChase';

interface LedMatrixBannerProps {
  onOpenDatabaseModal: () => void;
}

export const LedMatrixBanner: React.FC<LedMatrixBannerProps> = ({ onOpenDatabaseModal }) => {
  const {
    activeConnection,
    selectedTable,
    isConnecting,
    connectingPhase,
    networkSpeed,
    resolvedTheme,
  } = useAppStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [speedDisplay, setSpeedDisplay] = useState(networkSpeed || '355 KB/s');
  const [showTooltip, setShowTooltip] = useState(false);

  const env = activeConnection.env; // 'prod' | 'staging' | 'dev'

  const engineLabel =
    activeConnection.engine === 'postgres'
      ? 'PostgreSQL 17.7'
      : activeConnection.engine === 'mysql'
      ? 'MySQL 8.0.36'
      : activeConnection.engine === 'snowflake'
      ? 'Snowflake 8.2'
      : 'Redis 7.2';

  const envTag = env === 'prod' ? 'PROD' : env === 'staging' ? 'STAGING' : 'LOCAL';

  // Fluctuate speed slightly to mimic live network stream like TablePlus
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnecting) {
        const speeds = ['142 KB/s', '428 KB/s', '890 KB/s', '1.4 MB/s', '620 KB/s'];
        setSpeedDisplay(speeds[Math.floor(Math.random() * speeds.length)]);
      } else {
        const base = env === 'prod' ? 355 : env === 'staging' ? 240 : 180;
        const jitter = Math.floor(Math.random() * 40) - 20;
        setSpeedDisplay(`${base + jitter} KB/s`);
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [isConnecting, env]);

  // High-performance Canvas LED Matrix renderer (recreates TablePlus exact visual)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    // Fixed dot spacing
    const dotSpacing = 3.5;
    const dotRadius = 1.1;

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 2;

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const cols = Math.floor(width / dotSpacing);
      const rows = Math.floor(height / dotSpacing);

      // Speed of the scan wave
      const waveSpeed = isConnecting ? 0.08 : 0.02;
      t += waveSpeed;

      // Color paletting matching TablePlus screenshot
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * dotSpacing + dotSpacing / 2;
          const y = r * dotSpacing + dotSpacing / 2;

          // Wave equation across the matrix
          const wavePhase = (c / cols) * 4 - t;
          const waveIntensity = Math.sin(wavePhase);
          const noise = Math.sin(c * 12.9898 + r * 78.233 + t * 0.5) * 43758.5453;
          const randomVal = noise - Math.floor(noise);

          let rCol = 0;
          let gCol = 0;
          let bCol = 0;
          let alpha = 0.3;

          if (env === 'prod') {
            // Ruby red matrix with occasional amber/green sparkles (TablePlus exact look)
            if (randomVal > 0.94) {
              // Green sparkle
              rCol = 34;
              gCol = 197;
              bCol = 94;
              alpha = 0.75;
            } else if (randomVal > 0.86) {
              // Amber/orange sparkle
              rCol = 245;
              gCol = 158;
              bCol = 11;
              alpha = 0.8;
            } else {
              // Deep crimson to neon red
              const isBright = waveIntensity > 0.3 || randomVal > 0.6;
              rCol = isBright ? 239 : 140;
              gCol = isBright ? 68 : 20;
              bCol = isBright ? 68 : 20;
              alpha = isBright ? 0.75 + waveIntensity * 0.25 : 0.25;
            }
          } else if (env === 'staging') {
            // Cyber Amber / Gold Matrix
            if (randomVal > 0.92) {
              rCol = 56;
              gCol = 189;
              bCol = 248;
              alpha = 0.8;
            } else {
              const isBright = waveIntensity > 0.3 || randomVal > 0.55;
              rCol = isBright ? 245 : 180;
              gCol = isBright ? 158 : 90;
              bCol = isBright ? 11 : 10;
              alpha = isBright ? 0.8 + waveIntensity * 0.2 : 0.3;
            }
          } else {
            // Emerald Matrix / Digital Phosphor
            if (randomVal > 0.92) {
              rCol = 56;
              gCol = 189;
              bCol = 248;
              alpha = 0.8;
            } else {
              const isBright = waveIntensity > 0.3 || randomVal > 0.55;
              rCol = isBright ? 16 : 4;
              gCol = isBright ? 185 : 110;
              bCol = isBright ? 129 : 60;
              alpha = isBright ? 0.8 + waveIntensity * 0.2 : 0.3;
            }
          }

          if (isConnecting) {
            // Electric pulse effect during connection
            const pulse = (Math.sin(t * 3 + c * 0.1) + 1) / 2;
            alpha = Math.min(1, alpha + pulse * 0.4);
          }

          const isLight = resolvedTheme === 'light';
          const finalAlpha = isLight
            ? Math.max(0.08, Math.min(0.22, alpha * 0.3))
            : Math.max(0.15, Math.min(1, alpha));

          ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${finalAlpha})`;
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [env, isConnecting, resolvedTheme]);

  return (
    <div className="flex items-center space-x-1.5 pointer-events-auto shrink-0 select-none">
      {/* TablePlus Iconic LED Dot-Matrix Capsule */}
      <button
        onClick={onOpenDatabaseModal}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`no-drag relative h-7 px-3.5 rounded-full text-xs font-mono font-semibold transition-all active:scale-[0.98] flex items-center justify-between overflow-hidden cursor-pointer border max-w-xl group shadow-2xs dark:shadow-md ${
          env === 'prod'
            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/60 hover:border-rose-300 dark:hover:border-rose-400'
            : env === 'staging'
            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/60 hover:border-amber-300 dark:hover:border-amber-400'
            : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/60 hover:border-emerald-300 dark:hover:border-emerald-400'
        }`}
        title="Click to Switch Database or Change Schema (⌘O)"
      >
        {/* Apple-grade Border Chase Highlight Runner */}
        {isConnecting && (
          <BorderChase color="sky" dual={true} speed="fast" borderWidth={1.5} glow={true} />
        )}

        {/* HTML5 Canvas LED Dot Matrix Layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
        />

        {/* Ambient Gradient Overlay for text legibility */}
        <div
          className={`absolute inset-0 pointer-events-none ${
            env === 'prod'
              ? 'bg-gradient-to-r from-rose-50/90 via-rose-100/40 to-rose-50/90 dark:from-red-950/80 dark:via-rose-950/40 dark:to-red-950/80'
              : env === 'staging'
              ? 'bg-gradient-to-r from-amber-50/90 via-amber-100/40 to-amber-50/90 dark:from-amber-950/80 dark:via-yellow-950/40 dark:to-amber-950/80'
              : 'bg-gradient-to-r from-emerald-50/90 via-emerald-100/40 to-emerald-50/90 dark:from-emerald-950/80 dark:via-teal-950/40 dark:to-emerald-950/80'
          }`}
        />

        {/* Connecting High-Energy Scan Beam */}
        {isConnecting && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent blur-sm animate-[led-sweep_0.8s_linear_infinite]" />
          </div>
        )}

        {/* Monospace High-Contrast Foreground Content */}
        <div className="relative z-10 flex items-center justify-between w-full space-x-3 text-slate-800 dark:text-white leading-none dark:[text-shadow:_0_1px_3px_rgba(0,0,0,0.9)]">
          {isConnecting ? (
            /* Connecting Telemetry Status */
            <div className="flex items-center space-x-2 truncate">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500 dark:bg-sky-300" />
              </span>
              <span className="font-extrabold text-sky-700 dark:text-sky-200 tracking-wide uppercase">
                {connectingPhase || 'Establishing TLSv1.3 Handshake...'}
              </span>
            </div>
          ) : (
            /* TablePlus Standard Formatted Connection Banner */
            <div className="flex items-center space-x-1.5 truncate text-[11px]">
              <span className="font-extrabold tracking-wider text-slate-900 dark:text-white">{envTag}</span>
              <span className="opacity-40">|</span>
              <span className="shrink-0">{engineLabel}</span>
              <span className="opacity-40">:</span>
              <span className="shrink-0">TLSv1.3</span>
              <span className="opacity-40">:</span>
              <span className="truncate max-w-[130px] font-bold text-slate-900 dark:text-slate-100">{activeConnection.name}</span>
              <span className="opacity-40">:</span>
              <span className="underline decoration-slate-400/50 dark:decoration-white/50 underline-offset-2 truncate max-w-[110px]">
                {activeConnection.database || 'postgres'}
              </span>
              <span className="opacity-40">:</span>
              <span className="truncate max-w-[120px] text-slate-600 dark:text-slate-300">public.{selectedTable}</span>
            </div>
          )}

          {/* Right Speed Meter */}
          <div className="flex items-center space-x-1.5 shrink-0 pl-2">
            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-white/90 bg-white/80 dark:bg-black/35 px-1.5 py-0.5 rounded leading-none border border-slate-200 dark:border-white/10 shadow-2xs">
              {speedDisplay}
            </span>
          </div>
        </div>
      </button>

      {/* Hover Telemetry Quick Popover */}
      {showTooltip && (
        <div className="absolute top-9 left-1/2 -translate-x-1/2 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/90 rounded-xl shadow-2xl p-3 z-50 text-[11px] font-mono text-slate-700 dark:text-slate-300 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800 mb-2">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Connection Health</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
              ONLINE
            </span>
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Latency:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">0.8ms (Direct Socket)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cipher:</span>
              <span className="text-slate-700 dark:text-slate-300">TLS_AES_256_GCM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Buffer Hit Ratio:</span>
              <span className="text-sky-600 dark:text-sky-400 font-bold">99.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Throughput:</span>
              <span className="text-amber-600 dark:text-amber-300 font-bold">{speedDisplay}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
