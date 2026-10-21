import { useState } from 'react';
import { Play } from 'lucide-react';

export const SqlEditor = () => {
  const [sqlCode, setSqlCode] = useState(
`SELECT u.id, u.email, COUNT(o.id) AS total_orders, SUM(o.total_amount) AS total_spend
FROM users u
LEFT JOIN user_orders o ON o.user_id = u.id
WHERE u.status = 'active'
GROUP BY u.id, u.email
ORDER BY total_spend DESC LIMIT 50;`
  );

  const [isExecuting, setIsExecuting] = useState(false);
  const [results] = useState<any[]>([
    { id: 501, email: 'alex.turner@corp.io', total_orders: 14, total_spend: 2030.0 },
    { id: 502, email: 'sarah.connor@cyberdyne.net', total_orders: 29, total_spend: 4210.5 },
    { id: 503, email: 'khoa.nguyen@ai.lab', total_orders: 102, total_spend: 12450.0 },
  ]);

  const handleRun = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
    }, 300);
  };

  const handleFormat = () => {
    // Auto-capitalize keywords
    const keywords = ['select', 'from', 'where', 'left join', 'join', 'group by', 'order by', 'limit', 'as', 'count', 'sum'];
    let formatted = sqlCode;
    keywords.forEach(kw => {
      const reg = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(reg, kw.toUpperCase());
    });
    setSqlCode(formatted);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900/60 overflow-hidden">
      
      {/* Editor Toolbar */}
      <div className="h-10 bg-slate-950/60 border-b border-slate-800/80 px-4 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRun}
            disabled={isExecuting}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Running...' : 'Run'}</span>
            <kbd className="px-1 py-0.2 bg-slate-950/20 rounded text-[9px] font-mono text-slate-950 font-extrabold">⌘↵</kbd>
          </button>

          <button
            onClick={handleFormat}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition text-[11px]"
          >
            Format SQL (Auto-Capitalize)
          </button>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
          <span className="text-emerald-400 font-semibold">● Schema Indexed (0.8ms)</span>
          <span>•</span>
          <span>PostgreSQL Dialect</span>
        </div>
      </div>

      {/* Editor Box */}
      <div className="h-56 bg-slate-950 p-4 font-mono text-xs border-b border-slate-800 overflow-y-auto">
        <textarea
          value={sqlCode}
          onChange={(e) => setSqlCode(e.target.value)}
          className="w-full h-full bg-transparent text-slate-100 font-mono text-xs focus:outline-none resize-none leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* Results Header */}
      <div className="h-8 bg-slate-950/60 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 select-none">
        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
          <span>✓</span>
          <span>Query executed successfully in 1.4ms</span>
        </span>
        <span className="font-mono text-[11px]">{results.length} rows returned</span>
      </div>

      {/* Results Table */}
      <div className="flex-1 overflow-auto bg-slate-900/80 text-xs font-mono select-text">
        <table className="w-full border-collapse">
          <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 text-left sticky top-0">
            <tr>
              <th className="p-2 border-r border-slate-800">id</th>
              <th className="p-2 border-r border-slate-800">email</th>
              <th className="p-2 border-r border-slate-800">total_orders</th>
              <th className="p-2">total_spend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {results.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/40">
                <td className="p-2 border-r border-slate-800 text-sky-400 font-semibold">{r.id}</td>
                <td className="p-2 border-r border-slate-800 text-slate-200">{r.email}</td>
                <td className="p-2 border-r border-slate-800 text-slate-300">{r.total_orders}</td>
                <td className="p-2 text-emerald-400 font-semibold">${r.total_spend.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
