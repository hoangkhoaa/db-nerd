import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Search, Table, ChevronRight, ChevronDown } from 'lucide-react';

export const Sidebar = () => {
  const { appMode, setAppMode, selectedTable, setSelectedTable } = useAppStore();
  const [isProdOpen, setProdOpen] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  const tables = [
    { name: 'user_orders', count: '1.2M', active: true },
    { name: 'users', count: '124k' },
    { name: 'order_items', count: '4.8M' },
    { name: 'products', count: '8.4k' },
    { name: 'audit_logs', count: '2.1M' },
  ];

  const filteredTables = tables.filter(t => t.name.toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <aside className="w-64 bg-slate-950/60 border-r border-slate-800/80 flex flex-col justify-between select-none flex-shrink-0">
      
      {/* Top Filter & Mode Switcher */}
      <div className="p-3 border-b border-slate-800/80 space-y-2">
        {/* Mode Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
          <button
            onClick={() => setAppMode('sql')}
            className={`py-1 rounded transition flex items-center justify-center gap-1 ${
              appMode === 'sql' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>SQL</span>
          </button>
          <button
            onClick={() => setAppMode('redis')}
            className={`py-1 rounded transition flex items-center justify-center gap-1 ${
              appMode === 'redis' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Redis</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          </button>
          <button
            onClick={() => setAppMode('snowflake')}
            className={`py-1 rounded transition flex items-center justify-center gap-1 ${
              appMode === 'snowflake' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Snowflake</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search tables (⌘P)..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition pl-7 font-sans"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2.5" />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
        {appMode === 'sql' && (
          <div className="space-y-1">
            {/* Group: Production */}
            <div 
              onClick={() => setProdOpen(!isProdOpen)}
              className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-rose-400 uppercase tracking-wider cursor-pointer hover:bg-slate-900/50 rounded-md transition"
            >
              <div className="flex items-center space-x-1.5">
                {isProdOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
                <span>Production</span>
              </div>
              <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded text-[9px] font-mono">PROD</span>
            </div>

            {isProdOpen && (
              <div className="ml-2 pl-2 border-l border-rose-500/30 space-y-0.5">
                <div className="flex items-center justify-between px-2 py-1 rounded text-slate-300 font-semibold text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span>🐘</span>
                    <span>ecom_prod_db</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>

                {/* Table List */}
                <div className="ml-3 pl-2 border-l border-slate-800 space-y-0.5 pt-1">
                  {filteredTables.map((tbl) => (
                    <div
                      key={tbl.name}
                      onClick={() => setSelectedTable(tbl.name)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                        selectedTable === tbl.name
                          ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30'
                          : 'hover:bg-slate-800/60 text-slate-300 font-medium'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <Table className={`w-3.5 h-3.5 ${selectedTable === tbl.name ? 'text-sky-400' : 'text-slate-500'}`} />
                        <span className="truncate">{tbl.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{tbl.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Group: Staging */}
            <div className="pt-2">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                <div className="flex items-center space-x-1.5">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Staging GCP</span>
                </div>
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[9px] font-mono">QA</span>
              </div>
            </div>

            {/* Group: Local */}
            <div className="pt-1">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                <div className="flex items-center space-x-1.5">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Localhost</span>
                </div>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-mono">DEV</span>
              </div>
            </div>
          </div>
        )}

        {appMode === 'redis' && (
          <div className="space-y-2">
            <div className="px-2 py-1 flex items-center justify-between text-rose-300 font-bold text-[11px] uppercase">
              <span>Redis DB 0</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/20 rounded font-mono">1,482 keys</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-200 font-mono">
                <span>user:1001:profile</span>
                <span className="text-[9px] px-1 bg-blue-500/20 text-blue-300 rounded">HASH</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-mono">
                <span>rate_limit:ip:127.0.0.1</span>
                <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-300 rounded">STR</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-mono">
                <span>cache:cart:901</span>
                <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 rounded">JSON</span>
              </div>
            </div>
          </div>
        )}

        {appMode === 'snowflake' && (
          <div className="space-y-2">
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span>❄️ ANALYTICS_WH</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono">SIZE: L</span>
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>Auto-suspend: 300s</span>
                <span className="font-mono text-sky-400">4 Credits/hr</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
          <span className="font-medium text-slate-300">ec2-bastion (SSH)</span>
        </div>
        <span className="font-mono text-slate-500">1.8ms</span>
      </div>

    </aside>
  );
};
