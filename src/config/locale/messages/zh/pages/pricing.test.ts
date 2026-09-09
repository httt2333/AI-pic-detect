import { describe, expect, it } from 'vitest';

import pricing from './pricing.json';

describe('AI-PIC-DETECT credit-pack pricing configuration', () => {
  it('exposes only the approved CNY one-time review packs while payment is unavailable', () => {
    const section = pricing.page.sections.pricing;

    expect(section.purchase_enabled).toBe(false);
    expect(section.groups).toEqual([
      { name: 'one-time', title: '一次性额度包' },
    ]);
    expect(section.items.map((item) => item.credits)).toEqual([10, 50, 200]);
    expect(section.items.map((item) => item.currency)).toEqual([
      'CNY',
      'CNY',
      'CNY',
    ]);
    expect(section.items.filter((item) => item.is_featured)).toHaveLength(1);
    expect(section.items.find((item) => item.is_featured)?.credits).toBe(50);
    expect(section.items.every((item) => item.amount === 0)).toBe(true);
    expect(section.items.every((item) => item.price === '价格待定')).toBe(true);
  });
});
