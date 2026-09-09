import { respData, respErr } from '@/shared/lib/resp';
import { getRemainingCredits } from '@/shared/models/credit';
import { getUserInfo } from '@/shared/models/user';

export async function POST(req: Request) {
  try {
    const user = await getUserInfo();
    if (!user) {
      return respErr('no auth, please sign in');
    }

    const credits = await getRemainingCredits(user.id);

    return respData({ remainingCredits: credits });
  } catch (e) {
    console.log('get user credits failed:', e);
    return respErr('get user credits failed');
  }
}
