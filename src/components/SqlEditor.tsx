import React, { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, CheckCircle2, Eye, X, Terminal, Clock, Key } from 'lucide-react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, keymap, highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';
import { highlightSelectionMatches } from '@codemirror/search';
import { HighlightStyle, syntaxHighlighting, bracketMatching } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { useAppStore } from '../stores/useAppStore';
import { TABLE_SCHEMAS } from '../data/schemas';
import { TableContextMenu, ContextMenuPosition } from './TableContextMenu';
import { ColumnTypeIcon } from './ColumnTypeIcon';

// Build rich SQL Schema with column types, primary key badges, and descriptions for autocompletion
const buildSqlSchema = () => {
  const schema: Record<string, any[]> = {};
  Object.entries(TABLE_SCHEMAS).forEach(([tbl, info]) => {
    schema[tbl] = info.columns.map((c) => ({
      label: c.name,
      type: c.isPrimaryKey ? 'keyword' : 'property',
      detail: `${c.type}${c.isPrimaryKey ? ' (PK)' : c.isForeignKey ? ' (FK)' : ''}`,
      info: c.comment || (c.defaultValue ? `Default: ${c.defaultValue}` : undefined),
      boost: c.isPrimaryKey ? 99 : 50,
    }));
  });
  return schema;
};

const SQL_SCHEMA = buildSqlSchema();

// Dynamic alias resolver: e.g. "FROM users u" or "FROM users AS u" -> u resolves to users
function getTableForAlias(docText: string, aliasOrName: string): string | null {
  if (SQL_SCHEMA[aliasOrName]) return aliasOrName;
  const regex = new RegExp(`(?:FROM|JOIN)\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s+(?:AS\\s+)?${aliasOrName}\\b`, 'i');
  const match = docText.match(regex);
  if (match && SQL_SCHEMA[match[1]]) {
    return match[1];
  }
  return null;
}

// Custom autocomplete provider for table.column navigation and FROM/JOIN table suggestions
function customDotAndTableCompletion(context: CompletionContext): CompletionResult | null {
  const line = context.state.doc.lineAt(context.pos);
  const textBefore = line.text.slice(0, context.pos - line.from);

  // 1. Triggered on typing after a dot: e.g. users. or u. or tuple. or goose_db_version.
  const dotMatch = textBefore.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z0-9_]*)$/);
  if (dotMatch) {
    const [_, tableOrAlias, prefix] = dotMatch;
    const fullDoc = context.state.doc.toString();
    const actualTable = getTableForAlias(fullDoc, tableOrAlias);

    if (actualTable && SQL_SCHEMA[actualTable]) {
      return {
        from: context.pos - prefix.length,
        options: SQL_SCHEMA[actualTable],
        validFor: /^[a-zA-Z0-9_]*$/,
      };
    }
  }

  // 2. Triggered on FROM / JOIN / INTO clause to suggest table names
  const fromJoinMatch = textBefore.match(/(?:FROM|JOIN|INTO|UPDATE)\s+([a-zA-Z0-9_]*)$/i);
  if (fromJoinMatch) {
    const prefix = fromJoinMatch[1];
    const tableOptions = Object.keys(SQL_SCHEMA).map((tbl) => ({
      label: tbl,
      type: 'type',
      detail: 'table',
      boost: 90,
    }));
    return {
      from: context.pos - prefix.length,
      options: tableOptions,
    };
  }

  return null;
}

