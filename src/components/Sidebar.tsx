import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Search, Table, ChevronRight, Plus } from 'lucide-react';
import { HeartbeatDot, HeartbeatColor } from './HeartbeatDot';

const COLOR_MAP: Record<string, { text: string; dot: string; border: string; bg: string }> = {
  rose: { text: 'text-rose-400', dot: 'bg-rose-500', border: 'border-rose-500/30', bg: 'bg-rose-500/20' },
  amber: { text: 'text-amber-400', dot: 'bg-amber-500', border: 'border-amber-500/30', bg: 'bg-amber-500/20' },
  emerald: { text: 'text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-500/30', bg: 'bg-emerald-500/20' },
  sky: { text: 'text-sky-400', dot: 'bg-sky-500', border: 'border-sky-500/30', bg: 'bg-sky-500/20' },
  purple: { text: 'text-purple-400', dot: 'bg-purple-500', border: 'border-purple-500/30', bg: 'bg-purple-500/20' },
};

const GROUP_COLOR_MAP: Record<string, HeartbeatColor> = {
  rose: 'red',
  amber: 'amber',
  emerald: 'green',
  sky: 'sky',
  purple: 'purple',
};

const ENGINE_EMOJI: Record<string, string> = {
  postgres: '🐘',
  mysql: '🐬',
  redis: '🟥',
  snowflake: '❄️',
};

