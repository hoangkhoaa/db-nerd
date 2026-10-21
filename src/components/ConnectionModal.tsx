import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { DatabaseEngine } from '../types';
import { X, Plus, FolderPlus } from 'lucide-react';

export const ConnectionModal = () => {
  const { isConnectionModalOpen, setConnectionModalOpen } = useAppStore();
  const [selectedEngine, setSelectedEngine] = useState<DatabaseEngine>('postgres');
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  if (!isConnectionModalOpen) return null;

  const handleTest = () => {
    setIsTesting(true);
    setTestSuccess(false);
    setTimeout(() => {
      setIsTesting(false);
      setTestSuccess(true);
    }, 400);
  };

  const handleSave = () => {
    setConnectionModalOpen(false);
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-100">
      <div className="w-full max-w-4xl h-[620px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10">
        
        {/* Titlebar */}
        <div className="h-11 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-100">Connection Manager</span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded font-mono">
              OSS Edition
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => alert("📥 Auto-Discovery:\nScanned local configurations.\nImported 3 groups and 6 connections successfully!")}
              className="px-2.5 py-1 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold transition"
            >
              Import XML / JSON
            </button>
            <button
              onClick={() => setConnectionModalOpen(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Tree */}
          <div className="w-72 bg-slate-950/70 border-r border-slate-800 p-3 space-y-2 select-none overflow-y-auto">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Groups & Databases</span>
              <div className="flex items-center space-x-1">
                <FolderPlus className="w-3.5 h-3.5 hover:text-slate-200 cursor-pointer" />
                <Plus className="w-3.5 h-3.5 hover:text-slate-200 cursor-pointer" />
              </div>
            </div>

            {/* Production Group */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1 rounded bg-rose-950/20 text-rose-300 font-bold text-xs border border-rose-500/20">
                <span>🔴 Production</span>
                <span className="text-[9px] px-1 bg-rose-500/30 rounded font-mono">PROD</span>
              </div>
              <div className="ml-3 pl-2 border-l border-rose-500/30 space-y-1 text-xs">
                <div 
                  onClick={() => setSelectedEngine('postgres')}
                  className="px-2 py-1.5 rounded-lg bg-sky-500/20 text-sky-200 border border-sky-500/40 cursor-pointer font-medium flex items-center space-x-1.5"
                >
                  <span>🐘</span>
                  <span>prod-postgres-main</span>
                </div>
                <div 
                  onClick={() => setSelectedEngine('snowflake')}
                  className="px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 cursor-pointer flex items-center space-x-1.5"
                >
                  <span>❄️</span>
                  <span>analytics-dwh</span>
                </div>
                <div 
                  onClick={() => setSelectedEngine('redis')}
                  className="px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 cursor-pointer flex items-center space-x-1.5"
                >
                  <span>🟥</span>
                  <span>prod-redis-cache</span>
                </div>
              </div>
            </div>

            {/* Staging */}
            <div className="pt-2 space-y-1">
              <div className="flex items-center justify-between px-2 py-1 rounded bg-amber-950/20 text-amber-300 font-bold text-xs border border-amber-500/20">
                <span>🟡 Staging</span>
                <span className="text-[9px] px-1 bg-amber-500/30 rounded font-mono">QA</span>
              </div>
              <div className="ml-3 pl-2 border-l border-amber-500/30 space-y-1 text-xs">
                <div 
                  onClick={() => setSelectedEngine('mysql')}
                  className="px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 cursor-pointer flex items-center space-x-1.5"
                >
                  <span>🐬</span>
                  <span>staging-mysql-8</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs select-text">
            
            {/* Engine Tabs */}
            <div>
              <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[10px] tracking-wider">Engine</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'postgres', label: 'PostgreSQL', icon: '🐘' },
                  { id: 'mysql', label: 'MySQL', icon: '🐬' },
                  { id: 'redis', label: 'Redis', icon: '🟥' },
                  { id: 'snowflake', label: 'Snowflake', icon: '❄️' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedEngine(item.id as DatabaseEngine)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      selectedEngine === item.id
                        ? 'bg-sky-500/20 text-sky-200 border-sky-500/60 shadow-sm'
                        : 'bg-slate-800/40 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Host & Port */}
            {selectedEngine !== 'snowflake' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Host</label>
                  <input
                    type="text"
                    defaultValue="aurora-cluster.eu-west-1.rds.amazonaws.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Port</label>
                  <input
                    type="text"
                    defaultValue={selectedEngine === 'postgres' ? '5432' : selectedEngine === 'mysql' ? '3306' : '6379'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Snowflake Fields */}
            {selectedEngine === 'snowflake' && (
              <div className="space-y-3 bg-sky-950/20 border border-sky-500/30 p-3 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sky-300 font-semibold mb-1">Account Identifier</label>
                    <input type="text" defaultValue="xy12345.us-east-1" className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-sky-300 font-semibold mb-1">Warehouse</label>
                    <input type="text" defaultValue="COMPUTE_WH" className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200" />
                  </div>
                </div>
              </div>
            )}

            {/* User & Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Username</label>
                <input type="text" defaultValue="app_master" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-200" />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Password</label>
                <input type="password" defaultValue="••••••••••••" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-200" />
              </div>
            </div>

            {/* SSH Bastion */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <label className="flex items-center space-x-2 text-slate-200 cursor-pointer font-semibold">
                <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-sky-500" />
                <span>Connect via SSH Bastion Tunnel (ec2-bastion.corp.io)</span>
              </label>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="h-12 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTest}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition active:scale-95"
            >
              {isTesting ? 'Pinging...' : 'Test Connection'}
            </button>
            {testSuccess && <span className="text-xs text-emerald-400 font-semibold">✓ Connected in 1.8ms (TLSv1.3)</span>}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setConnectionModalOpen(false)}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl transition shadow-md shadow-sky-500/20 active:scale-95"
            >
              Save & Connect
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
