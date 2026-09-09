import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2';

import { envConfigs } from '@/config';
import { isCloudflareWorker } from '@/shared/lib/env';

// Global database connection instance (singleton pattern)
let dbInstance: ReturnType<typeof drizzle> | null = null;
let pool: ReturnType<typeof mysql.createPool> | null = null;

export function getMysqlDb() {
  let databaseUrl = envConfigs.database_url;

  let isHyperdrive = false;

  if (isCloudflareWorker) {
    const { env }: { env: any } = { env: {} };
    // Detect if set Hyperdrive
    isHyperdrive = 'HYPERDRIVE' in env;

    if (isHyperdrive) {
      const hyperdrive = env.HYPERDRIVE;
      databaseUrl = hyperdrive.connectionString;
      console.log('using Hyperdrive connection');
    }
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  // In Cloudflare Workers, create new connection each time
  if (isCloudflareWorker) {
    console.log('in Cloudflare Workers environment');
    // Workers environment uses minimal configuration
    const client = mysql.createConnection({
      uri: databaseUrl,
      connectionLimit: 1,
      enableKeepAlive: true,
      waitForConnections: true,
    });

    return drizzle({ client });
  }

  // Singleton mode: reuse existing connection (good for traditional servers and serverless warm starts)
  if (envConfigs.db_singleton_enabled === 'true') {
    // Return existing instance if already initialized
    if (dbInstance) {
      return dbInstance;
    }

    // Create connection pool only once
    pool = mysql.createPool({
      uri: databaseUrl,
      connectionLimit: Number(envConfigs.db_max_connections) || 1, // Maximum connections in pool (default 1)
      enableKeepAlive: true,
      waitForConnections: true,
    });

    dbInstance = drizzle({ client: pool });
    return dbInstance;
  }

  // Non-singleton mode: create new connection each time (good for serverless)
  // In serverless, the connection will be cleaned up when the function instance is destroyed
  const serverlessClient = mysql.createConnection({
    uri: databaseUrl,
    connectionLimit: 1,
    enableKeepAlive: true,
    waitForConnections: true,
  });

  return drizzle(serverlessClient);
}

// Optional: Function to close database connection (useful for testing or graceful shutdown)
// Note: Only works in singleton mode
export async function closeMysqlDb() {
  if (envConfigs.db_singleton_enabled && pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
  }
}
