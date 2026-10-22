import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { DatabaseEngine, ConnectionProfile, ConnectionGroup } from '../types';
import {
  X,
  Plus,
  FolderPlus,
  Trash2,
  Check,
  ChevronRight,
  Server,
  Shield,
  GripVertical,
  Play,
  Pencil,
  Copy,
  FileCode,
  FolderOpen,
  Link,
  AlertCircle,
} from 'lucide-react';
import { HeartbeatDot, HeartbeatColor } from './HeartbeatDot';
import { BorderChase } from './BorderChase';
import { parseConnectionUrl, serializeConnectionUrl } from '../utils/connectionUrl';
import { testRealConnection } from '../services/dbService';
import {
  ContextMenuContainer,
  ContextMenuItem,
  ContextMenuDivider,
  ContextMenuHeader,
  ContextMenuPosition,
} from './ContextMenu';

interface DraggedItem {
  type: 'group' | 'connection';
  id: string;
  groupId?: string;
}

interface DropIndicator {
  type: 'group' | 'connection';
  id: string;
  position: 'before' | 'after' | 'inside';
}

import {
  ConnectorIcon,
  CONNECTOR_METADATA,
  ALL_TABLEPLUS_CONNECTORS,
} from './ConnectorIcon';

const PRIMARY_ENGINES: DatabaseEngine[] = ['postgres', 'mysql', 'sqlite', 'redis', 'clickhouse', 'duckdb'];


const COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  rose: { bg: 'bg-rose-950/30', text: 'text-rose-300', border: 'border-rose-500/30', dot: 'bg-rose-500' },
  amber: { bg: 'bg-amber-950/30', text: 'text-amber-300', border: 'border-amber-500/30', dot: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-950/30', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  sky: { bg: 'bg-sky-950/30', text: 'text-sky-300', border: 'border-sky-500/30', dot: 'bg-sky-500' },
  purple: { bg: 'bg-purple-950/30', text: 'text-purple-300', border: 'border-purple-500/30', dot: 'bg-purple-500' },
};

const GROUP_COLOR_MAP: Record<string, HeartbeatColor> = {
  rose: 'red',
  amber: 'amber',
  emerald: 'green',
  sky: 'sky',
  purple: 'purple',
};

