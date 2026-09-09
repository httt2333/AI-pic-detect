const MAXIMUM_IMAGE_BYTES = 10 * 1024 * 1024;

export type SupportedImageType = 'image/png' | 'image/jpeg' | 'image/webp';

export type ImageInput = {
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export class ImageInputError extends Error {
  readonly code = 'unsupported';

  constructor(message: string) {
    super(message);
    this.name = 'ImageInputError';
  }
}

function hasPrefix(bytes: Uint8Array, expected: number[]) {
  return expected.every((byte, index) => bytes[index] === byte);
}

function hasMatchingSignature(type: SupportedImageType, bytes: Uint8Array) {
  switch (type) {
    case 'image/png':
      return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'image/jpeg':
      return hasPrefix(bytes, [0xff, 0xd8, 0xff]);
    case 'image/webp':
      return (
        hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        hasPrefix(bytes.slice(8), [0x57, 0x45, 0x42, 0x50])
      );
  }
}

function isSupportedImageType(type: string): type is SupportedImageType {
  return ['image/png', 'image/jpeg', 'image/webp'].includes(type);
}

export async function validateImageInput(
  input: ImageInput
): Promise<SupportedImageType> {
  if (input.size <= 0) {
    throw new ImageInputError('The image file is empty.');
  }

  if (input.size > MAXIMUM_IMAGE_BYTES) {
    throw new ImageInputError('The image file exceeds the 10MB limit.');
  }

  if (!isSupportedImageType(input.type)) {
    throw new ImageInputError('Only PNG, JPEG, and WebP images are supported.');
  }

  const bytes = new Uint8Array(await input.arrayBuffer());
  if (!hasMatchingSignature(input.type, bytes)) {
    throw new ImageInputError(
      'The image bytes do not match the declared type.'
    );
  }

  return input.type;
}
