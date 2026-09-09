import { respData, respErr } from '@/shared/lib/resp';
import { isEmailVerified } from '@/shared/models/user';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '')
      .trim()
      .toLowerCase();
    if (!email) {
      return respErr('email is required');
    }

    const emailVerified = await isEmailVerified(email);

    return respData({ emailVerified });
  } catch (e) {
    console.log('check email verified failed:', e);
    return respErr('check email verified failed');
  }
}
