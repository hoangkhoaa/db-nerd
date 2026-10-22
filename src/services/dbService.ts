import { invoke } from '@tauri-apps/api/core';
import { ConnectionProfile } from '../types';

export interface DbConfigPayload {
  engine: string;
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
}

export interface RealQueryResult {
  success: boolean;
  columns: string[];
  rows: any[];
  duration_ms: number;
  rows_affected: number;
  error?: string;
}

export interface RealTestResult {
  success: boolean;
  message: string;
  latency_ms: number;
  version?: string;
}

export interface RealTableSummary {
  name: string;
  count: string;
}

export const profileToConfig = (profile: ConnectionProfile): DbConfigPayload => {
  // If user has default placeholder password and host is localhost, resolve to docker dev credentials
  let password = profile.password;
  if (!password || password === '••••••••••••') {
    if (profile.engine === 'postgres' || profile.engine === 'mysql') {
      password = 'dev_password';
    } else {
      password = '';
    }
  }

  let username = profile.username;
  if (!username) {
    username = profile.engine === 'postgres' ? 'dev_user' : profile.engine === 'mysql' ? 'dev_user' : 'default';
  }

  return {
    engine: profile.engine,
    host: profile.host === '127.0.0.1' ? 'localhost' : (profile.host || 'localhost'),
    port: profile.port,
    database: profile.database || (profile.engine === 'postgres' ? 'ecom_prod_db' : profile.engine === 'mysql' ? 'analytics_staging' : '0'),
    username,
    password,
  };
};

export async function testRealConnection(profile: ConnectionProfile): Promise<RealTestResult> {
  try {
    const config = profileToConfig(profile);
    const res = await invoke<RealTestResult>('test_connection', { config });
    return res;
  } catch (err: any) {
    return {
      success: false,
      message: String(err?.message || err),
      latency_ms: 0,
    };
  }
}

export async function executeRealQuery(profile: ConnectionProfile, query: string): Promise<RealQueryResult> {
  try {
    const config = profileToConfig(profile);
    const res = await invoke<RealQueryResult>('execute_query', { config, query });
    return res;
  } catch (err: any) {
    return {
      success: false,
      columns: ['error'],
      rows: [{ error: String(err?.message || err) }],
      duration_ms: 0,
      rows_affected: 0,
      error: String(err?.message || err),
    };
  }
}

export async function getRealTables(profile: ConnectionProfile): Promise<RealTableSummary[]> {
  try {
    const config = profileToConfig(profile);
    const res = await invoke<RealTableSummary[]>('get_tables', { config });
    return res;
  } catch {
    return [];
  }
}
