import { useAppStore } from '../stores/useAppStore';
import {
  Sparkles,
  RefreshCw,
  PanelRight,
  PanelRightClose,
  PanelLeft,
  Terminal,
  Database,
  Filter,
  History,
  Sliders,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { HeartbeatDot } from './HeartbeatDot';
import { ThemeMode } from '../types';

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
    isSidebarOpen,
    toggleSidebar,
    isFilterBarOpen,
    toggleFilterBar,
    openNewQueryTab,
    isReloading,
    reloadData,
    settings,
    resolvedTheme,
    setThemeMode,
    setSettingsModalOpen,
  } = useAppStore();

  const handleCycleTheme = () => {
    const nextTheme: ThemeMode =
      settings.themeMode === 'auto'
        ? 'dark'
        : settings.themeMode === 'dark'
        ? 'light'
        : 'auto';
    setThemeMode(nextTheme);
  };

  const handleCommit = async () => {
    const res = await commitTransaction();
    if (res.count > 0) {
      alert(`✅ Transaction Committed Successfully!\n\nExecuted ${res.count} change(s)! All locks released.`);
    }
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
      className="drag-region h-11 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 pl-20 flex items-center justify-between select-none z-30 flex-shrink-0 cursor-default"
    >
      {/* Left: Window Controls spacer + Sidebar Toggle + Connection Selector + SQL Capsule + Filter Toggle */}
      <div className="flex items-center space-x-1.5 pointer-events-auto">
        {/* Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className={`no-drag p-1.5 rounded-lg border transition ${
            isSidebarOpen
              ? 'bg-slate-800 text-slate-100 border-slate-700/80 shadow-xs'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
          }`}
          title="Toggle Sidebar (⌘B)"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>

        {/* Connection Switcher Pill */}
        <button
          onClick={() => setConnectionModalOpen(true)}
          className="no-drag flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 rounded-lg border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition shadow-xs group active:scale-[0.98]"
          title="Connections (⌘K)"
        >
          <HeartbeatDot 
            color={activeConnection.env === 'prod' ? 'red' : activeConnection.env === 'staging' ? 'amber' : 'green'} 
            size="xs" 
            showWave={false} 
          />
          <Database className="w-3 h-3 text-sky-400" />
          <span className="font-mono text-[11px] font-bold truncate max-w-[105px]">{activeConnection.name}</span>
        </button>

        {/* SQL Query Console Capsule (TablePlus Style) */}
        <button
          onClick={() => openNewQueryTab()}
          className="no-drag flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-bold text-sky-300 hover:text-white transition group shadow-xs active:scale-95"
          title="SQL Query (⌘E / ⌘T)"
        >
          <Terminal className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
          <span className="font-mono text-[11px]">SQL</span>
        </button>

        {/* Inline Filter Bar Toggle */}
        <button
          onClick={toggleFilterBar}
          className={`no-drag p-1.5 rounded-lg border transition ${
            isFilterBarOpen
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-xs'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
          }`}
          title="Toggle Inline Filters (WHERE / ORDER BY)"
        >
          <Filter className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center: Environment Safety Pill Banner (TablePlus iconic layout) */}
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
          title="Click to Switch Database (⌘O)"
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

      {/* Right: Clean, un-cluttered actions matching TablePlus */}
      <div className="flex items-center space-x-1.5 pointer-events-auto">
        {pendingEditsCount > 0 ? (
          <div className="flex items-center space-x-1.5 animate-in fade-in">
            <div className="flex items-center space-x-1 px-2 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold">
              <HeartbeatDot color="amber" size="xs" showWave={true} />
              <span>{pendingEditsCount}</span>
            </div>

            <button
              onClick={handleDiscard}
              className="no-drag px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              title="Discard Uncommitted Edits (⌘Z)"
            >
              Discard
            </button>

            <button
              onClick={handleCommit}
              className="no-drag px-2.5 py-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center space-x-1 shadow-md shadow-sky-500/20 active:scale-95"
              title="Commit Changes (⌘S)"
            >
              <span>Commit</span>
              <kbd className="px-1 py-0.2 bg-slate-900/40 rounded text-[9px] font-mono text-slate-950 font-extrabold">⌘S</kbd>
            </button>
          </div>
        ) : (
          <button
            onClick={() => reloadData()}
            className={`no-drag p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white rounded-lg transition active:scale-95 ${
              isReloading ? 'text-sky-400 border-sky-500/50 bg-sky-950/30' : ''
            }`}
            title="Reload Data & Schema (⌘R)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        )}

        {/* History Modal Trigger */}
        <button
          onClick={() => setHistoryModalOpen(true)}
          className="no-drag p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-400 hover:text-slate-200 rounded-lg transition active:scale-95"
          title="Query History (⌘H)"
        >
          <History className="w-3.5 h-3.5" />
        </button>

        {/* Toggle Right Inspector */}
        <button
          onClick={toggleRightInspector}
          className={`no-drag p-1.5 border rounded-lg transition active:scale-95 ${
            isRightInspectorOpen
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-xs'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/70 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Right Inspector Panel (⌘I)"
        >
          {isRightInspectorOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRight className="w-3.5 h-3.5" />}
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

        {/* Quick Theme Mode Toggle */}
        <button
          onClick={handleCycleTheme}
          className="no-drag p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white rounded-lg transition active:scale-95 flex items-center justify-center cursor-pointer"
          title={`Theme: ${settings.themeMode === 'auto' ? `Auto (System: ${resolvedTheme})` : settings.themeMode === 'dark' ? 'Dark' : 'Light'} (Click to cycle)`}
        >
          {settings.themeMode === 'auto' ? (
            <Laptop className="w-3.5 h-3.5 text-sky-400" />
          ) : settings.themeMode === 'light' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          )}
        </button>

        {/* Preferences & Settings */}
        <button
          onClick={() => setSettingsModalOpen(true)}
          className="no-drag p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-400 hover:text-slate-200 rounded-lg transition active:scale-95 cursor-pointer"
          title="Preferences & Settings (⌘,)"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* AI Assistant */}
        <button 
          onClick={() => alert("✨ AI Assistant (MCP) connected via localhost:4080\nReady for natural language queries!")}
          className="no-drag p-1.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 hover:text-purple-100 rounded-lg transition active:scale-95"
          title="AI Assistant (MCP)"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        </button>
      </div>
    </header>
  );
};
