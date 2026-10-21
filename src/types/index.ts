export type DatabaseEngine = 'postgres' | 'mysql' | 'redis' | 'snowflake';
export type EnvironmentTag = 'prod' | 'staging' | 'local';

export interface ConnectionProfile {
  id: string;
  name: string;
  engine: DatabaseEngine;
  env: EnvironmentTag;
  host: string;
  port: number;
  database: string;
  username: string;
  active: boolean;
  latencyMs: number;
}

export interface GridRow {
  id: number;
  user_id: number;
  customer_name: string;
  product_sku: string;
  order_details: Record<string, any>;
  total_amount: number;
  created_at: string;
  status: string;
  isDirty?: boolean;
  dirtyFields?: Record<string, boolean>;
  rowState?: 'clean' | 'modified' | 'inserted' | 'deleted';
}

export interface PendingChange {
  rowId: number;
  tableName: string;
  field: string;
  oldValue: any;
  newValue: any;
  type: 'update' | 'insert' | 'delete';
}

export interface ProcessItem {
  pid: number;
  user: string;
  clientIp: string;
  duration: string;
  state: 'active' | 'idle in txn' | 'locked';
  query: string;
  isLongRunning?: boolean;
}

export interface QueryHistoryItem {
  id: string;
  connectionName: string;
  env: EnvironmentTag;
  sql: string;
  timestamp: string;
  durationMs: number;
  rowsAffected: number;
  status: 'success' | 'error';
  errorMessage?: string;
  isFavorite: boolean;
}
