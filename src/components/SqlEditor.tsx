import { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Check, RotateCcw, CheckCircle2 } from 'lucide-react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, keymap, highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { HighlightStyle, syntaxHighlighting, bracketMatching } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { useAppStore } from '../stores/useAppStore';
import { HeartbeatDot } from './HeartbeatDot';

// Vibrant, high-contrast SQL Syntax Highlighting Theme (Vivid Keywords, Emerald Strings, Amber Functions)
const sqlHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#38bdf8', fontWeight: 'bold' }, // SELECT, FROM, WHERE, JOIN, AS, LIMIT
  { tag: t.standard(t.name), color: '#c084fc', fontWeight: 'bold' }, // Standard SQL keywords
  { tag: t.special(t.string), color: '#fbbf24' },
  { tag: t.string, color: '#4ade80' }, // 'active', 'pending'
  { tag: t.number, color: '#f87171', fontWeight: 'semibold' }, // 50, 100, 1.4
  { tag: t.bool, color: '#f43f5e', fontWeight: 'bold' }, // TRUE, FALSE
  { tag: t.null, color: '#f43f5e', fontWeight: 'bold' }, // NULL
  { tag: t.function(t.variableName), color: '#fbbf24', fontWeight: 'bold' }, // COUNT, SUM, AVG
  { tag: t.operator, color: '#93c5fd' }, // =, >, <, +, -
  { tag: t.punctuation, color: '#94a3b8' }, // ,, ;, (, )
  { tag: t.comment, color: '#64748b', fontStyle: 'italic' }, // -- comment
  { tag: t.variableName, color: '#f8fafc' }, // table / column names
]);

// CodeMirror Theme for db-nerd dark aesthetic
const sqlEditorTheme = EditorView.theme(
  {
    '&': {
      color: '#f8fafc',
      backgroundColor: '#020617',
      fontSize: '13px',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#38bdf8',
      padding: '10px 0',
      lineHeight: '1.6',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#38bdf8',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: '#1e293b !important',
    },
    '.cm-gutters': {
      backgroundColor: '#020617',
      color: '#475569',
      borderRight: '1px solid #1e293b',
      paddingRight: '6px',
    },
    '.cm-activeLine': {
      backgroundColor: '#0f172a60',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#0f172a',
      color: '#94a3b8',
    },
    '.cm-scroller': {
      overflow: 'auto',
    },
  },
  { dark: true }
);

interface ResultRow {
  id: number;
  email: string;
  total_orders: number;
  total_spend: number;
  isDirty?: boolean;
  dirtyFields?: Record<string, boolean>;
}

