// ============================================================================
// MEGGS KITCHEN — MEDIA & UPLOAD VALIDATION UTILITIES
// File: src/lib/upload.ts
// ============================================================================

import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_DOC_MIMES,
  STORAGE_LIMITS,
  validateMediaFile,
  STORAGE_BUCKETS,
} from './storage';

export const ALLOWED_TYPES = ALLOWED_IMAGE_MIMES;
export const MAX_SIZE = STORAGE_LIMITS.IMAGE_MAX_SIZE;
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

export function validateUpload(
  file: File,
  isDocument = false
): { valid: boolean; error?: string } {
  const result = validateMediaFile(
    file,
    isDocument ? STORAGE_BUCKETS.DOCUMENTS : STORAGE_BUCKETS.PRODUCT_IMAGES
  );
  return {
    valid: result.valid,
    error: result.error,
  };
}

export function validateUrlExtension(url: string): boolean {
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
  return ext ? [...ALLOWED_EXTENSIONS, 'pdf', 'doc', 'docx'].includes(ext) : false;
}

export { ALLOWED_IMAGE_MIMES, ALLOWED_DOC_MIMES, STORAGE_LIMITS };