export const Sidebar = () => {
  const {
    appMode,
    setAppMode,
    selectedTable,
    openTableGridTab,
    openTableSchemaTab,
    connectionGroups,
    connections,
    activeConnection,
    switchActiveConnection,
    setConnectionModalOpen,
  } = useAppStore();

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [searchFilter, setSearchFilter] = useState('');

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const tables = [
    { name: 'user_orders', count: '1.2M', active: true },
    { name: 'users', count: '124k' },
    { name: 'order_items', count: '4.8M' },
    { name: 'products', count: '8.4k' },
    { name: 'audit_logs', count: '2.1M' },
  ];

  const filteredTables = tables.filter((t) => t.name.toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <aside className="w-64 bg-slate-950/60 border-r border-slate-800/80 flex flex-col justify-between select-none flex-shrink-0">
      
      {/* Top Filter & Mode Switcher */}
      <div className="p-3 border-b border-slate-800/80 space-y-2">
        {/* Mode Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
          <button
            onClick={() => setAppMode('sql')}
            className={`py-1 rounded-md transition-all duration-150 flex items-center justify-center gap-1 ${
              appMode === 'sql' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>SQL</span>
          </button>
          <button
            onClick={() => setAppMode('redis')}
            className={`py-1 rounded-md transition-all duration-150 flex items-center justify-center gap-1 ${
              appMode === 'redis' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Redis</span>
            <HeartbeatDot color="red" size="xs" showWave={false} />
          </button>
          <button
            onClick={() => setAppMode('snowflake')}
            className={`py-1 rounded-md transition-all duration-150 flex items-center justify-center gap-1 ${
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
            className="w-full bg-slate-900/90 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors pl-7 font-sans"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2.5" />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
        {appMode === 'sql' && (
          <div className="space-y-2">
            {connectionGroups.map((group) => {
              const groupConns = connections.filter((c) => c.groupId === group.id);
              const isCollapsed = !!collapsedGroups[group.id];
              const colorInfo = COLOR_MAP[group.color] || COLOR_MAP.rose;
              const dotColor = GROUP_COLOR_MAP[group.color] || 'red';

              return (
                <div key={group.id} className="space-y-1">
                  {/* Group Header with smooth rotating chevron */}
                  <div
                    onClick={() => toggleGroup(group.id)}
                    className={`flex items-center justify-between px-2 py-1.5 text-[11px] font-bold ${colorInfo.text} uppercase tracking-wider cursor-pointer hover:bg-slate-900/60 rounded-lg transition-all duration-150 active:scale-[0.99] group`}
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform duration-200 ease-out flex-shrink-0 ${
                          isCollapsed ? 'rotate-0' : 'rotate-90'
                        }`}
                      />
                      <HeartbeatDot color={dotColor} size="xs" showWave={false} />
                      <span className="truncate">{group.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`px-1.5 py-0.2 ${colorInfo.bg} rounded text-[9px] font-mono`}>
                        {group.tag}
                      </span>
                    </div>
                  </div>

                  {/* Smooth Accordion Container for Group Connections */}
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-240 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className={`ml-2 pl-2 border-l ${colorInfo.border} space-y-1 pt-1`}>
                        {groupConns.map((conn) => {
                          const isConnActive = activeConnection.id === conn.id;

                          return (
                            <div key={conn.id} className="space-y-1">
                              <div
                                onClick={() => switchActiveConnection(conn.id)}
                                className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition-all duration-150 ${
                                  isConnActive
                                    ? 'bg-slate-800/90 text-slate-100 font-semibold shadow-sm border border-slate-700/40'
                                    : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <div className="flex items-center space-x-1.5 truncate">
                                  <span>{ENGINE_EMOJI[conn.engine] || '🐘'}</span>
                                  <span className="truncate">{conn.name}</span>
                                </div>
                                {isConnActive && (
                                  <HeartbeatDot color="green" size="xs" showWave={true} />
                                )}
                              </div>

                              {/* Tables for Active Connection with smooth collapse */}
                              <div
                                className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                                  isConnActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                }`}
                              >
                                <div className="overflow-hidden">
                                  <div className="ml-3 pl-2 border-l border-slate-800 space-y-0.5 pt-0.5">
                                    {filteredTables.map((tbl) => (
                                      <div
                                        key={tbl.name}
                                        onClick={() => openTableGridTab(tbl.name)}
                                        className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition-all duration-150 group ${
                                          selectedTable === tbl.name
                                            ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30 shadow-sm'
                                            : 'hover:bg-slate-800/60 text-slate-300 font-medium'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2 truncate">
                                          <Table className={`w-3.5 h-3.5 transition-colors ${selectedTable === tbl.name ? 'text-sky-400' : 'text-slate-500'}`} />
                                          <span className="truncate">{tbl.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <span className="text-[10px] text-slate-500 font-mono group-hover:hidden">{tbl.count}</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openTableSchemaTab(tbl.name);
                                            }}
                                            className="hidden group-hover:inline-block px-1.5 py-0.2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded text-[9px] font-mono border border-indigo-500/30 transition-all duration-100 active:scale-95"
                                            title="Open Schema / DDL"
                                          >
                                            DDL
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Open Connection Manager Button */}
            <div className="pt-2">
              <button
                onClick={() => setConnectionModalOpen(true)}
                className="w-full py-1.5 px-2 bg-slate-900/60 hover:bg-slate-800 border border-dashed border-slate-700/80 rounded-lg text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center space-x-1.5 transition-all duration-150 active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add / Manage Connections</span>
              </button>
            </div>
          </div>
        )}

        {appMode === 'redis' && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <div className="px-2 py-1 flex items-center justify-between text-rose-300 font-bold text-[11px] uppercase">
              <span>Redis DB 0</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/20 rounded font-mono">1,482 keys</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-200 font-mono">
                <span>user:1001:profile</span>
                <span className="text-[9px] px-1 bg-blue-500/20 text-blue-300 rounded">HASH</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-mono transition-colors">
                <span>rate_limit:ip:127.0.0.1</span>
                <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-300 rounded">STR</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-mono transition-colors">
                <span>cache:cart:901</span>
                <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 rounded">JSON</span>
              </div>
            </div>
          </div>
        )}

        {appMode === 'snowflake' && (
          <div className="space-y-2 animate-in fade-in duration-200">
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

      {/* Footer Status with organic heartbeat light */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-2 truncate">
          <HeartbeatDot color="green" size="sm" showWave={true} />
          <span className="font-medium text-slate-300 truncate">
            {activeConnection.useSsh && activeConnection.sshHost
              ? `${activeConnection.sshHost} (SSH)`
              : activeConnection.host || 'localhost'}
          </span>
        </div>
        <span className="font-mono text-slate-500 flex-shrink-0">{activeConnection.latencyMs}ms</span>
      </div>

    </aside>
  );
};
