export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export type ImageValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validateReviewImageFile(file: File): ImageValidationResult {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return { valid: false, error: '仅支持 PNG、JPG 和 WebP 图片。' };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: '图片大小不能超过 10MB。' };
  }

  if (file.size === 0) {
    return { valid: false, error: '图片为空，请重新选择。' };
  }

  return { valid: true };
}
