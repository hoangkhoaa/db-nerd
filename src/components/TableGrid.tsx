import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { ExternalLink, Plus, Trash2, Check, RotateCcw, FileCode, CheckCircle2, Columns } from 'lucide-react';
import { GridRow } from '../types';

export const TableGrid = () => {
  const {
    rows,
    updateCell,
    insertRow,
    deleteRow,
    rollbackTransaction,
    commitTransaction,
    pendingEditsCount,
    setSqlDiffModalOpen,
    setActiveTab,
  } = useAppStore();

  const [filterText, setFilterText] = useState("status = 'pending' AND total_amount > 50");
  const [editingCell, setEditingCell] = useState<{ id: number; field: keyof GridRow } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const startEditing = (id: number, field: keyof GridRow, currentValue: any) => {
    // Prevent editing the primary key directly or complex JSON
    if (field === 'id') return;
    setEditingCell({ id, field });
    setEditValue(typeof currentValue === 'object' ? JSON.stringify(currentValue) : String(currentValue));
  };

  const saveEditing = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    let finalVal: any = editValue;
    if (field === 'total_amount' || field === 'user_id') {
      const num = Number(editValue);
      if (!isNaN(num)) finalVal = num;
    }
    updateCell(id, field, finalVal);
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleCommit = () => {
    const res = commitTransaction();
    setToastMessage(`Committed ${res.count} change(s) in 1.4ms! Transaction closed.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRollback = () => {
    rollbackTransaction();
    setToastMessage('Transaction rolled back. All changes reverted.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900/60 overflow-hidden relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-12 right-6 z-40 bg-emerald-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter / WHERE Bar + Table Toolbar */}
      <div className="bg-slate-950/50 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs select-none">
        
        {/* Left Filter Expression */}
        <div className="flex items-center space-x-2 flex-1 max-w-xl">
          <span className="px-1.5 py-0.5 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded font-mono font-bold text-[10px]">
            WHERE
          </span>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700/60 rounded px-2.5 py-1 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-sky-500"
          />
          <span className="px-1.5 py-0.5 bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded font-mono font-bold text-[10px]">
            ORDER BY
          </span>
          <span className="font-mono text-slate-300 text-[11px]">id DESC</span>
        </div>

        {/* Right Row & Schema Operations */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('schema')}
            className="px-2.5 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95"
            title="Inspect Table Schema, Column Types, Indexes & DDL"
          >
            <Columns className="w-3.5 h-3.5 text-indigo-400" />
            <span>Structure & DDL</span>
          </button>

          <button
            onClick={insertRow}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95"
            title="Insert new row (+)"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Insert Row</span>
          </button>
        </div>

      </div>

      {/* Data Grid Table (TablePlus Style) */}
      <div className="flex-1 overflow-auto bg-slate-900/80 text-xs font-mono select-text">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead className="sticky top-0 bg-slate-950/95 backdrop-blur-md z-20 border-b border-slate-800 text-slate-400 select-none shadow-sm">
            <tr className="text-left font-semibold">
              <th className="w-12 px-3 py-2.5 border-r border-slate-800/80 text-center text-slate-600">#</th>
              <th className="w-24 px-3 py-2.5 border-r border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-bold">id</span>
                  <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-bold">PK</span>
                </div>
              </th>
              <th className="w-48 px-3 py-2.5 border-r border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-bold">customer_name</span>
                  <span className="text-[9px] text-slate-500">varchar</span>
                </div>
              </th>
              <th className="w-36 px-3 py-2.5 border-r border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-bold">user_id</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded font-bold flex items-center gap-0.5">
                    <span>FK</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </div>
              </th>
              <th className="w-36 px-3 py-2.5 border-r border-slate-800/80">
                <span className="text-slate-200 font-bold">product_sku</span>
              </th>
              <th className="w-60 px-3 py-2.5 border-r border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-bold">order_details</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded font-bold font-mono">&#123; &#125; JSON</span>
                </div>
              </th>
              <th className="w-32 px-3 py-2.5 border-r border-slate-800/80">
                <span className="text-slate-200 font-bold">total_amount</span>
              </th>
              <th className="w-44 px-3 py-2.5 border-r border-slate-800/80">
                <span className="text-slate-200 font-bold">created_at</span>
              </th>
              <th className="w-36 px-3 py-2.5 border-r border-slate-800/80">
                <span className="text-slate-200 font-bold">status</span>
              </th>
              <th className="w-16 px-2 py-2.5 text-center">Action</th>
            </tr>
          </thead>

          {/* Rows */}
          <tbody className="divide-y divide-slate-800/50">
            {rows.map((row, index) => {
              const isInserted = row.rowState === 'inserted';
              const isDeleted = row.rowState === 'deleted';
              const isModified = row.rowState === 'modified';

              let rowClass = 'hover:bg-slate-800/40';
              if (isInserted) rowClass = 'bg-emerald-950/20 hover:bg-emerald-950/30 border-l-4 border-l-emerald-400';
              else if (isDeleted) rowClass = 'bg-rose-950/20 hover:bg-rose-950/30 line-through opacity-60 border-l-4 border-l-rose-500';
              else if (isModified || row.isDirty) rowClass = 'bg-amber-950/20 hover:bg-amber-950/30 border-l-4 border-l-amber-400';

              return (
                <tr key={row.id} className={`group transition ${rowClass}`}>
                  
                  {/* Row Index */}
                  <td className="px-3 py-2 border-r border-slate-800/60 text-slate-500 text-center select-none font-bold text-[11px]">
                    {index + 1}
                    {row.isDirty && <span className="text-amber-400 font-bold ml-0.5">*</span>}
                  </td>

                  {/* ID (PK) */}
                  <td className="px-3 py-2 border-r border-slate-800/60 text-sky-400 font-semibold">
                    {row.id}
                  </td>

                  {/* Customer Name (Inline Editable) */}
                  <td
                    onDoubleClick={() => startEditing(row.id, 'customer_name', row.customer_name)}
                    className={`px-3 py-1.5 border-r border-slate-800/60 cursor-pointer relative ${
                      row.dirtyFields?.customer_name ? 'bg-amber-500/20 text-amber-200 font-semibold ring-1 ring-amber-400/80 inset-0' : 'text-slate-200'
                    }`}
                  >
                    {editingCell?.id === row.id && editingCell.field === 'customer_name' ? (
                      <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEditing}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-slate-950 text-slate-100 px-1 py-0.5 rounded border border-sky-400 focus:outline-none"
                      />
                    ) : (
                      <span className="block truncate">{row.customer_name}</span>
                    )}
                  </td>

                  {/* User ID (FK Navigation Pill) */}
                  <td
                    onDoubleClick={() => startEditing(row.id, 'user_id', row.user_id)}
                    className={`px-3 py-1.5 border-r border-slate-800/60 ${
                      row.dirtyFields?.user_id ? 'bg-amber-500/20 text-amber-200 font-semibold ring-1 ring-amber-400/80' : ''
                    }`}
                  >
                    {editingCell?.id === row.id && editingCell.field === 'user_id' ? (
                      <input
                        autoFocus
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEditing}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-slate-950 text-slate-100 px-1 py-0.5 rounded border border-sky-400 focus:outline-none"
                      />
                    ) : (
                      <button 
                        onClick={() => alert(`🔗 Foreign Key Jump: Loading table 'users' WHERE id = ${row.user_id}`)}
                        className="px-2 py-0.5 bg-sky-500/10 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 rounded-md font-mono text-[11px] flex items-center space-x-1.5 transition"
                      >
                        <span>🔗</span>
                        <span>{row.user_id}</span>
                      </button>
                    )}
                  </td>

                  {/* SKU (Inline Editable) */}
                  <td
                    onDoubleClick={() => startEditing(row.id, 'product_sku', row.product_sku)}
                    className={`px-3 py-1.5 border-r border-slate-800/60 cursor-pointer ${
                      row.dirtyFields?.product_sku ? 'bg-amber-500/20 text-amber-200 font-semibold ring-1 ring-amber-400/80' : 'text-slate-300'
                    }`}
                  >
                    {editingCell?.id === row.id && editingCell.field === 'product_sku' ? (
                      <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEditing}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-slate-950 text-slate-100 px-1 py-0.5 rounded border border-sky-400 focus:outline-none"
                      />
                    ) : (
                      <span className="block truncate">{row.product_sku}</span>
                    )}
                  </td>

                  {/* JSON Preview */}
                  <td 
                    onClick={() => alert(`JSON Inspector (Double-click any cell to edit):\n\n${JSON.stringify(row.order_details, null, 2)}`)}
                    className="px-3 py-2 border-r border-slate-800/60 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <span className="text-purple-400 font-medium">&#123;</span> {JSON.stringify(row.order_details).slice(0, 30)}... <span className="text-purple-400 font-medium">&#125;</span>
                  </td>

                  {/* Total Amount (Inline Editable) */}
                  <td
                    onDoubleClick={() => startEditing(row.id, 'total_amount', row.total_amount)}
                    className={`px-3 py-1.5 border-r border-slate-800/60 cursor-pointer font-semibold ${
                      row.dirtyFields?.total_amount ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/80' : 'text-emerald-400'
                    }`}
                  >
                    {editingCell?.id === row.id && editingCell.field === 'total_amount' ? (
                      <input
                        autoFocus
                        type="number"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEditing}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-slate-950 text-slate-100 px-1 py-0.5 rounded border border-sky-400 focus:outline-none"
                      />
                    ) : (
                      <span>${typeof row.total_amount === 'number' ? row.total_amount.toFixed(2) : row.total_amount}</span>
                    )}
                  </td>

                  {/* Created At */}
                  <td className="px-3 py-2 border-r border-slate-800/60 text-slate-400 select-none">
                    {row.created_at}
                  </td>

                  {/* Status (Inline Editable) */}
                  <td
                    onDoubleClick={() => startEditing(row.id, 'status', row.status)}
                    className={`px-3 py-1.5 border-r border-slate-800/60 cursor-pointer ${
                      row.dirtyFields?.status ? 'bg-amber-500/20 text-amber-200 font-semibold ring-1 ring-amber-400/80' : 'text-slate-200'
                    }`}
                  >
                    {editingCell?.id === row.id && editingCell.field === 'status' ? (
                      <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEditing}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-slate-950 text-slate-100 px-1 py-0.5 rounded border border-sky-400 focus:outline-none"
                      />
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 font-mono text-[11px]">
                        {row.status}
                      </span>
                    )}
                  </td>

                  {/* Action Delete */}
                  <td className="px-2 py-1.5 text-center">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="p-1 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded transition"
                      title={isDeleted ? "Undo delete" : "Mark row for deletion"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TablePlus-Style Floating Transaction Commit Bar */}
      {pendingEditsCount > 0 && (
        <div className="h-11 bg-amber-500/15 border-t border-amber-500/40 px-4 flex items-center justify-between select-none z-30 shadow-lg backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs font-bold text-amber-300">
              {pendingEditsCount} uncommitted change{pendingEditsCount > 1 ? 's' : ''} in active transaction
            </span>
            <span className="text-[11px] text-amber-200/70 hidden sm:inline">• Double-click any cell to edit</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSqlDiffModalOpen(true)}
              className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1 transition active:scale-95"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Preview SQL</span>
            </button>

            <button
              onClick={handleRollback}
              className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard (⌘Z)</span>
            </button>

            <button
              onClick={handleCommit}
              className="px-3.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center space-x-1.5 shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Commit Changes (⌘S)</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid Footer Bar */}
      <div className="h-7 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 select-none flex-shrink-0">
        <div className="flex items-center space-x-3">
          <span>{rows.length} rows</span>
          <span>•</span>
          <span>Double-click any cell to edit inline</span>
          <span>•</span>
          <span>Latency: <strong className="text-slate-200 font-mono">1.8ms</strong></span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">120 FPS</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-500 font-mono text-[10px]">
          <span>RAM: 46.8MB</span>
          <span>•</span>
          <span>PostgreSQL 16.2</span>
        </div>
      </div>

    </div>
  );
};
