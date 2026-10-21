import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { ExternalLink } from 'lucide-react';

export const TableGrid = () => {
  const { rows, updateRow } = useAppStore();
  const [filterText, setFilterText] = useState("status = 'pending' AND total_amount > 50");

  const handleCellChange = (id: number, field: string, val: any) => {
    updateRow(id, field as any, val);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900/60 overflow-hidden">
      
      {/* Filter / WHERE Bar */}
      <div className="bg-slate-950/40 border-b border-slate-800/80 px-4 py-2 flex items-center space-x-2 text-xs select-none">
        <span className="px-1.5 py-0.5 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded font-mono font-bold text-[10px]">
          WHERE
        </span>
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700/60 rounded px-2.5 py-1 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-sky-500"
        />
        <span className="px-1.5 py-0.5 bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded font-mono font-bold text-[10px]">
          ORDER BY
        </span>
        <span className="font-mono text-slate-300 text-[11px]">id DESC</span>
        <button 
          onClick={() => alert(`Running filter: ${filterText}`)}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition text-xs"
        >
          Run Filter
        </button>
      </div>

      {/* Grid Content Area (TablePlus-Style Fast Canvas View) */}
      <div className="flex-1 overflow-auto bg-slate-900/80 text-xs font-mono select-text">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead className="sticky top-0 bg-slate-950/95 backdrop-blur-md z-20 border-b border-slate-800 text-slate-400 select-none shadow-sm">
            <tr className="text-left font-semibold">
              <th className="w-12 px-3 py-2.5 border-r border-slate-800/80 text-center text-slate-600">#</th>
              <th className="w-24 px-3 py-2.5 border-r border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-bold">id</span>
                  <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-bold">PK</span>
                </div>
              </th>
              <th className="w-44 px-3 py-2.5 border-r border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-bold">user_id</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded font-bold flex items-center gap-0.5">
                    <span>FK</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </div>
              </th>
              <th className="w-36 px-3 py-2.5 border-r border-slate-800/80">
                <span className="text-slate-200 font-bold">product_sku</span>
              </th>
              <th className="w-64 px-3 py-2.5 border-r border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-bold">order_details</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded font-bold font-mono">&#123; &#125; JSON</span>
                </div>
              </th>
              <th className="w-32 px-3 py-2.5 border-r border-slate-800/80">
                <span className="text-slate-200 font-bold">total_amount</span>
              </th>
              <th className="w-44 px-3 py-2.5 border-r border-slate-800/80">
                <span className="text-slate-200 font-bold">created_at</span>
              </th>
              <th className="w-36 px-3 py-2.5">
                <span className="text-slate-200 font-bold">status</span>
              </th>
            </tr>
          </thead>

          {/* Rows */}
          <tbody className="divide-y divide-slate-800/50">
            {rows.map((row, index) => (
              <tr 
                key={row.id}
                className={`group transition ${
                  row.isDirty ? 'bg-amber-950/20 hover:bg-amber-950/30 border-l-2 border-l-amber-400' : 'hover:bg-slate-800/40'
                }`}
              >
                <td className="px-3 py-2 border-r border-slate-800/60 text-slate-600 text-center select-none font-bold">
                  {index + 1}{row.isDirty ? '*' : ''}
                </td>
                <td className="px-3 py-2 border-r border-slate-800/60 text-sky-400 font-semibold">{row.id}</td>
                
                {/* Foreign Key Navigation Pill */}
                <td className="px-3 py-2 border-r border-slate-800/60">
                  <button 
                    onClick={() => alert(`🔗 Jump to table 'users' where id = ${row.user_id}\nTarget: ${row.customer_name}`)}
                    className="px-2 py-0.5 bg-sky-500/10 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 rounded-md font-mono text-[11px] flex items-center space-x-1.5 transition"
                  >
                    <span>🔗</span>
                    <span>{row.user_id}</span>
                    <span className="text-[10px] text-sky-500 font-sans">({row.customer_name})</span>
                  </button>
                </td>

                <td className="px-3 py-2 border-r border-slate-800/60 text-slate-300">{row.product_sku}</td>
                
                {/* JSON preview */}
                <td 
                  onClick={() => alert(`JSON Inspector:\n\n${JSON.stringify(row.order_details, null, 2)}`)}
                  className="px-3 py-2 border-r border-slate-800/60 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <span className="text-purple-400 font-medium">&#123;</span> {JSON.stringify(row.order_details).slice(0, 30)}... <span className="text-purple-400 font-medium">&#125;</span>
                </td>

                <td className="px-3 py-2 border-r border-slate-800/60 text-emerald-400 font-semibold">${row.total_amount.toFixed(2)}</td>
                <td className="px-3 py-2 border-r border-slate-800/60 text-slate-400">{row.created_at}</td>
                
                {/* In-place Editable Status Cell */}
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={row.status}
                    onChange={(e) => handleCellChange(row.id, 'status', e.target.value)}
                    className={`w-full px-2 py-0.5 rounded font-mono text-xs focus:outline-none transition ${
                      row.isDirty 
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-400/80 font-semibold' 
                        : 'bg-transparent text-slate-300 border border-transparent hover:border-slate-700'
                    }`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid Footer */}
      <div className="h-7 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 select-none">
        <div className="flex items-center space-x-3">
          <span>{rows.length} rows fetched (1.2M total)</span>
          <span>•</span>
          <span>Latency: <strong className="text-slate-200 font-mono">1.8ms</strong></span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">120 FPS</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-500">
          <span>Click any cell to edit</span>
          <span>•</span>
          <span>Double-click JSON to inspect</span>
        </div>
      </div>

    </div>
  );
};
