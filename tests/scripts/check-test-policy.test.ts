import { describe, expect, it } from 'vitest';

import { evaluateTestPolicy } from '../../scripts/check-test-policy';

describe('evaluateTestPolicy', () => {
  it('requires a test change when production source changes', () => {
    expect(evaluateTestPolicy(['src/app/api/analyze/route.ts'])).toEqual({
      productionChanges: ['src/app/api/analyze/route.ts'],
      requiresTestChange: true,
      passes: false,
    });
  });

  it('passes when a source change is accompanied by a test', () => {
    expect(
      evaluateTestPolicy([
        'src/app/api/analyze/route.ts',
        'src/app/api/analyze/route.test.ts',
      ])
    ).toEqual({
      productionChanges: ['src/app/api/analyze/route.ts'],
      requiresTestChange: true,
      passes: true,
    });
  });

  it('does not require a test for documentation, declarations, or test-only changes', () => {
    expect(
      evaluateTestPolicy([
        'README.md',
        'src/shared/types/result.d.ts',
        'src/app/api/analyze/route.test.ts',
      ])
    ).toEqual({
      productionChanges: [],
      requiresTestChange: false,
      passes: true,
    });
  });
});
