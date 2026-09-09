import { defineConfig } from 'drizzle-kit';

import { envConfigs } from '@/config';

// get db credentials
const dbCredentials: { url: string; authToken?: string } = {
  url: envConfigs.database_url ?? '',
};
if (envConfigs.database_auth_token) {
  dbCredentials.authToken = envConfigs.database_auth_token;
}

// define config
export default defineConfig({
  out: envConfigs.db_migrations_out,
  schema: envConfigs.db_schema_file,
  dialect: envConfigs.database_provider as
    | 'sqlite'
    | 'postgresql'
    | 'mysql'
    | 'turso'
    | 'singlestore'
    | 'gel',
  dbCredentials,
  // Migration journal location (used by drizzle-kit migrate)
  migrations:
    envConfigs.database_provider === 'postgresql'
      ? {
          schema: envConfigs.db_migrations_schema,
          table: envConfigs.db_migrations_table,
        }
      : undefined,
});
