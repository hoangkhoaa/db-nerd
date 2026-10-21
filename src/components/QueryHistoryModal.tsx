import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { X, Search, Copy, Play, Check } from 'lucide-react';

export const QueryHistoryModal = () => {
  const { isHistoryModalOpen, setHistoryModalOpen, history, setActiveTab } = useAppStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  if (!isHistoryModalOpen) return null;

  const handleCopy = (id: string, sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleRunInEditor = (_sql: string) => {
    setActiveTab('sql');
    setHistoryModalOpen(false);
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-100">
      <div className="w-full max-w-4xl h-[640px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10">
        
        {/* Titlebar */}
        <div className="h-11 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between select-none">
          <span className="text-xs font-bold text-slate-100">Query History & Audit Log (⌘H)</span>
          <button
            onClick={() => setHistoryModalOpen(false)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80">
          <div className="relative">
            <input
              type="text"
              placeholder="Search SQL query history (SQLite FTS5 indexed)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition pl-8 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* History Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {history.map((item) => (
            <div key={item.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[9px] font-mono font-bold uppercase">
                    {item.env}
                  </span>
                  <span className="font-semibold text-slate-200">{item.connectionName}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-mono text-[11px]">{item.timestamp}</span>
                  <span className="px-2 py-0.2 bg-emerald-500/15 text-emerald-400 rounded-full text-[10px] font-mono">
                    ✓ {item.durationMs}ms • {item.rowsAffected} rows
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleCopy(item.id, item.sql)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition active:scale-95"
                  >
                    {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => handleRunInEditor(item.sql)}
                    className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1 transition active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run in Editor</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 whitespace-pre-wrap select-text">
                {item.sql}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
