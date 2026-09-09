export const isProduction = process.env.NODE_ENV === 'production';

export const isCloudflareWorker =
  typeof globalThis !== 'undefined' && 'Cloudflare' in globalThis;
