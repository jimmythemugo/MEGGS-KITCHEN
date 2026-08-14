import { describe, it, expect } from 'vitest';
import {
  validateMediaFile,
  STORAGE_BUCKETS,
  STORAGE_LIMITS,
  ALLOWED_IMAGE_MIMES,
  ALLOWED_DOC_MIMES,
} from './storage';

function makeFile(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe('validateMediaFile', () => {
  it('rejects a missing file', () => {
    expect(validateMediaFile(undefined as unknown as File).valid).toBe(false);
  });

  it('accepts a valid image within size limits', () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1024);
    const result = validateMediaFile(file, STORAGE_BUCKETS.PRODUCT_IMAGES);
    expect(result.valid).toBe(true);
    expect(result.sanitizedFilename).toMatch(/\.jpg$/);
  });

  it('rejects an image exceeding the size limit', () => {
    const tooBig = STORAGE_LIMITS.IMAGE_MAX_SIZE + 1;
    const file = makeFile('big.jpg', 'image/jpeg', tooBig);
    const result = validateMediaFile(file, STORAGE_BUCKETS.PRODUCT_IMAGES);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/exceeds/i);
  });

  it('rejects an unsupported image extension', () => {
    const file = makeFile('evil.exe', 'application/octet-stream', 1024);
    const result = validateMediaFile(file, STORAGE_BUCKETS.PRODUCT_IMAGES);
    expect(result.valid).toBe(false);
  });

  it('accepts a valid document in the documents bucket', () => {
    const file = makeFile('spec.pdf', 'application/pdf', 1024);
    const result = validateMediaFile(file, STORAGE_BUCKETS.DOCUMENTS);
    expect(result.valid).toBe(true);
  });
});

describe('storage constants', () => {
  it('exposes allowed image and document MIME lists', () => {
    expect(ALLOWED_IMAGE_MIMES).toContain('image/jpeg');
    expect(ALLOWED_DOC_MIMES).toContain('application/pdf');
  });

  it('uses hyphenated primary product-images bucket name', () => {
    expect(STORAGE_BUCKETS.PRODUCT_IMAGES).toBe('product-images');
    expect(STORAGE_BUCKETS.PRODUCT_IMAGES_LEGACY).toBe('product_images');
  });
});