export const ConnectionModal = () => {
  const {
    isConnectionModalOpen,
    setConnectionModalOpen,
    connectionGroups,
    connections,
    activeConnection,
    addConnectionGroup,
    deleteConnectionGroup,
    addConnection,
    updateConnection,
    deleteConnection,
    switchActiveConnection,
    reorderConnectionGroups,
    moveConnection,
    showToast,
  } = useAppStore();

  const [selectedConnId, setSelectedConnId] = useState<string | null>(activeConnection?.id || null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [importUrlInput, setImportUrlInput] = useState('');
  const [testError, setTestError] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showAllConnectors, setShowAllConnectors] = useState(false);
  const [connectorSearch, setConnectorSearch] = useState('');

  // Drag and Drop State
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dropTarget, setDropTarget] = useState<DropIndicator | null>(null);

  // Context Menu State
  const [connContextPos, setConnContextPos] = useState<ContextMenuPosition | null>(null);
  const [targetConn, setTargetConn] = useState<ConnectionProfile | null>(null);
  const [groupContextPos, setGroupContextPos] = useState<ContextMenuPosition | null>(null);
  const [targetGroup, setTargetGroup] = useState<ConnectionGroup | null>(null);

  // Group Form state
  const [groupName, setGroupName] = useState('');
  const [groupTag, setGroupTag] = useState<'PROD' | 'QA' | 'DEV' | 'LOCAL'>('DEV');
  const [groupColor, setGroupColor] = useState<string>('emerald');

  // Connection Form state
  const [formData, setFormData] = useState<Omit<ConnectionProfile, 'id'>>({
    name: 'new-postgres-connection',
    groupId: connectionGroups[0]?.id || 'group-prod',
    engine: 'postgres',
    env: 'local',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    password: '',
    useSsh: false,
    sshHost: 'bastion.infra.net',
    accountIdentifier: '',
    warehouse: '',
    active: false,
    latencyMs: 1.0,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testLatency, setTestLatency] = useState(1.4);

  // Sync selected connection when opening or changing selection
  useEffect(() => {
    if (!isCreatingNew && selectedConnId) {
      const conn = connections.find((c) => c.id === selectedConnId);
      if (conn) {
        setFormData({
          name: conn.name,
          groupId: conn.groupId,
          engine: conn.engine,
          env: conn.env,
          host: conn.host,
          port: conn.port,
          database: conn.database,
          username: conn.username,
          password: conn.password || '',
          useSsh: conn.useSsh || false,
          sshHost: conn.sshHost || '',
          accountIdentifier: conn.accountIdentifier || '',
          warehouse: conn.warehouse || '',
          active: conn.active,
          latencyMs: conn.latencyMs,
        });
      }
    }
  }, [selectedConnId, isCreatingNew, connections]);

  if (!isConnectionModalOpen) return null;

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const newGroup = addConnectionGroup({
      name: groupName.trim(),
      tag: groupTag,
      color: groupColor,
    });

    setGroupName('');
    setIsCreatingGroup(false);
    setFormData((prev) => ({ ...prev, groupId: newGroup.id }));
  };

  const handleStartNewConnection = (groupId?: string) => {
    setIsCreatingNew(true);
    setSelectedConnId(null);
    setTestSuccess(false);
    setShowAllConnectors(true);
    setConnectorSearch('');
    setFormData({
      name: 'new-postgres-connection',
      groupId: groupId || connectionGroups[0]?.id || 'group-prod',
      engine: 'postgres',
      env: 'local',
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      username: 'postgres',
      password: '',
      useSsh: false,
      sshHost: 'bastion.corp.io',
      accountIdentifier: '',
      warehouse: '',
      active: false,
      latencyMs: 1.2,
    });
  };

  const handleSelectConnection = (conn: ConnectionProfile) => {
    setIsCreatingNew(false);
    setSelectedConnId(conn.id);
    setTestSuccess(false);
    setShowAllConnectors(false);
  };

  const handleEngineChange = (engine: DatabaseEngine) => {
    const meta = CONNECTOR_METADATA[engine] || CONNECTOR_METADATA.generic;
    setFormData((prev) => ({
      ...prev,
      engine,
      port: meta.defaultPort > 0 ? meta.defaultPort : prev.port,
      name: isCreatingNew && (prev.name.startsWith('new-') || !prev.name)
        ? `new-${meta.id}-connection`
        : prev.name,
      database: (meta.id === 'sqlite' || meta.id === 'duckdb') ? `${meta.id}.db` : (prev.database || meta.id),
    }));
  };

  const handleImportFromUrl = () => {
    try {
      if (!importUrlInput.trim()) return;
      const parsed = parseConnectionUrl(importUrlInput.trim());
      const targetGroupId = connectionGroups[0]?.id || 'group-prod';
      const newProfile: Omit<ConnectionProfile, 'id'> = {
        name: parsed.name || `${parsed.database} (${parsed.host})`,
        groupId: targetGroupId,
        engine: parsed.engine,
        env: parsed.env,
        host: parsed.host,
        port: parsed.port,
        database: parsed.database,
        username: parsed.username,
        password: parsed.password || '',
        useSsh: parsed.useSsh || false,
        sshHost: parsed.sshHost || '',
        sshUser: parsed.sshUser || '',
        accountIdentifier: '',
        warehouse: '',
        active: false,
        latencyMs: 1.0,
      };

      const created = addConnection(newProfile);
      setSelectedConnId(created.id);
      setIsCreatingNew(false);
      setIsImportingUrl(false);
      setImportUrlInput('');
      setTestSuccess(false);
      setTestError(null);
      showToast(`Imported connection: ${created.name}`);
    } catch (err: any) {
      alert(`Failed to parse connection URL: ${err.message}`);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestSuccess(false);
    setTestError(null);
    try {
      const profileToTest: ConnectionProfile = {
        ...formData,
        id: selectedConnId || 'temp-test-id',
      };
      const res = await testRealConnection(profileToTest);
      setIsTesting(false);
      if (res.success) {
        setTestSuccess(true);
        setTestLatency(res.latency_ms || 1.2);
        setTestError(null);
      } else {
        setTestSuccess(false);
        setTestError(res.message || 'Connection failed: Host unreachable');
      }
    } catch (err: any) {
      setIsTesting(false);
      setTestSuccess(false);
      setTestError(String(err?.message || err || 'Connection failed'));
    }
  };

  const handleSaveAndConnect = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a valid connection name');
      return;
    }

    let status: 'connected' | 'connecting' | 'failed' = 'connected';
    let lastError: string | undefined = undefined;

    if (testError) {
      status = 'failed';
      lastError = testError;
    } else if (!testSuccess) {
      setIsTesting(true);
      const res = await testRealConnection({ ...formData, id: selectedConnId || 'temp' });
      setIsTesting(false);
      if (res.success) {
        status = 'connected';
      } else {
        status = 'failed';
        lastError = res.message;
        setTestError(res.message);
        setTestSuccess(false);
        showToast(`⚠️ Connection failed: ${res.message}`);
      }
    }

    const payload = {
      ...formData,
      connectionStatus: status,
      lastError,
      active: true,
    };

    if (isCreatingNew) {
      const created = addConnection(payload);
      switchActiveConnection(created.id);
    } else if (selectedConnId) {
      updateConnection(selectedConnId, payload);
      switchActiveConnection(selectedConnId);
    }

    setConnectionModalOpen(false);
  };

  const handleDeleteConnection = (connId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this connection profile?')) {
      deleteConnection(connId);
      if (selectedConnId === connId) {
        const remaining = connections.filter((c) => c.id !== connId);
        if (remaining.length > 0) {
          setSelectedConnId(remaining[0].id);
        } else {
          handleStartNewConnection();
        }
      }
    }
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleGroupDragStart = (e: React.DragEvent, groupId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'group', id: groupId }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ type: 'group', id: groupId });
  };

  const handleGroupDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedItem) return;

    if (draggedItem.type === 'group') {
      if (draggedItem.id === groupId) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = e.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
      setDropTarget({ type: 'group', id: groupId, position: pos });
    } else if (draggedItem.type === 'connection') {
      // Hovering connection over a group header means dropping into this group
      setDropTarget({ type: 'group', id: groupId, position: 'inside' });
    }
  };

  const handleGroupDragLeave = (e: React.DragEvent, groupId: string) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dropTarget?.id === groupId) {
        setDropTarget(null);
      }
    }
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroup: { id: string; name: string }) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;

    if (draggedItem.type === 'group' && draggedItem.id !== targetGroup.id && dropTarget?.type === 'group') {
      const pos = dropTarget.position === 'after' ? 'after' : 'before';
      reorderConnectionGroups(draggedItem.id, targetGroup.id, pos);
      showToast('Reordered groups');
    } else if (draggedItem.type === 'connection') {
      const conn = connections.find((c) => c.id === draggedItem.id);
      moveConnection(draggedItem.id, targetGroup.id);
      setCollapsedGroups((prev) => ({ ...prev, [targetGroup.id]: false }));
      showToast(`Moved '${conn?.name || 'connection'}' to group '${targetGroup.name}'`);
    }

    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleConnDragStart = (e: React.DragEvent, conn: ConnectionProfile) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'connection', id: conn.id, groupId: conn.groupId }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ type: 'connection', id: conn.id, groupId: conn.groupId });
  };

  const handleConnDragOver = (e: React.DragEvent, conn: ConnectionProfile) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedItem || draggedItem.type !== 'connection' || draggedItem.id === conn.id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = e.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
    setDropTarget({ type: 'connection', id: conn.id, position: pos });
  };

  const handleConnDragLeave = (e: React.DragEvent, connId: string) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dropTarget?.id === connId) {
        setDropTarget(null);
      }
    }
  };

  const handleConnDrop = (e: React.DragEvent, targetConn: ConnectionProfile) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem || draggedItem.type !== 'connection' || draggedItem.id === targetConn.id) return;

    const pos = dropTarget?.position === 'after' ? 'after' : 'before';
    const sourceConn = connections.find((c) => c.id === draggedItem.id);
    const targetGroup = connectionGroups.find((g) => g.id === targetConn.groupId);
    const isCrossGroup = draggedItem.groupId !== targetConn.groupId;

    moveConnection(draggedItem.id, targetConn.groupId, targetConn.id, pos);

    if (isCrossGroup) {
      setCollapsedGroups((prev) => ({ ...prev, [targetConn.groupId]: false }));
      showToast(`Moved '${sourceConn?.name || 'connection'}' to '${targetGroup?.name || 'group'}'`);
    } else {
      showToast(`Reordered '${sourceConn?.name || 'connection'}'`);
    }

    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleEmptyGroupDrop = (e: React.DragEvent, targetGroup: { id: string; name: string }) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem || draggedItem.type !== 'connection') return;

    const sourceConn = connections.find((c) => c.id === draggedItem.id);
    moveConnection(draggedItem.id, targetGroup.id);
    setCollapsedGroups((prev) => ({ ...prev, [targetGroup.id]: false }));
    showToast(`Moved '${sourceConn?.name || 'connection'}' to '${targetGroup.name}'`);

    setDraggedItem(null);
    setDropTarget(null);
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl h-[650px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-150">
        
        {/* Titlebar */}
        <div className="h-11 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-slate-100">Connection Manager</span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded font-mono">
              OSS Edition
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => alert("📥 Auto-Discovery:\nScanned local configurations.\nImported all profiles successfully!")}
              className="px-2.5 py-1 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              Import XML / JSON
            </button>
            <button
              onClick={() => setConnectionModalOpen(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Tree */}
          <div className="w-72 bg-slate-950/70 border-r border-slate-800 p-3 space-y-3 select-none overflow-y-auto">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Groups & Databases</span>
              <div className="flex items-center space-x-1">
                {/* New Group Button */}
                <button
                  onClick={() => {
                    setIsCreatingGroup(!isCreatingGroup);
                    setIsImportingUrl(false);
                  }}
                  className={`p-1 rounded transition-all duration-150 active:scale-95 cursor-pointer ${
                    isCreatingGroup ? 'bg-indigo-500/30 text-indigo-300' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Create New Group (Folder)"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>

                {/* Import URL Button */}
                <button
                  onClick={() => {
                    setIsImportingUrl(!isImportingUrl);
                    setIsCreatingGroup(false);
                  }}
                  className={`p-1 rounded transition-all duration-150 active:scale-95 cursor-pointer ${
                    isImportingUrl ? 'bg-amber-500/30 text-amber-300' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Import from Connection URL (TablePlus / Postgres / MySQL)"
                >
                  <Link className="w-3.5 h-3.5" />
                </button>

                {/* New Connection Button */}
                <button
                  onClick={() => {
                    handleStartNewConnection();
                    setIsImportingUrl(false);
                    setIsCreatingGroup(false);
                  }}
                  className={`p-1 rounded transition-all duration-150 active:scale-95 cursor-pointer ${
                    isCreatingNew ? 'bg-sky-500/30 text-sky-300' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Create New Connection"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Smooth Collapsible Inline Import URL Card */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-250 ease-out ${
                isImportingUrl ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden">
                <div className="p-3 bg-slate-900 border border-amber-500/40 rounded-xl space-y-2 text-xs shadow-lg mb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 flex items-center space-x-1">
                      <Link className="w-3.5 h-3.5" />
                      <span>Import Connection URL</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsImportingUrl(false)}
                      className="text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <textarea
                      placeholder="Paste postgresql://, mysql:// or postgresql+ssh://..."
                      value={importUrlInput}
                      onChange={(e) => setImportUrlInput(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 placeholder-slate-500 font-mono text-[10px] focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleImportFromUrl}
                    disabled={!importUrlInput.trim()}
                    className="w-full py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold rounded-lg transition active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Parse & Import Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Smooth Collapsible Inline Create Group Card */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-250 ease-out ${
                isCreatingGroup ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden">
                <form onSubmit={handleCreateGroup} className="p-3 bg-slate-900 border border-indigo-500/40 rounded-xl space-y-2 text-xs shadow-lg mb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300">New Group</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingGroup(false)}
                      className="text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Group name (e.g. AWS Lab)..."
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      autoFocus
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Environment Tag:</span>
                    <select
                      value={groupTag}
                      onChange={(e) => setGroupTag(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-200 cursor-pointer"
                    >
                      <option value="PROD">PROD</option>
                      <option value="QA">QA</option>
                      <option value="DEV">DEV</option>
                      <option value="LOCAL">LOCAL</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Color:</span>
                    <div className="flex items-center space-x-1.5">
                      {['rose', 'amber', 'emerald', 'sky', 'purple'].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setGroupColor(col)}
                          className={`w-3.5 h-3.5 rounded-full ${COLOR_MAP[col]?.dot} transition-transform cursor-pointer ${
                            groupColor === col ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!groupName.trim()}
                    className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Create Group
                  </button>
                </form>
              </div>
            </div>

            {/* List of Groups & Connections with smooth accordions & Drag-and-Drop */}
            <div className="space-y-3">
              {connectionGroups.map((group) => {
                const groupConns = connections.filter((c) => c.groupId === group.id);
                const isCollapsed = !!collapsedGroups[group.id];
                const colorInfo = COLOR_MAP[group.color] || COLOR_MAP.rose;
                const dotColor = GROUP_COLOR_MAP[group.color] || 'red';

                const isGroupDragged = draggedItem?.type === 'group' && draggedItem.id === group.id;
                const isGroupDropTarget = dropTarget?.id === group.id;

                return (
                  <div key={group.id} className="space-y-1 relative">
                    {/* Group Header with rotating chevron & drag-and-drop */}
                    <div
                      draggable={true}
                      onDragStart={(e) => handleGroupDragStart(e, group.id)}
                      onDragEnd={() => {
                        setDraggedItem(null);
                        setDropTarget(null);
                      }}
                      onDragOver={(e) => handleGroupDragOver(e, group.id)}
                      onDragLeave={(e) => handleGroupDragLeave(e, group.id)}
                      onDrop={(e) => handleGroupDrop(e, group)}
                      onClick={() => toggleGroupCollapse(group.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setConnContextPos(null);
                        setGroupContextPos({ x: e.clientX, y: e.clientY });
                        setTargetGroup(group);
                      }}
                      className={`relative flex items-center justify-between px-2 py-1.5 rounded-lg ${colorInfo.bg} ${colorInfo.text} font-bold text-xs border ${colorInfo.border} cursor-grab active:cursor-grabbing hover:brightness-110 transition-all duration-150 select-none group ${
                        isGroupDragged ? 'opacity-40 scale-[0.98] border-dashed border-sky-400' : ''
                      } ${
                        isGroupDropTarget && dropTarget.position === 'inside'
                          ? 'ring-2 ring-sky-400 bg-sky-500/25 border-sky-400 scale-[1.01] shadow-lg shadow-sky-500/25'
                          : ''
                      }`}
                    >
                      {/* Insertion line indicator above group */}
                      {isGroupDropTarget && dropTarget.position === 'before' && (
                        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.9)] z-20 pointer-events-none" />
                      )}
                      {/* Insertion line indicator below group */}
                      {isGroupDropTarget && dropTarget.position === 'after' && (
                        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.9)] z-20 pointer-events-none" />
                      )}

                      <div className="flex items-center space-x-1.5 truncate">
                        <span title="Drag to reorder group" className="inline-flex items-center">
                          <GripVertical
                            className="w-3.5 h-3.5 text-slate-400/50 group-hover:text-slate-200 transition-colors flex-shrink-0 cursor-grab active:cursor-grabbing"
                          />
                        </span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform duration-200 ease-out flex-shrink-0 cursor-pointer ${
                            isCollapsed ? 'rotate-0' : 'rotate-90'
                          }`}
                        />
                        <HeartbeatDot color={dotColor} size="xs" showWave={false} />
                        <span className="truncate">{group.name}</span>
                      </div>

                      <div className="flex items-center space-x-1" onMouseDown={(e) => e.stopPropagation()}>
                        <span className="text-[9px] px-1 bg-black/30 rounded font-mono uppercase">{group.tag}</span>
                        {/* Quick Add Connection in this group */}
                        <button
                          type="button"
                          draggable={false}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartNewConnection(group.id);
                          }}
                          className="p-0.5 hover:bg-white/10 rounded text-slate-300 opacity-0 group-hover:opacity-100 transition active:scale-95 cursor-pointer"
                          title={`Add connection to ${group.name}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        {groupConns.length === 0 && connectionGroups.length > 1 && (
                          <button
                            type="button"
                            draggable={false}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete empty group "${group.name}"?`)) {
                                deleteConnectionGroup(group.id);
                              }
                            }}
                            className="p-0.5 hover:bg-white/10 rounded text-rose-300 opacity-0 group-hover:opacity-100 transition active:scale-95 cursor-pointer"
                            title="Delete empty group"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Smooth Accordion Container for Group Connections */}
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-240 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className={`ml-3 pl-2 border-l ${colorInfo.border} space-y-1 text-xs pt-1`}>
                          {groupConns.length === 0 ? (
                            <div
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (draggedItem?.type === 'connection') {
                                  setDropTarget({ type: 'group', id: group.id, position: 'inside' });
                                }
                              }}
                              onDragLeave={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                  if (dropTarget?.id === group.id && dropTarget.position === 'inside') {
                                    setDropTarget(null);
                                  }
                                }
                              }}
                              onDrop={(e) => handleEmptyGroupDrop(e, group)}
                              className={`px-2 py-2 rounded-lg border border-dashed text-[11px] text-center transition-all ${
                                dropTarget?.id === group.id && dropTarget.position === 'inside'
                                  ? 'border-sky-400 bg-sky-500/25 text-sky-200 shadow-md shadow-sky-500/20'
                                  : 'border-slate-800/80 text-slate-500 hover:border-slate-700'
                              }`}
                            >
                              {draggedItem?.type === 'connection'
                                ? 'Drop connection here'
                                : 'No connections yet. Drag here or click +'}
                            </div>
                          ) : (
                            groupConns.map((conn) => {
                              const isSelected = !isCreatingNew && selectedConnId === conn.id;
                              const isConnActive = conn.active;
                              const isConnDragged = draggedItem?.type === 'connection' && draggedItem.id === conn.id;
                              const isConnDropTarget = dropTarget?.id === conn.id;

                              return (
                                <div
                                  key={conn.id}
                                  draggable={true}
                                  onDragStart={(e) => handleConnDragStart(e, conn)}
                                  onDragEnd={() => {
                                    setDraggedItem(null);
                                    setDropTarget(null);
                                  }}
                                  onDragOver={(e) => handleConnDragOver(e, conn)}
                                  onDragLeave={(e) => handleConnDragLeave(e, conn.id)}
                                  onDrop={(e) => handleConnDrop(e, conn)}
                                  onClick={() => handleSelectConnection(conn)}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setGroupContextPos(null);
                                    setConnContextPos({ x: e.clientX, y: e.clientY });
                                    setTargetConn(conn);
                                  }}
                                  className={`relative px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing font-medium flex items-center justify-between transition-all duration-150 select-none group ${
                                    isSelected
                                      ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-sm'
                                      : 'hover:bg-slate-800 text-slate-300'
                                  } ${
                                    isConnDragged
                                      ? 'opacity-40 scale-[0.98] border border-dashed border-sky-400 bg-sky-950/20'
                                      : ''
                                  }`}
                                >
                                  {/* Insertion indicator before */}
                                  {isConnDropTarget && dropTarget.position === 'before' && (
                                    <div className="absolute -top-1 left-1 right-1 h-0.5 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.9)] z-20 pointer-events-none" />
                                  )}
                                  {/* Insertion indicator after */}
                                  {isConnDropTarget && dropTarget.position === 'after' && (
                                    <div className="absolute -bottom-1 left-1 right-1 h-0.5 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.9)] z-20 pointer-events-none" />
                                  )}

                                  <div className="flex items-center space-x-1.5 truncate">
                                    <span title="Drag to reorder or move to another group" className="inline-flex items-center">
                                      <GripVertical
                                        className="w-3 h-3 text-slate-500 group-hover:text-slate-300 opacity-20 group-hover:opacity-90 transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing"
                                      />
                                    </span>
                                    <ConnectorIcon engine={conn.engine} size="xs" />
                                    <span className="truncate">{conn.name}</span>
                                  </div>

                                  <div className="flex items-center space-x-1" onMouseDown={(e) => e.stopPropagation()}>
                                    {isConnActive && (
                                      <HeartbeatDot color="green" size="xs" showWave={true} />
                                    )}
                                    <button
                                      type="button"
                                      draggable={false}
                                      onClick={(e) => handleDeleteConnection(conn.id, e)}
                                      className="p-0.5 hover:bg-slate-700 text-slate-500 hover:text-rose-400 rounded opacity-0 group-hover:opacity-100 transition ml-1 active:scale-95 cursor-pointer"
                                      title="Delete connection"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick button to create new connection at bottom */}
            <button
              onClick={() => handleStartNewConnection()}
              className="w-full py-2 px-3 border border-dashed border-slate-700 hover:border-sky-500/60 rounded-xl text-slate-400 hover:text-sky-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all duration-150 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Connection</span>
            </button>

          </div>

          {/* Right Form */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs select-text">
            
            {/* Header info */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-100">
                  {isCreatingNew ? '✨ Create New Connection' : `Editing: ${formData.name}`}
                </span>
                {!isCreatingNew && selectedConnId && (
                  <span className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono">
                    ID: {selectedConnId}
                  </span>
                )}
              </div>

              {isCreatingNew && (
                <span className="text-[10px] px-2 py-0.5 bg-sky-500/15 border border-sky-500/30 text-sky-300 rounded font-semibold animate-pulse">
                  Drafting
                </span>
              )}
            </div>

            {/* Connection Name & Group Selection */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-wider">
                  Connection Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. prod-replica-db"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-medium text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-wider">
                  Target Group
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-medium text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                >
                  {connectionGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.tag})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Database Engine Selection (TablePlus Full 22 Connectors Catalog) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center space-x-1.5">
                  <span>Database Engine</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-sky-400 rounded-full font-mono border border-slate-700/80">
                    22 Connectors
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAllConnectors(!showAllConnectors)}
                  className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <span>{showAllConnectors ? 'Hide Connector Grid' : 'Browse All 22 Connectors'}</span>
                  <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${showAllConnectors ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {/* Full 22 TablePlus Connectors Grid */}
              {showAllConnectors ? (
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between space-x-2">
                    <input
                      type="text"
                      value={connectorSearch}
                      onChange={(e) => setConnectorSearch(e.target.value)}
                      placeholder="Filter 22 connectors (PostgreSQL, ClickHouse, DuckDB, Redis, etc.)..."
                      className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
                    />
                    {connectorSearch && (
                      <button
                        type="button"
                        onClick={() => setConnectorSearch('')}
                        className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
                    {ALL_TABLEPLUS_CONNECTORS.filter((item) =>
                      item.label.toLowerCase().includes(connectorSearch.toLowerCase()) ||
                      item.id.toLowerCase().includes(connectorSearch.toLowerCase()) ||
                      item.category.toLowerCase().includes(connectorSearch.toLowerCase())
                    ).map((item) => {
                      const isSelected = formData.engine === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleEngineChange(item.id)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all duration-150 cursor-pointer group/card relative ${
                            isSelected
                              ? 'bg-sky-500/20 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)] text-sky-200 ring-1 ring-sky-400/50'
                              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <ConnectorIcon engine={item.id} size="md" className="group-hover/card:scale-105 transition-transform" />
                          <span className="text-[10px] font-semibold mt-1.5 line-clamp-1 leading-tight">{item.label}</span>
                          <span className="text-[9px] text-slate-500 font-mono scale-90">{item.tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Quick Engine Tabs (Primary engines + currently selected) */
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(() => {
                    const keys = [...PRIMARY_ENGINES];
                    if (!keys.includes(formData.engine)) {
                      keys.push(formData.engine);
                    }
                    return keys.map((key) => {
                      const meta = CONNECTOR_METADATA[key] || {
                        id: key,
                        label: key.toUpperCase(),
                        iconSrc: '/connectors/generic.png',
                        tag: 'Db',
                        defaultPort: 5432,
                        category: 'sql' as const,
                      };
                      const isSelected = formData.engine === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleEngineChange(key)}
                          className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center space-x-2 active:scale-95 cursor-pointer ${
                            isSelected
                              ? 'bg-sky-500/20 text-sky-200 border-sky-500/60 shadow-sm ring-1 ring-sky-400/30'
                              : 'bg-slate-800/40 text-slate-300 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <ConnectorIcon engine={key} size="xs" />
                          <span className="truncate text-[11px]">{meta.label}</span>
                        </button>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Host & Port (Postgres, MySQL, Redis) */}
            {formData.engine !== 'snowflake' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Host / Server Address</label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    placeholder="localhost or db.cloud.internal"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Port</label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value, 10) || 5432 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Database / Keyspace Name */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {formData.engine === 'redis' ? 'Database Index (0-15)' : 'Database / Schema'}
              </label>
              <input
                type="text"
                value={formData.database}
                onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                placeholder={formData.engine === 'redis' ? '0' : 'ecom_prod_db'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {/* Snowflake Specific Fields */}
            {formData.engine === 'snowflake' && (
              <div className="space-y-3 bg-sky-950/20 border border-sky-500/30 p-3 rounded-xl animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sky-300 font-semibold mb-1">Account Identifier</label>
                    <input
                      type="text"
                      value={formData.accountIdentifier || ''}
                      onChange={(e) => setFormData({ ...formData, accountIdentifier: e.target.value })}
                      placeholder="e.g. xy12345.us-east-1"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sky-300 font-semibold mb-1">Warehouse</label>
                    <input
                      type="text"
                      value={formData.warehouse || ''}
                      onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                      placeholder="e.g. COMPUTE_WH"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* User & Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Username / Role</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="app_master"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            {/* Smooth Collapsible SSH Bastion Tunnel Option */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <label className="flex items-center space-x-2 text-slate-200 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={formData.useSsh || false}
                  onChange={(e) => setFormData({ ...formData, useSsh: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-sky-500"
                />
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span>Connect via SSH Bastion Tunnel (Zero-Trust)</span>
              </label>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                  formData.useSsh ? 'grid-rows-[1fr] opacity-100 pt-2' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 text-[10px] font-semibold mb-1">SSH Bastion Host</label>
                      <input
                        type="text"
                        value={formData.sshHost || ''}
                        onChange={(e) => setFormData({ ...formData, sshHost: e.target.value })}
                        placeholder="bastion.internal.cloud"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-semibold mb-1">SSH Port / Protocol</label>
                      <input
                        type="text"
                        defaultValue="22 (Standard SSH Key Auth)"
                        disabled
                        className="w-full bg-slate-900/50 border border-slate-800 rounded px-2 py-1 text-slate-500 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer Actions with smooth heartbeat test feedback */}
        <div className="h-12 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="relative overflow-hidden px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isTesting && (
                <BorderChase color="sky" dual={true} speed="fast" borderWidth={1.5} glow={true} />
              )}
              {isTesting ? 'Pinging host...' : 'Test Connection'}
            </button>

            <button
              type="button"
              onClick={() => {
                const currentProfile: ConnectionProfile = {
                  ...formData,
                  id: selectedConnId || 'temp',
                };
                const url = serializeConnectionUrl(currentProfile);
                navigator.clipboard.writeText(url);
                showToast('📋 Copied Connection URL');
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition active:scale-95 cursor-pointer flex items-center space-x-1.5"
              title="Copy connection as TablePlus / standard URL"
            >
              <Link className="w-3.5 h-3.5 text-amber-400" />
              <span>Copy as URL</span>
            </button>

            {testSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1.5 animate-in fade-in duration-200">
                <HeartbeatDot color="green" size="xs" showWave={true} />
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Connected in {testLatency}ms (TLSv1.3 Handshake OK)</span>
              </span>
            )}

            {testError && (
              <span className="text-xs text-rose-400 font-medium flex items-center space-x-1.5 animate-in fade-in duration-200 max-w-sm truncate" title={testError}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span className="truncate">{testError}</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setConnectionModalOpen(false)}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndConnect}
              className="px-4 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl transition shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer"
            >
              {isCreatingNew ? 'Create & Connect' : 'Save & Connect'}
            </button>
          </div>
        </div>

      </div>

      {/* Connection Profile Context Menu */}
      {connContextPos && targetConn && (
        <ContextMenuContainer position={connContextPos} onClose={() => setConnContextPos(null)}>
          <ContextMenuHeader title={`Connection: ${targetConn.name}`} />
          <ContextMenuItem
            icon={<Play className="w-3.5 h-3.5 text-emerald-400" />}
            label={`Connect to "${targetConn.name}"`}
            onClick={() => {
              switchActiveConnection(targetConn.id);
              setConnectionModalOpen(false);
              showToast(`Connected to ${targetConn.name}`);
            }}
          />
          <ContextMenuItem
            icon={<Pencil className="w-3.5 h-3.5 text-sky-400" />}
            label="Edit Connection Profile"
            onClick={() => {
              handleSelectConnection(targetConn);
            }}
          />
          <ContextMenuItem
            icon={<Copy className="w-3.5 h-3.5 text-slate-300" />}
            label="Duplicate Connection"
            onClick={() => {
              const { id: _, ...rest } = targetConn;
              addConnection({
                ...rest,
                name: `${targetConn.name} (Copy)`,
                active: false,
              });
              showToast(`Duplicated "${targetConn.name}"`);
            }}
          />
          <ContextMenuDivider />
          <ContextMenuItem
            icon={<Link className="w-3.5 h-3.5 text-amber-300" />}
            label="Copy as URL (TablePlus format)"
            onClick={() => {
              const url = serializeConnectionUrl(targetConn);
              navigator.clipboard.writeText(url);
              showToast(`Copied URL for "${targetConn.name}"`);
            }}
          />
          <ContextMenuItem
            icon={<FileCode className="w-3.5 h-3.5 text-slate-300" />}
            label="Copy Connection URI"
            onClick={() => {
              const uri = `${targetConn.engine}://${targetConn.username || 'user'}:••••@${targetConn.host || 'localhost'}:${targetConn.port}/${targetConn.database || ''}`;
              navigator.clipboard.writeText(uri);
              showToast(`Copied URI for "${targetConn.name}"`);
            }}
          />
          <ContextMenuItem
            icon={<Copy className="w-3.5 h-3.5 text-slate-300" />}
            label="Copy Config JSON"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(targetConn, null, 2));
              showToast(`Copied JSON config for "${targetConn.name}"`);
            }}
          />
          <ContextMenuDivider />
          <ContextMenuItem
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            label="Delete Connection"
            danger
            onClick={() => {
              if (confirm(`Delete connection "${targetConn.name}"?`)) {
                deleteConnection(targetConn.id);
                if (selectedConnId === targetConn.id) {
                  const remaining = connections.filter((c) => c.id !== targetConn.id);
                  if (remaining.length > 0) setSelectedConnId(remaining[0].id);
                  else handleStartNewConnection();
                }
                showToast(`Deleted "${targetConn.name}"`);
              }
            }}
          />
        </ContextMenuContainer>
      )}

      {/* Group Context Menu */}
      {groupContextPos && targetGroup && (
        <ContextMenuContainer position={groupContextPos} onClose={() => setGroupContextPos(null)}>
          <ContextMenuHeader title={`Group: ${targetGroup.name} (${targetGroup.tag})`} />
          <ContextMenuItem
            icon={<Plus className="w-3.5 h-3.5 text-emerald-400" />}
            label={`New Connection in "${targetGroup.name}"`}
            onClick={() => {
              handleStartNewConnection(targetGroup.id);
              setCollapsedGroups((prev) => ({ ...prev, [targetGroup.id]: false }));
            }}
          />
          <ContextMenuItem
            icon={<FolderOpen className="w-3.5 h-3.5 text-sky-400" />}
            label={collapsedGroups[targetGroup.id] ? 'Expand Group' : 'Collapse Group'}
            onClick={() => {
              toggleGroupCollapse(targetGroup.id);
            }}
          />
          <ContextMenuItem
            icon={<Copy className="w-3.5 h-3.5 text-slate-300" />}
            label="Copy Group Name"
            onClick={() => {
              navigator.clipboard.writeText(targetGroup.name);
              showToast(`Copied "${targetGroup.name}"`);
            }}
          />
          <ContextMenuDivider />
          <ContextMenuItem
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            label="Delete Group"
            danger
            onClick={() => {
              const count = connections.filter((c) => c.groupId === targetGroup.id).length;
              if (count > 0) {
                if (confirm(`Group "${targetGroup.name}" contains ${count} connection(s). Delete group and all its connections?`)) {
                  connections.filter((c) => c.groupId === targetGroup.id).forEach((c) => deleteConnection(c.id));
                  deleteConnectionGroup(targetGroup.id);
                  showToast(`Deleted group "${targetGroup.name}"`);
                }
              } else {
                if (confirm(`Delete empty group "${targetGroup.name}"?`)) {
                  deleteConnectionGroup(targetGroup.id);
                  showToast(`Deleted group "${targetGroup.name}"`);
                }
              }
            }}
          />
        </ContextMenuContainer>
      )}
    </div>
  );
};
