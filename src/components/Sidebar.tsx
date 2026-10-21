import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import {
  Search,
  Table as TableIcon,
  ChevronRight,
  ChevronDown,
  Plus,
  Terminal,
  Clock,
  SlidersHorizontal,
  CheckCircle2,
  Copy,
  Columns,
  Play,
  FileCode,
  Code,
  Database,
  Trash2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { TABLE_SCHEMAS } from '../data/schemas';
import {
  ContextMenuContainer,
  ContextMenuItem,
  ContextMenuDivider,
  ContextMenuHeader,
  ContextMenuPosition,
} from './ContextMenu';
import { format as formatSql } from 'sql-formatter';

const SAVED_QUERIES = [
  {
    id: 'q-1',
    title: 'Active Users by Spend',
    desc: 'Top active users ordered by total spend',
    sql: `SELECT u.id, u.email, COUNT(o.id) AS total_orders, SUM(o.total_amount) AS total_spend\nFROM users u\nLEFT JOIN user_orders o ON o.user_id = u.id\nWHERE u.status = 'active'\nGROUP BY u.id, u.email\nORDER BY total_spend DESC LIMIT 50;`,
  },
  {
    id: 'q-2',
    title: 'Tuples by Organisation',
    desc: 'OpenFGA tuple relationship mappings',
    sql: `SELECT store, object_type, object_id, relation, _user\nFROM tuple\nWHERE object_type = 'connector_tool'\nORDER BY inserted_at DESC\nLIMIT 20;`,
  },
  {
    id: 'q-3',
    title: 'Goose Migrations History',
    desc: 'Database schema migration ledger',
    sql: `SELECT id, version_id, is_applied, tstamp\nFROM goose_db_version\nORDER BY id ASC;`,
  },
  {
    id: 'q-4',
    title: 'Process Diagnostics (pg_stat)',
    desc: 'Active running queries and worker processes',
    sql: `SELECT pid, usename, client_addr, state, query_start, query\nFROM pg_stat_activity\nWHERE state != 'idle'\nORDER BY query_start ASC;`,
  },
  {
    id: 'q-5',
    title: 'Reset Session Locks',
    desc: 'Terminate idle in transaction sessions older than 5m',
    sql: `SELECT pg_terminate_backend(pid)\nFROM pg_stat_activity\nWHERE state = 'idle in transaction'\n  AND query_start < NOW() - INTERVAL '5 minutes';`,
  },
];

const TABLES = [
  { name: 'assertion', count: '42' },
  { name: 'authorization_model', count: '18' },
  { name: 'changelog', count: '1.4K' },
  { name: 'goose_db_version', count: '6' },
  { name: 'store', count: '120' },
  { name: 'tuple', count: '386K' },
  { name: 'user_orders', count: '1.2M' },
  { name: 'users', count: '124K' },
  { name: 'products', count: '8.4K' },
];

export const Sidebar = () => {
  const {
    selectedTable,
    setSelectedTable,
    openTableGridTab,
    openTableSchemaTab,
    openNewQueryTab,
    activeConnection,
    setDatabaseModalOpen,
    history,
    showToast,
    reloadData,
  } = useAppStore();

  const [sidebarTab, setSidebarTab] = useState<'items' | 'queries' | 'history'>('items');
  const [searchFilter, setSearchFilter] = useState('');
  const [isFunctionsOpen, setIsFunctionsOpen] = useState(false);
  const [isTablesOpen, setIsTablesOpen] = useState(true);

  // Context Menu state
  const [tableContextPos, setTableContextPos] = useState<ContextMenuPosition | null>(null);
  const [targetTable, setTargetTable] = useState<string | null>(null);

  const [queryContextPos, setQueryContextPos] = useState<ContextMenuPosition | null>(null);
  const [targetQuery, setTargetQuery] = useState<{ id: string; title?: string; sql: string } | null>(null);

  const filteredTables = TABLES.filter((t) =>
    t.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredQueries = SAVED_QUERIES.filter(
    (q) =>
      q.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      q.desc.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredHistory = history.filter((h) =>
    h.sql.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <aside className="w-60 bg-slate-950/70 border-r border-slate-800/80 flex flex-col justify-between select-none flex-shrink-0 font-sans">
      
      {/* Top Section: Segmented Switcher & Search */}
      <div className="flex-shrink-0 border-b border-slate-800/80 p-2 space-y-2">
        {/* TablePlus Style 3-Segment Switcher (Items | Queries | History) */}
        <div className="grid grid-cols-3 gap-0.5 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
          <button
            onClick={() => setSidebarTab('items')}
            className={`py-1 rounded-md transition-all duration-150 flex items-center justify-center ${
              sidebarTab === 'items'
                ? 'bg-slate-800 text-slate-100 shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Items
          </button>
          <button
            onClick={() => setSidebarTab('queries')}
            className={`py-1 rounded-md transition-all duration-150 flex items-center justify-center ${
              sidebarTab === 'queries'
                ? 'bg-slate-800 text-slate-100 shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Queries
          </button>
          <button
            onClick={() => setSidebarTab('history')}
            className={`py-1 rounded-md transition-all duration-150 flex items-center justify-center ${
              sidebarTab === 'history'
                ? 'bg-slate-800 text-slate-100 shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            History
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="flex items-center space-x-1">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={
                sidebarTab === 'items'
                  ? 'Search for item...'
                  : sidebarTab === 'queries'
                  ? 'Search queries...'
                  : 'Search history...'
              }
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors pl-6 font-sans"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-1.5 top-1.5" />
          </div>
          <button
            className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800/80 rounded transition"
            title="Filter preferences"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1 text-xs">
        
        {/* Tab 1: Database Items (Functions & Tables) */}
        {sidebarTab === 'items' && (
          <div className="space-y-1">
            {/* Functions Group */}
            <div>
              <div
                onClick={() => setIsFunctionsOpen(!isFunctionsOpen)}
                className="flex items-center space-x-1 px-1.5 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 cursor-pointer rounded hover:bg-slate-900/50 transition-colors"
              >
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isFunctionsOpen ? 'rotate-90' : 'rotate-0'
                  }`}
                />
                <span>Functions</span>
              </div>
              {isFunctionsOpen && (
                <div className="ml-4 pl-2 border-l border-slate-800/80 py-1 text-[11px] text-slate-500 italic">
                  No user functions defined
                </div>
              )}
            </div>

            {/* Tables Group */}
            <div>
              <div
                onClick={() => setIsTablesOpen(!isTablesOpen)}
                className="flex items-center justify-between px-1.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-slate-100 cursor-pointer rounded hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      isTablesOpen ? 'rotate-90' : 'rotate-0'
                    }`}
                  />
                  <span>Tables</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono pr-1">{filteredTables.length}</span>
              </div>

              {/* Table List (TablePlus Style) */}
              {isTablesOpen && (
                <div className="space-y-0.5 pt-0.5">
                  {filteredTables.map((tbl) => {
                    const isSelected = selectedTable === tbl.name;

                    return (
                      <div
                        key={tbl.name}
                        onClick={() => {
                          setSelectedTable(tbl.name);
                          openTableGridTab(tbl.name);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTableContextPos({ x: e.clientX, y: e.clientY });
                          setTargetTable(tbl.name);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1 rounded cursor-pointer text-xs font-mono transition-colors group ${
                          isSelected
                            ? 'bg-slate-800/90 text-slate-100 font-semibold shadow-xs'
                            : 'hover:bg-slate-900/70 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <TableIcon
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              isSelected ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-400'
                            }`}
                          />
                          <span className="truncate">{tbl.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                          {tbl.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Saved Queries */}
        {sidebarTab === 'queries' && (
          <div className="space-y-1">
            <div className="px-1.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Saved Queries ({filteredQueries.length})
            </div>
            {filteredQueries.map((q) => (
              <div
                key={q.id}
                onClick={() => openNewQueryTab(q.sql)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQueryContextPos({ x: e.clientX, y: e.clientY });
                  setTargetQuery({ id: q.id, title: q.title, sql: q.sql });
                }}
                className="p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/90 border border-slate-800/60 hover:border-slate-700 cursor-pointer transition-all space-y-1 group"
                title="Click to open query (Right click for options)"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 truncate">
                    <Terminal className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                      {q.title}
                    </span>
                  </div>
                  <span className="text-[9px] px-1 py-0.2 bg-slate-950 border border-slate-800 rounded text-slate-500 font-mono">
                    SQL
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">{q.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Execution History */}
        {sidebarTab === 'history' && (
          <div className="space-y-1">
            <div className="px-1.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Recent Executions ({filteredHistory.length})
            </div>
            {filteredHistory.map((h) => (
              <div
                key={h.id}
                onClick={() => openNewQueryTab(h.sql)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQueryContextPos({ x: e.clientX, y: e.clientY });
                  setTargetQuery({ id: h.id, title: `Query (${h.durationMs}ms)`, sql: h.sql });
                }}
                className="p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/90 border border-slate-800/60 hover:border-slate-700 cursor-pointer transition-all space-y-1 group"
                title="Click to open query (Right click for options)"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <div className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">{h.durationMs}ms</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{h.timestamp.replace('Today at ', '')}</span>
                  </div>
                </div>
                <div className="font-mono text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                  {h.sql}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Footer Section: Add Item & Database/Schema Selector Dropdown */}
      <div className="h-9 px-2 border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
        <button
          onClick={() => openNewQueryTab()}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded transition cursor-pointer"
          title="New SQL Query (⌘E / ⌘T)"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* TablePlus Database & Schema Switcher Dropdown */}
        <button
          onClick={() => setDatabaseModalOpen(true)}
          className="flex items-center space-x-1.5 px-2 py-0.5 hover:bg-slate-800/80 rounded text-[11px] font-mono text-slate-300 hover:text-white transition group border border-transparent hover:border-slate-700/60 cursor-pointer"
          title="Switch Database or Schema (⌘O)"
        >
          <span className="font-semibold text-sky-400 truncate max-w-[120px]">
            {activeConnection.database || 'postgres'}
          </span>
          <span className="text-slate-500">:</span>
          <span className="text-slate-300">public</span>
          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-200 transition-transform" />
        </button>
      </div>

      {/* Table Context Menu */}
      {tableContextPos && targetTable && (
        <ContextMenuContainer
          position={tableContextPos}
          onClose={() => {
            setTableContextPos(null);
            setTargetTable(null);
          }}
          width={240}
        >
          <ContextMenuHeader title={`Table: ${targetTable}`} />
          <ContextMenuItem
            icon={<TableIcon className="w-3.5 h-3.5 text-sky-400" />}
            label="Open Data (Grid)"
            shortcut="↵"
            onClick={() => {
              setSelectedTable(targetTable);
              openTableGridTab(targetTable);
              setTableContextPos(null);
            }}
          />
          <ContextMenuItem
            icon={<Columns className="w-3.5 h-3.5 text-indigo-400" />}
            label="Open Structure (Schema)"
            onClick={() => {
              setSelectedTable(targetTable);
              openTableSchemaTab(targetTable);
              setTableContextPos(null);
            }}
          />
          <ContextMenuItem
            icon={<RefreshCw className="w-3.5 h-3.5 text-emerald-400" />}
            label="Reload Table Data"
            shortcut="⌘R"
            onClick={() => {
              reloadData();
              setTableContextPos(null);
            }}
          />
          <ContextMenuItem
            icon={<Terminal className="w-3.5 h-3.5 text-amber-400" />}
            label="Query in New Tab"
            shortcut="⌘E"
            onClick={() => {
              openNewQueryTab(`SELECT * FROM ${targetTable} LIMIT 100;`);
              setTableContextPos(null);
            }}
          />
          <ContextMenuDivider />
          <ContextMenuItem
            icon={<Copy className="w-3.5 h-3.5 text-slate-400" />}
            label="Copy Table Name"
            onClick={() => {
              navigator.clipboard.writeText(targetTable);
              showToast(`📋 Copied "${targetTable}"`);
              setTableContextPos(null);
            }}
          />
          <ContextMenuItem
            icon={<FileCode className="w-3.5 h-3.5 text-slate-400" />}
            label="Copy SELECT Query"
            onClick={() => {
              const query = `SELECT * FROM ${targetTable} LIMIT 50;`;
              navigator.clipboard.writeText(query);
              showToast(`📋 Copied SELECT query for "${targetTable}"`);
              setTableContextPos(null);
            }}
          />
          <ContextMenuItem
            icon={<Code className="w-3.5 h-3.5 text-slate-400" />}
            label="Copy INSERT Template"
            onClick={() => {
              const cols = TABLE_SCHEMAS[targetTable]?.columns || [];
              const colNames = cols.map((c) => c.name).join(', ');
              const valPlaceholders = cols
                .map((c) => (c.type.includes('int') ? '0' : c.type.includes('bool') ? 'true' : "'value'"))
                .join(', ');
              const insertSql = `INSERT INTO ${targetTable} (${colNames})\nVALUES (${valPlaceholders});`;
              navigator.clipboard.writeText(insertSql);
              showToast(`📋 Copied INSERT template for "${targetTable}"`);
              setTableContextPos(null);
            }}
          />
          <ContextMenuItem
            icon={<Database className="w-3.5 h-3.5 text-slate-400" />}
            label="Copy CREATE TABLE DDL"
            onClick={() => {
              const cols = TABLE_SCHEMAS[targetTable]?.columns || [];
              const colDefs = cols
                .map((c) => `  ${c.name} ${c.type.toUpperCase()}${c.isPrimaryKey ? ' PRIMARY KEY' : ''}`)
                .join(',\n');
              const ddlSql = `CREATE TABLE ${targetTable} (\n${colDefs}\n);`;
              navigator.clipboard.writeText(ddlSql);
              showToast(`📋 Copied CREATE TABLE DDL for "${targetTable}"`);
              setTableContextPos(null);
            }}
          />
          <ContextMenuDivider />
          <ContextMenuItem
            icon={<Sparkles className="w-3.5 h-3.5 text-rose-400" />}
            label="Truncate Table..."
            danger
            onClick={() => {
              if (confirm(`Are you sure you want to TRUNCATE table "${targetTable}"? All data will be deleted.`)) {
                showToast(`⚡ Truncated table "${targetTable}" (0 rows)`);
              }
              setTableContextPos(null);
            }}
          />
          <ContextMenuItem
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            label="Drop Table..."
            danger
            onClick={() => {
              if (confirm(`Are you sure you want to DROP table "${targetTable}"? This action cannot be undone.`)) {
                showToast(`🗑️ Dropped table "${targetTable}"`);
              }
              setTableContextPos(null);
            }}
          />
        </ContextMenuContainer>
      )}

      {/* Saved Query / History Context Menu */}
      {queryContextPos && targetQuery && (
        <ContextMenuContainer
          position={queryContextPos}
          onClose={() => {
            setQueryContextPos(null);
            setTargetQuery(null);
          }}
          width={220}
        >
          <ContextMenuHeader title={targetQuery.title || 'SQL Query'} />
          <ContextMenuItem
            icon={<Play className="w-3.5 h-3.5 text-emerald-400" />}
            label="Open in New Query Tab"
            shortcut="⌘E"
            onClick={() => {
              openNewQueryTab(targetQuery.sql);
              setQueryContextPos(null);
            }}
          />
          <ContextMenuItem
            icon={<Copy className="w-3.5 h-3.5 text-slate-400" />}
            label="Copy SQL"
            shortcut="⌘C"
            onClick={() => {
              navigator.clipboard.writeText(targetQuery.sql);
              showToast('📋 Copied SQL query to clipboard');
              setQueryContextPos(null);
            }}
          />
          <ContextMenuItem
            icon={<Sparkles className="w-3.5 h-3.5 text-sky-400" />}
            label="Copy Formatted SQL"
            onClick={() => {
              try {
                const formatted = formatSql(targetQuery.sql, {
                  language: 'postgresql',
                  keywordCase: 'upper',
                  dataTypeCase: 'upper',
                  functionCase: 'upper',
                  tabWidth: 2,
                });
                navigator.clipboard.writeText(formatted);
                showToast('✨ Copied beautified SQL to clipboard');
              } catch {
                navigator.clipboard.writeText(targetQuery.sql);
                showToast('📋 Copied SQL to clipboard');
              }
              setQueryContextPos(null);
            }}
          />
        </ContextMenuContainer>
      )}

    </aside>
  );
};
