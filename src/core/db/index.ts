import { envConfigs } from '@/config';

import { closeMysqlDb, getMysqlDb } from './mysql';
import { closePostgresDb, getPostgresDb } from './postgres';
import { getSqliteDb } from './sqlite';

const mysqlCompatProxyCache = new WeakMap<object, any>();
const sqliteCompatProxyCache = new WeakMap<object, any>();

/**
 * Global fallback for Drizzle `.returning()` on dialects that don't support it (notably MySQL).
 *
 * Many call sites do: `db().insert(...).values(...).returning()`.
 * In MySQL, `.returning()` does not exist, so we polyfill it by:
 * - capturing the `.values()` / `.set()` payload
 * - executing the query
 * - returning `[payload]`
 *
 * This keeps code changes minimal while remaining compatible with Postgres/SQLite
 * (where the native `.returning()` is used).
 */
function withMysqlCompat<T extends object>(dbInstance: T): T {
  if (dbInstance && typeof dbInstance === 'object') {
    const cached = mysqlCompatProxyCache.get(dbInstance);
    if (cached) return cached as T;
  }

  const wrapQuery = (query: any, ctx: { payload?: any }) => {
    if (!query || typeof query !== 'object') return query;

    return new Proxy(query, {
      get(target, prop, receiver) {
        // MySQL doesn't support `onConflictDoUpdate`; Drizzle uses `onDuplicateKeyUpdate`.
        // Polyfill it so call sites can stay dialect-agnostic.
        if (
          prop === 'onConflictDoUpdate' &&
          typeof (target as any).onConflictDoUpdate !== 'function' &&
          typeof (target as any).onDuplicateKeyUpdate === 'function'
        ) {
          return (cfg: any) => {
            const res = (target as any).onDuplicateKeyUpdate({
              set: cfg?.set,
            });
            return wrapQuery(res, ctx);
          };
        }

        // If this dialect doesn't implement `.returning()`, provide a fallback.
        if (
          prop === 'returning' &&
          typeof (target as any).returning !== 'function'
        ) {
          return async (..._args: any[]) => {
            // Ensure the query actually runs.
            await (target as any);
            if (ctx.payload === undefined) return [];
            return Array.isArray(ctx.payload) ? ctx.payload : [ctx.payload];
          };
        }

        const value = Reflect.get(target, prop, receiver);
        if (typeof value !== 'function') return value;

        return (...args: any[]) => {
          // Capture best-effort payload for return value fallback.
          if (prop === 'values' || prop === 'set') {
            ctx.payload = args[0];
          }

          const res = value.apply(target, args);
          // Keep wrapping to preserve chaining.
          return wrapQuery(res, ctx);
        };
      },
    });
  };

  const proxied = new Proxy(dbInstance, {
    get(target, prop, receiver) {
      // Wrap transaction callback so `tx` is also polyfilled (returning + onConflictDoUpdate).
      if (prop === 'transaction') {
        const original = Reflect.get(target, prop, receiver);
        if (typeof original !== 'function') return original;

        return (fn: any, ...rest: any[]) => {
          return original.call(
            target,
            (tx: any) => fn(withMysqlCompat(tx)),
            ...rest
          );
        };
      }

      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;

      // Only wrap mutation builders; everything else is passed through.
      if (prop !== 'insert' && prop !== 'update' && prop !== 'delete') {
        return value.bind(target);
      }

      return (...args: any[]) => {
        const res = value.apply(target, args);
        return wrapQuery(res, {});
      };
    },
  }) as any as T;

  if (dbInstance && typeof dbInstance === 'object') {
    mysqlCompatProxyCache.set(dbInstance, proxied);
  }

  return proxied;
}

/**
 * SQLite/Turso compatibility shim:
 * - SQLite doesn't support row-level locking; Drizzle's select builder may not implement `.for()`.
 *   We polyfill `.for(...)` as a no-op to keep call sites portable.
 */
function withSqliteCompat<T extends object>(dbInstance: T): T {
  if (dbInstance && typeof dbInstance === 'object') {
    const cached = sqliteCompatProxyCache.get(dbInstance);
    if (cached) return cached as T;
  }

  const wrapQuery = (query: any) => {
    if (!query || typeof query !== 'object') return query;

    return new Proxy(query, {
      get(target, prop, receiver) {
        // `.for('update')` is not meaningful in SQLite; treat it as no-op when missing.
        if (prop === 'for' && typeof (target as any).for !== 'function') {
          return (..._args: any[]) => receiver;
        }

        const value = Reflect.get(target, prop, receiver);
        if (typeof value !== 'function') return value;

        return (...args: any[]) => {
          const res = value.apply(target, args);
          return wrapQuery(res);
        };
      },
    });
  };

  const proxied = new Proxy(dbInstance, {
    get(target, prop, receiver) {
      // Wrap transaction callback so `tx` is also shimmed.
      if (prop === 'transaction') {
        const original = Reflect.get(target, prop, receiver);
        if (typeof original !== 'function') return original;
        return (fn: any, ...rest: any[]) =>
          original.call(target, (tx: any) => fn(withSqliteCompat(tx)), ...rest);
      }

      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;

      // Wrap select builders so `.for()` can be polyfilled on the built query.
      if (typeof prop === 'string' && prop.startsWith('select')) {
        return (...args: any[]) => wrapQuery(value.apply(target, args));
      }

      return value.bind(target);
    },
  }) as any as T;

  if (dbInstance && typeof dbInstance === 'object') {
    sqliteCompatProxyCache.set(dbInstance, proxied);
  }

  return proxied;
}

/**
 * Universal DB accessor.
 *
 * Drizzle returns different DB types for Postgres vs SQLite/libsql.
 * If we return a union here, TypeScript can't call methods like `db().insert(...)`
 * because the overloads are incompatible across dialects.
 *
 * So we intentionally return `any` to keep call sites stable.
 */
export function db(): any {
  if (['sqlite', 'turso'].includes(envConfigs.database_provider)) {
    return withSqliteCompat(getSqliteDb() as any);
  }

  if (envConfigs.database_provider === 'mysql') {
    return withMysqlCompat(getMysqlDb() as any);
  }

  return getPostgresDb() as any;
}

export function dbPostgres(): ReturnType<typeof getPostgresDb> {
  if (envConfigs.database_provider !== 'postgresql') {
    throw new Error('Database provider is not PostgreSQL');
  }

  return getPostgresDb();
}

export function dbMysql(): ReturnType<typeof getMysqlDb> {
  if (envConfigs.database_provider !== 'mysql') {
    throw new Error('Database provider is not MySQL');
  }

  return getMysqlDb();
}

export function dbSqlite(): ReturnType<typeof getSqliteDb> {
  if (!['sqlite', 'turso'].includes(envConfigs.database_provider)) {
    throw new Error('Database provider is not SQLite');
  }

  return getSqliteDb();
}

export async function closeDb() {
  if (envConfigs.database_provider === 'postgresql') {
    await closePostgresDb();
    return;
  }

  if (envConfigs.database_provider === 'mysql') {
    await closeMysqlDb();
    return;
  }
}
