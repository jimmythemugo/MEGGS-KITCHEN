// ============================================================================
// MEGGS KITCHEN — SUPABASE STORAGE & MEDIA ARCHITECTURE ENGINE
// File: src/lib/storage.ts
// Phase: 7 (Supabase Storage & Media)
// ============================================================================

import { supabase } from '@/lib/supabase';
import type { ProductImage, ProductDocument } from '@/lib/types';

/**
 * Authoritative Supabase Storage Bucket identifiers
 */
export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  PRODUCT_IMAGES_LEGACY: 'product_images',
  SITE_IMAGES: 'site-images',
  CATEGORY_IMAGES: 'category-images',
  BRAND_IMAGES: 'brand-images',
  DOCUMENTS: 'documents',
  MEDIA_ASSETS: 'media_assets',
} as const;

export type StorageBucketKey = keyof typeof STORAGE_BUCKETS;
export type StorageBucketName = typeof STORAGE_BUCKETS[StorageBucketKey];

/**
 * File size constraints & allowed MIME types
 */
export const STORAGE_LIMITS = {
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  DOC_MAX_SIZE: 20 * 1024 * 1024,   // 20MB
  CATEGORY_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  BRAND_MAX_SIZE: 5 * 1024 * 1024,    // 5MB
};

export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
];

export const ALLOWED_DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
  extension?: string;
}

/**
 * Validates a file before upload against type and size boundaries
 */
