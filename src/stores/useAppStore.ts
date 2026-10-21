import { create } from 'zustand';
import { ConnectionProfile, ConnectionGroup, GridRow, ProcessItem, QueryHistoryItem, TabItem } from '../types';

interface AppState {
  tabs: TabItem[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  openNewQueryTab: (initialSql?: string) => void;
  openTableGridTab: (tableName: string) => void;
  openTableSchemaTab: (tableName: string) => void;
  closeTab: (id: string) => void;

  activeTab: 'grid' | 'schema' | 'sql' | 'stats' | 'connection';
  setActiveTab: (tab: 'grid' | 'schema' | 'sql' | 'stats' | 'connection') => void;

  appMode: 'sql' | 'redis' | 'snowflake';
  setAppMode: (mode: 'sql' | 'redis' | 'snowflake') => void;

  connectionGroups: ConnectionGroup[];
  connections: ConnectionProfile[];
  addConnectionGroup: (group: Omit<ConnectionGroup, 'id'>) => ConnectionGroup;
  updateConnectionGroup: (id: string, updates: Partial<ConnectionGroup>) => void;
  deleteConnectionGroup: (id: string) => void;
  addConnection: (profile: Omit<ConnectionProfile, 'id'>) => ConnectionProfile;
  updateConnection: (id: string, updates: Partial<ConnectionProfile>) => void;
  deleteConnection: (id: string) => void;
  switchActiveConnection: (id: string) => void;

  activeConnection: ConnectionProfile;
  setActiveConnection: (conn: ConnectionProfile) => void;

  isConnectionModalOpen: boolean;
  setConnectionModalOpen: (open: boolean) => void;

  isHistoryModalOpen: boolean;
  setHistoryModalOpen: (open: boolean) => void;

  isSqlDiffModalOpen: boolean;
  setSqlDiffModalOpen: (open: boolean) => void;

  isTransactionOpen: boolean;
  setTransactionOpen: (open: boolean) => void;

  pendingEditsCount: number;
  resetPending: () => void;

  selectedTable: string;
  setSelectedTable: (tbl: string) => void;

  originalRows: GridRow[];
  rows: GridRow[];
  updateCell: (id: number, field: keyof GridRow, value: any) => void;
  insertRow: () => void;
  deleteRow: (id: number) => void;
  rollbackTransaction: () => void;
  commitTransaction: () => { sqlText: string; count: number };
  getPendingSQL: () => string;

  processes: ProcessItem[];
  killProcess: (pid: number) => void;

  history: QueryHistoryItem[];
}

const INITIAL_ROWS: GridRow[] = [
  {
    id: 1034,
    user_id: 501,
    customer_name: 'Alex Turner',
    product_sku: 'SKU-8902-M',
    order_details: { items: 3, total: 145.0, express: true },
    total_amount: 145.0,
    created_at: '2026-10-20 14:30:00',
    status: 'shipped',
    isDirty: false,
    dirtyFields: {},
    rowState: 'clean',
  },
  {
    id: 1035,
    user_id: 502,
    customer_name: 'Sarah Connor',
    product_sku: 'SKU-1239-X',
    order_details: { items: 1, total: 89.5, reason: 'size_mismatch' },
    total_amount: 89.5,
    created_at: '2026-10-21 09:15:00',
    status: 'processing_refund',
    isDirty: true,
    dirtyFields: { status: true },
    rowState: 'modified',
  },
  {
    id: 1036,
    user_id: 503,
    customer_name: 'Khoa Nguyen',
    product_sku: 'SKU-4560-L',
    order_details: { items: 5, total: 1200.0, vip: true },
    total_amount: 1200.0,
    created_at: '2026-10-21 11:00:00',
    status: 'completed',
    isDirty: false,
    dirtyFields: {},
    rowState: 'clean',
  },
  {
    id: 1037,
    user_id: 504,
    customer_name: 'Elena Rostova',
    product_sku: 'SKU-9901-S',
    order_details: { items: 2, total: 340.0 },
    total_amount: 340.0,
    created_at: '2026-10-21 13:45:00',
    status: 'pending',
    isDirty: false,
    dirtyFields: {},
    rowState: 'clean',
  },
  {
    id: 1038,
    user_id: 505,
    customer_name: 'Marcus Vance',
    product_sku: 'SKU-3321-XL',
    order_details: { items: 4, total: 580.0 },
    total_amount: 580.0,
    created_at: '2026-10-21 15:20:00',
    status: 'completed',
    isDirty: false,
    dirtyFields: {},
    rowState: 'clean',
  },
];

const DEFAULT_TABS: TabItem[] = [
  { id: 'tab-grid-user_orders', type: 'grid', title: 'user_orders [Grid]', tableName: 'user_orders', canClose: true },
  { id: 'tab-schema-user_orders', type: 'schema', title: 'user_orders [Structure & DDL]', tableName: 'user_orders', canClose: true },
  { id: 'tab-sql-1', type: 'sql', title: 'Query 1 [SQL]', queryId: 1, canClose: true },
  { id: 'tab-stats', type: 'stats', title: 'Instance Health & Activity', canClose: false },
];

const INITIAL_GROUPS: ConnectionGroup[] = [
  { id: 'group-prod', name: 'Production', color: 'rose', tag: 'PROD' },
  { id: 'group-staging', name: 'Staging GCP', color: 'amber', tag: 'QA' },
  { id: 'group-local', name: 'Localhost', color: 'emerald', tag: 'DEV' },
];

const INITIAL_CONNECTIONS: ConnectionProfile[] = [
  {
    id: 'conn-1',
    name: 'prod-postgres-main',
    groupId: 'group-prod',
    engine: 'postgres',
    env: 'prod',
    host: 'aurora-cluster.eu-west-1.rds.amazonaws.com',
    port: 5432,
    database: 'ecom_prod_db',
    username: 'app_master',
    password: '••••••••••••',
    useSsh: true,
    sshHost: 'ec2-bastion.corp.io',
    active: true,
    latencyMs: 1.8,
  },
  {
    id: 'conn-2',
    name: 'analytics-dwh',
    groupId: 'group-prod',
    engine: 'snowflake',
    env: 'prod',
    host: 'xy12345.us-east-1.snowflakecomputing.com',
    port: 443,
    database: 'ANALYTICS_PROD',
    username: 'dwh_engineer',
    password: '••••••••••••',
    accountIdentifier: 'xy12345.us-east-1',
    warehouse: 'COMPUTE_WH',
    active: false,
    latencyMs: 24.5,
  },
  {
    id: 'conn-3',
    name: 'prod-redis-cache',
    groupId: 'group-prod',
    engine: 'redis',
    env: 'prod',
    host: 'redis-cluster.prod.cache.amazonaws.com',
    port: 6379,
    database: '0',
    username: 'default',
    password: '',
    active: false,
    latencyMs: 0.9,
  },
  {
    id: 'conn-4',
    name: 'staging-mysql-8',
    groupId: 'group-staging',
    engine: 'mysql',
    env: 'staging',
    host: '10.128.0.4',
    port: 3306,
    database: 'staging_main',
    username: 'staging_admin',
    password: '••••••••••••',
    useSsh: false,
    active: false,
    latencyMs: 3.2,
  },
  {
    id: 'conn-5',
    name: 'local-docker-postgres',
    groupId: 'group-local',
    engine: 'postgres',
    env: 'local',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    password: '',
    useSsh: false,
    active: false,
    latencyMs: 0.2,
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  tabs: DEFAULT_TABS,
  activeTabId: 'tab-grid-user_orders',
  activeTab: 'grid',

  setActiveTabId: (id) => {
    const { tabs } = get();
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;
    set({
      activeTabId: id,
      activeTab: tab.type,
      selectedTable: tab.tableName || get().selectedTable,
    });
  },

  setActiveTab: (tabType) => {
    const { tabs, activeTabId, selectedTable } = get();
    let match = tabs.find((t) => t.id === activeTabId && t.type === tabType);
    if (!match) {
      match = tabs.find((t) => t.type === tabType && (!t.tableName || t.tableName === selectedTable));
    }
    if (!match) {
      match = tabs.find((t) => t.type === tabType);
    }
    if (match) {
      set({
        activeTabId: match.id,
        activeTab: tabType,
        selectedTable: match.tableName || selectedTable,
      });
    } else {
      set({ activeTab: tabType });
    }
  },

  openNewQueryTab: (initialSql) => {
    const { tabs } = get();
    const sqlTabs = tabs.filter((t) => t.type === 'sql');
    const maxQueryId = sqlTabs.reduce((max, t) => Math.max(max, t.queryId || 1), 0);
    const nextQueryId = maxQueryId + 1;
    const newTab: TabItem = {
      id: `tab-sql-${nextQueryId}`,
      type: 'sql',
      title: `Query ${nextQueryId} [SQL]`,
      queryId: nextQueryId,
      sqlContent: initialSql,
      canClose: true,
    };
    set({
      tabs: [...tabs, newTab],
      activeTabId: newTab.id,
      activeTab: 'sql',
    });
  },

  openTableGridTab: (tableName) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.type === 'grid' && t.tableName === tableName);
    if (existing) {
      set({
        activeTabId: existing.id,
        activeTab: 'grid',
        selectedTable: tableName,
      });
    } else {
      const newTab: TabItem = {
        id: `tab-grid-${tableName}`,
        type: 'grid',
        title: `${tableName} [Grid]`,
        tableName,
        canClose: true,
      };
      set({
        tabs: [...tabs, newTab],
        activeTabId: newTab.id,
        activeTab: 'grid',
        selectedTable: tableName,
      });
    }
  },

