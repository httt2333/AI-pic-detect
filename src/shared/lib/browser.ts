import { headers } from 'next/headers';

export async function getPathname() {
  const headersList = await headers();
  return headersList.get('x-pathname') || '';
}
