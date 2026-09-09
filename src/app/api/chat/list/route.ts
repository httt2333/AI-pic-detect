import { respData, respErr } from '@/shared/lib/resp';
import { ChatStatus, getChats, getChatsCount } from '@/shared/models/chat';
import { getUserInfo } from '@/shared/models/user';

export async function POST(req: Request) {
  try {
    let { page, limit } = await req.json();
    if (!page) {
      page = 1;
    }
    if (!limit) {
      limit = 30;
    }

    const user = await getUserInfo();
    if (!user) {
      return respErr('no auth, please sign in');
    }

    const chats = await getChats({
      userId: user.id,
      status: ChatStatus.CREATED,
      page,
      limit,
    });
    const total = await getChatsCount({
      userId: user.id,
      status: ChatStatus.CREATED,
    });

    return respData({
      list: chats,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  } catch (e: any) {
    console.log('get chat list failed:', e);
    return respErr(`get chat list failed: ${e.message}`);
  }
}
