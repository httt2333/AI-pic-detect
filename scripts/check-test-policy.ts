import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import { evaluateTestPolicy as evaluateChanges } from './test-policy.mjs';

export type TestPolicyResult = {
  productionChanges: string[];
  requiresTestChange: boolean;
  passes: boolean;
};

export function evaluateTestPolicy(changedFiles: string[]): TestPolicyResult {
  const result = evaluateChanges(
    changedFiles.map((path) => ({ status: 'M', path }))
  );
  const productionChanges = result.productionChanges;
  const requiresTestChange = productionChanges.length > 0;
  const passes = result.ok;

  return {
    productionChanges,
    requiresTestChange,
    passes,
  };
}

function run(): void {
  const base = process.env.TEST_POLICY_BASE;
  if (!base) {
    console.log(
      'TEST_POLICY_BASE is not set; skipping changed-file policy check.'
    );
    return;
  }

  let changedFiles: string[];
  try {
    changedFiles = execFileSync(
      'git',
      ['diff', '--name-only', `${base}...HEAD`],
      {
        encoding: 'utf8',
      }
    )
      .split(/\r?\n/u)
      .filter(Boolean);
  } catch {
    console.error(`Unable to compare HEAD with TEST_POLICY_BASE=${base}.`);
    process.exitCode = 1;
    return;
  }

  const result = evaluateTestPolicy(changedFiles);
  if (!result.passes) {
    console.error(
      'Production code changed without an accompanying automated test change:'
    );
    result.productionChanges.forEach((file) => console.error(`- ${file}`));
    console.error(
      'Add or update a test, or document an approved exception in the pull request.'
    );
    process.exitCode = 1;
    return;
  }

  console.log('Changed-file test policy passed.');
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  run();
}
