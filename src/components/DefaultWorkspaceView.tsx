import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import {
  Terminal,
  Table as TableIcon,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { HeartbeatDot } from './HeartbeatDot';

export const DefaultWorkspaceView: React.FC = () => {
  const {
    activeConnection,
    openNewQueryTab,
    openTableGridTab,
  } = useAppStore();

  const isPostgres = activeConnection.engine === 'postgres';
  const isMysql = activeConnection.engine === 'mysql';
  const isRedis = activeConnection.engine === 'redis';

  const engineName = isPostgres
    ? 'PostgreSQL 16.15'
    : isMysql
    ? 'MySQL 8.0.46'
    : isRedis
    ? 'Redis 7.4.11'
    : 'Snowflake 8.2';

  const defaultSuggestedTable = isMysql ? 'app_users' : isRedis ? 'cache_keys' : 'users';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 select-none overflow-y-auto relative animate-in fade-in duration-200">
      {/* Background subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-xl w-full flex flex-col items-center text-center space-y-6">
        
        {/* TablePlus Style Cute Mascot Illustration (Handcrafted SVG) */}
        <div className="relative group">
          <div className="w-36 h-36 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 shadow-2xl flex items-center justify-center p-5 ring-1 ring-white/10 group-hover:border-sky-500/40 transition-all duration-300">
            {/* Ambient pulse */}
            <div className="absolute inset-0 rounded-3xl bg-sky-500/5 blur-xl group-hover:bg-sky-500/10 transition-colors" />

            <svg
              viewBox="0 0 120 120"
              className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Database Cylinder Stack Base */}
              <ellipse cx="60" cy="90" rx="36" ry="12" fill="#1E293B" stroke="#334155" strokeWidth="2" />
              <path d="M24 75 C24 87 96 87 96 75 L96 90 C96 102 24 102 24 90 Z" fill="#0F172A" stroke="#334155" strokeWidth="2" />
              <ellipse cx="60" cy="75" rx="36" ry="12" fill="#1E293B" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 3" />

              {/* Glowing Energy Ring */}
              <ellipse cx="60" cy="60" rx="42" ry="14" stroke="#0284C7" strokeWidth="1.5" strokeOpacity="0.4" />

              {/* Middle Layer */}
              <path d="M24 45 C24 57 96 57 96 45 L96 60 C96 72 24 72 24 60 Z" fill="#0F172A" stroke="#475569" strokeWidth="2" />
              <ellipse cx="60" cy="45" rx="36" ry="12" fill="#334155" stroke="#64748B" strokeWidth="2" />

              {/* TablePlus Character / Robot Mascot */}
              <circle cx="60" cy="36" r="16" fill="#38BDF8" />
              {/* Cute Visor / Eyes */}
              <rect x="50" y="32" width="20" height="8" rx="4" fill="#0F172A" />
              <circle cx="55" cy="36" r="2" fill="#38BDF8" />
              <circle cx="65" cy="36" r="2" fill="#38BDF8" />

              {/* Antenna with green connection LED */}
              <path d="M60 20 L60 12" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
              <circle cx="60" cy="10" r="3" fill="#10B981" />

              {/* Data Sparkles */}
              <circle cx="92" cy="30" r="1.5" fill="#F59E0B" />
              <circle cx="28" cy="38" r="1.5" fill="#38BDF8" />
              <circle cx="85" cy="80" r="2" fill="#10B981" />
            </svg>
          </div>

          {/* Engine Badge */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-slate-900 border border-slate-700/80 rounded-full flex items-center space-x-1.5 shadow-md">
            <HeartbeatDot color="green" size="xs" showWave={true} />
            <span className="text-[10px] font-mono font-bold text-slate-200 uppercase tracking-wider">
              {activeConnection.engine}
            </span>
          </div>
        </div>

        {/* Database & Connection Header */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-base font-bold text-slate-100 font-mono tracking-tight">
              {activeConnection.database || 'postgres'}
            </h1>
            <span className="text-slate-600 font-mono">/</span>
            <span className="text-xs font-mono text-sky-400 font-semibold">
              public
            </span>
          </div>

          <p className="text-xs text-slate-400 flex items-center justify-center space-x-1.5 font-mono">
            <span>{engineName}</span>
            <span className="text-slate-600">•</span>
            <span>{activeConnection.host}:{activeConnection.port}</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>TLSv1.3</span>
            </span>
          </p>
        </div>

        {/* Quick Action Tiles */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-md pt-2">
          {/* Action 1: New SQL Console */}
          <button
            onClick={() => openNewQueryTab()}
            className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/50 flex flex-col items-start transition-all duration-150 cursor-pointer group shadow-sm text-left active:scale-[0.98]"
          >
            <div className="p-2 bg-sky-500/15 text-sky-400 rounded-lg group-hover:scale-105 transition-transform mb-2">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-slate-200 group-hover:text-white">New SQL Query</span>
              <kbd className="text-[10px] font-mono text-slate-500 group-hover:text-sky-300 font-bold">⌘E</kbd>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5">Write and execute raw SQL statements</span>
          </button>

          {/* Action 2: Open Default Table Grid */}
          <button
            onClick={() => openTableGridTab(defaultSuggestedTable)}
            className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-start transition-all duration-150 cursor-pointer group shadow-sm text-left active:scale-[0.98]"
          >
            <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform mb-2">
              <TableIcon className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-slate-200 group-hover:text-white">Open Table</span>
              <kbd className="text-[10px] font-mono text-slate-500 group-hover:text-emerald-300 font-bold">⌘O</kbd>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5">Explore {defaultSuggestedTable} data grid</span>
          </button>
        </div>

        {/* Shortcuts & Navigation Hint Banner */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 w-full max-w-md text-xs text-slate-400 space-y-1.5 font-sans">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Workspace Navigation</span>
            </span>
            <span className="text-slate-500 font-mono">TablePlus Native Feel</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60 font-mono">
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-slate-950/60 text-slate-300">
              <span>Switch DB</span>
              <kbd className="text-[10px] text-sky-400 font-bold">⌘O</kbd>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-slate-950/60 text-slate-300">
              <span>Connections</span>
              <kbd className="text-[10px] text-sky-400 font-bold">⌘K</kbd>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-slate-950/60 text-slate-300">
              <span>Toggle Sidebar</span>
              <kbd className="text-[10px] text-sky-400 font-bold">⌘B</kbd>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-slate-950/60 text-slate-300">
              <span>Preferences</span>
              <kbd className="text-[10px] text-sky-400 font-bold">⌘,</kbd>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 text-center pt-1">
            Double-click any table on the left sidebar to open its data grid tab.
          </p>
        </div>

      </div>
    </div>
  );
};