export function validateMediaFile(
  file: File,
  bucket: StorageBucketName = STORAGE_BUCKETS.PRODUCT_IMAGES
): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Determine file limits based on bucket
  const isDocument = bucket === STORAGE_BUCKETS.DOCUMENTS;
  const maxSize = isDocument ? STORAGE_LIMITS.DOC_MAX_SIZE : STORAGE_LIMITS.IMAGE_MAX_SIZE;
  const allowedMimes = isDocument ? ALLOWED_DOC_MIMES : ALLOWED_IMAGE_MIMES;

  if (file.size > maxSize) {
    const sizeMb = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of ${sizeMb}MB.`,
    };
  }

  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type.toLowerCase();

  const isMimeAllowed = allowedMimes.some((m) => mimeType.includes(m) || m.includes(mimeType));
  const isImageExt = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(rawExt);
  const isDocExt = ['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(rawExt);

  if (isDocument && !isDocExt && !isMimeAllowed) {
    return {
      valid: false,
      error: 'Invalid document format. Allowed: PDF, DOC, DOCX, XLS, XLSX.',
    };
  }

  if (!isDocument && !isImageExt && !isMimeAllowed) {
    return {
      valid: false,
      error: 'Invalid image format. Allowed: JPEG, PNG, WebP, SVG, GIF.',
    };
  }

  // Sanitize filename to prevent directory traversal or malformed URL encodings
  const baseName = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');

  const sanitizedFilename = `${baseName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${rawExt || (isDocument ? 'pdf' : 'jpg')}`;

  return {
    valid: true,
    sanitizedFilename,
    extension: rawExt,
  };
}

export interface UploadResult {
  publicUrl: string;
  storagePath: string;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * Uploads a file directly to Supabase Storage with bucket auto-fallback
 */
export async function uploadToStorage(
  bucket: StorageBucketName,
  file: File,
  folder = 'uploads'
): Promise<UploadResult> {
  const validation = validateMediaFile(file, bucket);
  if (!validation.valid || !validation.sanitizedFilename) {
    throw new Error(validation.error || 'File validation failed');
  }

  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
  const storagePath = cleanFolder ? `${cleanFolder}/${validation.sanitizedFilename}` : validation.sanitizedFilename;

  // Try primary bucket, fallback to legacy if needed
  let uploadError = null;
  let activeBucket = bucket;

  const res = await supabase.storage
    .from(activeBucket)
    .upload(storagePath, file, {
      cacheControl: '31536000', // 1 year CDN cache
      upsert: true,
      contentType: file.type || undefined,
    });

  uploadError = res.error;

  // If primary hyphenated bucket doesn't exist yet, retry with underscore alias
  if (uploadError && /bucket not found/i.test(uploadError.message)) {
    if (activeBucket === STORAGE_BUCKETS.PRODUCT_IMAGES) {
      activeBucket = STORAGE_BUCKETS.PRODUCT_IMAGES_LEGACY;
      const retryRes = await supabase.storage
        .from(activeBucket)
        .upload(storagePath, file, { cacheControl: '31536000', upsert: true });
      uploadError = retryRes.error;
    }
  }

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(activeBucket)
    .getPublicUrl(storagePath);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to retrieve public CDN URL for uploaded asset');
  }

  return {
    publicUrl: urlData.publicUrl,
    storagePath,
    filename: validation.sanitizedFilename,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
  };
}

/**
 * Deletes a file from Supabase Storage by its public URL or storage path
 */
export async function deleteFromStorage(
  bucket: StorageBucketName,
  pathOrUrl: string
): Promise<boolean> {
  if (!pathOrUrl) return false;

  let storagePath = pathOrUrl;
  // If a full public URL was provided, extract the relative path
  if (pathOrUrl.startsWith('http')) {
    const bucketMarker = `/${bucket}/`;
    const idx = pathOrUrl.indexOf(bucketMarker);
    if (idx !== -1) {
      storagePath = pathOrUrl.substring(idx + bucketMarker.length);
    } else {
      const parts = pathOrUrl.split('/');
      storagePath = parts.slice(-2).join('/');
    }
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([storagePath]);
    if (error) {
      console.warn(`Storage delete warning for ${storagePath}:`, error.message);
    }
    return !error;
  } catch (err) {
    console.warn('Storage deletion error:', err);
    return false;
  }
}

// ----------------------------------------------------------------------------
// PRODUCT IMAGES DATABASE & STORAGE CONNECTIVITY
// ----------------------------------------------------------------------------

export interface AddProductImageParams {
  productId: string;
  file?: File;
  imageUrl?: string;
  altText?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

/**
 * Adds a new product image (uploading to product-images storage or linking an asset)
 */
export async function addProductImage({
  productId,
  file,
  imageUrl,
  altText,
  isPrimary = false,
  displayOrder,
}: AddProductImageParams): Promise<ProductImage> {
  if (!productId) throw new Error('Product ID is required');

  let finalUrl = imageUrl;

  if (file) {
    const uploadResult = await uploadToStorage(
      STORAGE_BUCKETS.PRODUCT_IMAGES,
      file,
      `products/${productId}`
    );
    finalUrl = uploadResult.publicUrl;
  }

  if (!finalUrl) {
    throw new Error('Either a file or an imageUrl must be provided');
  }

  // Calculate next display order if not specified
  let order = displayOrder;
  if (order === undefined) {
    const { count } = await supabase
      .from('product_images')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);
    order = count || 0;
  }

  // If this is set as primary or is the first image, reset other primaries
  if (isPrimary || order === 0) {
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId);
  }

  const { data, error } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      image_url: finalUrl,
      alt_text: altText || null,
      display_order: order,
      is_primary: isPrimary || order === 0,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to save product image record: ${error?.message}`);
  }

  // Sync products.image_url if primary
  if (data.is_primary) {
    await supabase
      .from('products')
      .update({ image_url: finalUrl })
      .eq('id', productId);
  }

  return data as ProductImage;
}

/**
 * Replaces an existing product image with a new uploaded file
 */
