import { describe, expect, it } from 'vitest';

import { md5 } from './hash';

describe('md5', () => {
  it.each([
    ['', 'd41d8cd98f00b204e9800998ecf8427e'],
    ['hello', '5d41402abc4b2a76b9719d911017c592'],
    ['你好', '7eca689f0d3389d9dea66ae112e5cfd7'],
  ])('hashes the UTF-8 string %j', (input, expected) => {
    expect(md5(input)).toBe(expected);
  });

  it('produces the same digest for equivalent byte inputs', () => {
    const bytes = new TextEncoder().encode('image-bytes');

    expect(md5(bytes)).toBe(md5(bytes.buffer));
  });
});
