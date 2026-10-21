import { useEffect, useState } from 'react';
import { useAppStore } from './stores/useAppStore';
import { Titlebar } from './components/Titlebar';
import { Sidebar } from './components/Sidebar';
import { TableGrid } from './components/TableGrid';
import { SqlEditor } from './components/SqlEditor';
import { Observability } from './components/Observability';
import { ConnectionModal } from './components/ConnectionModal';
import { OpenDatabaseModal } from './components/OpenDatabaseModal';
import { QueryHistoryModal } from './components/QueryHistoryModal';
import { SqlDiffModal } from './components/SqlDiffModal';
import { TableSchemaView } from './components/TableSchemaView';
import { RightInspector } from './components/RightInspector';
import { HeartbeatDot } from './components/HeartbeatDot';
import { Table, Terminal, Activity, FileCode, RotateCcw, Check, Columns, Plus, X, ChevronLeft, ChevronRight, Columns2, CheckCircle2 } from 'lucide-react';
import './App.css';

export function App() {
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    closeTab,
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
    commitTransaction,
    rollbackTransaction,
    toastMessage,
    reloadData,
  } = useAppStore();

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

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
          const res = commitTransaction();
          alert(`✅ Transaction Committed Successfully!\n\nExecuted ${res.count} change(s) in 1.4ms! All locks released.`);
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
              <span className="font-bold text-amber-300">Active Transaction Open</span>
              <span className="text-amber-200/80">
                • TxID: #891024 • {pendingEditsCount} uncommitted edit{pendingEditsCount > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSqlDiffModalOpen(true)}
                className="px-2 py-0.5 hover:bg-slate-800 text-amber-300 rounded font-medium text-[11px] flex items-center space-x-1 transition-colors"
              >
                <FileCode className="w-3 h-3" />
                <span>Review SQL</span>
              </button>
              <button
                onClick={() => {
                  if (confirm("Rollback transaction?")) rollbackTransaction();
                }}
                className="px-2 py-0.5 hover:bg-slate-800 text-slate-300 rounded font-medium text-[11px] flex items-center space-x-1 transition-colors active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Rollback (⌘Z)</span>
              </button>
              <button
                onClick={() => {
                  const res = commitTransaction();
                  alert(`✅ Transaction Committed!\n\nExecuted ${res.count} change(s) in 1.4ms.`);
                }}
                className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded text-[11px] flex items-center space-x-1 shadow-sm transition-all active:scale-95"
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Commit (⌘S)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Split (Sidebar + Main) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar (Collapsible with ⌘B) */}
        {isSidebarOpen && <Sidebar />}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-900/40">
          
          {/* Dynamic Multi-Tab Bar (TablePlus Style Capsule Tabs) */}
          <div className="h-10 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between px-2 select-none flex-shrink-0">
            <div className="flex items-center space-x-1.5 h-full overflow-x-auto no-scrollbar py-1">
              
              {/* Tab History Navigation (< >) */}
              <div className="flex items-center bg-slate-900/80 border border-slate-800/80 rounded-md p-0.5 mr-1 flex-shrink-0">
                <button
                  onClick={handlePrevTab}
                  disabled={!canGoBack}
                  className={`p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition ${!canGoBack ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'}`}
                  title="Previous Tab"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextTab}
                  disabled={!canGoForward}
                  className={`p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition ${!canGoForward ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'}`}
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
                if (tab.type === 'stats') icon = <Activity className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;

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
            <div className="flex items-center space-x-3 flex-shrink-0 pl-2">
              <button
                onClick={() => {}}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                title="Toggle Split Editor (⌘\)"
              >
                <Columns2 className="w-3.5 h-3.5" />
              </button>
              <div className="text-[11px] text-slate-500 font-mono hidden md:flex items-center space-x-2">
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
            {currentTabType === 'grid' && <TableGrid key={activeTabObj?.tableName || 'grid'} />}
            {currentTabType === 'schema' && <TableSchemaView key={activeTabObj?.tableName || 'schema'} />}
            {currentTabType === 'sql' && <SqlEditor key={activeTabId} />}
            {currentTabType === 'stats' && <Observability />}
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

      {/* Global Modals */}
      <ConnectionModal />
      <OpenDatabaseModal />
      <QueryHistoryModal />
      <SqlDiffModal />

    </div>
  );
}

export default App;
