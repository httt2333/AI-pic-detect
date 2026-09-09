import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

import { envConfigs } from '@/config';
import { isCloudflareWorker } from '@/shared/lib/env';

// SQLite/libsql singleton (only used when DB_SINGLETON_ENABLED === 'true' and not in Workers)
let sqliteDbInstance: ReturnType<typeof drizzle> | null = null;

// get sqlite db instance (works for both local sqlite file:... and turso/libsql://...)
export function getSqliteDb() {
  const databaseUrl = envConfigs.database_url;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  // custom options
  const options: Record<string, string> = {};
  if (envConfigs.database_auth_token) {
    options.authToken = envConfigs.database_auth_token;
  }

  // In Cloudflare Workers, create new connection each time (avoid cross-request state)
  if (isCloudflareWorker) {
    const client = createClient({
      url: databaseUrl,
      ...options,
    });
    return drizzle({ client });
  }

  // Singleton mode: reuse existing instance
  if (envConfigs.db_singleton_enabled === 'true') {
    if (sqliteDbInstance) return sqliteDbInstance;

    const client = createClient({
      url: databaseUrl,
      ...options,
    });
    sqliteDbInstance = drizzle({ client });
    return sqliteDbInstance;
  }

  // Non-singleton mode: create new connection each time
  const client = createClient({
    url: databaseUrl,
    ...options,
  });
  return drizzle({ client });
}
