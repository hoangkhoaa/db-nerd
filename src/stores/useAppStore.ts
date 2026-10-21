import { create } from 'zustand';
import { ConnectionProfile, GridRow, ProcessItem, QueryHistoryItem } from '../types';

interface AppState {
  activeTab: 'grid' | 'sql' | 'stats';
  setActiveTab: (tab: 'grid' | 'sql' | 'stats') => void;

  appMode: 'sql' | 'redis' | 'snowflake';
  setAppMode: (mode: 'sql' | 'redis' | 'snowflake') => void;

  activeConnection: ConnectionProfile;
  setActiveConnection: (conn: ConnectionProfile) => void;

  isConnectionModalOpen: boolean;
  setConnectionModalOpen: (open: boolean) => void;

  isHistoryModalOpen: boolean;
  setHistoryModalOpen: (open: boolean) => void;

  isTransactionOpen: boolean;
  setTransactionOpen: (open: boolean) => void;

  pendingEditsCount: number;
  incrementPending: () => void;
  resetPending: () => void;

  selectedTable: string;
  setSelectedTable: (tbl: string) => void;

  rows: GridRow[];
  updateRow: (id: number, field: keyof GridRow, value: any) => void;

  processes: ProcessItem[];
  killProcess: (pid: number) => void;

  history: QueryHistoryItem[];
}

export const useAppStore = create<AppState>((set) => ({
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

  isTransactionOpen: true,
  setTransactionOpen: (open) => set({ isTransactionOpen: open }),

  pendingEditsCount: 1,
  incrementPending: () => set((state) => ({ pendingEditsCount: state.pendingEditsCount + 1 })),
  resetPending: () => set({ pendingEditsCount: 0 }),

  selectedTable: 'user_orders',
  setSelectedTable: (tbl) => set({ selectedTable: tbl }),

  rows: [
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
    },
  ],
  updateRow: (id, field, value) =>
    set((state) => ({
      rows: state.rows.map((r) => (r.id === id ? { ...r, [field]: value, isDirty: true } : r)),
      pendingEditsCount: state.pendingEditsCount + 1,
    })),

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
