import { betterAuth, BetterAuthOptions } from 'better-auth';

import { getAllConfigs } from '@/shared/models/config';

import { getAuthOptions } from './config';

// get auth instance in server side
export async function getAuth() {
  // get configs from db and env
  const configs = await getAllConfigs();

  const authOptions = await getAuthOptions(configs);

  return betterAuth(authOptions as BetterAuthOptions);
}