  openTableSchemaTab: (tableName) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.type === 'schema' && t.tableName === tableName);
    if (existing) {
      set({
        activeTabId: existing.id,
        activeTab: 'schema',
        selectedTable: tableName,
      });
    } else {
      const newTab: TabItem = {
        id: `tab-schema-${tableName}`,
        type: 'schema',
        title: `${tableName} [Structure & DDL]`,
        tableName,
        canClose: true,
      };
      set({
        tabs: [...tabs, newTab],
        activeTabId: newTab.id,
        activeTab: 'schema',
        selectedTable: tableName,
      });
    }
  },

  closeTab: (id) => {
    const { tabs, activeTabId, selectedTable } = get();
    if (tabs.length <= 1) return;
    const tabToClose = tabs.find((t) => t.id === id);
    if (tabToClose && tabToClose.canClose === false) return;

    const idx = tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;

    const nextTabs = tabs.filter((t) => t.id !== id);
    let nextActiveId = activeTabId;

    if (activeTabId === id) {
      const newIdx = Math.min(idx, nextTabs.length - 1);
      nextActiveId = nextTabs[newIdx].id;
    }

    const nextActiveTab = nextTabs.find((t) => t.id === nextActiveId);
    set({
      tabs: nextTabs,
      activeTabId: nextActiveId,
      activeTab: nextActiveTab?.type || 'grid',
      selectedTable: nextActiveTab?.tableName || selectedTable,
    });
  },

  appMode: 'sql',
  setAppMode: (mode) => set({ appMode: mode }),

  connectionGroups: INITIAL_GROUPS,
  connections: INITIAL_CONNECTIONS,
  activeConnection: INITIAL_CONNECTIONS[0],
  setActiveConnection: (conn) => set({ activeConnection: conn }),

  addConnectionGroup: (group) => {
    const newGroup: ConnectionGroup = {
      ...group,
      id: `group-${Date.now()}`,
    };
    set((state) => ({ connectionGroups: [...state.connectionGroups, newGroup] }));
    return newGroup;
  },

  updateConnectionGroup: (id, updates) => {
    set((state) => ({
      connectionGroups: state.connectionGroups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  },

  deleteConnectionGroup: (id) => {
    set((state) => ({
      connectionGroups: state.connectionGroups.filter((g) => g.id !== id),
      connections: state.connections.filter((c) => c.groupId !== id),
    }));
  },

  addConnection: (profile) => {
    const newConn: ConnectionProfile = {
      ...profile,
      id: `conn-${Date.now()}`,
    };
    set((state) => ({ connections: [...state.connections, newConn] }));
    return newConn;
  },

  updateConnection: (id, updates) => {
    set((state) => {
      const nextConnections = state.connections.map((c) => (c.id === id ? { ...c, ...updates } : c));
      const nextActive = state.activeConnection.id === id ? { ...state.activeConnection, ...updates } : state.activeConnection;
      return { connections: nextConnections, activeConnection: nextActive };
    });
  },

  deleteConnection: (id) => {
    set((state) => {
      const nextConnections = state.connections.filter((c) => c.id !== id);
      let nextActive = state.activeConnection;
      if (state.activeConnection.id === id && nextConnections.length > 0) {
        nextActive = nextConnections[0];
      }
      return { connections: nextConnections, activeConnection: nextActive };
    });
  },

  switchActiveConnection: (id) => {
    const { connections } = get();
    const conn = connections.find((c) => c.id === id);
    if (!conn) return;
    const nextEngine = conn.engine;
    const nextAppMode = nextEngine === 'redis' ? 'redis' : nextEngine === 'snowflake' ? 'snowflake' : 'sql';
    set((state) => ({
      connections: state.connections.map((c) => ({ ...c, active: c.id === id })),
      activeConnection: { ...conn, active: true },
      appMode: nextAppMode,
    }));
  },

  isConnectionModalOpen: false,
  setConnectionModalOpen: (open) => set({ isConnectionModalOpen: open }),

  isHistoryModalOpen: false,
  setHistoryModalOpen: (open) => set({ isHistoryModalOpen: open }),

  isSqlDiffModalOpen: false,
  setSqlDiffModalOpen: (open) => set({ isSqlDiffModalOpen: open }),

  isTransactionOpen: true,
  setTransactionOpen: (open) => set({ isTransactionOpen: open }),

  pendingEditsCount: 1,
  resetPending: () => set({ pendingEditsCount: 0, isTransactionOpen: false }),

  selectedTable: 'user_orders',
  setSelectedTable: (tbl) => set({ selectedTable: tbl }),

  originalRows: JSON.parse(JSON.stringify(INITIAL_ROWS)),
  rows: JSON.parse(JSON.stringify(INITIAL_ROWS)),

  updateCell: (id, field, value) => {
    const { rows, originalRows, selectedTable } = get();
    const origRow = originalRows.find((r) => r.id === id);

    let castValue = value;
    if (field === 'id' || field === 'user_id' || field === 'total_amount') {
      const num = Number(value);
      if (!isNaN(num)) castValue = num;
    }

    const updatedRows = rows.map((r) => {
      if (r.id !== id) return r;

      const currentDirty = { ...(r.dirtyFields || {}) };
      const isOriginal = origRow ? JSON.stringify(origRow[field]) === JSON.stringify(castValue) : false;

      if (isOriginal) {
        delete currentDirty[field as string];
      } else {
        currentDirty[field as string] = true;
      }

      const hasDirtyFields = Object.keys(currentDirty).length > 0;
      const nextRowState: GridRow['rowState'] = r.rowState === 'inserted' ? 'inserted' : hasDirtyFields ? 'modified' : 'clean';
      return {
        ...r,
        [field]: castValue,
        dirtyFields: currentDirty,
        isDirty: hasDirtyFields || r.rowState === 'inserted' || r.rowState === 'deleted',
        rowState: nextRowState,
      };
    });

    // Count all dirty cells & rows
    let dirtyCount = 0;
    updatedRows.forEach((r) => {
      if (r.rowState === 'inserted' || r.rowState === 'deleted') {
        dirtyCount++;
      } else if (r.dirtyFields) {
        dirtyCount += Object.keys(r.dirtyFields).length;
      }
    });

    set({
      rows: updatedRows,
      pendingEditsCount: dirtyCount,
      isTransactionOpen: dirtyCount > 0,
      selectedTable,
    });
  },

  insertRow: () => {
    const { rows } = get();
    const maxId = rows.reduce((max, r) => Math.max(max, r.id), 1000);
    const newId = maxId + 1;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newRow: GridRow = {
      id: newId,
      user_id: 501,
      customer_name: 'New Customer',
      product_sku: 'SKU-NEW-01',
      order_details: { items: 1, total: 50.0 },
      total_amount: 50.0,
      created_at: now,
      status: 'pending',
      isDirty: true,
      dirtyFields: { id: true, customer_name: true, product_sku: true, total_amount: true, status: true },
      rowState: 'inserted',
    };

    const nextRows = [newRow, ...rows];
    let dirtyCount = 0;
    nextRows.forEach((r) => {
      if (r.rowState === 'inserted' || r.rowState === 'deleted') dirtyCount++;
      else if (r.dirtyFields) dirtyCount += Object.keys(r.dirtyFields).length;
    });

    set({
      rows: nextRows,
      pendingEditsCount: dirtyCount,
      isTransactionOpen: true,
    });
  },

  deleteRow: (id) => {
    const { rows } = get();
    const nextRows = rows.map((r) => {
      if (r.id !== id) return r;
      const nextState: GridRow['rowState'] = r.rowState === 'deleted' ? 'clean' : 'deleted';
      return {
        ...r,
        rowState: nextState,
        isDirty: nextState === 'deleted',
      };
    });

    let dirtyCount = 0;
    nextRows.forEach((r) => {
      if (r.rowState === 'inserted' || r.rowState === 'deleted') dirtyCount++;
      else if (r.dirtyFields) dirtyCount += Object.keys(r.dirtyFields).length;
    });

    set({
      rows: nextRows,
      pendingEditsCount: dirtyCount,
      isTransactionOpen: dirtyCount > 0,
    });
  },

  rollbackTransaction: () => {
    const { originalRows } = get();
    set({
      rows: JSON.parse(JSON.stringify(originalRows)),
      pendingEditsCount: 0,
      isTransactionOpen: false,
    });
  },

  commitTransaction: () => {
    const { rows, getPendingSQL, activeConnection, history } = get();
    const sqlText = getPendingSQL();
    const count = get().pendingEditsCount;

    // Filter out rows marked as deleted
    const committedRows = rows
      .filter((r) => r.rowState !== 'deleted')
      .map((r) => ({
        ...r,
        isDirty: false,
        dirtyFields: {},
        rowState: 'clean' as const,
      }));

    const now = new Date();
    const timeStr = `Today at ${now.toTimeString().slice(0, 8)}`;
    const newHistoryItem: QueryHistoryItem = {
      id: `h-${Date.now()}`,
      connectionName: activeConnection.name,
      env: activeConnection.env,
      sql: sqlText,
      timestamp: timeStr,
      durationMs: 1.4,
      rowsAffected: count,
      status: 'success',
      isFavorite: false,
    };

    set({
      rows: committedRows,
      originalRows: JSON.parse(JSON.stringify(committedRows)),
      pendingEditsCount: 0,
      isTransactionOpen: false,
      isSqlDiffModalOpen: false,
      history: [newHistoryItem, ...history],
    });

    return { sqlText, count };
  },

  getPendingSQL: () => {
    const { rows, selectedTable } = get();
    const sqlStatements: string[] = [];

    rows.forEach((r) => {
      if (r.rowState === 'inserted') {
        sqlStatements.push(
          `INSERT INTO ${selectedTable} (id, user_id, customer_name, product_sku, total_amount, status, created_at) VALUES (${r.id}, ${r.user_id}, '${r.customer_name}', '${r.product_sku}', ${r.total_amount}, '${r.status}', '${r.created_at}');`
        );
      } else if (r.rowState === 'deleted') {
        sqlStatements.push(`DELETE FROM ${selectedTable} WHERE id = ${r.id};`);
      } else if (r.dirtyFields && Object.keys(r.dirtyFields).length > 0) {
        const setClauses = Object.keys(r.dirtyFields).map((field) => {
          const val = (r as any)[field];
          if (typeof val === 'number') return `${field} = ${val}`;
          if (typeof val === 'object') return `${field} = '${JSON.stringify(val)}'::jsonb`;
          return `${field} = '${String(val).replace(/'/g, "''")}'`;
        });
        sqlStatements.push(`UPDATE ${selectedTable} SET ${setClauses.join(', ')} WHERE id = ${r.id};`);
      }
    });

    if (sqlStatements.length === 0) {
      return '-- No pending changes in active transaction';
    }

    return `BEGIN TRANSACTION;\n\n${sqlStatements.join('\n')}\n\nCOMMIT;`;
  },

  processes: [
    {
      pid: 4821,
      user: 'analytics_bot',
      clientIp: '10.0.12.84',
      duration: '18.4s',
      state: 'locked',
      query: 'SELECT * FROM audit_logs a JOIN user_orders o ON a.id = o.id WHERE a.payload::text LIKE \'%error%\'',
      isLongRunning: true,
    },
    {
      pid: 3910,
      user: 'app_backend',
      clientIp: '10.0.10.15',
      duration: '42.1s',
      state: 'idle in txn',
      query: 'UPDATE user_orders SET status = \'refunded\' WHERE id = 1035',
      isLongRunning: false,
    },
    {
      pid: 5012,
      user: 'web_client',
      clientIp: '192.168.1.5',
      duration: '0.02s',
      state: 'active',
      query: 'SELECT id, email, full_name FROM users WHERE id = 1001 LIMIT 1',
      isLongRunning: false,
    },
  ],
  killProcess: (pid) =>
    set((state) => ({
      processes: state.processes.filter((p) => p.pid !== pid),
    })),

  history: [
    {
      id: 'h-1',
      connectionName: 'ecom_prod_db',
      env: 'prod',
      sql: 'SELECT u.id, u.email, COUNT(o.id) AS total_orders\nFROM users u\nLEFT JOIN user_orders o ON u.id = o.user_id\nWHERE u.status = \'active\'\nGROUP BY u.id, u.email\nORDER BY total_orders DESC LIMIT 50;',
      timestamp: 'Today at 14:22:15',
      durationMs: 1.8,
      rowsAffected: 50,
      status: 'success',
      isFavorite: true,
    },
    {
      id: 'h-2',
      connectionName: 'staging-mysql-8',
      env: 'staging',
      sql: 'UPDATE user_orders SET status = \'refunded\', updated_at = NOW() WHERE id = 1035;',
      timestamp: 'Today at 11:05:40',
      durationMs: 4.2,
      rowsAffected: 1,
      status: 'success',
      isFavorite: false,
    },
  ],
}));
