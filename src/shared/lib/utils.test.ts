import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
  it('combines conditional class names', () => {
    expect(cn('base', false && 'hidden', { active: true })).toBe('base active');
  });

  it('resolves conflicting Tailwind classes in favor of the last value', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
