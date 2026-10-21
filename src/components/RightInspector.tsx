import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { getTableSchema } from '../data/schemas';
import { Search, X, Copy, Check, Info, FileText } from 'lucide-react';

export const RightInspector: React.FC = () => {
  const {
    isRightInspectorOpen,
    toggleRightInspector,
    selectedTable,
    selectedRowData,
    setSelectedRowData,
    updateCell,
  } = useAppStore();

  const [searchField, setSearchField] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isRightInspectorOpen) return null;

  const schemaInfo = getTableSchema(selectedTable);

  const handleCopyRowJson = () => {
    if (selectedRowData) {
      navigator.clipboard.writeText(JSON.stringify(selectedRowData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Determine metadata values
  const totalSize = schemaInfo.totalSize ? schemaInfo.totalSize.split(' ')[0] + ' ' + schemaInfo.totalSize.split(' ')[1] : '24 KB';
  const dataSize = schemaInfo.totalSize?.includes('Data:')
    ? schemaInfo.totalSize.split('Data: ')[1]?.split(',')[0]
    : '8 KB';
  const indexSize = schemaInfo.totalSize?.includes('Index:')
    ? schemaInfo.totalSize.split('Index: ')[1]?.replace(')', '')
    : '16 KB';

  // Extract columns to display for selected row
  const rowFields = selectedRowData
    ? Object.keys(selectedRowData).filter(
        (k) => !['isDirty', 'dirtyFields', 'rowState'].includes(k)
      )
    : [];

  const filteredFields = rowFields.filter((f) =>
    f.toLowerCase().includes(searchField.trim().toLowerCase())
  );

  return (
    <aside className="w-64 bg-slate-950/95 border-l border-slate-800/90 flex flex-col h-full text-xs font-sans select-none flex-shrink-0 z-20">
      {/* Top Header */}
      <div className="h-10 px-3 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 truncate">
          <Info className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
          <span className="font-bold text-slate-200 truncate">
            {selectedRowData ? `Row #${selectedRowData.id ?? selectedRowData.ulid ?? 'Selected'}` : 'Table Metadata'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {selectedRowData && (
            <button
              onClick={handleCopyRowJson}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
              title="Copy row JSON"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            onClick={toggleRightInspector}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
            title="Close Inspector (⌘I)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-2 border-b border-slate-800/80 bg-slate-950/60">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for field..."
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-sans"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2 pointer-events-none" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-[11px]">
        {selectedRowData ? (
          /* ROW DETAIL INSPECTOR (TablePlus style as in screenshot) */
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Field Details</span>
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
                const colType = colDef?.type || (typeof val === 'number' ? 'int' : typeof val === 'boolean' ? 'bool' : typeof val === 'object' ? 'json' : 'text');
                const isDirty = selectedRowData.dirtyFields?.[field];

                return (
                  <div key={field} className="space-y-1 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 truncate">
                        {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>}
                        <span className="font-semibold text-slate-300 truncate group-hover:text-sky-300 transition-colors">
                          {field}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-sans px-1 bg-slate-900 rounded border border-slate-800">
                        {colType}
                      </span>
                    </div>

                    {/* Field Value Box */}
                    {typeof val === 'object' && val !== null ? (
                      <textarea
                        rows={3}
                        value={JSON.stringify(val, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            updateCell(selectedRowData.id, field, parsed);
                            setSelectedRowData({ ...selectedRowData, [field]: parsed });
                          } catch {
                            // invalid json while typing
                          }
                        }}
                        className={`w-full bg-slate-900 border rounded-lg p-2 text-sky-300 font-mono text-[10px] focus:outline-none focus:border-sky-500 select-text ${
                          isDirty ? 'border-rose-500/60 ring-1 ring-rose-500/30' : 'border-slate-800'
                        }`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={val === null || val === undefined ? 'NULL' : String(val)}
                        onChange={(e) => {
                          const nextVal = e.target.value;
                          updateCell(selectedRowData.id, field, nextVal);
                          setSelectedRowData({ ...selectedRowData, [field]: nextVal });
                        }}
                        className={`w-full bg-slate-900 border rounded-lg px-2 py-1 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-sky-500 select-text ${
                          val === null ? 'text-slate-500 italic' : ''
                        } ${isDirty ? 'border-rose-500/60 ring-1 ring-rose-500/30' : 'border-slate-800'}`}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* TABLE METADATA INSPECTOR (TablePlus style as in screenshot) */
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">total_size</label>
              <div className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200">
                {totalSize}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">data_size</label>
              <div className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200">
                {dataSize}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">index_size</label>
              <div className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200">
                {indexSize}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">comment</label>
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
                <FileText className="w-3.5 h-3.5" />
                <span>Tip: Click any row</span>
              </div>
              <p>Click on any table row to inspect and edit all individual columns in this panel.</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
