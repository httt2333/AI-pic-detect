import { describe, expect, it } from 'vitest';

import { shouldLoadAccountPricingState } from './pricing-access';

describe('shouldLoadAccountPricingState', () => {
  it('does not query account or database state while purchases are disabled', () => {
    expect(shouldLoadAccountPricingState(false)).toBe(false);
  });

  it('loads account state only when purchasing is explicitly enabled', () => {
    expect(shouldLoadAccountPricingState(true)).toBe(true);
    expect(shouldLoadAccountPricingState(undefined)).toBe(false);
  });
});
