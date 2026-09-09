import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { config } from 'dotenv';

import { runEvoLinkSingleDimensionSpike } from '../src/features/analyze/evolink-single-dimension-spike';

const MIME_TYPES: Readonly<Record<string, string>> = {
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  config({ path: '.env.local', quiet: true });

  const imagePath = process.argv[2];
  if (!imagePath) {
    throw new Error('Usage: pnpm spike:evolink:single-dimension <image-path>');
  }

  const resolvedImagePath = resolve(imagePath);
  const mimeType = MIME_TYPES[extname(resolvedImagePath).toLowerCase()];
  if (!mimeType) {
    throw new Error('Only JPEG, PNG, and WebP images are supported.');
  }

  const imageBase64 = (await readFile(resolvedImagePath)).toString('base64');
  const result = await runEvoLinkSingleDimensionSpike({
    apiKey: requiredEnvironmentValue('EVOLINK_API_KEY'),
    baseUrl: requiredEnvironmentValue('EVOLINK_GEMINI_BASE_URL'),
    model: requiredEnvironmentValue('EVOLINK_GEMINI_MODEL'),
    imageBase64,
    mimeType,
    instruction: requiredEnvironmentValue('EVOLINK_SPIKE_INSTRUCTION'),
  });

  console.log(JSON.stringify(result));
}

void main().catch(() => {
  console.error('Single-dimension spike could not be started.');
  process.exitCode = 1;
});
