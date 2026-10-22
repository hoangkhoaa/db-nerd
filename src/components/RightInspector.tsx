import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { getTableSchema } from '../data/schemas';
import {
  Search,
  X,
  Copy,
  Check,
  Info,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Key,
  Layers,
  Database,
  Terminal,
  Activity,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { ColumnTypeIcon } from './ColumnTypeIcon';

export const RightInspector: React.FC = () => {
  const {
    isRightInspectorOpen,
    toggleRightInspector,
    rightInspectorWidth,
    setRightInspectorWidth,
    selectedTable,
    selectedRowData,
    setSelectedRowData,
    updateCell,
    tableViewMode,
    tabs,
    activeTabId,
    activeTab,
    selectedStructureColumn,
  } = useAppStore();

  const [searchField, setSearchField] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({
    _user: true,
    object_id: true,
    order_details: true,
    condition_context: true,
  });

  if (!isRightInspectorOpen) return null;

  const activeTabObj = tabs.find((t) => t.id === activeTabId);
  const currentTabType = activeTabObj?.type || activeTab;
  const schemaInfo = getTableSchema(selectedTable);

  const toggleFieldExpand = (field: string) => {
    setExpandedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Metadata sizes
  const totalSize = schemaInfo.totalSize ? schemaInfo.totalSize.split(' ')[0] + ' ' + schemaInfo.totalSize.split(' ')[1] : '24 KB';
  const dataSize = schemaInfo.totalSize?.includes('Data:')
    ? schemaInfo.totalSize.split('Data: ')[1]?.split(',')[0]
    : '8 KB';
  const indexSize = schemaInfo.totalSize?.includes('Index:')
    ? schemaInfo.totalSize.split('Index: ')[1]?.replace(')', '')
    : '16 KB';

  // Determine which mode to render in Right Inspector:
  // 1. Data mode (Row inspector OR Table metadata)
  // 2. Structure mode (Column definition inspector)
  // 3. Index mode (Index properties inspector)
  // 4. SQL mode (Execution stats & Explain assistant)
  const isFunctionStats = activeTabObj?.title?.startsWith('Functions.') || activeTabObj?.tableName === '__all_functions__';
  const isTableStats = activeTabObj?.title?.startsWith('Tables.') || activeTabObj?.tableName === '__all_tables__';
  const isSqlTab = currentTabType === 'sql';
  const isStatsTab = currentTabType === 'stats' && !isFunctionStats && !isTableStats;
  const isStructureMode = currentTabType === 'schema' || tableViewMode === 'structure';
  const isIndexMode = tableViewMode === 'index';
  const isDataMode = (!isSqlTab && !isStatsTab && !isStructureMode && !isIndexMode) || isFunctionStats || isTableStats;

  // Extract columns to display for selected row
  const rowFields = selectedRowData
    ? Object.keys(selectedRowData).filter(
        (k) => !['isDirty', 'dirtyFields', 'rowState'].includes(k)
      )
    : [];

  const filteredFields = rowFields.filter((f) =>
    f.toLowerCase().includes(searchField.trim().toLowerCase())
  );

  const isExpanded = rightInspectorWidth >= 480;

  return (
    <aside
      style={{ width: `${rightInspectorWidth}px` }}
      className="bg-slate-950/95 border-l border-slate-800/90 flex flex-col h-full text-xs font-sans select-none flex-shrink-0 z-20"
    >
      {/* Top Header Bar */}
      <div className="h-10 px-3 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-1.5 truncate">
          {isSqlTab ? (
            <Terminal className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          ) : isStatsTab ? (
            <Activity className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          ) : isStructureMode ? (
            <Layers className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
          ) : isIndexMode ? (
            <Key className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          ) : selectedRowData ? (
            <Info className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
          ) : (
            <Database className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          )}

          <span className="font-bold text-slate-200 truncate">
            {isSqlTab
              ? 'Query Inspector'
              : isStatsTab
              ? 'Instance Telemetry'
              : isStructureMode
              ? `Column: ${selectedStructureColumn?.name || 'Selected'}`
              : isIndexMode
              ? 'Index Inspector'
              : selectedRowData
              ? (selectedRowData.name ? `${selectedRowData.kind || 'Item'}: ${selectedRowData.name}` : `Row #${selectedRowData.id ?? selectedRowData.ulid ?? 'Selected'}`)
              : 'Table Metadata'}
          </span>
        </div>

        {/* Action icons: Width Toggle (Maximize/Minimize), Copy, Close */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setRightInspectorWidth(isExpanded ? 320 : 520)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition cursor-pointer"
            title={isExpanded ? 'Restore width (320px)' : 'Expand width (520px)'}
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {selectedRowData && isDataMode && (
            <button
              onClick={() => handleCopyText(JSON.stringify(selectedRowData, null, 2))}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
              title="Copy row JSON"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={toggleRightInspector}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
            title="Hide Inspector (⌘I)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input Bar (Shown in Data Mode & Structure Mode) */}
      {(isDataMode || isStructureMode) && (
        <div className="p-2 border-b border-slate-800/80 bg-slate-950/60 flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder={isDataMode ? 'Search for field...' : 'Filter properties...'}
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-sans"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-[11px]">
        {/* ========================================================================= */}
        {/* CASE 1: DATA TAB - ROW INSPECTOR (TablePlus style with expand/collapse) */}
        {/* ========================================================================= */}
        {isDataMode && selectedRowData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Fields ({filteredFields.length})
              </span>
              <button
                onClick={() => setSelectedRowData(null)}
                className="text-[10px] text-sky-400 hover:underline"
              >
                Clear Selection
              </button>
            </div>

            {filteredFields.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs font-sans">
                No fields match "{searchField}"
              </div>
            ) : (
              filteredFields.map((field) => {
                const val = selectedRowData[field];
                const colDef = schemaInfo.columns.find((c) => c.name === field);
                const colType =
                  colDef?.type ||
                  (typeof val === 'number'
                    ? 'int'
                    : typeof val === 'boolean'
                    ? 'bool'
                    : typeof val === 'object'
                    ? 'json'
                    : 'text');
                const isDirty = selectedRowData.dirtyFields?.[field];
                const isExpanded = !!expandedFields[field];

                return (
                  <div key={field} className="space-y-1 group">
                    {/* Field Header: Name, Type Badge, and Collapse/Expand Caret */}
                    <div
                      onClick={() => toggleFieldExpand(field)}
                      className="flex items-center justify-between cursor-pointer py-0.5 select-none"
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        )}
                        {isDirty && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                        )}
                        <ColumnTypeIcon type={colType} sampleValue={val} size={11} />
                        <span className="font-semibold text-slate-300 truncate group-hover:text-sky-300 transition-colors">
                          {field}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-slate-500 font-sans px-1 bg-slate-900 rounded border border-slate-800">
                          {colType}
                        </span>
                      </div>
                    </div>

                    {/* Field Value Box (Collapsible/Expandable) */}
                    {isExpanded ? (
                      /* Expanded Multiline Mode (wrapping like in TablePlus screenshot) */
                      <textarea
                        rows={typeof val === 'object' ? 4 : String(val).length > 40 ? 3 : 2}
                        value={
                          typeof val === 'object' && val !== null
                            ? JSON.stringify(val, null, 2)
                            : val === null || val === undefined
                            ? 'NULL'
                            : String(val)
                        }
                        onChange={(e) => {
                          let parsed: any = e.target.value;
                          if (typeof val === 'object' && val !== null) {
                            try {
                              parsed = JSON.parse(e.target.value);
                            } catch {
                              // typing json
                            }
                          }
                          updateCell(selectedRowData.id, field, parsed);
                          setSelectedRowData({ ...selectedRowData, [field]: parsed });
                        }}
                        className={`w-full bg-slate-900/90 border rounded-lg p-2 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-sky-500 select-text leading-relaxed ${
                          val === null ? 'text-slate-500 italic' : ''
                        } ${
                          isDirty ? 'border-rose-500/60 ring-1 ring-rose-500/30' : 'border-slate-800'
                        }`}
                      />
                    ) : (
                      /* Collapsed Compact Mode */
                      <div className="relative">
                        <input
                          type="text"
                          value={
                            typeof val === 'object' && val !== null
                              ? JSON.stringify(val)
                              : val === null || val === undefined
                              ? 'NULL'
                              : String(val)
                          }
                          onChange={(e) => {
                            const nextVal = e.target.value;
                            updateCell(selectedRowData.id, field, nextVal);
                            setSelectedRowData({ ...selectedRowData, [field]: nextVal });
                          }}
                          className={`w-full bg-slate-900/90 border rounded-lg px-2.5 py-1 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-sky-500 select-text truncate pr-6 ${
                            val === null ? 'text-slate-500 italic' : ''
                          } ${
                            isDirty ? 'border-rose-500/60 ring-1 ring-rose-500/30' : 'border-slate-800'
                          }`}
                        />
                        <button
                          onClick={() => toggleFieldExpand(field)}
                          className="absolute right-1.5 top-1.5 text-slate-500 hover:text-slate-300"
                          title="Expand field view"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 2: DATA TAB - TABLE METADATA (When no row is selected) */}
        {/* ========================================================================= */}
        {isDataMode && !selectedRowData && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                total_size
              </label>
              <div className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200">
                {totalSize}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                data_size
              </label>
              <div className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200">
                {dataSize}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                index_size
              </label>
              <div className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200">
                {indexSize}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                comment
              </label>
              <div className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-500 italic">
                NULL
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Engine</span>
                <span className="text-slate-300 font-semibold">{schemaInfo.engine}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Schema</span>
                <span className="text-sky-400 font-semibold">{schemaInfo.schema}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Rows</span>
                <span className="text-emerald-400 font-semibold">{schemaInfo.rowCount}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Columns</span>
                <span className="text-slate-300 font-semibold">{schemaInfo.columns.length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Indexes</span>
                <span className="text-amber-400 font-semibold">{schemaInfo.indexes.length}</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[10px] font-sans text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5 text-sky-400 font-bold">
                <Info className="w-3.5 h-3.5" />
                <span>Tip: Click any row</span>
              </div>
              <p>Click on any table row to view and expand its column details in this panel.</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 3: STRUCTURE TAB - COLUMN INSPECTOR */}
        {/* ========================================================================= */}
        {isStructureMode && (
          <div className="space-y-3 font-sans">
            {selectedStructureColumn ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 font-mono">
                  <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                    Column Definition
                  </span>
                  <span className="px-1.5 py-0.2 bg-sky-950 border border-sky-600/60 text-sky-300 rounded text-[10px]">
                    {selectedStructureColumn.type}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold uppercase">Column Name</label>
                  <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100 font-mono font-semibold">
                    {selectedStructureColumn.name}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold uppercase">Data Type</label>
                  <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-sky-300 font-mono">
                    {selectedStructureColumn.type}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Nullable</label>
                    <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 font-mono">
                      {selectedStructureColumn.isNullable ? (
                        <span className="text-emerald-400 font-semibold">YES</span>
                      ) : (
                        <span className="text-rose-400 font-semibold">NO</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Primary Key</label>
                    <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 font-mono">
                      {selectedStructureColumn.isPrimaryKey ? (
                        <span className="text-amber-400 font-semibold">YES 🔑</span>
                      ) : (
                        <span className="text-slate-500">NO</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold uppercase">Default Value</label>
                  <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 font-mono">
                    {selectedStructureColumn.defaultValue || 'NULL'}
                  </div>
                </div>

                {selectedStructureColumn.isForeignKey && (
                  <div className="p-2 bg-sky-950/40 border border-sky-600/40 rounded-lg space-y-1">
                    <span className="text-[10px] font-bold text-sky-300 uppercase">Foreign Key Target</span>
                    <div className="text-[11px] font-mono text-sky-200">
                      → {selectedStructureColumn.foreignTable}({selectedStructureColumn.foreignColumn})
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold uppercase">Comment</label>
                  <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-400 text-xs italic">
                    {selectedStructureColumn.comment || 'No comment provided for this column.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                Click any column in the structure grid to inspect its detailed attributes.
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 4: INDEX TAB - INDEX PROPERTIES INSPECTOR */}
        {/* ========================================================================= */}
        {isIndexMode && (
          <div className="space-y-3 font-sans">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 font-mono">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Index Summary
              </span>
              <span className="text-xs text-slate-400 font-semibold">{schemaInfo.indexes.length} total</span>
            </div>

            {schemaInfo.indexes.map((idx) => (
              <div
                key={idx.name}
                className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-mono text-slate-200 font-bold truncate">
                    <Key className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate">{idx.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-mono">
                    {idx.type}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-sky-300">
                  Columns: {idx.columns.join(', ')}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>Unique: {idx.isUnique ? 'YES' : 'NO'}</span>
                  <span>Size: {idx.size || '16 KB'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 5: SQL QUERY TAB - EXECUTION STATS & SNIPPETS */}
        {/* ========================================================================= */}
        {isSqlTab && (
          <div className="space-y-3 font-sans">
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-mono text-emerald-400 font-bold">
                <span className="flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Execution Metrics</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 border border-emerald-500/30 rounded">
                  Success
                </span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="text-emerald-300 font-semibold">1.4ms (Cached)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rows affected:</span>
                  <span>3 rows</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lock time:</span>
                  <span>0.02ms</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Quick SQL Snippets
              </span>
              {[
                { label: 'COUNT(*) OVER ()', desc: 'Window total' },
                { label: 'DATE_TRUNC(\'day\', tstamp)', desc: 'Group by date' },
                { label: 'COALESCE(val, \'default\')', desc: 'Handle NULL' },
                { label: 'JSONB_AGG(obj)', desc: 'Aggregate JSON' },
              ].map((s) => (
                <div
                  key={s.label}
                  onClick={() => handleCopyText(s.label)}
                  className="p-2 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer transition flex items-center justify-between group"
                  title="Click to copy snippet"
                >
                  <div className="font-mono text-[11px] text-sky-300 group-hover:text-white truncate">
                    {s.label}
                  </div>
                  <span className="text-[10px] text-slate-500">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 6: STATS / OBSERVABILITY TAB */}
        {/* ========================================================================= */}
        {isStatsTab && (
          <div className="space-y-3 font-sans">
            <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2">
              <span className="font-bold text-purple-300 text-xs flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Instance Health</span>
              </span>
              <div className="space-y-1 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Connections:</span>
                  <span className="text-slate-100 font-semibold">14 / 100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Buffer Cache Hit:</span>
                  <span className="text-emerald-400 font-semibold">99.82%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transactions/sec:</span>
                  <span className="text-sky-300 font-semibold">2,840 TPS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Locks waiting:</span>
                  <span className="text-emerald-400 font-semibold">0 (Clean)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
