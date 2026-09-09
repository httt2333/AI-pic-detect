import { describe, expect, it } from 'vitest';

import { evaluateTestPolicy } from './test-policy.mjs';

describe('evaluateTestPolicy', () => {
  it('rejects production changes without an added or modified test', () => {
    const result = evaluateTestPolicy([
      { status: 'M', path: 'src/shared/lib/hash.ts' },
    ]);

    expect(result.ok).toBe(false);
    expect(result.productionChanges).toEqual(['src/shared/lib/hash.ts']);
  });

  it('accepts production changes with an added or modified test', () => {
    const result = evaluateTestPolicy([
      { status: 'M', path: 'src/shared/lib/hash.ts' },
      { status: 'A', path: 'src/shared/lib/hash.test.ts' },
    ]);

    expect(result.ok).toBe(true);
  });

  it('does not treat deleting the only test as satisfying the policy', () => {
    const result = evaluateTestPolicy([
      { status: 'M', path: 'src/shared/lib/hash.ts' },
      { status: 'D', path: 'src/shared/lib/hash.test.ts' },
    ]);

    expect(result.ok).toBe(false);
  });

  it('allows documentation and declaration-only changes without tests', () => {
    const result = evaluateTestPolicy([
      { status: 'M', path: 'README.md' },
      { status: 'M', path: 'src/shared/types/blocks/common.d.ts' },
    ]);

    expect(result.ok).toBe(true);
    expect(result.productionChanges).toEqual([]);
  });

  it('recognizes integration and browser tests outside src', () => {
    const result = evaluateTestPolicy([
      { status: 'M', path: 'src/app/api/analyze/route.ts' },
      { status: 'M', path: 'tests/analyze.integration.ts' },
      { status: 'M', path: 'e2e/analyze.spec.ts' },
    ]);

    expect(result.ok).toBe(true);
  });
});
