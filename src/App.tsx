import { useEffect } from 'react';
import { useAppStore } from './stores/useAppStore';
import { Titlebar } from './components/Titlebar';
import { Sidebar } from './components/Sidebar';
import { TableGrid } from './components/TableGrid';
import { SqlEditor } from './components/SqlEditor';
import { Observability } from './components/Observability';
import { ConnectionModal } from './components/ConnectionModal';
import { QueryHistoryModal } from './components/QueryHistoryModal';
import { Table, Terminal, Activity } from 'lucide-react';
import './App.css';

export function App() {
  const {
    activeTab,
    setActiveTab,
    selectedTable,
    isTransactionOpen,
    setTransactionOpen,
    setConnectionModalOpen,
    setHistoryModalOpen,
    resetPending,
  } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setConnectionModalOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        setHistoryModalOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        alert("✅ Commit: Changes committed via atomic transaction!");
        resetPending();
        setTransactionOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0f1d] text-slate-100 overflow-hidden font-sans select-none relative">
      
      {/* Native macOS Titlebar */}
      <Titlebar />

      {/* Transaction Alert Banner */}
      {isTransactionOpen && (
        <div className="h-8 bg-amber-500/15 border-b border-amber-500/30 px-4 flex items-center justify-between text-xs select-none">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-bold text-amber-300">Active Transaction Open</span>
            <span className="text-amber-200/80">• TxID: #891024 • 1 uncommitted edit</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                resetPending();
                setTransactionOpen(false);
              }}
              className="px-2 py-0.5 hover:bg-slate-800 text-slate-300 rounded font-medium text-[11px]"
            >
              Rollback (⌘Z)
            </button>
            <button
              onClick={() => {
                alert("Transaction committed!");
                resetPending();
                setTransactionOpen(false);
              }}
              className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px]"
            >
              Commit (⌘S)
            </button>
          </div>
        </div>
      )}

      {/* Workspace Split (Sidebar + Main) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-900/40">
          
          {/* Tab Bar */}
          <div className="h-10 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between px-3 select-none flex-shrink-0">
            <div className="flex items-center space-x-1 h-full pt-1">
              
              {/* Tab: Data Grid */}
              <button
                onClick={() => setActiveTab('grid')}
                className={`h-9 px-4 rounded-t-lg text-xs font-bold flex items-center space-x-2 transition ${
                  activeTab === 'grid'
                    ? 'bg-slate-900 border-t border-x border-slate-800 text-slate-100 shadow-sm'
                    : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="w-3.5 h-3.5 text-sky-400" />
                <span>{selectedTable} [Grid]</span>
              </button>

              {/* Tab: SQL Studio */}
              <button
                onClick={() => setActiveTab('sql')}
                className={`h-9 px-4 rounded-t-lg text-xs font-semibold flex items-center space-x-2 transition ${
                  activeTab === 'sql'
                    ? 'bg-slate-900 border-t border-x border-slate-800 text-slate-100 shadow-sm'
                    : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Query 1 [SQL]</span>
              </button>

              {/* Tab: Health & Activity */}
              <button
                onClick={() => setActiveTab('stats')}
                className={`h-9 px-4 rounded-t-lg text-xs font-semibold flex items-center space-x-2 transition ${
                  activeTab === 'stats'
                    ? 'bg-slate-900 border-t border-x border-slate-800 text-slate-100 shadow-sm'
                    : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instance Health & Activity</span>
              </button>

            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              RAM: <strong className="text-slate-300">46.8 MB</strong> • 120 FPS
            </div>
          </div>

          {/* Tab Views */}
          <div className="flex-1 flex overflow-hidden">
            {activeTab === 'grid' && <TableGrid />}
            {activeTab === 'sql' && <SqlEditor />}
            {activeTab === 'stats' && <Observability />}
          </div>

        </main>
      </div>

      {/* Global Modals */}
      <ConnectionModal />
      <QueryHistoryModal />

    </div>
  );
}

export default App;
