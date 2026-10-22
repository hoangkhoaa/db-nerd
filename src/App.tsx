import { useEffect, useState } from 'react';
import { useAppStore } from './stores/useAppStore';
import { Titlebar } from './components/Titlebar';
import { ConnectionRail } from './components/ConnectionRail';
import { Sidebar } from './components/Sidebar';
import { TableGrid } from './components/TableGrid';
import { SqlEditor } from './components/SqlEditor';
import { Observability } from './components/Observability';
import { ConnectionModal } from './components/ConnectionModal';
import { OpenDatabaseModal } from './components/OpenDatabaseModal';
import { QueryHistoryModal } from './components/QueryHistoryModal';
import { RunningQueriesModal } from './components/RunningQueriesModal';
import { SqlDiffModal } from './components/SqlDiffModal';
import { SettingsModal } from './components/SettingsModal';
import { TableSchemaView } from './components/TableSchemaView';
import { DefaultWorkspaceView } from './components/DefaultWorkspaceView';
import { AllTableStatsView } from './components/AllTableStatsView';
import { AllFunctionsView } from './components/AllFunctionsView';
import { RightInspector } from './components/RightInspector';
import { HeartbeatDot } from './components/HeartbeatDot';
import { Table, Terminal, Activity, FileCode, RotateCcw, Check, Columns, Plus, X, ChevronLeft, ChevronRight, Columns2, CheckCircle2, ArrowRight, CopyPlus, Edit3, Copy, Code } from 'lucide-react';
import {
  ContextMenuContainer,
  ContextMenuItem,
  ContextMenuDivider,
  ContextMenuHeader,
  ContextMenuPosition,
} from './components/ContextMenu';
import './App.css';

