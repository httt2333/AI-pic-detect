import { and, count, desc, eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { chat } from '@/config/db/schema';

import { appendUserToResult, User } from './user';

export type Chat = typeof chat.$inferSelect & {
  user?: User;
};
export type NewChat = typeof chat.$inferInsert;
export type UpdateChat = Partial<Omit<NewChat, 'id' | 'createdAt'>>;

export enum ChatStatus {
  PENDING = 'pending',
  CREATED = 'created',
  DELETED = 'deleted',
}

export async function createChat(newChat: NewChat): Promise<Chat> {
  const [result] = await db().insert(chat).values(newChat).returning();

  return result;
}

export async function getChats({
  userId,
  status,
  page = 1,
  limit = 30,
  getUser = false,
}: {
  userId?: string;
  status?: ChatStatus;
  page?: number;
  limit?: number;
  getUser?: boolean;
}): Promise<Chat[]> {
  const result = await db()
    .select()
    .from(chat)
    .where(
      and(
        userId ? eq(chat.userId, userId) : undefined,
        status ? eq(chat.status, status) : undefined
      )
    )
    .orderBy(desc(chat.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  if (getUser) {
    return appendUserToResult(result);
  }

  return result;
}

export async function getChatsCount({
  userId,
  status,
}: {
  userId?: string;
  status?: ChatStatus;
}): Promise<number> {
  const [result] = await db()
    .select({ count: count() })
    .from(chat)
    .where(
      and(
        userId ? eq(chat.userId, userId) : undefined,
        status ? eq(chat.status, status) : undefined
      )
    );

  return result?.count || 0;
}

export async function findChatById(id: string): Promise<Chat> {
  const [result] = await db().select().from(chat).where(eq(chat.id, id));

  return result;
}

export async function updateChat(
  id: string,
  updateChat: UpdateChat
): Promise<Chat> {
  const [result] = await db()
    .update(chat)
    .set(updateChat)
    .where(eq(chat.id, id))
    .returning();

  return result;
}
