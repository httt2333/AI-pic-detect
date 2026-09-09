import { describe, expect, it } from 'vitest';

import { ImageInputError, validateImageInput } from './image-input';

function createImageInput(type: string, bytes: number[], size = bytes.length) {
  return {
    type,
    size,
    arrayBuffer: async () => Uint8Array.from(bytes).buffer,
  };
}

describe('validateImageInput', () => {
  it.each([
    ['image/png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ['image/jpeg', [0xff, 0xd8, 0xff, 0xe0]],
    [
      'image/webp',
      [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
    ],
  ])('accepts a valid %s image signature', async (type, bytes) => {
    await expect(
      validateImageInput(createImageInput(type, bytes))
    ).resolves.toBe(type);
  });

  it('rejects an unsupported declared image type', async () => {
    await expect(
      validateImageInput(createImageInput('image/gif', [0x47, 0x49, 0x46]))
    ).rejects.toMatchObject({
      code: 'unsupported',
    } satisfies Partial<ImageInputError>);
  });

  it('rejects a file whose bytes do not match its declared image type', async () => {
    await expect(
      validateImageInput(createImageInput('image/png', [0xff, 0xd8, 0xff]))
    ).rejects.toMatchObject({
      code: 'unsupported',
    } satisfies Partial<ImageInputError>);
  });

  it('rejects empty and oversized images before analysis', async () => {
    await expect(
      validateImageInput(createImageInput('image/png', [], 0))
    ).rejects.toMatchObject({
      code: 'unsupported',
    } satisfies Partial<ImageInputError>);

    await expect(
      validateImageInput(
        createImageInput(
          'image/png',
          [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
          10 * 1024 * 1024 + 1
        )
      )
    ).rejects.toMatchObject({
      code: 'unsupported',
    } satisfies Partial<ImageInputError>);
  });
});