export const SqlEditor = () => {
  const { activeConnection } = useAppStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const [isExecuting, setIsExecuting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: number; field: keyof ResultRow } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const [results, setResults] = useState<ResultRow[]>([
    { id: 501, email: 'alex.turner@corp.io', total_orders: 14, total_spend: 2030.0 },
    { id: 502, email: 'sarah.connor@cyberdyne.net', total_orders: 29, total_spend: 4210.5 },
    { id: 503, email: 'khoa.nguyen@ai.lab', total_orders: 102, total_spend: 12450.0 },
  ]);

  const [originalResults, setOriginalResults] = useState<ResultRow[]>([
    { id: 501, email: 'alex.turner@corp.io', total_orders: 14, total_spend: 2030.0 },
    { id: 502, email: 'sarah.connor@cyberdyne.net', total_orders: 29, total_spend: 4210.5 },
    { id: 503, email: 'khoa.nguyen@ai.lab', total_orders: 102, total_spend: 12450.0 },
  ]);

  const defaultQuery = `SELECT u.id, u.email, COUNT(o.id) AS total_orders, SUM(o.total_amount) AS total_spend
FROM users u
LEFT JOIN user_orders o ON o.user_id = u.id
WHERE u.status = 'active'
GROUP BY u.id, u.email
ORDER BY total_spend DESC LIMIT 50;`;

  const handleRun = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setToastMessage('Query executed successfully in 1.4ms (3 rows returned)');
      setTimeout(() => setToastMessage(null), 2500);
    }, 280);
  };

  // Initialize CodeMirror 6 with SQL language and syntax highlighting
  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: defaultQuery,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        bracketMatching(),
        sql({ dialect: PostgreSQL }),
        syntaxHighlighting(sqlHighlightStyle),
        sqlEditorTheme,
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              handleRun();
              return true;
            },
          },
          ...defaultKeymap,
          ...historyKeymap,
        ]),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  const handleFormat = () => {
    if (!viewRef.current) return;
    const currentText = viewRef.current.state.doc.toString();
    const keywords = [
      'select', 'from', 'where', 'left join', 'join', 'group by', 'order by',
      'limit', 'as', 'count', 'sum', 'avg', 'desc', 'asc', 'on', 'and', 'or',
    ];
    let formatted = currentText;
    keywords.forEach((kw) => {
      const reg = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(reg, kw.toUpperCase());
    });

    viewRef.current.dispatch({
      changes: { from: 0, to: currentText.length, insert: formatted },
    });
  };

  // Inline editing for query results
  const startEditing = (id: number, field: keyof ResultRow, val: any) => {
    if (field === 'id') return;
    setEditingCell({ id, field });
    setEditValue(String(val));
  };

  const saveEditing = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    const orig = originalResults.find((r) => r.id === id);

    let finalVal: any = editValue;
    if (field === 'total_orders' || field === 'total_spend') {
      const num = Number(editValue);
      if (!isNaN(num)) finalVal = num;
    }

    const updated = results.map((r) => {
      if (r.id !== id) return r;
      const dirty = { ...(r.dirtyFields || {}) };
      if (orig && orig[field] === finalVal) {
        delete dirty[field];
      } else {
        dirty[field] = true;
      }
      return {
        ...r,
        [field]: finalVal,
        dirtyFields: dirty,
        isDirty: Object.keys(dirty).length > 0,
      };
    });

    setResults(updated);
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEditing();
    else if (e.key === 'Escape') setEditingCell(null);
  };

  const dirtyCount = results.reduce(
    (acc, r) => acc + (r.dirtyFields ? Object.keys(r.dirtyFields).length : 0),
    0
  );

  const handleCommitResults = () => {
    setOriginalResults(JSON.parse(JSON.stringify(results)));
    setResults(
      results.map((r) => ({
        ...r,
        isDirty: false,
        dirtyFields: {},
      }))
    );
    setToastMessage(`Committed ${dirtyCount} edit(s) via atomic transaction!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDiscardResults = () => {
    setResults(JSON.parse(JSON.stringify(originalResults)));
    setToastMessage('Discarded pending edits in query result table.');
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

      {/* Editor Toolbar */}
      <div className="h-10 bg-slate-950/70 border-b border-slate-800/80 px-4 flex items-center justify-between text-xs select-none flex-shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRun}
            disabled={isExecuting}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Executing...' : 'Run Query'}</span>
            <kbd className="px-1.5 py-0.2 bg-slate-950/20 rounded text-[9px] font-mono text-slate-950 font-extrabold">⌘↵</kbd>
          </button>

          <button
            onClick={handleFormat}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition text-[11px] flex items-center space-x-1"
          >
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>Format SQL (Auto-Capitalize)</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
          <span className="text-emerald-400 font-semibold">● Schema Indexed (0.8ms)</span>
          <span>•</span>
          <span className="text-slate-300 font-semibold uppercase">{activeConnection.engine}</span>
          <span>•</span>
          <span>Syntax: CodeMirror 6</span>
        </div>
      </div>

      {/* CodeMirror 6 Syntax Highlighted Editor Box */}
      <div className="h-60 bg-slate-950 border-b border-slate-800 overflow-hidden relative">
        <div ref={editorRef} className="h-full w-full overflow-hidden" />
      </div>

      {/* Results Header */}
      <div className="h-8 bg-slate-950/70 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 select-none flex-shrink-0">
        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
          <span>✓</span>
          <span>Query executed successfully in 1.4ms</span>
        </span>
        <span className="font-mono text-[11px]">
          {results.length} rows returned • Double-click cell to edit inline
        </span>
      </div>

      {/* Results Table (with TablePlus-Style Inline Edit & Dirty Tracking) */}
      <div className="flex-1 overflow-auto bg-slate-900/80 text-xs font-mono select-text">
        <table className="w-full border-collapse">
          <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 text-left sticky top-0 shadow-sm">
            <tr>
              <th className="p-2.5 border-r border-slate-800 w-16 text-center text-slate-600">#</th>
              <th className="p-2.5 border-r border-slate-800">
                <span className="text-slate-200 font-bold">id</span>
              </th>
              <th className="p-2.5 border-r border-slate-800">
                <span className="text-slate-200 font-bold">email</span>
              </th>
              <th className="p-2.5 border-r border-slate-800">
                <span className="text-slate-200 font-bold">total_orders</span>
              </th>
              <th className="p-2.5">
                <span className="text-slate-200 font-bold">total_spend</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {results.map((r, index) => (
              <tr
                key={r.id}
                className={`transition ${
                  r.isDirty ? 'bg-amber-950/20 hover:bg-amber-950/30 border-l-4 border-l-amber-400' : 'hover:bg-slate-800/40'
                }`}
              >
                <td className="p-2.5 border-r border-slate-800 text-slate-500 text-center select-none font-bold">
                  {index + 1}
                  {r.isDirty && <span className="text-amber-400 ml-0.5">*</span>}
                </td>

                <td className="p-2.5 border-r border-slate-800 text-sky-400 font-semibold">
                  {r.id}
                </td>

                {/* Email (Inline Editable) */}
                <td
                  onDoubleClick={() => startEditing(r.id, 'email', r.email)}
                  className={`p-2.5 border-r border-slate-800 cursor-pointer ${
                    r.dirtyFields?.email ? 'bg-amber-500/20 text-amber-200 font-semibold ring-1 ring-amber-400/80' : 'text-slate-200'
                  }`}
                >
                  {editingCell?.id === r.id && editingCell.field === 'email' ? (
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
                    <span>{r.email}</span>
                  )}
                </td>

                {/* Total Orders (Inline Editable) */}
                <td
                  onDoubleClick={() => startEditing(r.id, 'total_orders', r.total_orders)}
                  className={`p-2.5 border-r border-slate-800 cursor-pointer ${
                    r.dirtyFields?.total_orders ? 'bg-amber-500/20 text-amber-200 font-semibold ring-1 ring-amber-400/80' : 'text-slate-300'
                  }`}
                >
                  {editingCell?.id === r.id && editingCell.field === 'total_orders' ? (
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
                    <span>{r.total_orders}</span>
                  )}
                </td>

                {/* Total Spend (Inline Editable) */}
                <td
                  onDoubleClick={() => startEditing(r.id, 'total_spend', r.total_spend)}
                  className={`p-2.5 cursor-pointer font-semibold ${
                    r.dirtyFields?.total_spend ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/80' : 'text-emerald-400'
                  }`}
                >
                  {editingCell?.id === r.id && editingCell.field === 'total_spend' ? (
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
                    <span>${typeof r.total_spend === 'number' ? r.total_spend.toFixed(2) : r.total_spend}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TablePlus-Style Transaction Bar for Result Edits */}
      {dirtyCount > 0 && (
        <div className="h-11 bg-amber-500/15 border-t border-amber-500/40 px-4 flex items-center justify-between select-none z-30 shadow-lg backdrop-blur-md flex-shrink-0">
          <div className="flex items-center space-x-2">
            <HeartbeatDot color="amber" size="sm" showWave={true} />
            <span className="text-xs font-bold text-amber-300">
              {dirtyCount} uncommitted edit{dirtyCount > 1 ? 's' : ''} in query result
            </span>
            <span className="text-[11px] text-amber-200/70 hidden sm:inline">
              • Generates atomic UPDATE statements
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDiscardResults}
              className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard (⌘Z)</span>
            </button>

            <button
              onClick={handleCommitResults}
              className="px-3.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center space-x-1.5 shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Commit Edits (⌘S)</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
