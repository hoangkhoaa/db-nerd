import { useAppStore } from '../stores/useAppStore';
import { Activity } from 'lucide-react';
import { HeartbeatDot } from './HeartbeatDot';
import { BorderChase } from './BorderChase';

export const Observability = () => {
  const { processes, killProcess } = useAppStore();

  const handleKill = (pid: number) => {
    if (confirm(`⚠️ Terminate query process PID ${pid} via pg_cancel_backend()?`)) {
      killProcess(pid);
      alert(`✓ Process PID ${pid} cancelled! Lock released.`);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900/60 overflow-hidden">
      
      {/* Top 4 Metrics Cards */}
      <div className="p-4 grid grid-cols-4 gap-3 bg-slate-950/40 border-b border-slate-800/80 select-none flex-shrink-0">
        
        {/* Card 1: Buffer Cache Hit Ratio */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cache Hit Ratio</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">HEALTHY</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">99.6%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: '99.6%' }}></div>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>RAM Reads: 4.8M</span>
            <span>Disk I/O: 18.2k</span>
          </div>
        </div>

        {/* Card 2: Connection Pool */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Connection Pool</span>
            <span className="text-slate-400 font-mono text-[11px]">18.6%</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">28 <span className="text-xs font-normal text-slate-500">/ 150</span></div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full" style={{ width: '18.6%' }}></div>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>Active: 6</span>
            <span>Idle in Pool: 22</span>
          </div>
        </div>

        {/* Card 3: Database Size */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Database Size</span>
            <span className="text-blue-400 font-mono text-[10px]">SSD</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">14.2 <span className="text-sm font-normal text-slate-400">GB</span></div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
            <div className="bg-sky-500 h-full" style={{ width: '71%' }}></div>
            <div className="bg-purple-500 h-full" style={{ width: '27%' }}></div>
            <div className="bg-amber-500 h-full" style={{ width: '2%' }}></div>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span className="text-sky-400">Data: 10.1G</span>
            <span className="text-purple-400">Index: 3.8G</span>
          </div>
        </div>

        {/* Card 4: TPS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Throughput (TPS)</span>
            <span className="text-slate-400 font-mono text-[11px]">1.8ms ping</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">1,420 <span className="text-xs font-normal text-slate-500">tps</span></div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-400 h-full rounded-full" style={{ width: '62%' }}></div>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>QPS: 4,890 /s</span>
            <span className="text-emerald-400">0% Rollback</span>
          </div>
        </div>

      </div>

      {/* Processlist Header */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs select-none flex-shrink-0">
        <div className="flex items-center space-x-2">
          <HeartbeatDot color="green" size="xs" showWave={true} />
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-200 font-bold">Live Processlist & Running Queries (Kill Query)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative overflow-hidden px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold flex items-center space-x-1.5 shadow-sm">
            <BorderChase color="emerald" dual={true} speed="slow" borderWidth={1.5} glow={true} />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>STREAMING PG_STAT</span>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">{processes.length} threads</span>
        </div>
      </div>

      {/* Processlist Table */}
      <div className="flex-1 overflow-auto text-xs font-mono select-text">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-slate-950/95 border-b border-slate-800 text-slate-400 text-left select-none">
            <tr>
              <th className="p-2.5 pl-4 border-r border-slate-800/80 w-24">PID</th>
              <th className="p-2.5 border-r border-slate-800/80 w-28">User</th>
              <th className="p-2.5 border-r border-slate-800/80 w-32">Client IP</th>
              <th className="p-2.5 border-r border-slate-800/80 w-24">Duration</th>
              <th className="p-2.5 border-r border-slate-800/80 w-36">State</th>
              <th className="p-2.5 border-r border-slate-800/80 flex-1">Query SQL</th>
              <th className="p-2.5 pr-4 text-right w-28">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {processes.map((proc) => (
              <tr 
                key={proc.pid}
                className={`transition ${proc.isLongRunning ? 'bg-rose-950/20 hover:bg-rose-950/30 border-l-2 border-l-rose-500' : 'hover:bg-slate-800/40'}`}
              >
                <td className="p-2.5 pl-4 border-r border-slate-800/60 font-bold text-sky-400">{proc.pid}</td>
                <td className="p-2.5 border-r border-slate-800/60 text-slate-200">{proc.user}</td>
                <td className="p-2.5 border-r border-slate-800/60 text-slate-400">{proc.clientIp}</td>
                <td className={`p-2.5 border-r border-slate-800/60 font-bold ${proc.isLongRunning ? 'text-rose-400' : 'text-slate-300'}`}>
                  {proc.duration}
                </td>
                <td className="p-2.5 border-r border-slate-800/60">
                  <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    proc.state === 'locked' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    <HeartbeatDot color={proc.state === 'locked' ? 'red' : 'green'} size="xs" showWave={proc.state === 'locked'} />
                    <span>{proc.state}</span>
                  </span>
                </td>
                <td className="p-2.5 border-r border-slate-800/60 text-slate-300 truncate max-w-md">{proc.query}</td>
                <td className="p-2.5 pr-4 text-right select-none">
                  <button
                    onClick={() => handleKill(proc.pid)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg shadow-sm transition active:scale-95"
                  >
                    Kill Query
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
