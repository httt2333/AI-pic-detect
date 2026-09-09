import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { buildMigrationCorpusIndex } from '../src/features/analyze/migration-corpus';

const [inputPath, outputPath] = process.argv.slice(2);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && !Array.isArray(value) && typeof value === 'object';
}

async function main() {
  if (!inputPath || !outputPath) {
    throw new Error(
      'Usage: tsx scripts/build-migration-corpus-index.ts <input.jsonl> <output.json>'
    );
  }

  const source = await readFile(resolve(inputPath), 'utf8');
  const records = source
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        const parsed: unknown = JSON.parse(line);
        if (!isRecord(parsed)) {
          throw new Error('expected an object');
        }
        return parsed;
      } catch {
        throw new Error(`Invalid JSONL record at line ${index + 1}`);
      }
    });

  const destination = resolve(outputPath);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(
    destination,
    `${JSON.stringify(buildMigrationCorpusIndex(records), null, 2)}\n`,
    'utf8'
  );

  console.log(
    `Wrote sanitized migration corpus index with ${records.length} source records.`
  );
}

void main();