export function App() {
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    closeTab,
    closeOtherTabs,
    closeTabsToRight,
    closeAllTabs,
    duplicateTab,
    openNewQueryTab,
    renameTab,
    activeTab,
    isTransactionOpen,
    pendingEditsCount,
    isSidebarOpen,
    toggleSidebar,
    setConnectionModalOpen,
    setDatabaseModalOpen,
    setHistoryModalOpen,
    setSqlDiffModalOpen,
    settings,
    setSettingsModalOpen,
    updateResolvedTheme,
    commitTransaction,
    rollbackTransaction,
    toastMessage,
    showToast,
    reloadData,
    sqlTabStates,
  } = useAppStore();

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [tabContextPos, setTabContextPos] = useState<ContextMenuPosition | null>(null);
  const [targetTabId, setTargetTabId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘B: Toggle Sidebar
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebar();
      }
      // ⌘I: Toggle Right Inspector
      if ((e.metaKey || e.ctrlKey) && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        useAppStore.getState().toggleRightInspector();
      }
      // ⌘R: Reload Data (Table or Query)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        reloadData();
      }
      // ⌘O: Open Database Switcher
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        setDatabaseModalOpen(true);
      }
      // ⌘T or ⌘E: New SQL Query Tab (TablePlus standard)
      if ((e.metaKey || e.ctrlKey) && (e.key === 't' || e.key === 'T' || e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        openNewQueryTab();
      }
      // ⌘W: Close Active Tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        const activeId = useAppStore.getState().activeTabId;
        closeTab(activeId);
      }
      // ⌘K: Connection Manager
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setConnectionModalOpen(true);
      }
      // ⌘H: Query History
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        setHistoryModalOpen(true);
      }
      // ⌘S: Commit Transaction
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (useAppStore.getState().pendingEditsCount > 0) {
          commitTransaction().then((res) => {
            alert(`✅ Transaction Committed Successfully!\n\nExecuted ${res.count} change(s)! All locks released.`);
          });
        }
      }
      // ⌘Z: Rollback Transaction (when not in input/textarea)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        if (useAppStore.getState().pendingEditsCount > 0) {
          e.preventDefault();
          if (confirm("Rollback transaction and discard all uncommitted edits?")) {
            rollbackTransaction();
          }
        }
      }
      // ⌘, : Preferences & Settings
      if ((e.metaKey || e.ctrlKey) && (e.key === ',' || e.code === 'Comma')) {
        e.preventDefault();
        setSettingsModalOpen(true);
      }
      // ⌘1 - ⌘9: Switch directly to tab index
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        const tabIndex = parseInt(e.key, 10) - 1;
        const currentTabs = useAppStore.getState().tabs;
        if (currentTabs[tabIndex]) {
          e.preventDefault();
          setActiveTabId(currentTabs[tabIndex].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Synchronize Theme Mode (Light / Dark / Auto Device)
  useEffect(() => {
    const applyTheme = () => {
      const mode = settings.themeMode;
      let resolved: 'dark' | 'light' = 'dark';
      if (mode === 'auto') {
        resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = mode;
      }
      updateResolvedTheme(resolved);

      if (resolved === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery) {
      const handleChange = () => {
        if (useAppStore.getState().settings.themeMode === 'auto') {
          applyTheme();
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.themeMode]);

  const activeTabObj = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const currentTabType = activeTabObj?.type || activeTab;

  const activeTabIndex = tabs.findIndex((t) => t.id === activeTabId);
  const canGoBack = activeTabIndex > 0;
  const canGoForward = activeTabIndex >= 0 && activeTabIndex < tabs.length - 1;

  const handlePrevTab = () => {
    if (canGoBack) setActiveTabId(tabs[activeTabIndex - 1].id);
  };

  const handleNextTab = () => {
    if (canGoForward) setActiveTabId(tabs[activeTabIndex + 1].id);
  };

  const startRename = (tabId: string, currentTitle: string) => {
    setEditingTabId(tabId);
    setEditingTitle(currentTitle);
  };

  const saveRename = () => {
    if (editingTabId && editingTitle.trim()) {
      renameTab(editingTabId, editingTitle.trim());
    }
    setEditingTabId(null);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0f1d] text-slate-100 overflow-hidden font-sans select-none relative">
      
      {/* Native macOS Titlebar */}
      <Titlebar />

      {/* Transaction Alert Banner with Smooth Expand/Collapse & Heartbeat LED */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-240 ease-[cubic-bezier(0.16,1,0.3,1)] z-20 ${
          isTransactionOpen && pendingEditsCount > 0
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <div className="h-8 bg-amber-500/15 border-b border-amber-500/40 px-4 flex items-center justify-between text-xs select-none backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <HeartbeatDot color="amber" size="sm" showWave={true} />
              <span className="font-bold text-amber-300 leading-none">Active Transaction Open</span>
              <span className="text-amber-200/80 leading-none">
                • TxID: #891024 • {pendingEditsCount} uncommitted edit{pendingEditsCount > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSqlDiffModalOpen(true)}
                className="h-6 px-2 hover:bg-slate-800 text-amber-300 rounded font-medium text-[11px] flex items-center space-x-1.5 transition-colors leading-none cursor-pointer"
              >
                <FileCode className="w-3 h-3 shrink-0" />
                <span>Review SQL</span>
              </button>
              <button
                onClick={() => {
                  if (confirm("Rollback transaction?")) rollbackTransaction();
                }}
                className="h-6 px-2 hover:bg-slate-800 text-slate-300 rounded font-medium text-[11px] flex items-center space-x-1.5 transition-colors active:scale-95 leading-none cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 shrink-0" />
                <span>Rollback (⌘Z)</span>
              </button>
              <button
                onClick={async () => {
                  const res = await commitTransaction();
                  if (res.count > 0) {
                    alert(`✅ Transaction Committed!\n\nExecuted ${res.count} change(s).`);
                  }
                }}
                className="h-6 px-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded text-[11px] flex items-center space-x-1.5 shadow-sm transition-all active:scale-95 leading-none cursor-pointer"
              >
                <Check className="w-3 h-3 stroke-[3] shrink-0" />
                <span>Commit (⌘S)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Split (Rail + Sidebar + Main) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Connection Switcher Rail (TablePlus style) */}
        <ConnectionRail />

        {/* Sidebar (Collapsible with ⌘B) */}
        {isSidebarOpen && <Sidebar />}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-900/40">
          
          {/* Dynamic Multi-Tab Bar (TablePlus Style Capsule Tabs) */}
          <div className="h-10 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between px-2 select-none flex-shrink-0">
            <div className="flex items-center space-x-1.5 h-full overflow-x-auto no-scrollbar py-1">
              
              {/* Tab History Navigation (< >) */}
              <div className="flex items-center bg-slate-900/80 border border-slate-800/80 rounded-md p-0.5 mr-1 flex-shrink-0 h-7">
                <button
                  onClick={handlePrevTab}
                  disabled={!canGoBack}
                  className={`h-6 w-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition ${!canGoBack ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'}`}
                  title="Previous Tab"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextTab}
                  disabled={!canGoForward}
                  className={`h-6 w-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition ${!canGoForward ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'}`}
                  title="Next Tab"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Dynamic Open Tabs */}
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                let icon = <Table className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />;
                if (tab.type === 'schema') icon = <Columns className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />;
                if (tab.type === 'sql') icon = <Terminal className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />;
                if (tab.type === 'stats') {
                  if (tab.tableName === '__all_tables__' || tab.title.startsWith('Tables.')) {
                    icon = <Table className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />;
                  } else if (tab.tableName === '__all_functions__' || tab.title.startsWith('Functions.')) {
                    icon = <Code className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />;
                  } else {
                    icon = <Activity className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
                  }
                }

                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(tab.id, tab.title);
                    }}
                    onMouseDown={(e) => {
                      if (e.button === 1 && tab.canClose !== false) {
                        e.preventDefault();
                        closeTab(tab.id);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTabContextPos({ x: e.clientX, y: e.clientY });
                      setTargetTabId(tab.id);
                    }}
                    className={`group h-7 px-2.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer select-none max-w-[220px] flex-shrink-0 border ${
                      isActive
                        ? 'bg-slate-800/90 border-slate-700/80 text-slate-100 shadow-sm font-semibold'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                    title={`${tab.title} (Double-click to rename)`}
                  >
                    {icon}
                    {editingTabId === tab.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        autoFocus
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={saveRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename();
                          if (e.key === 'Escape') setEditingTabId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-900 text-slate-100 border border-sky-500 rounded px-1 py-0 text-xs w-24 outline-none font-sans"
                      />
                    ) : (
                      <span className="truncate">{tab.title}</span>
                    )}
                    {tab.canClose !== false && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(tab.id);
                        }}
                        className="p-0.5 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded transition opacity-0 group-hover:opacity-100 ml-0.5"
                        title="Close Tab (⌘W)"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* New Tab Button (+) */}
              <button
                onClick={() => openNewQueryTab()}
                className="h-7 w-7 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition active:scale-95 border border-transparent hover:border-slate-700/60 flex-shrink-0"
                title="New SQL Query Tab (⌘T / ⌘E)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

            </div>

            {/* Right Controls: Split Editor & Engine Stats */}
            <div className="flex items-center space-x-3 flex-shrink-0 pl-2 h-full">
              <button
                onClick={() => {}}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                title="Toggle Split Editor (⌘\)"
              >
                <Columns2 className="w-3.5 h-3.5" />
              </button>
              <div className="text-[11px] text-slate-500 font-mono hidden md:flex items-center space-x-2 leading-none">
                <span>Tabs: <strong className="text-slate-300">{tabs.length}</strong></span>
                <span>•</span>
                <span>RAM: <strong className="text-slate-300">46.8 MB</strong></span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">120 FPS</span>
              </div>
            </div>
          </div>

          {/* Active Tab View */}
          <div className="flex-1 flex overflow-hidden">
            {tabs.length === 0 || currentTabType === 'default' ? (
              <DefaultWorkspaceView />
            ) : (
              <>
                {currentTabType === 'grid' && <TableGrid key={activeTabObj?.tableName || 'grid'} />}
                {currentTabType === 'schema' && <TableSchemaView key={activeTabObj?.tableName || 'schema'} />}
                {currentTabType === 'sql' && <SqlEditor key={activeTabId} />}
                {currentTabType === 'stats' && (
                  activeTabObj?.tableName === '__all_tables__' || activeTabObj?.title.startsWith('Tables.') ? (
                    <AllTableStatsView key={activeTabId} />
                  ) : activeTabObj?.tableName === '__all_functions__' || activeTabObj?.title.startsWith('Functions.') ? (
                    <AllFunctionsView key={activeTabId} />
                  ) : (
                    <Observability key={activeTabId} />
                  )
                )}
              </>
            )}
          </div>

        </main>

        {/* Right Inspector Panel */}
        <RightInspector />
      </div>

      {/* Global Floating Toast */}
      {toastMessage && (
        <div className="fixed top-14 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-3.5 py-2 rounded-xl shadow-2xl flex items-center space-x-2 text-xs border border-emerald-400/40 animate-in fade-in slide-in-from-top-3 duration-150 pointer-events-none select-none">
          <CheckCircle2 className="w-4 h-4 text-slate-950 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tab Context Menu */}
      {tabContextPos && targetTabId && (() => {
        const targetTab = tabs.find((t) => t.id === targetTabId);
        if (!targetTab) return null;
        const targetIdx = tabs.findIndex((t) => t.id === targetTabId);
        const hasTabsToRight = targetIdx < tabs.length - 1;
        const hasOtherTabs = tabs.length > 1;

        return (
          <ContextMenuContainer
            position={tabContextPos}
            onClose={() => {
              setTabContextPos(null);
              setTargetTabId(null);
            }}
            width={220}
          >
            <ContextMenuHeader title={`Tab: ${targetTab.title}`} />
            {targetTab.canClose !== false && (
              <ContextMenuItem
                icon={<X className="w-3.5 h-3.5 text-rose-400" />}
                label="Close Tab"
                shortcut="⌘W"
                onClick={() => {
                  closeTab(targetTab.id);
                  setTabContextPos(null);
                }}
              />
            )}
            <ContextMenuItem
              icon={<X className="w-3.5 h-3.5 text-slate-400" />}
              label="Close Other Tabs"
              disabled={!hasOtherTabs}
              onClick={() => {
                closeOtherTabs(targetTab.id);
                setTabContextPos(null);
              }}
            />
            <ContextMenuItem
              icon={<ArrowRight className="w-3.5 h-3.5 text-slate-400" />}
              label="Close Tabs to the Right"
              disabled={!hasTabsToRight}
              onClick={() => {
                closeTabsToRight(targetTab.id);
                setTabContextPos(null);
              }}
            />
            <ContextMenuItem
              icon={<X className="w-3.5 h-3.5 text-rose-400" />}
              label="Close All Tabs"
              danger
              onClick={() => {
                closeAllTabs();
                setTabContextPos(null);
              }}
            />
            <ContextMenuDivider />
            <ContextMenuItem
              icon={<CopyPlus className="w-3.5 h-3.5 text-sky-400" />}
              label="Duplicate Tab"
              shortcut="⌘D"
              onClick={() => {
                duplicateTab(targetTab.id);
                setTabContextPos(null);
              }}
            />
            <ContextMenuItem
              icon={<Edit3 className="w-3.5 h-3.5 text-slate-400" />}
              label="Rename Tab..."
              onClick={() => {
                startRename(targetTab.id, targetTab.title);
                setTabContextPos(null);
              }}
            />
            <ContextMenuItem
              icon={<Copy className="w-3.5 h-3.5 text-slate-400" />}
              label={targetTab.type === 'sql' ? 'Copy SQL Content' : 'Copy Tab Title'}
              onClick={() => {
                if (targetTab.type === 'sql') {
                  const query = sqlTabStates[targetTab.id]?.query || '';
                  navigator.clipboard.writeText(query);
                  showToast('📋 Copied SQL content to clipboard');
                } else {
                  navigator.clipboard.writeText(targetTab.title);
                  showToast(`📋 Copied "${targetTab.title}" to clipboard`);
                }
                setTabContextPos(null);
              }}
            />
          </ContextMenuContainer>
        );
      })()}

      {/* Global Modals */}
      <ConnectionModal />
      <OpenDatabaseModal />
      <QueryHistoryModal />
      <RunningQueriesModal />
      <SqlDiffModal />
      <SettingsModal />

    </div>
  );
}

export default App;
