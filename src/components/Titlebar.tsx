import { useAppStore } from '../stores/useAppStore';
import { Database, Search, Sparkles } from 'lucide-react';

export const Titlebar = () => {
  const {
    activeConnection,
    setConnectionModalOpen,
    setHistoryModalOpen,
    pendingEditsCount,
    selectedTable,
    commitTransaction,
    rollbackTransaction,
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

  return (
    <header 
      data-tauri-drag-region
      className="h-12 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 pl-20 flex items-center justify-between select-none z-30 flex-shrink-0"
    >
      {/* Left: App Logo + Active Connection Badge + Quick Find */}
      <div className="flex items-center space-x-3">
        {/* App Logo Branding */}
        <div className="flex items-center space-x-2 pr-2 border-r border-slate-800/80">
          <img 
            src="/app-icon.png" 
            alt="db-nerd" 
            className="w-6 h-6 rounded-md shadow-sm border border-slate-700/60 object-cover" 
          />
          <span className="font-extrabold text-xs tracking-tight text-slate-100 font-mono">db-nerd</span>
        </div>

        {/* Connection Switcher Button */}
        <button
          onClick={() => setConnectionModalOpen(true)}
          className="flex items-center space-x-2 px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800/90 rounded-lg border border-rose-500/40 text-xs font-semibold transition shadow-sm group"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-rose-500/30"></span>
          <span className="text-slate-100 font-bold">{activeConnection.name}</span>
          <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded uppercase">
            {activeConnection.env}
          </span>
        </button>

        {/* Command Palette Trigger */}
        <button
          onClick={() => setConnectionModalOpen(true)}
          className="flex items-center space-x-2 px-2.5 py-1.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-[11px]">Quick Find</span>
          <kbd className="px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-[9px] font-mono text-slate-300">⌘K</kbd>
        </button>

        {/* Query History Trigger */}
        <button
          onClick={() => setHistoryModalOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
        >
          <span className="text-[11px]">History</span>
          <kbd className="px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-[9px] font-mono text-slate-300">⌘H</kbd>
        </button>
      </div>

      {/* Center: Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs">
        <div className="flex items-center space-x-1 text-slate-400">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span>public</span>
        </div>
        <span className="text-slate-600">/</span>
        <div className="flex items-center space-x-1.5 px-2.5 py-0.5 bg-sky-500/10 border border-sky-500/30 rounded-md text-sky-300 font-semibold shadow-sm">
          <span>{selectedTable}</span>
        </div>
      </div>

      {/* Right: Actions (Pending edits, Commit, AI Assistant) */}
      <div className="flex items-center space-x-2">
        {pendingEditsCount > 0 && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>{pendingEditsCount} pending</span>
            </div>

            <button
              onClick={handleDiscard}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              Discard
            </button>

            <button
              onClick={handleCommit}
              className="px-3 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center space-x-1.5 shadow-md shadow-sky-500/20 active:scale-95"
            >
              <span>Commit</span>
              <kbd className="px-1 py-0.2 bg-slate-900/40 rounded text-[9px] font-mono text-slate-950 font-extrabold">⌘S</kbd>
            </button>
          </div>
        )}

        <div className="h-4 w-[1px] bg-slate-800 mx-1"></div>

        <button 
          onClick={() => alert("✨ AI Assistant (MCP) connected via localhost:4080\nReady for natural language queries!")}
          className="px-2.5 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI / MCP</span>
        </button>
      </div>
    </header>
  );
};
