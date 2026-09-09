import { describe, expect, it } from 'vitest';

import { VISION_API_BASELINE_CASES } from './vision-api-baseline';

describe('VISION_API_BASELINE_CASES', () => {
  it('contains uniquely identified, traceable historical review cases', () => {
    const ids = VISION_API_BASELINE_CASES.map((testCase) => testCase.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(
      VISION_API_BASELINE_CASES.every(
        (testCase) => testCase.source.reference.length > 0
      )
    ).toBe(true);
  });

  it('contains only independently traceable human-correction constraints', () => {
    expect(
      VISION_API_BASELINE_CASES.every(
        (testCase) =>
          testCase.source.verification === 'historical_human_correction'
      )
    ).toBe(true);
    expect(
      VISION_API_BASELINE_CASES.every(
        (testCase) => testCase.expected.outcome === 'no_issue'
      )
    ).toBe(true);
  });

  it('includes counterexamples that prevent fabricated or AI-origin claims', () => {
    expect(
      VISION_API_BASELINE_CASES.filter(
        (testCase) => testCase.expected.outcome === 'no_issue'
      ).length
    ).toBeGreaterThanOrEqual(3);
    expect(
      VISION_API_BASELINE_CASES.flatMap(
        (testCase) => testCase.prohibitedAssertions
      )
    ).toEqual(
      expect.arrayContaining([
        'ai_origin_determination',
        'forced_issue_count',
        'unverified_directional_claim',
      ])
    );
  });
});