export async function replaceProductImage(
  imageId: string,
  productId: string,
  newFile: File,
  oldImageUrl?: string
): Promise<ProductImage> {
  const uploadResult = await uploadToStorage(
    STORAGE_BUCKETS.PRODUCT_IMAGES,
    newFile,
    `products/${productId}`
  );

  const { data, error } = await supabase
    .from('product_images')
    .update({
      image_url: uploadResult.publicUrl,
    })
    .eq('id', imageId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update product image: ${error?.message}`);
  }

  // If replaced image was primary, update products.image_url
  if (data.is_primary) {
    await supabase
      .from('products')
      .update({ image_url: uploadResult.publicUrl })
      .eq('id', productId);
  }

  // Asynchronously clean up old storage asset if it was hosted in our bucket
  if (oldImageUrl && oldImageUrl !== uploadResult.publicUrl) {
    deleteFromStorage(STORAGE_BUCKETS.PRODUCT_IMAGES, oldImageUrl).catch(() => {});
  }

  return data as ProductImage;
}

/**
 * Sets a specific image as the product's primary cover image
 */
export async function setPrimaryProductImage(
  productId: string,
  imageId: string,
  imageUrl: string
): Promise<void> {
  // Reset all images for this product to non-primary
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId);

  // Set selected image as primary
  const { error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId);

  if (error) {
    throw new Error(`Failed to set primary image: ${error.message}`);
  }

  // Keep products.image_url in lockstep
  await supabase
    .from('products')
    .update({ image_url: imageUrl })
    .eq('id', productId);
}

/**
 * Reorders product gallery images sequentially
 */
export async function reorderProductImages(
  productId: string,
  orderedImageIds: string[]
): Promise<void> {
  const updatePromises = orderedImageIds.map((id, index) =>
    supabase
      .from('product_images')
      .update({ display_order: index })
      .eq('id', id)
      .eq('product_id', productId)
  );

  await Promise.all(updatePromises);
}

/**
 * Deletes a product image and re-assigns primary if needed
 */
export async function deleteProductImage(
  imageId: string,
  productId: string,
  imageUrl?: string
): Promise<void> {
  // Check if target was primary
  const { data: targetImg } = await supabase
    .from('product_images')
    .select('is_primary')
    .eq('id', imageId)
    .single();

  const wasPrimary = targetImg?.is_primary;

  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId);

  if (error) {
    throw new Error(`Failed to delete product image: ${error.message}`);
  }

  // If deleted image was primary, elevate the first remaining image to primary
  if (wasPrimary) {
    const { data: remaining } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true })
      .limit(1);

    if (remaining && remaining.length > 0) {
      const nextPrimary = remaining[0];
      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', nextPrimary.id);

      await supabase
        .from('products')
        .update({ image_url: nextPrimary.image_url })
        .eq('id', productId);
    } else {
      // No remaining images
      await supabase
        .from('products')
        .update({ image_url: '' })
        .eq('id', productId);
    }
  }

  // Cleanup storage file
  if (imageUrl) {
    deleteFromStorage(STORAGE_BUCKETS.PRODUCT_IMAGES, imageUrl).catch(() => {});
  }
}

// ----------------------------------------------------------------------------
// PRODUCT DOCUMENTS DATABASE & STORAGE CONNECTIVITY
// ----------------------------------------------------------------------------

export interface AddProductDocumentParams {
  productId: string;
  file?: File;
  documentUrl?: string;
  documentName: string;
  documentType?: string;
  displayOrder?: number;
}

export async function addProductDocument({
  productId,
  file,
  documentUrl,
  documentName,
  documentType = 'pdf',
  displayOrder = 0,
}: AddProductDocumentParams): Promise<ProductDocument> {
  if (!productId) throw new Error('Product ID is required');

  let finalUrl = documentUrl;
  let fileSize: number | null = null;

  if (file) {
    const uploadResult = await uploadToStorage(
      STORAGE_BUCKETS.DOCUMENTS,
      file,
      `specs/${productId}`
    );
    finalUrl = uploadResult.publicUrl;
    fileSize = uploadResult.size;
  }

  if (!finalUrl) {
    throw new Error('Either a document file or documentUrl is required');
  }

  const { data, error } = await supabase
    .from('product_documents')
    .insert({
      product_id: productId,
      document_name: documentName,
      document_url: finalUrl,
      document_type: documentType,
      file_size: fileSize,
      display_order: displayOrder,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to save document record: ${error?.message}`);
  }

  return data as ProductDocument;
}