// Vibrant, high-contrast SQL Syntax Highlighting Theme (Vivid Keywords, Emerald Strings, Amber Functions)
const sqlHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#38bdf8', fontWeight: 'bold' },
  { tag: t.standard(t.name), color: '#c084fc', fontWeight: 'bold' },
  { tag: t.special(t.string), color: '#fbbf24' },
  { tag: t.string, color: '#4ade80' },
  { tag: t.number, color: '#f87171', fontWeight: 'semibold' },
  { tag: t.bool, color: '#f43f5e', fontWeight: 'bold' },
  { tag: t.null, color: '#f43f5e', fontWeight: 'bold' },
  { tag: t.function(t.variableName), color: '#fbbf24', fontWeight: 'bold' },
  { tag: t.operator, color: '#93c5fd' },
  { tag: t.punctuation, color: '#94a3b8' },
  { tag: t.comment, color: '#64748b', fontStyle: 'italic' },
  { tag: t.variableName, color: '#f8fafc' },
]);

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
    /* High-contrast Native macOS / TablePlus Selection Highlight */
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'rgba(37, 99, 235, 0.45) !important',
    },
    '.cm-selectionLayer .cm-selectionBackground': {
      backgroundColor: 'rgba(37, 99, 235, 0.45) !important',
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
      backgroundColor: 'rgba(37, 99, 235, 0.45) !important',
    },
    '::selection, .cm-content ::selection': {
      backgroundColor: 'rgba(37, 99, 235, 0.55) !important',
      color: '#ffffff !important',
    },
    '&:not(.cm-focused) .cm-selectionBackground': {
      backgroundColor: 'rgba(37, 99, 235, 0.22) !important',
    },
    /* Word match highlight on double-click */
    '.cm-selectionMatch': {
      backgroundColor: 'rgba(56, 189, 248, 0.25) !important',
      outline: '1px solid rgba(56, 189, 248, 0.6) !important',
      borderRadius: '2px',
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
    /* Autocomplete Tooltip Dropdown (TablePlus / VS Code style) */
    '.cm-tooltip': {
      backgroundColor: '#0f172a !important',
      border: '1px solid #334155 !important',
      borderRadius: '8px !important',
      boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05) !important',
      overflow: 'hidden !important',
      zIndex: '100 !important',
    },
    '.cm-tooltip.cm-tooltip-autocomplete': {
      '& > ul': {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: '12px',
        maxHeight: '260px',
        minWidth: '240px',
        padding: '4px',
      },
      '& > ul > li': {
        padding: '5px 8px',
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#e2e8f0',
        cursor: 'pointer',
      },
      '& > ul > li[aria-selected]': {
        backgroundColor: '#1e293b !important',
        color: '#38bdf8 !important',
      },
      '& > ul > li:hover': {
        backgroundColor: '#1e293b80',
      },
    },
    '.cm-completionLabel': {
      fontWeight: '600',
      color: '#f8fafc',
    },
    '.cm-completionDetail': {
      marginLeft: 'auto',
      paddingLeft: '12px',
      color: '#94a3b8',
      fontSize: '11px',
      fontStyle: 'normal',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    },
    '.cm-completionInfo': {
      backgroundColor: '#090d16',
      borderLeft: '1px solid #334155',
      padding: '8px 12px',
      color: '#cbd5e1',
      fontSize: '11px',
      maxWidth: '300px',
    },
    '.cm-completionIcon': {
      width: '14px',
      opacity: '0.8',
      marginRight: '2px',
    },
  },
  { dark: true }
);

