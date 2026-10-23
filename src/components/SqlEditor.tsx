import React, { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Eye, X, Terminal, Clock, Key, Copy, Scissors, Trash, Check, Zap, ChevronDown, ChevronUp, Maximize2, Minimize2, AlertCircle, WrapText } from 'lucide-react';
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
import { syntaxHighlighting, bracketMatching } from '@codemirror/language';
import { useAppStore } from '../stores/useAppStore';
import { TABLE_SCHEMAS } from '../data/schemas';
import { getThemeDefinition } from '../themes/themeRegistry';
import { TableContextMenu } from './TableContextMenu';
import { ColumnTypeIcon } from './ColumnTypeIcon';
import { BorderChase } from './BorderChase';
import { format as formatSql } from 'sql-formatter';
import {
  ContextMenuContainer,
  ContextMenuItem,
  ContextMenuDivider,
  ContextMenuHeader,
  ContextMenuPosition,
} from './ContextMenu';

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


export const SqlEditor: React.FC = () => {
  const {
    activeTabId,
    sqlTabStates,
    setSqlTabQuery,
    runSqlQuery,
    selectedTable,
    activeConnection,
    sqlEditorSplitHeight,
    setSqlEditorSplitHeight,
    isSqlResultsCollapsed,
    toggleSqlResultsCollapsed,
    resolvedTheme,
    settings,
    openNewQueryTab,
    closeTab,
    showToast,
  } = useAppStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const handleSplitterResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = sqlEditorSplitHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY;
      const newHeight = Math.min(650, Math.max(80, startHeight + delta));
      setSqlEditorSplitHeight(newHeight);
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

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

  const [contextMenuPos, setContextMenuPos] = useState<ContextMenuPosition | null>(null);
  const [contextMenuRows, setContextMenuRows] = useState<any[]>([]);
  const [editorContextPos, setEditorContextPos] = useState<ContextMenuPosition | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set([501]));
  const [inspectingRow, setInspectingRow] = useState<any | null>(null);
  const [wrapText, setWrapText] = useState<boolean>(true);

  const handleRun = () => {
    if (activeConnection?.connectionStatus === 'failed') {
      showToast('⚠️ Cannot run query: Database connection failed (Press ⌘K to fix)');
      return;
    }
    if (!viewRef.current) return;
    const currentCode = viewRef.current.state.doc.toString();
    runSqlQuery(activeTabId, currentCode);
    showToast(`⚡ Query executed in 1.4ms!`);
  };

  const handleFormat = () => {
    if (!viewRef.current) return;
    const view = viewRef.current;
    const { from, to } = view.state.selection.main;
    const hasSelection = from !== to;
    const textToFormat = hasSelection
      ? view.state.sliceDoc(from, to)
      : view.state.doc.toString();

    if (!textToFormat.trim()) {
      showToast('⚠️ No SQL text to format');
      return;
    }

    const engine = activeConnection?.engine || 'postgres';
    const dialect =
      engine === 'postgres'
        ? 'postgresql'
        : engine === 'mysql'
        ? 'mysql'
        : engine === 'snowflake'
        ? 'snowflake'
        : 'sql';

    try {
      const formatted = formatSql(textToFormat, {
        language: dialect as any,
        keywordCase: 'upper',
        dataTypeCase: 'upper',
        functionCase: 'upper',
        linesBetweenQueries: 2,
        indentStyle: 'standard',
        tabWidth: 2,
        useTabs: false,
      });

      if (hasSelection) {
        view.dispatch({
          changes: { from, to, insert: formatted },
          selection: { anchor: from, head: from + formatted.length },
        });
        setSqlTabQuery(activeTabId, view.state.doc.toString());
        showToast('✨ Formatted Selected SQL');
      } else {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: formatted },
          selection: { anchor: Math.min(from, formatted.length) },
        });
        setSqlTabQuery(activeTabId, formatted);
        showToast('✨ Formatted Full SQL Query');
      }
    } catch (err) {
      console.warn('SQL format dialect error, trying generic sql:', err);
      try {
        const fallbackFormatted = formatSql(textToFormat, {
          language: 'sql',
          keywordCase: 'upper',
          dataTypeCase: 'upper',
          functionCase: 'upper',
          linesBetweenQueries: 2,
          indentStyle: 'standard',
          tabWidth: 2,
          useTabs: false,
        });

        if (hasSelection) {
          view.dispatch({
            changes: { from, to, insert: fallbackFormatted },
            selection: { anchor: from, head: from + fallbackFormatted.length },
          });
          setSqlTabQuery(activeTabId, view.state.doc.toString());
          showToast('✨ Formatted Selected SQL');
        } else {
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: fallbackFormatted },
            selection: { anchor: Math.min(from, fallbackFormatted.length) },
          });
          setSqlTabQuery(activeTabId, fallbackFormatted);
          showToast('✨ Formatted Full SQL Query');
        }
      } catch (fallbackErr) {
        showToast('⚠️ SQL syntax error: check quotes or parentheses');
      }
    }
  };

  // Initialize CodeMirror 6 with SQL language, schema completion, and syntax highlighting
  useEffect(() => {
    if (!editorRef.current) return;

    const currentThemeId = settings.appTheme || (resolvedTheme === 'light' ? 'default-light' : 'default-dark');
    const themeDef = getThemeDefinition(currentThemeId);
    const activeHighlight = themeDef.sqlHighlight;
    const activeTheme = themeDef.sqlTheme;

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
        syntaxHighlighting(activeHighlight),
        activeTheme,
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
          {
            key: 'Mod-r',
            run: () => {
              handleRun();
              return true;
            },
          },
          {
            key: 'Mod-t',
            run: () => {
              openNewQueryTab();
              return true;
            },
          },
          {
            key: 'Mod-e',
            run: () => {
              openNewQueryTab();
              return true;
            },
          },
          {
            key: 'Mod-w',
            run: () => {
              closeTab(activeTabId);
              return true;
            },
          },
          {
            key: 'Alt-Shift-f',
            run: () => {
              handleFormat();
              return true;
            },
          },
          {
            key: 'Mod-Shift-f',
            run: () => {
              handleFormat();
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
  }, [activeTabId, selectedTable, resolvedTheme, settings.appTheme]);

  const columns = tabState.columns.length > 0
    ? tabState.columns
    : Object.keys(tabState.results[0] || {});
  const results = tabState.results;
  const isErrorResult = Boolean(
    tabState.error ||
    (columns.length === 1 && columns[0]?.toLowerCase() === 'error') ||
    (results.length > 0 && typeof results[0]?.error === 'string')
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900/60 overflow-hidden relative">
      {/* Editor Top Toolbar */}
      <div className="h-10 bg-white dark:bg-slate-950/80 border-b border-slate-300 dark:border-slate-800/80 px-4 flex items-center justify-between text-xs select-none flex-shrink-0">
        <div className="flex items-center space-x-2 h-full">
          {activeConnection?.connectionStatus === 'failed' ? (
            <div className="h-7 px-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 rounded-lg text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center space-x-1.5 shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Disconnected (⌘K)</span>
            </div>
          ) : (
            <button
              onClick={handleRun}
              disabled={tabState.isExecuting}
              className="relative overflow-hidden h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition flex items-center space-x-1.5 shadow-xs active:scale-95 cursor-pointer leading-none"
            >
              {tabState.isExecuting && (
                <BorderChase color="emerald" dual={true} speed="fast" borderWidth={2} glow={true} />
              )}
              <Play className={`w-3.5 h-3.5 fill-current shrink-0 ${tabState.isExecuting ? 'animate-pulse text-white' : ''}`} />
              <span className="leading-none">{tabState.isExecuting ? 'Executing...' : 'Run Query'}</span>
              <kbd className="px-1.5 py-0.5 bg-black/20 rounded text-[9px] font-mono text-white font-extrabold leading-none">⌘↵</kbd>
            </button>
          )}

          <button
            onClick={handleFormat}
            className="h-7 px-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 rounded-lg transition flex items-center space-x-1.5 font-medium cursor-pointer active:scale-95 leading-none shadow-2xs"
            title="Beautify SQL Query or Selected Block (⇧⌥F / ⇧⌘F)"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="leading-none">Format</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded text-[9px] font-mono text-slate-600 dark:text-slate-400 leading-none">⇧⌥F</kbd>
          </button>
        </div>

        {/* Execution Performance Badge */}
        <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] leading-none">
          <span className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 font-semibold leading-none">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="leading-none">{tabState.durationMs || 1.4}ms</span>
          </span>
          <span>•</span>
          <span className="leading-none">{results.length} rows</span>
        </div>
      </div>

      {/* Top Split: CodeMirror 6 Editor Container */}
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          setEditorContextPos({ x: e.clientX, y: e.clientY });
        }}
        style={!isSqlResultsCollapsed ? { height: `${sqlEditorSplitHeight}px` } : undefined}
        className={`${isSqlResultsCollapsed ? 'flex-1' : ''} border-b border-slate-300 dark:border-slate-800/80 relative flex flex-col bg-white dark:bg-slate-950 flex-shrink-0 overflow-hidden`}
      >
        <div ref={editorRef} className="flex-1 w-full h-full overflow-hidden" />
      </div>

      {/* Draggable Horizontal Splitter Handle between Editor and Results */}
      {!isSqlResultsCollapsed && (
        <div
          onMouseDown={handleSplitterResizeStart}
          onDoubleClick={() => setSqlEditorSplitHeight(220)}
          className="h-1 hover:h-1.5 bg-slate-200 dark:bg-slate-800/80 hover:bg-sky-500/60 active:bg-sky-500 cursor-row-resize transition-all duration-100 relative group flex-shrink-0 z-20 select-none"
          title="Drag to resize SQL editor & results • Double-click to reset (220px)"
        >
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 -bottom-1 w-12 rounded-full bg-sky-400/0 group-hover:bg-sky-400/40 transition-colors pointer-events-none flex items-center justify-center">
            <div className="h-0.5 w-6 bg-sky-400 rounded-full opacity-0 group-hover:opacity-100" />
          </div>
        </div>
      )}

      {/* Bottom Split: Query Result Grid (Collapsible & Resizable) */}
      {!isSqlResultsCollapsed ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950/90 select-text relative">
        {/* Live Executing Overlay (TablePlus High-Tech System) */}
        {tabState.isExecuting && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs z-30 flex items-center justify-center p-4">
            <div className="relative overflow-hidden bg-slate-900/95 border border-sky-500/50 rounded-2xl p-4 shadow-2xl flex items-center space-x-3.5 max-w-sm ring-1 ring-sky-400/20">
              <BorderChase color="sky" dual={true} speed="fast" borderWidth={2} glow={true} />
              <div className="p-2.5 bg-sky-500/15 rounded-xl border border-sky-500/30 text-sky-400 shrink-0">
                <Terminal className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-0.5 font-mono">
                <div className="text-xs font-bold text-slate-100 flex items-center space-x-2">
                  <span>Executing Query...</span>
                  <span className="text-[10px] text-sky-400 bg-sky-500/15 px-1.5 py-0.2 rounded font-sans font-semibold">
                    DIRECT
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[210px]">
                  Streaming packets from {activeConnection.name}...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Sub-header */}
        <div className="h-8 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between text-xs select-none flex-shrink-0">
          <div className="flex items-center space-x-2">
            {isErrorResult ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="font-bold text-rose-600 dark:text-rose-400">Query Error</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono rounded">Execution Failed</span>
              </>
            ) : (
              <>
                <Terminal className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-slate-200">Query Results</span>
                <span className="text-[10px] text-slate-500 font-mono">({results.length} records)</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            {/* Wrap Text Toggle */}
            <button
              onClick={() => {
                setWrapText(!wrapText);
                showToast(wrapText ? 'Single line view (Text wrap off)' : 'Auto line wrap enabled (Đã bật xuống dòng)');
              }}
              className={`h-6 px-2 rounded-md transition-all flex items-center space-x-1 cursor-pointer select-none ${
                wrapText
                  ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 font-semibold border border-sky-300 dark:border-sky-500/40'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title={wrapText ? 'Tắt xuống dòng (Single line truncate)' : 'Bật xuống dòng tự động (Wrap long text lines)'}
            >
              <WrapText className="w-3 h-3" />
              <span>{wrapText ? 'Wrap: On' : 'Wrap: Off'}</span>
            </button>

            <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-800" />

            {isErrorResult ? (
              <button
                onClick={() => {
                  const errorText = String(results[0]?.error || tabState.error || 'Query execution error');
                  navigator.clipboard.writeText(errorText);
                  showToast('📋 Copied full error message!');
                }}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer flex items-center space-x-1"
                title="Copy entire error text"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Error</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const text =
                    results.length === 1
                      ? JSON.stringify(results[0], null, 2)
                      : JSON.stringify(results, null, 2);
                  navigator.clipboard.writeText(text);
                  showToast(
                    results.length === 1
                      ? '📋 Copied result row as JSON Object!'
                      : `📋 Copied ${results.length} rows as JSON Array!`
                  );
                }}
                className="hover:text-slate-900 dark:hover:text-slate-200 transition cursor-pointer"
              >
                Copy JSON
              </button>
            )}

            <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-800" />
            <button
              onClick={() => setSqlEditorSplitHeight(sqlEditorSplitHeight <= 100 ? 220 : 80)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded transition cursor-pointer"
              title={sqlEditorSplitHeight <= 100 ? 'Restore Split' : 'Maximize Results'}
            >
              {sqlEditorSplitHeight <= 100 ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleSqlResultsCollapsed}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-400 rounded transition cursor-pointer"
              title="Collapse Results Panel"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Results Table */}
        <div className="flex-1 overflow-auto text-xs font-mono bg-white dark:bg-transparent">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-950/95 backdrop-blur-md z-10 border-b border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 text-left text-[11px]">
              <tr>
                <th className="w-12 p-2 border-r border-slate-300 dark:border-slate-800/80 text-center text-slate-500 dark:text-slate-600 font-bold">#</th>
                {columns.map((col) => {
                  const isErrorCol = col.toLowerCase() === 'error';
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
                    <th key={col} className={`p-2 border-r border-slate-300 dark:border-slate-800/80 font-semibold min-w-[120px] ${
                      isErrorCol ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      <div className="flex items-center space-x-1.5 truncate">
                        {isErrorCol ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : (
                          <ColumnTypeIcon type={foundType} sampleValue={sampleVal} />
                        )}
                        <span className={`font-semibold truncate ${isErrorCol ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>{col}</span>
                        {isPk && (
                          <span title="Primary Key" className="inline-flex items-center ml-0.5">
                            <Key className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400/90 flex-shrink-0" />
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 text-[11px]">
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
                        const rowId = r.id !== undefined ? r.id : index;
                        setContextMenuRows([r]);
                        setSelectedRowIds(new Set([rowId]));
                        setContextMenuPos({ x: e.clientX, y: e.clientY });
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#eff6ff] dark:bg-sky-600/30 text-[#1d4ed8] dark:text-white font-medium shadow-2xs border-y border-[#dbeafe] dark:border-sky-500/30'
                          : isEven
                          ? 'bg-[#fcfdfd] dark:bg-slate-900/40 hover:bg-[#f0f7ff] dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                          : 'bg-white dark:bg-slate-950/60 hover:bg-[#f0f7ff] dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800/60 text-center text-slate-500 select-none font-medium align-top">
                        {index + 1}
                      </td>
                      {columns.map((col) => {
                        const val = r[col];
                        const isErrorCol = col.toLowerCase() === 'error';
                        const shouldWrap = wrapText || isErrorCol;

                        return (
                          <td 
                            key={col} 
                            className={`px-3 py-2 border-r border-slate-200 dark:border-slate-800/60 select-text ${
                              shouldWrap
                                ? 'whitespace-pre-wrap break-words leading-relaxed'
                                : 'whitespace-nowrap overflow-hidden text-ellipsis max-w-md'
                            } ${isErrorCol ? 'bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-mono' : ''}`}
                            title={val ? String(val) : undefined}
                          >
                            {val === null || val === undefined ? (
                              <span className="text-slate-400 dark:text-slate-500 italic select-none font-mono">NULL</span>
                            ) : typeof val === 'boolean' ? (
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{val ? 'TRUE' : 'FALSE'}</span>
                            ) : typeof val === 'object' ? (
                              <span className={`font-mono text-slate-700 dark:text-slate-300 ${shouldWrap ? 'whitespace-pre-wrap break-words' : 'truncate block'}`}>
                                {JSON.stringify(val, null, shouldWrap ? 2 : undefined)}
                              </span>
                            ) : isErrorCol ? (
                              <div className="flex items-start space-x-2 text-rose-700 dark:text-rose-300">
                                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                <span className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed select-text flex-1">
                                  {String(val)}
                                </span>
                              </div>
                            ) : shouldWrap ? (
                              <span className="whitespace-pre-wrap break-words block text-slate-800 dark:text-slate-200 leading-relaxed font-mono">{String(val)}</span>
                            ) : (
                              <span className="truncate block text-slate-800 dark:text-slate-200 font-mono">{String(val)}</span>
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
      ) : (
        /* Collapsed Query Results Bottom Bar */
        <div className="h-8 bg-slate-950 border-t border-slate-800/80 px-4 flex items-center justify-between text-xs select-none flex-shrink-0">
          <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>Query Results: {results.length} rows (Collapsed)</span>
          </div>
          <button
            onClick={toggleSqlResultsCollapsed}
            className="px-2.5 py-1 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 rounded-md text-[11px] font-semibold transition active:scale-95 cursor-pointer flex items-center space-x-1"
          >
            <ChevronUp className="w-3 h-3" />
            <span>Expand Results</span>
          </button>
        </div>
      )}

      {/* Right-Click Context Menu for Results */}
      <TableContextMenu
        position={contextMenuPos}
        selectedRows={
          contextMenuRows.length > 0
            ? contextMenuRows
            : selectedRowIds.size > 0
            ? results.filter((r, idx) => selectedRowIds.has(r.id !== undefined ? r.id : idx))
            : results[0]
            ? [results[0]]
            : []
        }
        tableName="query_results"
        onClose={() => {
          setContextMenuPos(null);
          setContextMenuRows([]);
        }}
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
      {/* Code Editor Context Menu */}
      {editorContextPos && (
        <ContextMenuContainer
          position={editorContextPos}
          onClose={() => setEditorContextPos(null)}
          width={240}
        >
          <ContextMenuHeader title="SQL Editor" />
          <ContextMenuItem
            icon={<Play className="w-3.5 h-3.5 text-emerald-400" />}
            label="Run Query"
            shortcut="⌘↵"
            onClick={() => {
              handleRun();
              setEditorContextPos(null);
            }}
          />
          {viewRef.current && viewRef.current.state.selection.main.from !== viewRef.current.state.selection.main.to && (
            <ContextMenuItem
              icon={<Play className="w-3.5 h-3.5 text-sky-400" />}
              label="Run Selected Query"
              onClick={() => {
                const sel = viewRef.current!.state.sliceDoc(
                  viewRef.current!.state.selection.main.from,
                  viewRef.current!.state.selection.main.to
                );
                runSqlQuery(activeTabId, sel);
                showToast(`⚡ Selected query executed in 1.4ms!`);
                setEditorContextPos(null);
              }}
            />
          )}
          <ContextMenuItem
            icon={<Sparkles className="w-3.5 h-3.5 text-sky-400" />}
            label="Format SQL"
            shortcut="⇧⌥F"
            onClick={() => {
              handleFormat();
              setEditorContextPos(null);
            }}
          />
          <ContextMenuDivider />
          <ContextMenuItem
            icon={<Check className="w-3.5 h-3.5 text-slate-400" />}
            label="Select All"
            shortcut="⌘A"
            onClick={() => {
              if (viewRef.current) {
                viewRef.current.dispatch({
                  selection: { anchor: 0, head: viewRef.current.state.doc.length },
                });
              }
              setEditorContextPos(null);
            }}
          />
          <ContextMenuItem
            icon={<Copy className="w-3.5 h-3.5 text-slate-400" />}
            label="Copy"
            shortcut="⌘C"
            onClick={() => {
              if (viewRef.current) {
                const { from, to } = viewRef.current.state.selection.main;
                const text = from !== to ? viewRef.current.state.sliceDoc(from, to) : viewRef.current.state.doc.toString();
                navigator.clipboard.writeText(text);
                showToast('📋 Copied to clipboard');
              }
              setEditorContextPos(null);
            }}
          />
          <ContextMenuItem
            icon={<Scissors className="w-3.5 h-3.5 text-slate-400" />}
            label="Cut"
            shortcut="⌘X"
            onClick={() => {
              if (viewRef.current) {
                const { from, to } = viewRef.current.state.selection.main;
                if (from !== to) {
                  const text = viewRef.current.state.sliceDoc(from, to);
                  navigator.clipboard.writeText(text);
                  viewRef.current.dispatch({ changes: { from, to, insert: '' } });
                  showToast('✂️ Cut selection');
                }
              }
              setEditorContextPos(null);
            }}
          />
          <ContextMenuItem
            icon={<Trash className="w-3.5 h-3.5 text-slate-400" />}
            label="Clear Editor"
            onClick={() => {
              if (viewRef.current) {
                viewRef.current.dispatch({
                  changes: { from: 0, to: viewRef.current.state.doc.length, insert: '' },
                });
                setSqlTabQuery(activeTabId, '');
                showToast('🧹 Cleared editor');
              }
              setEditorContextPos(null);
            }}
          />
          <ContextMenuDivider />
          <ContextMenuItem
            icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
            label="Explain Query (EXPLAIN ANALYZE)"
            onClick={() => {
              if (viewRef.current) {
                const currentDoc = viewRef.current.state.doc.toString();
                const explainQuery = currentDoc.trim().toLowerCase().startsWith('explain')
                  ? currentDoc
                  : `EXPLAIN ANALYZE\n${currentDoc}`;
                viewRef.current.dispatch({
                  changes: { from: 0, to: viewRef.current.state.doc.length, insert: explainQuery },
                });
                setSqlTabQuery(activeTabId, explainQuery);
                runSqlQuery(activeTabId, explainQuery);
                showToast('⚡ Running EXPLAIN ANALYZE...');
              }
              setEditorContextPos(null);
            }}
          />
        </ContextMenuContainer>
      )}
    </div>
  );
};
