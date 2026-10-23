import React, { useState, useEffect, useRef } from 'react';
import { ConnectionProfile, PendingQueryEdit } from '../types';
import { executeRealQuery } from '../services/dbService';
import {
  X,
  Copy,
  Check,
  Play,
  Pencil,
  AlertCircle,
  RotateCcw,
  Database,
  Table as TableIcon,
  Key,
  Terminal,
} from 'lucide-react';

interface QueryEditUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingEdits: Record<string, PendingQueryEdit>;
  activeConnection: ConnectionProfile;
  onApplySuccess: (executedSql: string, rowsAffected: number) => void;
  onDiscard: () => void;
  onShowToast: (msg: string) => void;
  onSendToEditor?: (sql: string) => void;
}

export const QueryEditUpdateModal: React.FC<QueryEditUpdateModalProps> = ({
  isOpen,
  onClose,
  pendingEdits,
  activeConnection,
  onApplySuccess,
  onDiscard,
  onShowToast,
  onSendToEditor,
}) => {
  const editsList = Object.values(pendingEdits);
  const defaultSql = editsList.map((e) => e.generatedSql).join('\n\n');

  const [sqlText, setSqlText] = useState(defaultSql);
  const [copied, setCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSqlText(editsList.map((e) => e.generatedSql).join('\n\n'));
      setExecutionError(null);
      setCopied(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [isOpen, pendingEdits]);

  // Handle keyboard shortcuts (⌘↵ to execute, Esc to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleExecute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, sqlText, isExecuting]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlText);
    setCopied(true);
    onShowToast('📋 UPDATE query copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleExecute = async () => {
    if (!sqlText.trim()) {
      onShowToast('⚠️ SQL query is empty');
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);

    try {
      const res = await executeRealQuery(activeConnection, sqlText.trim());

      if (!res.success && res.error) {
        setExecutionError(res.error);
        setIsExecuting(false);
        return;
      }

      setIsExecuting(false);
      const affected = res.rows_affected || editsList.length || 1;
      onApplySuccess(sqlText.trim(), affected);
      onShowToast(`✅ UPDATE executed successfully (${affected} row${affected > 1 ? 's' : ''} affected)`);
      onClose();
    } catch (err: any) {
      setIsExecuting(false);
      setExecutionError(err?.message || 'Failed to execute UPDATE query on server');
    }
  };

  const sampleEdit = editsList[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-100 font-sans select-none">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#141517] border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold leading-tight">Review & Execute UPDATE Query</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                  {editsList.length} Pending Edit{editsList.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Generated from inline cell edits. You can copy, modify, or execute directly.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Metadata Row */}
          {sampleEdit && (
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-100 dark:bg-[#121315] border border-slate-200 dark:border-white/5 rounded-xl text-xs font-mono">
              <div className="flex items-center space-x-1.5 truncate">
                <TableIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="text-slate-500">Table:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{sampleEdit.table}</span>
              </div>
              <div className="flex items-center space-x-1.5 truncate">
                <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-slate-500">PK Filter:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                  {sampleEdit.pkColumn} = {String(sampleEdit.pkValue)}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 truncate">
                <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-slate-500">Conn:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{activeConnection.name}</span>
              </div>
            </div>
          )}

          {/* Execution Error Banner (if any) */}
          {executionError && (
            <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 space-y-1 animate-in fade-in">
              <div className="flex items-center space-x-2 font-bold text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Execution Failed — Review & Adjust SQL</span>
              </div>
              <pre className="text-[11px] font-mono whitespace-pre-wrap break-all bg-black/20 dark:bg-black/40 p-2 rounded-lg border border-rose-500/20 text-rose-200 select-text leading-relaxed">
                {executionError}
              </pre>
              <p className="text-[10px] text-rose-600 dark:text-rose-400">
                💡 Tip: You can edit the SQL statement below to correct the table, column, or WHERE condition, then click "Execute & Apply (⌘↵)" again.
              </p>
            </div>
          )}

          {/* Editable SQL Code Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-medium">
                Editable UPDATE Statement (User can customize before execution):
              </span>
              <div className="flex items-center space-x-1.5">
                {onSendToEditor && (
                  <button
                    type="button"
                    onClick={() => {
                      onSendToEditor(sqlText);
                      onClose();
                    }}
                    className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-500/20 hover:bg-sky-200 dark:hover:bg-sky-500/30 text-sky-700 dark:text-sky-300 text-[10px] font-semibold flex items-center space-x-1 transition cursor-pointer active:scale-95 border border-sky-300/60 dark:border-sky-500/30"
                    title="Paste this SQL into the SQL Editor"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Send to Editor</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-[10px] font-semibold flex items-center space-x-1 transition cursor-pointer active:scale-95"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
            </div>

            <div className="relative rounded-xl border border-slate-300 dark:border-white/15 bg-slate-900 text-amber-300 dark:bg-[#0e0f11] overflow-hidden focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition shadow-inner">
              <textarea
                ref={textareaRef}
                value={sqlText}
                onChange={(e) => {
                  setSqlText(e.target.value);
                  if (executionError) setExecutionError(null);
                }}
                rows={Math.max(4, Math.min(10, sqlText.split('\n').length + 1))}
                className="w-full bg-transparent p-3.5 font-mono text-xs text-amber-300 dark:text-amber-200 placeholder-slate-500 focus:outline-none resize-y leading-relaxed select-text"
                placeholder="UPDATE table SET col = val WHERE id = 1;"
              />
            </div>
          </div>

          {/* List of Modified Fields Summary */}
          <div className="space-y-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Modified Values Overview:
            </span>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {editsList.map((edit, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#141517] border border-slate-200 dark:border-white/5 text-[11px] font-mono"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{edit.field}:</span>
                    <span className="text-slate-400 line-through truncate max-w-[120px]">
                      {edit.originalValue === null || edit.originalValue === undefined ? 'NULL' : String(edit.originalValue)}
                    </span>
                    <span className="text-slate-400">➔</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 truncate max-w-[150px]">
                      {edit.newValue === null || edit.newValue === undefined ? 'NULL' : String(edit.newValue)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    WHERE {edit.pkColumn} = {String(edit.pkValue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#141517] border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onDiscard();
              onClose();
              onShowToast('↩️ Discarded pending cell modifications');
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center space-x-1 cursor-pointer font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Discard Edits</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer font-medium"
            >
              Cancel (Esc)
            </button>

            <button
              type="button"
              disabled={isExecuting}
              onClick={handleExecute}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isExecuting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Execute & Apply (⌘↵)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