export const SqlEditor: React.FC = () => {
  const { activeTabId, sqlTabStates, setSqlTabQuery, runSqlQuery, selectedTable } = useAppStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const tabState = sqlTabStates[activeTabId] || {
    tabId: activeTabId,
    query: `SELECT u.id, u.email, COUNT(o.id) AS total_orders, SUM(o.total_amount) AS total_spend\nFROM users u\nLEFT JOIN user_orders o ON o.user_id = u.id\nWHERE u.status = 'active'\nGROUP BY u.id, u.email\nORDER BY total_spend DESC LIMIT 50;`,
    results: [
      { id: 501, email: 'alex.turner@corp.io', total_orders: 14, total_spend: 2030.0 },
      { id: 502, email: 'sarah.connor@cyberdyne.net', total_orders: 29, total_spend: 4210.5 },
      { id: 503, email: 'khoa.nguyen@ai.lab', total_orders: 102, total_spend: 12450.0 },
    ],
    columns: ['id', 'email', 'total_orders', 'total_spend'],
    durationMs: 1.4,
    rowsCount: 3,
    isExecuting: false,
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<ContextMenuPosition | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set([501]));
  const [inspectingRow, setInspectingRow] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  const handleRun = () => {
    if (!viewRef.current) return;
    const currentCode = viewRef.current.state.doc.toString();
    runSqlQuery(activeTabId, currentCode);
    showToast(`⚡ Query executed in 1.4ms!`);
  };

  // Initialize CodeMirror 6 with SQL language, schema completion, and syntax highlighting
  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: tabState.query,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        bracketMatching(),
        closeBrackets(),
        highlightSelectionMatches(),
        sql({
          dialect: PostgreSQL,
          schema: SQL_SCHEMA,
          defaultTable: selectedTable || 'users',
          upperCaseKeywords: true,
        }),
        PostgreSQL.language.data.of({
          autocomplete: customDotAndTableCompletion,
        }),
        autocompletion({
          activateOnTyping: true,
          maxRenderedOptions: 30,
        }),
        syntaxHighlighting(sqlHighlightStyle),
        sqlEditorTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setSqlTabQuery(activeTabId, update.state.doc.toString());
          }
        }),
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              handleRun();
              return true;
            },
          },
          ...completionKeymap,
          ...closeBracketsKeymap,
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
  }, [activeTabId, selectedTable]);

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
    setSqlTabQuery(activeTabId, formatted);
    showToast('✨ Formatted SQL Query');
  };

  const columns = tabState.columns.length > 0
    ? tabState.columns
    : Object.keys(tabState.results[0] || {});
  const results = tabState.results;

  return (
    <div className="flex-1 flex flex-col bg-slate-900/60 overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-12 right-6 z-40 bg-emerald-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Editor Top Toolbar */}
      <div className="h-10 bg-slate-950/80 border-b border-slate-800/80 px-4 flex items-center justify-between text-xs select-none flex-shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRun}
            disabled={tabState.isExecuting}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{tabState.isExecuting ? 'Executing...' : 'Run Query'}</span>
            <kbd className="px-1.5 py-0.2 bg-slate-950/20 rounded text-[9px] font-mono text-slate-950 font-extrabold">⌘↵</kbd>
          </button>

          <button
            onClick={handleFormat}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 rounded-lg transition flex items-center space-x-1.5 font-medium"
            title="Auto-format SQL keywords to uppercase"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Format</span>
          </button>
        </div>

        {/* Execution Performance Badge */}
        <div className="flex items-center space-x-3 text-slate-400 font-mono text-[11px]">
          <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
            <Clock className="w-3 h-3" />
            <span>{tabState.durationMs || 1.4}ms</span>
          </span>
          <span>•</span>
          <span>{results.length} rows</span>
        </div>
      </div>

      {/* Top Split: CodeMirror 6 Editor Container */}
      <div className="h-48 border-b border-slate-800/80 relative flex flex-col bg-slate-950 flex-shrink-0">
        <div ref={editorRef} className="flex-1 w-full h-full overflow-hidden" />
      </div>

      {/* Bottom Split: Query Result Grid */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/90 select-text">
        {/* Results Sub-header */}
        <div className="h-8 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-xs select-none flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold text-slate-200">Query Results</span>
            <span className="text-[10px] text-slate-500 font-mono">({results.length} records)</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(results, null, 2));
                showToast('📋 Copied results as JSON!');
              }}
              className="hover:text-slate-200 transition"
            >
              Copy JSON
            </button>
          </div>
        </div>

        {/* Dynamic Results Table */}
        <div className="flex-1 overflow-auto text-xs font-mono">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-slate-950/95 backdrop-blur-md z-10 border-b border-slate-800 text-slate-400 text-left text-[11px]">
              <tr>
                <th className="w-12 p-2 border-r border-slate-800/80 text-center text-slate-600">#</th>
                {columns.map((col) => {
                  const firstRowWithVal = results.find((r) => r[col] !== null && r[col] !== undefined);
                  const sampleVal = firstRowWithVal ? firstRowWithVal[col] : undefined;

                  let foundType: string | undefined;
                  let isPk = false;
                  for (const schema of Object.values(TABLE_SCHEMAS)) {
                    const match = schema.columns.find((c) => c.name === col);
                    if (match) {
                      foundType = match.type;
                      isPk = !!match.isPrimaryKey;
                      break;
                    }
                  }

                  return (
                    <th key={col} className="p-2 border-r border-slate-800/80 text-slate-200 font-semibold min-w-[120px]">
                      <div className="flex items-center space-x-1.5 truncate">
                        <ColumnTypeIcon type={foundType} sampleValue={sampleVal} />
                        <span className="text-slate-200 font-semibold truncate">{col}</span>
                        {isPk && (
                          <span title="Primary Key" className="inline-flex items-center ml-0.5">
                            <Key className="w-2.5 h-2.5 text-amber-400/90 flex-shrink-0" />
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-[11px]">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-8 text-center text-slate-500">
                    No records returned from query execution.
                  </td>
                </tr>
              ) : (
                results.map((r, index) => {
                  const isSelected = selectedRowIds.has(r.id);
                  const isEven = index % 2 === 0;

                  return (
                    <tr
                      key={r.id ?? index}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey) {
                          const next = new Set(selectedRowIds);
                          if (next.has(r.id)) next.delete(r.id);
                          else next.add(r.id);
                          setSelectedRowIds(next);
                        } else {
                          setSelectedRowIds(new Set([r.id]));
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSelectedRowIds(new Set([r.id]));
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
                      <td className="p-2 border-r border-slate-800/60 text-center text-slate-500 select-none">
                        {index + 1}
                      </td>
                      {columns.map((col) => {
                        const val = r[col];
                        return (
                          <td key={col} className="p-2 border-r border-slate-800/60 truncate max-w-xs">
                            {val === null || val === undefined ? (
                              <span className="text-slate-500 italic select-none">NULL</span>
                            ) : typeof val === 'boolean' ? (
                              <span className="text-slate-300 font-medium">{val ? 'TRUE' : 'FALSE'}</span>
                            ) : typeof val === 'object' ? (
                              <span className="truncate block font-mono text-slate-300">{JSON.stringify(val)}</span>
                            ) : (
                              <span className="truncate block text-slate-200">{String(val)}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right-Click Context Menu for Results */}
      <TableContextMenu
        position={contextMenuPos}
        selectedRows={results.filter((r) => selectedRowIds.has(r.id))}
        tableName="query_results"
        onClose={() => setContextMenuPos(null)}
        onDuplicateRow={() => {}}
        onDeleteRows={() => {}}
        onQuickLook={(row) => setInspectingRow(row)}
        onToast={showToast}
      />

      {/* Quick Look Inspector Dialog */}
      {inspectingRow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-100">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 flex flex-col animate-in zoom-in-95 duration-100">
            <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between select-none">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-slate-100">Quick Look — Row #{inspectingRow.id}</span>
              </div>
              <button
                onClick={() => setInspectingRow(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <pre className="p-4 max-h-[420px] overflow-auto font-mono text-xs text-sky-300 bg-slate-950 select-text">
              {JSON.stringify(inspectingRow, null, 2)}
            </pre>
            <div className="h-11 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-end select-none">
              <button
                onClick={() => setInspectingRow(null)}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
