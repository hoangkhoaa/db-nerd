import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Copy, Check, FileText, Code, Database, Table as TableIcon, Trash2, CopyPlus, Eye, RefreshCw } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface TableContextMenuProps {
  position: ContextMenuPosition | null;
  selectedRows: any[];
  tableName?: string;
  onClose: () => void;
  onDuplicateRow?: (row: any) => void;
  onDeleteRows?: (rows: any[]) => void;
  onQuickLook?: (row: any) => void;
  onToast: (msg: string) => void;
}

export const TableContextMenu: React.FC<TableContextMenuProps> = ({
  position,
  selectedRows,
  tableName = 'query_results',
  onClose,
  onDuplicateRow,
  onDeleteRows,
  onQuickLook,
  onToast,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<'copyAs' | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!position || selectedRows.length === 0) return null;

  // Filter out internal state keys
  const getCleanRows = () => {
    return selectedRows.map((r) => {
      const clean: Record<string, any> = {};
      Object.keys(r).forEach((k) => {
        if (!['isDirty', 'dirtyFields', 'rowState'].includes(k)) {
          clean[k] = r[k];
        }
      });
      return clean;
    });
  };

  const getCleanKeys = (rows: any[]) => {
    if (!rows[0]) return [];
    return Object.keys(rows[0]).filter((k) => !['isDirty', 'dirtyFields', 'rowState'].includes(k));
  };

  const notifyAndClose = (formatName: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    const count = selectedRows.length;
    const countStr = count === 1 ? '1 row' : `${count} rows`;
    onToast(`📋 Copied ${countStr} as ${formatName} to clipboard!`);
    setTimeout(() => {
      onClose();
    }, 180);
  };

  // Format: JSON (auto-determines Object for 1 row, Array for multiple rows)
  const handleCopyJson = () => {
    const clean = getCleanRows();
    const text = clean.length === 1 ? JSON.stringify(clean[0], null, 2) : JSON.stringify(clean, null, 2);
    notifyAndClose('JSON', text);
  };

  // Format: CSV (no header)
  const handleCopyCsv = () => {
    const clean = getCleanRows();
    const keys = getCleanKeys(clean);
    const lines = clean.map((r) =>
      keys
        .map((k) => {
          const val = r[k];
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    );
    notifyAndClose('CSV', lines.join('\n'));
  };

  // Format: CSV with Header
  const handleCopyCsvWithHeader = () => {
    const clean = getCleanRows();
    const keys = getCleanKeys(clean);
    const header = keys.join(',');
    const lines = clean.map((r) =>
      keys
        .map((k) => {
          const val = r[k];
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    );
    notifyAndClose('CSV with Header', [header, ...lines].join('\n'));
  };

  // Format: Markdown Table
  const handleCopyMarkdown = () => {
    const clean = getCleanRows();
    const keys = getCleanKeys(clean);
    const header = `| ${keys.join(' | ')} |`;
    const sep = `| ${keys.map(() => '---').join(' | ')} |`;
    const lines = clean.map(
      (r) =>
        `| ${keys
          .map((k) => {
            const val = r[k];
            return typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
          })
          .join(' | ')} |`
    );
    notifyAndClose('Markdown Table', [header, sep, ...lines].join('\n'));
  };

  // Format: INSERT Statement
  const handleCopyInsert = () => {
    const clean = getCleanRows();
    const keys = getCleanKeys(clean);
    const stmts = clean.map((r) => {
      const vals = keys.map((k) => {
        const val = r[k];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return String(val);
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      return `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${vals.join(', ')});`;
    });
    notifyAndClose('INSERT Statements', stmts.join('\n'));
  };

  // Format: Plain Text (Tab-separated)
  const handleCopyPlainText = () => {
    const clean = getCleanRows();
    const keys = getCleanKeys(clean);
    const lines = clean.map((r) =>
      keys
        .map((k) => {
          const val = r[k];
          return typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
        })
        .join('\t')
    );
    notifyAndClose('Plain Text (TSV)', lines.join('\n'));
  };

  // Format: HTML Table
  const handleCopyHtml = () => {
    const clean = getCleanRows();
    const keys = getCleanKeys(clean);
    let text = '<table>\n  <thead>\n    <tr>' + keys.map((k) => `<th>${k}</th>`).join('') + '</tr>\n  </thead>\n  <tbody>\n';
    clean.forEach((r) => {
      text += '    <tr>' + keys.map((k) => `<td>${r[k] ?? ''}</td>`).join('') + '</tr>\n';
    });
    text += '  </tbody>\n</table>';
    notifyAndClose('HTML Table', text);
  };

  // Calculate clamped positioning so menu doesn't overflow screen
  const menuWidth = 240;
  const menuHeight = 360;
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

  let left = position.x;
  let top = position.y;

  if (left + menuWidth > screenW - 10) {
    left = screenW - menuWidth - 12;
  }
  if (top + menuHeight > screenH - 10) {
    top = screenH - menuHeight - 12;
  }

  const isSubmenuLeft = left + menuWidth + 210 > screenW;

  return (
    <div
      ref={menuRef}
      style={{ left: `${left}px`, top: `${top}px` }}
      className="fixed z-50 w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xl p-1 text-xs select-none ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-100 font-sans"
    >
      {/* Quick Look */}
      {onQuickLook && selectedRows[0] && (
        <button
          onClick={() => {
            onQuickLook(selectedRows[0]);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-sky-600 hover:text-white transition-colors group cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            <span>Quick Look Inspector</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-sky-200 font-mono">⌘↩</span>
        </button>
      )}

      {/* Refresh Data */}
      <button
        onClick={() => {
          useAppStore.getState().reloadData();
          onClose();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-sky-600 hover:text-white transition-colors group cursor-pointer"
      >
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
          <span>Refresh</span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-sky-200 font-mono">⌘R</span>
      </button>

      {/* Duplicate Row */}
      {onDuplicateRow && selectedRows[0] && (
        <button
          onClick={() => {
            onDuplicateRow(selectedRows[0]);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-sky-600 hover:text-white transition-colors group cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <CopyPlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            <span>Duplicate Row</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-sky-200 font-mono">⌘D</span>
        </button>
      )}

      <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-1 mx-1"></div>

      {/* Copy Rows (Default Plain text) */}
      <button
        onClick={handleCopyPlainText}
        className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-sky-600 hover:text-white transition-colors group cursor-pointer"
      >
        <div className="flex items-center space-x-2">
          <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
          <span>Copy {selectedRows.length > 1 ? `${selectedRows.length} Rows` : 'Row'}</span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-sky-200 font-mono">⌘C</span>
      </button>

      {/* Copy Rows As > (Hover or Click expands submenu) */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('copyAs')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <button
          onClick={() => setActiveSubmenu(activeSubmenu === 'copyAs' ? null : 'copyAs')}
          className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors group cursor-pointer ${
            activeSubmenu === 'copyAs' ? 'bg-sky-600 text-white font-medium' : 'text-slate-700 dark:text-slate-200 hover:bg-sky-600 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            <span className="font-semibold">Copy Rows As</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </button>

        {/* Submenu Popout */}
        {activeSubmenu === 'copyAs' && (
          <div
            style={{ [isSubmenuLeft ? 'right' : 'left']: '100%', top: '-4px' }}
            className="absolute z-50 w-52 bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xl p-1 text-xs select-none ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in duration-100"
          >
            {/* Plain Text */}
            <button
              onClick={handleCopyPlainText}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-sky-600 hover:text-white transition-colors cursor-pointer"
            >
              <span>Plain Text (TSV)</span>
              {copiedFormat === 'Plain Text (TSV)' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            </button>

            {/* JSON (Auto Object / Array) */}
            <button
              onClick={handleCopyJson}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-sky-600 hover:text-white transition-colors font-medium cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <Code className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>JSON</span>
              </div>
              {copiedFormat === 'JSON' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            </button>

            {/* HTML */}
            <button
              onClick={handleCopyHtml}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-sky-600 hover:text-white transition-colors cursor-pointer"
            >
              <span>HTML Table</span>
              {copiedFormat === 'HTML Table' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            </button>

            {/* Markdown Table */}
            <button
              onClick={handleCopyMarkdown}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-sky-600 hover:text-white transition-colors cursor-pointer"
            >
              <span>Markdown Table</span>
              {copiedFormat === 'Markdown Table' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            </button>

            <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-1 mx-1"></div>

            {/* CSV */}
            <button
              onClick={handleCopyCsv}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-sky-600 hover:text-white transition-colors font-medium cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <TableIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>CSV</span>
              </div>
              {copiedFormat === 'CSV' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            </button>

            {/* CSV with Header */}
            <button
              onClick={handleCopyCsvWithHeader}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-sky-600 hover:text-white transition-colors font-medium cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <TableIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>CSV with Header</span>
              </div>
              {copiedFormat === 'CSV with Header' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            </button>

            <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-1 mx-1"></div>

            {/* INSERT Statement */}
            <button
              onClick={handleCopyInsert}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-sky-600 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <Database className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>INSERT Statement</span>
              </div>
              {copiedFormat === 'INSERT Statements' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            </button>
          </div>
        )}
      </div>

      <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-1 mx-1"></div>

      {/* Delete Rows */}
      {onDeleteRows && (
        <button
          onClick={() => {
            onDeleteRows(selectedRows);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-colors group cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 group-hover:text-white" />
            <span>Delete Row{selectedRows.length > 1 ? 's' : ''}</span>
          </div>
          <span className="text-[10px] text-rose-500/80 group-hover:text-white font-mono">⌫</span>
        </button>
      )}
    </div>
  );
};
