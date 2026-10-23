import React, { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { RefreshCw } from 'lucide-react';

export const DisconnectedModal: React.FC = () => {
  const {
    reconnectModalOpen,
    setReconnectModalOpen,
    isReconnecting,
    reconnectActiveConnection,
    activeConnection,
  } = useAppStore();

  useEffect(() => {
    if (!reconnectModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘⇧R or Ctrl+Shift+R
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        reconnectActiveConnection();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        reconnectActiveConnection();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setReconnectModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reconnectModalOpen, reconnectActiveConnection, setReconnectModalOpen]);

  if (!reconnectModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="disconnected-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={() => setReconnectModalOpen(false)}
    >
      <div
        className="w-full max-w-[420px] bg-[#1c1c1e] text-white rounded-2xl p-6 shadow-2xl border border-white/10 flex flex-col items-center text-center animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2 className="text-sm font-semibold text-white mb-2">Error</h2>

        {/* Message */}
        <p className="font-mono text-xs text-neutral-300 leading-relaxed max-w-[340px] mb-5">
          Database is disconnected! Press Command + Shift + R to reconnect!
        </p>

        {activeConnection?.lastError && (
          <div className="w-full max-w-[360px] bg-red-950/40 border border-red-500/20 text-red-300 text-[10px] font-mono p-2.5 rounded-lg mb-4 text-left overflow-hidden text-ellipsis line-clamp-3">
            {activeConnection.lastError}
          </div>
        )}

        {/* Buttons matching TablePlus exact layout */}
        <div className="w-full max-w-[280px] space-y-2">
          {/* Reconnect Workspace (Primary Blue Pill) */}
          <button
            type="button"
            disabled={isReconnecting}
            onClick={() => reconnectActiveConnection()}
            className="w-full h-8 bg-[#007aff] hover:bg-[#0069d9] active:bg-[#0058b8] disabled:opacity-60 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
          >
            {isReconnecting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{isReconnecting ? 'Reconnecting Workspace...' : 'Reconnect Workspace'}</span>
          </button>

          {/* OK (Secondary Grey Pill) */}
          <button
            type="button"
            onClick={() => setReconnectModalOpen(false)}
            className="w-full h-8 bg-[#2c2c2e] hover:bg-[#3a3a3c] active:bg-[#252527] text-neutral-200 font-medium text-xs rounded-lg transition-colors flex items-center justify-center cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
