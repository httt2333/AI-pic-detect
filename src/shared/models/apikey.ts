import { and, count, desc, eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { apikey } from '@/config/db/schema';

import { appendUserToResult, User } from './user';

export type Apikey = typeof apikey.$inferSelect & {
  user?: User;
};
export type NewApikey = typeof apikey.$inferInsert;
export type UpdateApikey = Partial<Omit<NewApikey, 'id' | 'createdAt'>>;

export enum ApikeyStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
}

export const createApikey = async (newApikey: NewApikey): Promise<Apikey> => {
  const [result] = await db().insert(apikey).values(newApikey).returning();
  return result;
};

export async function getApikeys({
  getUser,
  userId,
  status,
  page = 1,
  limit = 30,
}: {
  getUser?: boolean;
  userId?: string;
  status?: ApikeyStatus;
  page?: number;
  limit?: number;
}): Promise<Apikey[]> {
  const result = await db()
    .select()
    .from(apikey)
    .where(
      and(
        userId ? eq(apikey.userId, userId) : undefined,
        status ? eq(apikey.status, status) : undefined
      )
    )
    .orderBy(desc(apikey.createdAt))
    .offset((page - 1) * limit)
    .limit(limit);

  if (getUser) {
    return appendUserToResult(result);
  }

  return result;
}

export async function getApikeysCount({
  userId,
  status,
}: {
  userId?: string;
  status?: ApikeyStatus;
}): Promise<number> {
  const [result] = await db()
    .select({ count: count() })
    .from(apikey)
    .where(
      and(
        userId ? eq(apikey.userId, userId) : undefined,
        status ? eq(apikey.status, status) : undefined
      )
    );

  return result?.count || 0;
}

export async function findApikeyById(id: string): Promise<Apikey> {
  const [result] = await db().select().from(apikey).where(eq(apikey.id, id));

  return result;
}

export async function findApikeyByKey(key: string): Promise<Apikey> {
  const [result] = await db()
    .select()
    .from(apikey)
    .where(and(eq(apikey.key, key), eq(apikey.status, ApikeyStatus.ACTIVE)));

  return result;
}

export const updateApikey = async (
  id: string,
  updateApikey: UpdateApikey
): Promise<Apikey> => {
  const [result] = await db()
    .update(apikey)
    .set(updateApikey)
    .where(eq(apikey.id, id))
    .returning();

  return result;
};
