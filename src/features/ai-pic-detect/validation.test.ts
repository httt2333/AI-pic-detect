import { describe, expect, it } from 'vitest';

import { MAX_IMAGE_SIZE_BYTES, validateReviewImageFile } from './validation';

describe('validateReviewImageFile', () => {
  it.each([
    ['character.png', 'image/png'],
    ['character.jpg', 'image/jpeg'],
    ['character.webp', 'image/webp'],
  ])('accepts supported image %s', (name, type) => {
    const file = new File(['image'], name, { type });

    expect(validateReviewImageFile(file)).toEqual({ valid: true });
  });

  it('rejects formats outside the P0 contract', () => {
    const file = new File(['image'], 'character.gif', { type: 'image/gif' });

    expect(validateReviewImageFile(file)).toEqual({
      valid: false,
      error: '仅支持 PNG、JPG 和 WebP 图片。',
    });
  });

  it('rejects images that exceed the size limit', () => {
    const file = new File(
      [new Uint8Array(MAX_IMAGE_SIZE_BYTES + 1)],
      'large.png',
      { type: 'image/png' }
    );

    expect(validateReviewImageFile(file)).toEqual({
      valid: false,
      error: '图片大小不能超过 10MB。',
    });
  });
});
