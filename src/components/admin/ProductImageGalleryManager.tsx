// ============================================================================
// MEGGS KITCHEN — PRODUCT IMAGE GALLERY MANAGER COMPONENT
// File: src/components/admin/ProductImageGalleryManager.tsx
// Phase: 7 (Supabase Storage & Media Architecture)
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  Star,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Trash2,
  FolderOpen,
  Loader2,
  Maximize2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { MediaLibraryModal } from '@/components/admin/MediaLibraryModal';
import {
  STORAGE_BUCKETS,
  validateMediaFile,
  addProductImage,
  replaceProductImage,
  deleteProductImage,
  setPrimaryProductImage,
  reorderProductImages,
} from '@/lib/storage';
import type { ProductImage } from '@/lib/types';

interface ProductImageGalleryManagerProps {
  productId: string;
  productName: string;
  onGalleryUpdated?: () => void;
  className?: string;
}

export function ProductImageGalleryManager({
  productId,
  productName,
  onGalleryUpdated,
  className = '',
}: ProductImageGalleryManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [tempAltText, setTempAltText] = useState('');

  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadGallery = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      console.error('Error loading gallery images:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  // Handle Multi-file upload
  const handleFilesUpload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateMediaFile(file, STORAGE_BUCKETS.PRODUCT_IMAGES);
      if (!validation.valid) {
        toast({
          title: `Skipped ${file.name}`,
          description: validation.error,
          variant: 'destructive',
        });
        continue;
      }

      try {
        await addProductImage({
          productId,
          file,
          altText: `${productName} photo ${images.length + successCount + 1}`,
          isPrimary: images.length === 0 && successCount === 0,
          displayOrder: images.length + successCount,
        });
        successCount++;
      } catch (err) {
        toast({
          title: `Upload error (${file.name})`,
          description: err instanceof Error ? err.message : 'Upload failed',
          variant: 'destructive',
        });
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast({
        title: 'Photos Uploaded',
        description: `Successfully added ${successCount} photo${successCount > 1 ? 's' : ''} to gallery.`,
      });
      await loadGallery();
      onGalleryUpdated?.();
    }
  };

  // Handle Replacing an Image
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingId) return;

    const validation = validateMediaFile(file, STORAGE_BUCKETS.PRODUCT_IMAGES);
    if (!validation.valid) {
      toast({
        title: 'Invalid File',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    const target = images.find((img) => img.id === replacingId);
    setUploading(true);

    try {
      await replaceProductImage(replacingId, productId, file, target?.image_url);
      toast({ title: 'Photo Replaced' });
      await loadGallery();
      onGalleryUpdated?.();
    } catch (err) {
      toast({
        title: 'Replace Failed',
        description: err instanceof Error ? err.message : 'Could not replace photo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setReplacingId(null);
      e.target.value = '';
    }
  };

  // Set Cover Image / Primary
  const handleSetPrimary = async (img: ProductImage) => {
    try {
      await setPrimaryProductImage(productId, img.id, img.image_url);
      toast({ title: 'Cover photo updated' });
      await loadGallery();
      onGalleryUpdated?.();
    } catch (err) {
      toast({
        title: 'Action failed',
        description: err instanceof Error ? err.message : 'Could not set cover image',
        variant: 'destructive',
      });
    }
  };

  // Delete Image
  const handleDelete = async (img: ProductImage) => {
    if (!confirm('Are you sure you want to remove this photo from the product gallery?')) return;

    try {
      await deleteProductImage(img.id, productId, img.image_url);
      toast({ title: 'Photo removed' });
      await loadGallery();
      onGalleryUpdated?.();
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Could not remove photo',
        variant: 'destructive',
      });
    }
  };

  // Reorder Images Left / Right
  const handleMove = async (index: number, direction: 'left' | 'right') => {
    const newImages = [...images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    setImages(newImages);

    try {
      await reorderProductImages(
        productId,
        newImages.map((img) => img.id)
      );
      onGalleryUpdated?.();
    } catch (err) {
      toast({
        title: 'Reorder error',
        description: 'Failed to persist order',
        variant: 'destructive',
      });
      await loadGallery();
    }
  };

  // Save Alt Text
  const handleSaveAltText = async (imgId: string) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .update({ alt_text: tempAltText || null })
        .eq('id', imgId);

      if (error) throw error;
      toast({ title: 'Caption updated' });
      setEditingAltId(null);
      await loadGallery();
    } catch {
      toast({ title: 'Failed to update caption', variant: 'destructive' });
    }
  };

  // Add from Media Library
  const handleSelectFromLibrary = async (url: string) => {
    try {
      await addProductImage({
        productId,
        imageUrl: url,
        altText: `${productName} photo`,
        isPrimary: images.length === 0,
        displayOrder: images.length,
      });
      toast({ title: 'Photo added from library' });
      await loadGallery();
      onGalleryUpdated?.();
    } catch (err) {
      toast({
        title: 'Library pick failed',
        description: err instanceof Error ? err.message : 'Could not link photo',
        variant: 'destructive',
      });
    } finally {
      setLibraryOpen(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Controls & Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) handleFilesUpload(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-lg p-5 text-center transition-all ${
          dragOver
            ? 'border-primary-500 bg-primary-50/50 scale-[1.01]'
            : 'border-gray-300 hover:border-primary-400 bg-gray-50/60'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <div className="flex flex-col items-center justify-center">
          {uploading ? (
            <div className="flex items-center gap-2 text-primary-600 font-medium py-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading to product-images storage...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center mb-2">
                <Upload className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Drag and drop equipment photos here
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                PNG, JPG, WebP, SVG up to 10MB per image
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => multiFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded text-xs font-semibold hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload from Computer
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryOpen(true)}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-gray-500" /> Choose from Media Library
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={multiFileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
        onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
        className="hidden"
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
        onChange={handleReplaceFile}
        className="hidden"
      />

      {/* Gallery Grid */}
      {loading ? (
        <div className="py-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary-600" /> Loading product gallery...
        </div>
      ) : images.length === 0 ? (
        <div className="p-6 bg-white rounded-lg border border-gray-200 text-center">
          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
          <p className="text-sm font-medium text-gray-700">No photos in product gallery</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Add high-resolution product photos above to showcase this equipment.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>{images.length} photo{images.length > 1 ? 's' : ''} in gallery</span>
            <span>⭐ Star indicates the primary cover image</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className={`relative group bg-white rounded-lg border overflow-hidden transition-all flex flex-col ${
                  img.is_primary
                    ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={img.image_url}
                    alt={img.alt_text || productName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Primary Cover Badge */}
                  {img.is_primary && (
                    <div className="absolute top-2 left-2 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" /> COVER
                    </div>
                  )}

                  {/* Order Number Badge */}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </div>

                  {/* Quick Action Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                    {/* Zoom / Preview */}
                    <button
                      type="button"
                      onClick={() => setPreviewModalUrl(img.image_url)}
                      title="Preview full size"
                      className="p-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-md shadow-sm transition-colors"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>

                    {/* Set Primary Star */}
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img)}
                        title="Set as cover photo"
                        className="p-1.5 bg-white/90 hover:bg-primary-50 text-amber-500 hover:text-amber-600 rounded-md shadow-sm transition-colors"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}

                    {/* Replace Photo */}
                    <button
                      type="button"
                      onClick={() => {
                        setReplacingId(img.id);
                        replaceFileInputRef.current?.click();
                      }}
                      title="Replace this photo"
                      className="p-1.5 bg-white/90 hover:bg-white text-blue-600 rounded-md shadow-sm transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(img)}
                      title="Delete photo"
                      className="p-1.5 bg-white/90 hover:bg-red-50 text-red-600 rounded-md shadow-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Footer Controls: Reorder & Caption */}
                <div className="p-2 bg-white border-t border-gray-100 flex flex-col gap-1.5">
                  {/* Reordering Buttons */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'left')}
                      className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-gray-100"
                      title="Move left"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] text-gray-400">Order</span>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => handleMove(idx, 'right')}
                      className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-gray-100"
                      title="Move right"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Caption / Alt-text */}
                  {editingAltId === img.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tempAltText}
                        onChange={(e) => setTempAltText(e.target.value)}
                        placeholder="Caption / Alt text"
                        className="text-[11px] px-1.5 py-0.5 border border-primary-500 rounded w-full outline-hidden"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveAltText(img.id)}
                        className="p-1 bg-primary-600 text-white rounded text-[10px]"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingAltId(null)}
                        className="p-1 bg-gray-200 text-gray-700 rounded text-[10px]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingAltId(img.id);
                        setTempAltText(img.alt_text || '');
                      }}
                      className="text-[11px] text-gray-600 truncate cursor-pointer hover:text-primary-600 hover:underline"
                      title="Click to edit caption / alt text"
                    >
                      {img.alt_text || <span className="text-gray-400 italic">Add caption...</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white hover:bg-black rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalUrl}
              alt="High resolution preview"
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* Media Library Modal Picker */}
      {libraryOpen && (
        <MediaLibraryModal
          onSelect={handleSelectFromLibrary}
          onClose={() => setLibraryOpen(false)}
        />
      )}
    </div>
  );
}
