import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { getTableSchema } from '../data/schemas';
import {
  Columns,
  Key,
  Layers,
  FileCode,
  Copy,
  Check,
  Terminal,
  Plus,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const TableSchemaView = () => {
  const { selectedTable, setActiveTab, showToast } = useAppStore();
  const schemaInfo = getTableSchema(selectedTable);

  const [activeSchemaTab, setActiveSchemaTab] = useState<'columns' | 'indexes' | 'foreign_keys' | 'ddl'>('columns');
  const [copied, setCopied] = useState(false);

  const handleCopyDDL = () => {
    navigator.clipboard.writeText(schemaInfo.ddl);
    setCopied(true);
    showToast('📋 DDL script copied to clipboard!');
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleOpenInSqlEditor = () => {
    setActiveTab('sql');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900/60 overflow-hidden relative font-sans">
      
      {/* Top Schema Summary & Sub-Tabs Bar */}
      <div className="h-11 bg-white dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800/80 px-4 flex items-center justify-between text-xs select-none flex-shrink-0">
        
        {/* Sub-Tabs: Columns, Indexes, FK, DDL */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveSchemaTab('columns')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
              activeSchemaTab === 'columns'
                ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Columns ({schemaInfo.columns.length})</span>
          </button>

          <button
            onClick={() => setActiveSchemaTab('indexes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
              activeSchemaTab === 'indexes'
                ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Indexes ({schemaInfo.indexes.length})</span>
          </button>

          <button
            onClick={() => setActiveSchemaTab('foreign_keys')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
              activeSchemaTab === 'foreign_keys'
                ? 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Foreign Keys ({schemaInfo.foreignKeys.length})</span>
          </button>

          <button
            onClick={() => setActiveSchemaTab('ddl')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
              activeSchemaTab === 'ddl'
                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>DDL Script</span>
          </button>
        </div>

        {/* Right Info: Engine, Size, Row Count */}
        <div className="flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span>{schemaInfo.engine}</span>
          <span>•</span>
          <span>Size: <strong className="text-slate-700 dark:text-slate-200">{schemaInfo.totalSize}</strong></span>
          <span>•</span>
          <span><strong className="text-sky-600 dark:text-sky-300">{schemaInfo.rowCount}</strong></span>
        </div>

      </div>

      {/* Content View Based on Sub-Tab */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900/80 text-xs font-mono select-text">

        {/* 1. Columns & Data Types Tab */}
        {activeSchemaTab === 'columns' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between select-none">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider font-sans">
                Columns Definition & Attributes ({schemaInfo.tableName})
              </span>
              <button
                onClick={() => alert("ADD COLUMN modal:\nReady to generate: ALTER TABLE " + selectedTable + " ADD COLUMN ...")}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Add Column</span>
              </button>
            </div>

            <table className="w-full border-collapse border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-left font-semibold">
                <tr>
                  <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-12 text-center text-slate-400 dark:text-slate-600">#</th>
                  <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-52">Column Name</th>
                  <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-44">Data Type</th>
                  <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-28 text-center">Nullable</th>
                  <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-64">Default Value</th>
                  <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-32">Key Constraint</th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Comment / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
                {schemaInfo.columns.map((col, idx) => (
                  <tr key={col.name} className="hover:bg-[#f0f7ff] dark:hover:bg-slate-800/40 transition">
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-center font-bold">
                      {idx + 1}
                    </td>

                    {/* Column Name */}
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                      <span>{col.name}</span>
                      {col.isPrimaryKey && (
                        <span className="px-1.5 py-0.2 bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 rounded text-[9px] font-extrabold">
                          PK
                        </span>
                      )}
                      {col.isForeignKey && (
                        <span className="px-1.5 py-0.2 bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30 rounded text-[9px] font-extrabold flex items-center gap-0.5">
                          <span>FK</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </td>

                    {/* Data Type */}
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-sky-700 dark:text-sky-400 font-semibold">
                      {col.type}
                    </td>

                    {/* Nullable */}
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center">
                      {col.isNullable ? (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[10px]">NULL</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 rounded text-[10px] font-bold">
                          NOT NULL
                        </span>
                      )}
                    </td>

                    {/* Default Value */}
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-300/90 font-mono text-[11px]">
                      {col.defaultValue ? (
                        <span className="bg-slate-100 dark:bg-slate-950/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">{col.defaultValue}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 italic">None</span>
                      )}
                    </td>

                    {/* Key */}
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                      {col.isPrimaryKey && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          <span>Primary Key</span>
                        </span>
                      )}
                      {col.isForeignKey && col.foreignTable && (
                        <span className="text-sky-600 dark:text-sky-400 flex items-center gap-1">
                          <span>→</span>
                          <span>{col.foreignTable}({col.foreignColumn})</span>
                        </span>
                      )}
                      {!col.isPrimaryKey && !col.isForeignKey && (
                        <span className="text-slate-400 dark:text-slate-600">-</span>
                      )}
                    </td>

                    {/* Comment */}
                    <td className="p-2.5 text-slate-500 dark:text-slate-400 font-sans text-xs">
                      {col.comment || <span className="text-slate-400 dark:text-slate-600 italic font-mono">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Indexes Tab */}
        {activeSchemaTab === 'indexes' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between select-none">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider font-sans">
                Table Indexes & Access Methods ({schemaInfo.indexes.length} configured)
              </span>
              <button
                onClick={() => alert("CREATE INDEX modal:\nCREATE INDEX idx_" + selectedTable + "_new ON " + selectedTable + " USING btree (...)")}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Create Index</span>
              </button>
            </div>

            <table className="w-full border-collapse border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-left font-semibold">
                <tr>
                  <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-12 text-center text-slate-400 dark:text-slate-600">#</th>
                  <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-64">Index Name</th>
                  <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-64">Indexed Columns</th>
                  <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-32 text-center">Type / Method</th>
                  <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-28 text-center">Uniqueness</th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Estimated Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
                {schemaInfo.indexes.map((idxItem, i) => (
                  <tr key={idxItem.name} className="hover:bg-[#f0f7ff] dark:hover:bg-slate-800/40 transition">
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-center font-bold">
                      {i + 1}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                      <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span>{idxItem.name}</span>
                    </td>
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-sky-700 dark:text-sky-300 font-mono">
                      ({idxItem.columns.join(', ')})
                    </td>
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center">
                      <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 rounded text-[10px] font-bold">
                        {idxItem.type}
                      </span>
                    </td>
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center">
                      {idxItem.isUnique ? (
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded text-[10px] font-bold">
                          UNIQUE
                        </span>
                      ) : (
                        <span className="text-slate-500 font-sans text-xs">Non-unique</span>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-700 dark:text-slate-300 font-mono">
                      {idxItem.size || 'Auto'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Foreign Keys Tab */}
        {activeSchemaTab === 'foreign_keys' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between select-none">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider font-sans">
                Foreign Key Constraints & Referential Integrity
              </span>
            </div>

            {schemaInfo.foreignKeys.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-sans">
                No foreign key constraints defined on this table.
              </div>
            ) : (
              <table className="w-full border-collapse border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-left font-semibold">
                  <tr>
                    <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-64">Constraint Name</th>
                    <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-44">Local Column</th>
                    <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-64">Referenced Foreign Table & Column</th>
                    <th className="p-2.5 border-r border-b border-slate-200 dark:border-slate-800 w-36">On Update</th>
                    <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">On Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
                  {schemaInfo.foreignKeys.map((fk) => (
                    <tr key={fk.name} className="hover:bg-[#f0f7ff] dark:hover:bg-slate-800/40 transition">
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        <span>{fk.name}</span>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-sky-700 dark:text-sky-400 font-semibold">
                        {fk.column}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 font-semibold">
                        {fk.foreignTable}.{fk.foreignColumn}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-300 font-mono">
                        {fk.onUpdate}
                      </td>
                      <td className="p-2.5 text-rose-700 dark:text-rose-300 font-mono">
                        {fk.onDelete}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 4. DDL Script (Create Syntax) Tab */}
        {activeSchemaTab === 'ddl' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider font-sans">
                  Raw DDL (Create Table Syntax)
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded font-mono">
                  PostgreSQL 16
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyDDL}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied DDL' : 'Copy DDL'}</span>
                </button>

                <button
                  onClick={handleOpenInSqlEditor}
                  className="px-3 py-1.5 bg-sky-50 dark:bg-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/30 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Open in SQL Editor</span>
                </button>
              </div>
            </div>

            {/* Syntax Box */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto shadow-inner">
              <pre className="text-slate-800 dark:text-slate-100 leading-relaxed font-mono whitespace-pre-wrap select-text">
                {schemaInfo.ddl}
              </pre>
            </div>
          </div>
        )}

      </div>

      {/* Schema View Footer */}
      <div className="h-7 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 select-none flex-shrink-0">
        <div className="flex items-center space-x-3">
          <span>Schema: <strong className="text-slate-700 dark:text-slate-200">{schemaInfo.schema}</strong></span>
          <span>•</span>
          <span>Table: <strong className="text-slate-700 dark:text-slate-200">{schemaInfo.tableName}</strong></span>
          <span>•</span>
          <span>{schemaInfo.columns.length} columns</span>
          <span>•</span>
          <span>{schemaInfo.indexes.length} indexes</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-500 font-mono text-[10px]">
          <span>Schema Cache: Fresh (0.4ms)</span>
        </div>
      </div>

    </div>
  );
};
