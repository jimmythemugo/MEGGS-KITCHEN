// ============================================================================
// MEGGS KITCHEN — IMAGE & FILE UPLOAD UI COMPONENT
// File: src/components/ui/image-upload.tsx
// Phase: 7 (Supabase Storage & Media Architecture)
// ============================================================================

import { useRef, useState } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  FolderOpen,
  RefreshCw,
  Maximize2,
  FileText,
} from 'lucide-react';
import { MediaLibraryModal } from '@/components/admin/MediaLibraryModal';
import {
  STORAGE_BUCKETS,
  validateMediaFile,
  uploadToStorage,
  type StorageBucketName,
} from '@/lib/storage';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  bucket?: StorageBucketName;
  className?: string;
  accept?: string;
  helpText?: string;
  isDocument?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  label = 'Image',
  folder = 'general',
  bucket = STORAGE_BUCKETS.SITE_IMAGES,
  className = '',
  accept = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml',
  helpText,
  isDocument = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const targetBucket = isDocument ? STORAGE_BUCKETS.DOCUMENTS : bucket;

  async function uploadFile(file: File) {
    setError(null);

    const validation = validateMediaFile(file, targetBucket);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);

    try {
      const result = await uploadToStorage(targetBucket, file, folder);
      onChange(result.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleRemove() {
    onChange('');
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative group border border-gray-200 rounded-lg p-2 bg-gray-50/50">
          <div className="relative w-full h-44 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
            {isDocument ? (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <FileText className="w-12 h-12 text-primary-600 mb-2" />
                <span className="text-xs font-mono text-gray-700 max-w-xs truncate">
                  {value.split('/').pop()}
                </span>
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-primary-600 hover:underline font-medium"
                >
                  View Document ↗
                </a>
              </div>
            ) : (
              <img
                src={value}
                alt="Uploaded media preview"
                className="w-full h-full object-contain"
              />
            )}

            {/* Quick Actions Overlay */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isDocument && (
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  title="Expand preview"
                  className="p-1.5 bg-black/70 text-white rounded-md hover:bg-black transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleRemove}
                title="Remove"
                className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${uploading ? 'animate-spin' : ''}`} />
                {uploading ? 'Uploading...' : 'Replace'}
              </button>

              {!isDocument && (
                <button
                  type="button"
                  onClick={() => setLibraryOpen(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> Media Library
                </button>
              )}
            </div>

            <span className="text-[10px] text-gray-400 font-mono truncate max-w-[180px]">
              {value.split('/').pop()}
            </span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`w-full rounded-lg border-2 border-dashed transition-all ${
            dragOver
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          } ${uploading ? 'pointer-events-none' : ''}`}
        >
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="h-32 flex flex-col items-center justify-center cursor-pointer p-4 text-center"
          >
            {uploading ? (
              <>
                <Loader2 className="w-7 h-7 text-primary-500 animate-spin mb-2" />
                <p className="text-sm text-gray-600 font-medium">Uploading to storage...</p>
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center mb-1.5">
                  <Upload className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-xs font-semibold text-gray-700">
                  Click to upload or drag & drop
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {helpText || (isDocument ? 'PDF, Word, Excel up to 20MB' : 'PNG, JPG, WebP, SVG up to 10MB')}
                </p>
              </>
            )}
          </div>

          {!isDocument && (
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className="w-full py-2 text-xs text-gray-500 hover:text-primary-600 font-medium border-t border-gray-200 flex items-center justify-center gap-1.5 bg-gray-50/50 hover:bg-gray-100 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Or choose from Media Library
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Lightbox Preview */}
      {previewOpen && value && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white hover:bg-black rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={value}
              alt="High resolution view"
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* Media Library Picker Modal */}
      {libraryOpen && (
        <MediaLibraryModal
          currentValue={value}
          onSelect={(url) => {
            onChange(url);
            setLibraryOpen(false);
          }}
          onClose={() => setLibraryOpen(false)}
        />
      )}
    </div>
  );
}

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  folder?: string;
  bucket?: StorageBucketName;
  className?: string;
}

export function MultiImageUpload({
  value,
  onChange,
  label = 'Images',
  folder = 'gallery',
  bucket = STORAGE_BUCKETS.PRODUCT_IMAGES,
  className = '',
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: FileList) {
    setError(null);
    setUploading(true);

    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const validation = validateMediaFile(file, bucket);
        if (!validation.valid) {
          setError(validation.error || 'Invalid file');
          setUploading(false);
          return;
        }

        const result = await uploadToStorage(bucket, file, folder);
        urls.push(result.publicUrl);
      }
      onChange([...value, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {value.map((url, i) => (
          <div key={i} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow opacity-0 group-hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500">Add</span>
            </>
          )}
        </div>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
