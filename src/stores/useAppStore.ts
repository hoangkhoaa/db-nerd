import { create } from 'zustand';
import { ConnectionProfile, GridRow, ProcessItem, QueryHistoryItem } from '../types';

interface AppState {
  activeTab: 'grid' | 'schema' | 'sql' | 'stats';
  setActiveTab: (tab: 'grid' | 'schema' | 'sql' | 'stats') => void;

  appMode: 'sql' | 'redis' | 'snowflake';
  setAppMode: (mode: 'sql' | 'redis' | 'snowflake') => void;

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

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'grid',
  setActiveTab: (tab) => set({ activeTab: tab }),

  appMode: 'sql',
  setAppMode: (mode) => set({ appMode: mode }),

  activeConnection: {
    id: 'conn-1',
    name: 'ecom_prod_db',
    engine: 'postgres',
    env: 'prod',
    host: 'aurora-cluster.eu-west-1.rds.amazonaws.com',
    port: 5432,
    database: 'ecom_prod_db',
    username: 'app_master',
    active: true,
    latencyMs: 1.8,
  },
  setActiveConnection: (conn) => set({ activeConnection: conn }),

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
