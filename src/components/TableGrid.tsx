import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { getTableSchema } from '../data/schemas';
import {
  Key,
  Plus,
  FileCode,
  CheckCircle2,
  Columns as ColumnsIcon,
  Eye,
  Copy,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Zap,
  ArrowUpAZ,
  ArrowDownZA,
  Columns,
} from 'lucide-react';
import { GridRow } from '../types';
import { TableContextMenu } from './TableContextMenu';
import { TableStructureView } from './TableStructureView';
import { TableIndexesView } from './TableIndexesView';
import { ColumnTypeIcon } from './ColumnTypeIcon';
import {
  ContextMenuContainer,
  ContextMenuItem,
  ContextMenuDivider,
  ContextMenuHeader,
  ContextMenuPosition,
} from './ContextMenu';

export const TableGrid: React.FC = () => {
  const {
    rows,
    updateCell,
    insertRow,
    duplicateRow,
    deleteRow,
    selectedTable,
    selectedRowData,
    setSelectedRowData,
    tableViewMode,
    setTableViewMode,
    isFilterBarOpen,
    toggleFilterBar,
    filterWhereText,
    setFilterWhereText,
    filterOrderByText,
    setFilterOrderByText,
    setSelectedStructureColumn,
  } = useAppStore();

  const schemaInfo = getTableSchema(selectedTable);

  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<ContextMenuPosition | null>(null);
  const [targetContextMenuRows, setTargetContextMenuRows] = useState<GridRow[]>([]);
  const [colContextPos, setColContextPos] = useState<ContextMenuPosition | null>(null);
  const [targetCol, setTargetCol] = useState<any | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [inspectingRow, setInspectingRow] = useState<GridRow | null>(null);
  const [isDdlModalOpen, setIsDdlModalOpen] = useState(false);
  const [isColumnsModalOpen, setIsColumnsModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(schemaInfo.columns.map((c) => c.name))
  );

  // Sync visible columns when selectedTable changes
  React.useEffect(() => {
    setVisibleColumns(new Set(schemaInfo.columns.map((c) => c.name)));
  }, [selectedTable]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  const handleDuplicateRow = (r: GridRow) => {
    duplicateRow(r);
    showToast(`✨ Duplicated row #${r.id}`);
  };

  const handleDeleteRows = (rowsToDelete: GridRow[]) => {
    rowsToDelete.forEach((r) => deleteRow(r.id));
    setSelectedRowIds(new Set());
    if (selectedRowData && rowsToDelete.some((r) => r.id === selectedRowData.id)) {
      setSelectedRowData(null);
    }
    showToast(`🗑️ Marked ${rowsToDelete.length} row(s) for deletion`);
  };

  const handleRowClick = (row: GridRow, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      setSelectedRowIds((prev) => {
        const next = new Set(prev);
        if (next.has(row.id)) next.delete(row.id);
        else next.add(row.id);
        return next;
      });
    } else {
      setSelectedRowIds(new Set([row.id]));
    }
    setSelectedRowData(row);
  };

  const startEditing = (id: number, field: string, currentValue: any) => {
    // Prevent editing the primary key directly or complex JSON
    if (field === 'id' && schemaInfo.columns.find((c) => c.name === 'id')?.isPrimaryKey) return;
    setEditingCell({ id, field });
    setEditValue(typeof currentValue === 'object' ? JSON.stringify(currentValue) : String(currentValue ?? ''));
  };

  const saveEditing = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    let finalVal: any = editValue;
    if (field === 'total_amount' || field === 'user_id' || field === 'version_id') {
      const num = Number(editValue);
      if (!isNaN(num)) finalVal = num;
    } else if (editValue === 'true' || editValue === 'TRUE') {
      finalVal = true;
    } else if (editValue === 'false' || editValue === 'FALSE') {
      finalVal = false;
    }
    updateCell(id, field as keyof GridRow, finalVal);
    if (selectedRowData && selectedRowData.id === id) {
      setSelectedRowData({ ...selectedRowData, [field]: finalVal });
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const toggleColumnVisibility = (colName: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colName)) {
        if (next.size > 1) next.delete(colName);
      } else {
        next.add(colName);
      }
      return next;
    });
  };

  const activeCols = schemaInfo.columns.filter((c) => visibleColumns.has(c.name));
  const emptyRowsCount = Math.max(0, 20 - rows.length);

  return (
    <div className="flex-1 flex flex-col bg-slate-900/60 overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-12 right-6 z-40 bg-emerald-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Inline Filter Bar (TablePlus style: WHERE ... ORDER BY ...) */}
      {tableViewMode === 'data' && isFilterBarOpen && (
        <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs select-none flex-shrink-0 animate-in fade-in duration-100">
          <div className="flex items-center space-x-2 flex-1 max-w-2xl font-mono text-[11px]">
            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded font-bold text-[10px]">
              WHERE
            </span>
            <input
              type="text"
              value={filterWhereText}
              onChange={(e) => setFilterWhereText(e.target.value)}
              placeholder="e.g. status = 'pending' AND total_amount > 50"
              className="flex-1 bg-slate-900 border border-slate-700/70 rounded px-2.5 py-1 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded font-bold text-[10px]">
              ORDER BY
            </span>
            <input
              type="text"
              value={filterOrderByText}
              onChange={(e) => setFilterOrderByText(e.target.value)}
              placeholder="e.g. id DESC"
              className="w-28 bg-slate-900 border border-slate-700/70 rounded px-2 py-1 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <button
              onClick={() => showToast('⚡ Filter applied in 1.2ms (4 records returned)')}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-sans font-semibold transition active:scale-95 flex items-center space-x-1"
            >
              <Zap className="w-3 h-3" />
              <span>Run</span>
            </button>
            <button
              onClick={() => {
                setFilterWhereText('');
                setFilterOrderByText('');
                showToast('Filter cleared');
              }}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
              title="Clear Filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold flex items-center space-x-1">
              <span>⚡ 1.2ms</span>
            </span>
          </div>
        </div>
      )}

      {/* Main Workspace Mode View */}
      {tableViewMode === 'structure' ? (
        <TableStructureView />
      ) : tableViewMode === 'index' ? (
        <TableIndexesView />
      ) : (
        /* DATA GRID VIEW (TablePlus Canvas style) */
        <div className="flex-1 overflow-auto bg-slate-950/80 text-xs font-mono select-text">
          <table className="w-full border-collapse">
            {/* Header */}
            <thead className="sticky top-0 bg-slate-950/95 backdrop-blur-md z-10 border-b border-slate-800 text-slate-400 select-none shadow-sm text-[11px]">
              <tr className="text-left font-semibold">
                <th className="w-12 px-3 py-2 border-r border-slate-800/80 text-center text-slate-600">#</th>
                {activeCols.map((col) => (
                  <th
                    key={col.name}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setColContextPos({ x: e.clientX, y: e.clientY });
                      setTargetCol(col);
                    }}
                    className="px-3 py-2 border-r border-slate-800/80 min-w-[130px] cursor-pointer hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <ColumnTypeIcon type={col.type} />
                      <span className="text-slate-200 font-semibold truncate">{col.name}</span>
                      {col.isPrimaryKey && (
                        <span title="Primary Key" className="inline-flex items-center ml-0.5">
                          <Key className="w-2.5 h-2.5 text-amber-400/90 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Rows */}
            <tbody className="divide-y divide-slate-800/40 text-[11px]">
              {rows.map((row, index) => {
                const isSelected = selectedRowIds.has(row.id) || (selectedRowData && selectedRowData.id === row.id);
                const isEven = index % 2 === 0;

                return (
                  <tr
                    key={row.id ?? index}
                    onClick={(e) => handleRowClick(row, e)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      let nextSelected = selectedRowIds;
                      if (!selectedRowIds.has(row.id)) {
                        nextSelected = new Set([row.id]);
                        setSelectedRowIds(nextSelected);
                      }
                      setSelectedRowData(row);
                      const matched = rows.filter((r) => nextSelected.has(r.id));
                      setTargetContextMenuRows(matched.length > 0 ? matched : [row]);
                      setContextMenuPos({ x: e.clientX, y: e.clientY });
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-600/30 text-white font-medium shadow-inner'
                        : isEven
                        ? 'bg-slate-900/40 hover:bg-slate-800/50 text-slate-200'
                        : 'bg-slate-950/60 hover:bg-slate-800/50 text-slate-200'
                    }`}
                  >
                    {/* Row Index */}
                    <td className="px-3 py-1.5 border-r border-slate-800/60 text-center text-slate-500 select-none">
                      {index + 1}
                    </td>

                    {/* Columns */}
                    {activeCols.map((col) => {
                      const val = row[col.name];
                      const isEditing = editingCell?.id === row.id && editingCell?.field === col.name;
                      const isDirty = row.dirtyFields?.[col.name];

                      return (
                        <td
                          key={col.name}
                          onDoubleClick={() => startEditing(row.id, col.name, val)}
                          className={`px-3 py-1.5 border-r border-slate-800/60 relative truncate max-w-xs ${
                            isDirty ? 'bg-amber-500/15' : ''
                          }`}
                        >
                          {/* Dirty indicator dot */}
                          {isDirty && (
                            <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
                          )}

                          {isEditing ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEditing}
                              onKeyDown={handleKeyDown}
                              autoFocus
                              className="w-full bg-slate-900 border border-sky-500 rounded px-1.5 py-0.5 text-slate-100 font-mono text-[11px] focus:outline-none"
                            />
                          ) : val === null || val === undefined ? (
                            <span className="text-slate-500 italic select-none">NULL</span>
                          ) : typeof val === 'boolean' ? (
                            <span className="text-slate-300 font-medium">{val ? 'TRUE' : 'FALSE'}</span>
                          ) : typeof val === 'object' ? (
                            <span className="truncate block font-mono text-slate-300">
                              {JSON.stringify(val)}
                            </span>
                          ) : (
                            <span className="truncate block text-slate-200">{String(val)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Zebra Empty Rows (matching TablePlus aesthetic) */}
              {Array.from({ length: emptyRowsCount }).map((_, i) => {
                const rowNum = rows.length + i + 1;
                const isEven = (rows.length + i) % 2 === 0;

                return (
                  <tr
                    key={`empty-${i}`}
                    className={`h-7 ${isEven ? 'bg-slate-900/40' : 'bg-slate-950/60'}`}
                  >
                    <td className="px-3 py-1 border-r border-slate-800/40 text-center text-slate-700 select-none">
                      {rowNum}
                    </td>
                    {activeCols.map((col) => (
                      <td key={col.name} className="px-3 py-1 border-r border-slate-800/40" />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* BOTTOM CONTROL BAR (TablePlus Standard Footer Toolbar) */}
      <div className="h-9 bg-slate-950 border-t border-slate-800/90 px-3 flex items-center justify-between text-xs font-sans select-none flex-shrink-0 z-20">
        {/* Left Segment: [Data] [Structure] [Index] + Mode Actions */}
        <div className="flex items-center space-x-2 h-full">
          {/* View Mode Switcher Pills */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-semibold h-6">
            <button
              onClick={() => setTableViewMode('data')}
              className={`h-5 px-2.5 rounded-md transition-all duration-100 flex items-center justify-center leading-none cursor-pointer ${
                tableViewMode === 'data'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Data
            </button>
            <button
              onClick={() => setTableViewMode('structure')}
              className={`h-5 px-2.5 rounded-md transition-all duration-100 flex items-center justify-center leading-none cursor-pointer ${
                tableViewMode === 'structure'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Structure
            </button>
            <button
              onClick={() => setTableViewMode('index')}
              className={`h-5 px-2.5 rounded-md transition-all duration-100 flex items-center justify-center leading-none cursor-pointer ${
                tableViewMode === 'index'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Index
            </button>
          </div>

          <div className="h-3.5 w-[1px] bg-slate-800 mx-0.5 self-center" />

          {/* Mode-specific Buttons */}
          {tableViewMode === 'data' ? (
            <button
              onClick={insertRow}
              className="h-6 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 rounded-md text-[11px] font-semibold transition active:scale-95 flex items-center space-x-1 leading-none cursor-pointer"
              title="Insert new row (+)"
            >
              <Plus className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Row</span>
            </button>
          ) : tableViewMode === 'structure' ? (
            <div className="flex items-center space-x-1.5 h-full">
              <button
                onClick={() => {
                  showToast('Added column column_new to structure');
                }}
                className="h-6 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 rounded-md text-[11px] font-semibold transition active:scale-95 flex items-center space-x-1 leading-none cursor-pointer"
              >
                <Plus className="w-3 h-3 text-sky-400 shrink-0" />
                <span>Column</span>
              </button>
              <button
                onClick={() => showToast('Table Triggers: 0 triggers defined')}
                className="h-6 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 rounded-md text-[11px] font-semibold transition flex items-center leading-none cursor-pointer"
              >
                Triggers
              </button>
              <button
                onClick={() => setIsDdlModalOpen(true)}
                className="h-6 px-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 rounded-md text-[11px] font-semibold transition active:scale-95 flex items-center space-x-1 leading-none cursor-pointer"
              >
                <FileCode className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>DDL</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => showToast('Opened create index wizard')}
              className="h-6 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 rounded-md text-[11px] font-semibold transition active:scale-95 flex items-center space-x-1 leading-none cursor-pointer"
            >
              <Plus className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Index</span>
            </button>
          )}
        </div>

        {/* Center: Row Counter / Stats */}
        <div className="text-[11px] text-slate-400 font-mono select-none flex items-center leading-none">
          {tableViewMode === 'data' ? (
            selectedRowData || selectedRowIds.size > 0 ? (
              <span className="text-sky-300 font-semibold">{`${selectedRowIds.size || 1} of ${rows.length} rows selected`}</span>
            ) : (
              <span>{`1-${rows.length} of ${rows.length} rows`}</span>
            )
          ) : tableViewMode === 'structure' ? (
            <span>{`${schemaInfo.columns.length} columns, ${schemaInfo.indexes.length} indexes`}</span>
          ) : (
            <span>{`${schemaInfo.indexes.length} indexes, ${schemaInfo.foreignKeys.length} foreign keys`}</span>
          )}
        </div>

        {/* Right: Filters toggle, Columns picker, Pagination */}
        <div className="flex items-center space-x-1.5 h-full">
          {tableViewMode === 'data' && (
            <>
              <button
                onClick={toggleFilterBar}
                className={`h-6 px-2 rounded-md text-[11px] font-semibold border transition flex items-center space-x-1 active:scale-95 leading-none cursor-pointer ${
                  isFilterBarOpen
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle WHERE / ORDER BY filter bar"
              >
                <Filter className="w-3 h-3 shrink-0" />
                <span>Filters</span>
              </button>

              <button
                onClick={() => setIsColumnsModalOpen(!isColumnsModalOpen)}
                className="h-6 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-md text-[11px] font-semibold transition flex items-center space-x-1 leading-none cursor-pointer"
                title="Choose visible columns"
              >
                <ColumnsIcon className="w-3 h-3 shrink-0" />
                <span>Columns</span>
              </button>

              <div className="flex items-center space-x-0.5 pl-1 h-6">
                <button
                  className="h-6 w-6 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                  disabled
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  className="h-6 w-6 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                  disabled
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Columns Visibility Popup */}
      {isColumnsModalOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsColumnsModalOpen(false)}
        >
          <div
            className="absolute bottom-11 right-12 w-48 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 text-xs font-sans animate-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-bold text-slate-200 px-2 py-1 border-b border-slate-800 text-[11px]">
              Toggle Columns
            </div>
            <div className="max-h-48 overflow-y-auto py-1 space-y-0.5">
              {schemaInfo.columns.map((col) => {
                const isVis = visibleColumns.has(col.name);
                return (
                  <label
                    key={col.name}
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-slate-800 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isVis}
                      onChange={() => toggleColumnVisibility(col.name)}
                      className="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-0"
                    />
                    <span className="truncate text-slate-300 font-mono text-[11px]">{col.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Raw DDL Modal */}
      {isDdlModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-100"
          onClick={() => setIsDdlModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-100">DDL — {selectedTable}</span>
              <button
                onClick={() => setIsDdlModalOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs max-h-96 overflow-auto select-text">
              {schemaInfo.ddl}
            </pre>
            <div className="h-11 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(schemaInfo.ddl);
                  showToast('Copied DDL script!');
                  setIsDdlModalOpen(false);
                }}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition"
              >
                Copy DDL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right-Click Context Menu */}
      <TableContextMenu
        position={contextMenuPos}
        selectedRows={
          targetContextMenuRows.length > 0
            ? targetContextMenuRows
            : selectedRowIds.size > 0
            ? rows.filter((r) => selectedRowIds.has(r.id))
            : selectedRowData
            ? [selectedRowData]
            : []
        }
        tableName={selectedTable}
        onClose={() => {
          setContextMenuPos(null);
          setTargetContextMenuRows([]);
        }}
        onDuplicateRow={handleDuplicateRow}
        onDeleteRows={handleDeleteRows}
        onQuickLook={(row) => setInspectingRow(row)}
        onToast={showToast}
      />

      {/* Column Header Right-Click Context Menu */}
      {colContextPos && targetCol && (
        <ContextMenuContainer position={colContextPos} onClose={() => setColContextPos(null)}>
          <ContextMenuHeader title={`Column: ${targetCol.name} (${targetCol.type})`} />
          <ContextMenuItem
            icon={<ArrowUpAZ className="w-3.5 h-3.5 text-sky-400" />}
            label={`Sort "${targetCol.name}" ASC`}
            onClick={() => {
              setFilterOrderByText(`${targetCol.name} ASC`);
              showToast(`⚡ Sorted by ${targetCol.name} ASC`);
            }}
          />
          <ContextMenuItem
            icon={<ArrowDownZA className="w-3.5 h-3.5 text-sky-400" />}
            label={`Sort "${targetCol.name}" DESC`}
            onClick={() => {
              setFilterOrderByText(`${targetCol.name} DESC`);
              showToast(`⚡ Sorted by ${targetCol.name} DESC`);
            }}
          />
          {filterOrderByText && (
            <ContextMenuItem
              icon={<X className="w-3.5 h-3.5 text-slate-400" />}
              label="Clear Sort"
              onClick={() => {
                setFilterOrderByText('');
                showToast('Cleared sorting');
              }}
            />
          )}
          <ContextMenuDivider />
          <ContextMenuItem
            icon={<Filter className="w-3.5 h-3.5 text-purple-400" />}
            label={`Filter by "${targetCol.name}"`}
            onClick={() => {
              setFilterWhereText(`${targetCol.name} = ''`);
              if (!isFilterBarOpen) toggleFilterBar();
              showToast(`Filter added: ${targetCol.name}`);
            }}
          />
          <ContextMenuDivider />
          <ContextMenuItem
            icon={<Copy className="w-3.5 h-3.5 text-slate-300" />}
            label="Copy Column Name"
            shortcut="⌘C"
            onClick={() => {
              navigator.clipboard.writeText(targetCol.name);
              showToast(`Copied "${targetCol.name}" to clipboard`);
            }}
          />
          <ContextMenuItem
            icon={<FileCode className="w-3.5 h-3.5 text-slate-300" />}
            label={`Copy Qualified Name (${selectedTable}.${targetCol.name})`}
            onClick={() => {
              navigator.clipboard.writeText(`"${selectedTable}"."${targetCol.name}"`);
              showToast(`Copied "${selectedTable}"."${targetCol.name}"`);
            }}
          />
          <ContextMenuDivider />
          <ContextMenuItem
            icon={<Eye className="w-3.5 h-3.5 text-emerald-400" />}
            label="Inspect Column in Structure View"
            onClick={() => {
              setSelectedStructureColumn?.(targetCol);
              setTableViewMode('structure');
            }}
          />
          <ContextMenuItem
            icon={<Columns className="w-3.5 h-3.5 text-slate-400" />}
            label="Hide this Column"
            onClick={() => {
              toggleColumnVisibility(targetCol.name);
              showToast(`Column "${targetCol.name}" hidden`);
            }}
          />
        </ContextMenuContainer>
      )}

      {/* Quick Look Inspector Dialog */}
      {inspectingRow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-100">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 flex flex-col animate-in zoom-in-95 duration-100">
            <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between select-none">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-slate-100">
                  Quick Look Inspector — {selectedTable} #{inspectingRow.id}
                </span>
              </div>
              <button
                onClick={() => setInspectingRow(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-4 max-h-[420px] overflow-auto font-mono text-xs text-sky-300 bg-slate-950 select-text">
              <pre>{JSON.stringify(inspectingRow, null, 2)}</pre>
            </div>
            <div className="h-11 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between select-none">
              <span className="text-[11px] text-slate-500 font-mono">Format: JSON Object</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(inspectingRow, null, 2));
                    showToast('📋 Copied row JSON to clipboard!');
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </button>
                <button
                  onClick={() => setInspectingRow(null)}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition active:scale-95"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
