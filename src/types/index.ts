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

export interface TabItem {
  id: string;
  type: 'grid' | 'schema' | 'sql' | 'stats' | 'connection';
  title: string;
  tableName?: string;
  queryId?: number;
  sqlContent?: string;
  canClose?: boolean;
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

export interface ColumnDefinition {
  name: string;
  type: string;
  isNullable: boolean;
  defaultValue?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignTable?: string;
  foreignColumn?: string;
  comment?: string;
}

export interface TableIndexDefinition {
  name: string;
  columns: string[];
  type: 'BTREE' | 'GIN' | 'HASH' | 'GIST';
  isUnique: boolean;
  isPrimary?: boolean;
  size?: string;
}

export interface TableForeignKeyDefinition {
  name: string;
  column: string;
  foreignTable: string;
  foreignColumn: string;
  onUpdate: string;
  onDelete: string;
}

export interface TableSchemaInfo {
  tableName: string;
  schema: string;
  engine: string;
  rowCount: string;
  totalSize: string;
  columns: ColumnDefinition[];
  indexes: TableIndexDefinition[];
  foreignKeys: TableForeignKeyDefinition[];
  ddl: string;
}
