import { respData, respErr } from '@/shared/lib/resp';
import { findChatById } from '@/shared/models/chat';
import { getUserInfo } from '@/shared/models/user';

export async function POST(req: Request) {
  try {
    let { chatId } = await req.json();
    if (!chatId) {
      return respErr('chatId is required');
    }

    const user = await getUserInfo();
    if (!user) {
      return respErr('no auth, please sign in');
    }

    const chat = await findChatById(chatId);
    if (!chat) {
      return respErr('chat not found');
    }

    if (chat.userId !== user.id) {
      return respErr('no permission to access this chat');
    }

    return respData(chat);
  } catch (e: any) {
    console.log('get chat info failed:', e);
    return respErr(`get chat info failed: ${e.message}`);
  }
}
