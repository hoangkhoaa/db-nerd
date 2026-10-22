import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import {
  X,
  Sun,
  Moon,
  Laptop,
  Check,
  RotateCcw,
  Sliders,
  Keyboard,
  Database,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { RowDensity } from '../types';

export const SettingsModal: React.FC = () => {
  const {
    settings,
    updateSettings,
    setThemeMode,
    isSettingsModalOpen,
    setSettingsModalOpen,
    showToast,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'appearance' | 'query' | 'shortcuts'>('appearance');

  if (!isSettingsModalOpen) return null;

  const handleResetDefaults = () => {
    if (confirm('Reset all preferences to default values?')) {
      updateSettings({
        themeMode: 'auto',
        editorFontSize: 13,
        rowDensity: 'normal',
        autoFormatSql: false,
        confirmDestructive: true,
        defaultQueryLimit: 100,
      });
      showToast('Settings reset to defaults');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-150"
      onClick={() => setSettingsModalOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Titlebar */}
        <div className="h-12 bg-slate-950 border-b border-slate-800 px-5 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-sky-500/15 text-sky-400 rounded-lg">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-100">Preferences & Settings</h2>
              <p className="text-[10px] text-slate-400">Customize theme, appearance, editor, and system behaviors</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950/60 border-b border-slate-800/80 px-5 flex items-center space-x-2 pt-2">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center space-x-1.5 cursor-pointer border-b-2 ${
              activeTab === 'appearance'
                ? 'border-sky-500 text-sky-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Appearance & Theme</span>
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center space-x-1.5 cursor-pointer border-b-2 ${
              activeTab === 'query'
                ? 'border-sky-500 text-sky-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Editor & Queries</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center space-x-1.5 cursor-pointer border-b-2 ${
              activeTab === 'shortcuts'
                ? 'border-sky-500 text-sky-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts Cheatsheet</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto max-h-[440px] space-y-6 text-xs">
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Mode Option */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-200">Color Theme</h3>
                    <p className="text-[11px] text-slate-400">Select Light, Dark, or sync with your macOS device settings.</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px] uppercase">
                    Active: {settings.themeMode}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Light Theme Card */}
                  <button
                    type="button"
                    onClick={() => setThemeMode('light')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                      settings.themeMode === 'light'
                        ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/20 text-white'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-850 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-400/15 text-amber-400 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xs text-slate-200">Light Mode</span>
                    <span className="text-[10px] text-slate-400 text-center">Clean macOS light gray aesthetic</span>
                    {settings.themeMode === 'light' && (
                      <span className="w-4 h-4 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>

                  {/* Dark Theme Card */}
                  <button
                    type="button"
                    onClick={() => setThemeMode('dark')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                      settings.themeMode === 'dark'
                        ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/20 text-white'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-850 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-400/15 text-indigo-400 flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xs text-slate-200">Dark Mode</span>
                    <span className="text-[10px] text-slate-400 text-center">Deep OLED black & TablePlus slate</span>
                    {settings.themeMode === 'dark' && (
                      <span className="w-4 h-4 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>

                  {/* Auto Theme Card */}
                  <button
                    type="button"
                    onClick={() => setThemeMode('auto')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                      settings.themeMode === 'auto'
                        ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/20 text-white'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-850 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-400/15 text-emerald-400 flex items-center justify-center">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xs text-slate-200">Auto (System)</span>
                    <span className="text-[10px] text-slate-400 text-center">Syncs automatically with device OS</span>
                    {settings.themeMode === 'auto' && (
                      <span className="w-4 h-4 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Row Density */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div>
                  <h3 className="font-bold text-slate-200">Data Grid Row Density</h3>
                  <p className="text-[11px] text-slate-400">Controls row height and visual density for data tables.</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'compact', label: 'Compact (28px)', desc: 'Max rows visible' },
                    { id: 'normal', label: 'Normal (34px)', desc: 'TablePlus standard' },
                    { id: 'relaxed', label: 'Relaxed (40px)', desc: 'Touch & comfortable' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => updateSettings({ rowDensity: d.id as RowDensity })}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        settings.rowDensity === d.id
                          ? 'border-sky-500/80 bg-sky-500/10 text-sky-200 font-semibold'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{d.label}</span>
                        {settings.rowDensity === d.id && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor Font Size */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-200">SQL Code Editor Font Size</h3>
                    <p className="text-[11px] text-slate-400">Adjust code font size in the SQL query editor.</p>
                  </div>
                  <span className="font-mono text-sky-400 font-bold">{settings.editorFontSize}px</span>
                </div>
                <div className="flex items-center space-x-2">
                  {[11, 12, 13, 14, 15, 16, 18].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => updateSettings({ editorFontSize: size })}
                      className={`px-3 py-1 rounded-lg border text-xs font-mono transition cursor-pointer ${
                        settings.editorFontSize === size
                          ? 'border-sky-500 bg-sky-500/20 text-white font-bold'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'query' && (
            <div className="space-y-5">
              {/* Default Query Limit */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div>
                  <h4 className="font-bold text-slate-200">Default Query Row Limit</h4>
                  <p className="text-[11px] text-slate-400">Automatic safety LIMIT clause appended to raw SELECT queries.</p>
                </div>
                <div className="flex items-center space-x-1.5 font-mono">
                  {[50, 100, 500, 1000].map((limit) => (
                    <button
                      key={limit}
                      type="button"
                      onClick={() => updateSettings({ defaultQueryLimit: limit })}
                      className={`px-2.5 py-1 rounded-lg border text-xs transition cursor-pointer ${
                        settings.defaultQueryLimit === limit
                          ? 'border-sky-500 bg-sky-500/20 text-white font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {limit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Format SQL on Run */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-200">Auto-Format SQL on Execute</h4>
                    <p className="text-[11px] text-slate-400">Automatically beautify query syntax (UPPERCASE keywords, 2-space indentation) when running.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoFormatSql}
                  onChange={(e) => updateSettings({ autoFormatSql: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Confirm on Destructive Actions */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="flex items-start space-x-3">
                  <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-200">Confirm on Destructive Operations</h4>
                    <p className="text-[11px] text-slate-400">Require explicit confirmation before executing DROP TABLE, TRUNCATE, or DELETE without WHERE.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.confirmDestructive}
                  onChange={(e) => updateSettings({ confirmDestructive: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-300">Keyboard Shortcuts Reference</span>
                <span className="text-[10px] text-slate-500">macOS Standard Bindings</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {[
                  { key: '⌘ ↵', desc: 'Run Query / Selection' },
                  { key: '⇧ ⌥ F', desc: 'Format / Beautify SQL' },
                  { key: '⌘ R', desc: 'Reload Active Table / Query' },
                  { key: '⌘ T / ⌘ E', desc: 'New SQL Query Tab' },
                  { key: '⌘ W', desc: 'Close Active Tab' },
                  { key: '⌘ K', desc: 'Connection Manager' },
                  { key: '⌘ O', desc: 'Database Switcher' },
                  { key: '⌘ B', desc: 'Toggle Left Sidebar' },
                  { key: '⌘ I', desc: 'Toggle Right Inspector' },
                  { key: '⌘ ,', desc: 'Open Settings / Preferences' },
                  { key: '⌘ S', desc: 'Commit Transaction' },
                  { key: '⌘ Z', desc: 'Rollback Transaction' },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-950/60 border border-slate-800/70 rounded-lg flex items-center justify-between"
                  >
                    <span className="text-slate-300">{s.desc}</span>
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-200 rounded font-mono font-bold text-[10px]">
                      {s.key}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 bg-slate-950 border-t border-slate-800 px-5 flex items-center justify-between select-none">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center space-x-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsModalOpen(false)}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
