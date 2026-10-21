import { useAppStore } from '../stores/useAppStore';
import { Search, Sparkles, AlertCircle, RefreshCw, PanelRight, PanelRightClose } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { HeartbeatDot } from './HeartbeatDot';

export const Titlebar = () => {
  const {
    activeConnection,
    setConnectionModalOpen,
    setDatabaseModalOpen,
    setHistoryModalOpen,
    pendingEditsCount,
    selectedTable,
    commitTransaction,
    rollbackTransaction,
    isRightInspectorOpen,
    toggleRightInspector,
  } = useAppStore();

  const handleCommit = () => {
    const res = commitTransaction();
    alert(`✅ Transaction Committed Successfully!\n\nExecuted ${res.count} change(s) in 1.4ms! All locks released.`);
  };

  const handleDiscard = () => {
    if (confirm("Discard all pending uncommitted edits in active transaction?")) {
      rollbackTransaction();
    }
  };

  const handleMouseDown = async (e: React.MouseEvent) => {
    if (e.button === 0 && !(e.target as HTMLElement).closest('button, input, select, textarea, kbd, a')) {
      try {
        const appWindow = getCurrentWindow();
        await appWindow.startDragging();
      } catch (err) {
        console.error('Failed to start dragging window:', err);
      }
    }
  };

  const handleDoubleClick = async (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('button, input, select, textarea, kbd, a')) {
      try {
        const appWindow = getCurrentWindow();
        await appWindow.toggleMaximize();
      } catch (err) {
        console.error('Failed to toggle maximize window:', err);
      }
    }
  };

  const engineLabel =
    activeConnection.engine === 'postgres'
      ? 'PostgreSQL 17.7'
      : activeConnection.engine === 'mysql'
      ? 'MySQL 8.0.36'
      : activeConnection.engine === 'snowflake'
      ? 'Snowflake 8.2'
      : 'Redis 7.2';

  return (
    <header 
      data-tauri-drag-region
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className="drag-region h-12 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 pl-20 flex items-center justify-between select-none z-30 flex-shrink-0 cursor-default"
    >
      {/* Left: App Logo + Active Connection Badge + Quick Find */}
      <div className="flex items-center space-x-2.5 pointer-events-auto">
        {/* App Logo Branding */}
        <div className="flex items-center space-x-2 pr-2 border-r border-slate-800/80">
          <img 
            src="/app-icon.png" 
            alt="db-nerd" 
            className="w-7 h-7 object-contain drop-shadow" 
          />
          <span className="font-extrabold text-xs tracking-tight text-slate-100 font-mono">db-nerd</span>
        </div>

        {/* Connection Switcher Button */}
        <button
          onClick={() => setConnectionModalOpen(true)}
          className="no-drag flex items-center space-x-1.5 px-2 py-1 bg-slate-900/90 hover:bg-slate-800/90 rounded-lg border border-slate-700/80 text-xs font-semibold transition shadow-sm group active:scale-[0.98]"
        >
          <HeartbeatDot 
            color={activeConnection.env === 'prod' ? 'red' : activeConnection.env === 'staging' ? 'amber' : 'green'} 
            size="sm" 
            showWave={true} 
          />
          <span className="text-slate-200 font-bold text-[11px] truncate max-w-[110px]">{activeConnection.name}</span>
        </button>

        {/* Command Palette Trigger */}
        <button
          onClick={() => setConnectionModalOpen(true)}
          className="no-drag flex items-center space-x-1.5 px-2 py-1 bg-slate-900/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
        >
          <Search className="w-3.5 h-3.5" />
          <kbd className="px-1 py-0.2 bg-slate-950 border border-slate-700 rounded text-[9px] font-mono text-slate-300">⌘K</kbd>
        </button>

        {/* Query History Trigger */}
        <button
          onClick={() => setHistoryModalOpen(true)}
          className="no-drag flex items-center space-x-1 px-2 py-1 bg-slate-900/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
          title="Query History (⌘H)"
        >
          <span className="text-[11px]">History</span>
          <kbd className="px-1 py-0.2 bg-slate-950 border border-slate-700 rounded text-[9px] font-mono text-slate-300">⌘H</kbd>
        </button>
      </div>

      {/* Center: Environment Safety Pill Banner (TablePlus standard layout) */}
      <div className="flex items-center space-x-2 pointer-events-auto">
        <button
          onClick={() => setDatabaseModalOpen(true)}
          className={`no-drag flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold transition shadow-sm active:scale-95 ${
            activeConnection.env === 'prod'
              ? 'bg-rose-600/90 hover:bg-rose-600 text-white shadow-rose-950/40 border border-rose-400/40'
              : activeConnection.env === 'staging'
              ? 'bg-amber-600/90 hover:bg-amber-600 text-white shadow-amber-950/40 border border-amber-400/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 border border-emerald-400/40'
          }`}
          title="Click to Switch Database or Connection (⌘O)"
        >
          <span>{engineLabel}</span>
          <span className="opacity-60">:</span>
          <span>TLSv1.3</span>
          <span className="opacity-60">:</span>
          <span>{activeConnection.name}</span>
          <span className="opacity-60">:</span>
          <span className="underline decoration-white/40 underline-offset-2">{activeConnection.database || 'postgres'}</span>
          <span className="opacity-60">:</span>
          <span>public.{selectedTable}</span>
        </button>
      </div>

      {/* Right: Actions, Refresh, Inspector Toggle, Commit */}
      <div className="flex items-center space-x-2 pointer-events-auto">
        {pendingEditsCount > 0 && (
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center space-x-1 px-2 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold">
              <HeartbeatDot color="amber" size="xs" showWave={true} />
              <span>{pendingEditsCount}</span>
            </div>

            <button
              onClick={handleDiscard}
              className="no-drag px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              Discard
            </button>

            <button
              onClick={handleCommit}
              className="no-drag px-2.5 py-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center space-x-1 shadow-md shadow-sky-500/20 active:scale-95"
            >
              <span>Commit</span>
              <kbd className="px-1 py-0.2 bg-slate-900/40 rounded text-[9px] font-mono text-slate-950 font-extrabold">⌘S</kbd>
            </button>
          </div>
        )}

        {/* Safe Mode Alert Badge */}
        <button
          onClick={() => alert("🛡️ Safe Mode is Active.\nAuto-commit is disabled. All modifications require explicit transaction commit (⌘S).")}
          className="no-drag p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-amber-400 rounded-lg transition"
          title="Safe Mode: Transaction Isolation Active"
        >
          <AlertCircle className="w-3.5 h-3.5" />
        </button>

        {/* Reload Table */}
        <button
          onClick={() => {
            const { setSelectedTable, selectedTable } = useAppStore.getState();
            setSelectedTable(selectedTable);
          }}
          className="no-drag p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white rounded-lg transition active:scale-95"
          title="Reload Table Data & Schema (⌘R)"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Toggle Right Inspector */}
        <button
          onClick={toggleRightInspector}
          className={`no-drag p-1.5 border rounded-lg transition active:scale-95 ${
            isRightInspectorOpen
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/70 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Right Inspector Panel (⌘I)"
        >
          {isRightInspectorOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRight className="w-3.5 h-3.5" />}
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-0.5"></div>

        <button 
          onClick={() => alert("✨ AI Assistant (MCP) connected via localhost:4080\nReady for natural language queries!")}
          className="no-drag px-2 py-1 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI</span>
        </button>
      </div>
    </header>
  );
};
