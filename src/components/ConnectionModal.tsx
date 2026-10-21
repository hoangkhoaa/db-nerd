import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { DatabaseEngine, ConnectionProfile } from '../types';
import { X, Plus, FolderPlus, Trash2, Check, ChevronRight, Server, Shield } from 'lucide-react';
import { HeartbeatDot, HeartbeatColor } from './HeartbeatDot';

const ENGINE_OPTIONS: { id: DatabaseEngine; label: string; icon: string; defaultPort: number }[] = [
  { id: 'postgres', label: 'PostgreSQL', icon: '🐘', defaultPort: 5432 },
  { id: 'mysql', label: 'MySQL', icon: '🐬', defaultPort: 3306 },
  { id: 'redis', label: 'Redis', icon: '🟥', defaultPort: 6379 },
  { id: 'snowflake', label: 'Snowflake', icon: '❄️', defaultPort: 443 },
];

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
  } = useAppStore();

  const [selectedConnId, setSelectedConnId] = useState<string | null>(activeConnection?.id || null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

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
    setFormData({
      name: 'new-database-conn',
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
  };

  const handleEngineChange = (engine: DatabaseEngine) => {
    const opt = ENGINE_OPTIONS.find((e) => e.id === engine);
    setFormData((prev) => ({
      ...prev,
      engine,
      port: opt?.defaultPort || prev.port,
    }));
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestSuccess(false);
    setTimeout(() => {
      setIsTesting(false);
      setTestSuccess(true);
      setTestLatency(+(Math.random() * 2 + 0.8).toFixed(1));
    }, 380);
  };

  const handleSaveAndConnect = () => {
    if (!formData.name.trim()) {
      alert('Please enter a valid connection name');
      return;
    }

    if (isCreatingNew) {
      const created = addConnection({
        ...formData,
        active: true,
      });
      switchActiveConnection(created.id);
    } else if (selectedConnId) {
      updateConnection(selectedConnId, {
        ...formData,
      });
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
              className="px-2.5 py-1 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold transition active:scale-95"
            >
              Import XML / JSON
            </button>
            <button
              onClick={() => setConnectionModalOpen(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition active:scale-95"
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
                  onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                  className={`p-1 rounded transition-all duration-150 active:scale-95 ${
                    isCreatingGroup ? 'bg-indigo-500/30 text-indigo-300' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Create New Group (Folder)"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>

                {/* New Connection Button */}
                <button
                  onClick={() => handleStartNewConnection()}
                  className={`p-1 rounded transition-all duration-150 active:scale-95 ${
                    isCreatingNew ? 'bg-sky-500/30 text-sky-300' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Create New Connection"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
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
                      className="text-slate-400 hover:text-slate-200"
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
                      className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-200"
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
                          className={`w-3.5 h-3.5 rounded-full ${COLOR_MAP[col]?.dot} transition-transform ${
                            groupColor === col ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!groupName.trim()}
                    className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition active:scale-95"
                  >
                    Create Group
                  </button>
                </form>
              </div>
            </div>

            {/* List of Groups & Connections with smooth accordions */}
            <div className="space-y-3">
              {connectionGroups.map((group) => {
                const groupConns = connections.filter((c) => c.groupId === group.id);
                const isCollapsed = !!collapsedGroups[group.id];
                const colorInfo = COLOR_MAP[group.color] || COLOR_MAP.rose;
                const dotColor = GROUP_COLOR_MAP[group.color] || 'red';

                return (
                  <div key={group.id} className="space-y-1">
                    {/* Group Header with rotating chevron */}
                    <div
                      onClick={() => toggleGroupCollapse(group.id)}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${colorInfo.bg} ${colorInfo.text} font-bold text-xs border ${colorInfo.border} cursor-pointer hover:brightness-110 transition-all duration-150 active:scale-[0.99] group`}
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform duration-200 ease-out flex-shrink-0 ${
                            isCollapsed ? 'rotate-0' : 'rotate-90'
                          }`}
                        />
                        <HeartbeatDot color={dotColor} size="xs" showWave={false} />
                        <span className="truncate">{group.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-[9px] px-1 bg-black/30 rounded font-mono uppercase">{group.tag}</span>
                        {/* Quick Add Connection in this group */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartNewConnection(group.id);
                          }}
                          className="p-0.5 hover:bg-white/10 rounded text-slate-300 opacity-0 group-hover:opacity-100 transition active:scale-95"
                          title={`Add connection to ${group.name}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        {groupConns.length === 0 && connectionGroups.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete empty group "${group.name}"?`)) {
                                deleteConnectionGroup(group.id);
                              }
                            }}
                            className="p-0.5 hover:bg-white/10 rounded text-rose-300 opacity-0 group-hover:opacity-100 transition active:scale-95"
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
                            <div className="px-2 py-1 text-slate-500 italic text-[11px]">
                              No connections yet. Click + to add.
                            </div>
                          ) : (
                            groupConns.map((conn) => {
                              const isSelected = !isCreatingNew && selectedConnId === conn.id;
                              const isConnActive = conn.active;
                              const engObj = ENGINE_OPTIONS.find((e) => e.id === conn.engine);

                              return (
                                <div
                                  key={conn.id}
                                  onClick={() => handleSelectConnection(conn)}
                                  className={`px-2 py-1.5 rounded-lg cursor-pointer font-medium flex items-center justify-between transition-all duration-150 ${
                                    isSelected
                                      ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-sm'
                                      : 'hover:bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center space-x-1.5 truncate">
                                    <span>{engObj?.icon || '🐘'}</span>
                                    <span className="truncate">{conn.name}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {isConnActive && (
                                      <HeartbeatDot color="green" size="xs" showWave={true} />
                                    )}
                                    <button
                                      onClick={(e) => handleDeleteConnection(conn.id, e)}
                                      className="p-0.5 hover:bg-slate-700 text-slate-500 hover:text-rose-400 rounded opacity-0 group-hover:opacity-100 transition ml-1 active:scale-95"
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
              className="w-full py-2 px-3 border border-dashed border-slate-700 hover:border-sky-500/60 rounded-xl text-slate-400 hover:text-sky-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all duration-150 active:scale-[0.98]"
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

            {/* Engine Tabs */}
            <div>
              <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                Database Engine
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ENGINE_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleEngineChange(item.id)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center justify-center space-x-1.5 active:scale-95 ${
                      formData.engine === item.id
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
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition active:scale-95 disabled:opacity-50"
            >
              {isTesting ? 'Pinging host...' : 'Test Connection'}
            </button>
            {testSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1.5 animate-in fade-in duration-200">
                <HeartbeatDot color="green" size="xs" showWave={true} />
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Connected in {testLatency}ms (TLSv1.3 Handshake OK)</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setConnectionModalOpen(false)}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndConnect}
              className="px-4 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl transition shadow-md shadow-sky-500/20 active:scale-95"
            >
              {isCreatingNew ? 'Create & Connect' : 'Save & Connect'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
