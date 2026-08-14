-- ============================================================================
-- MEGGS KITCHEN — PHASE 7: SUPABASE STORAGE & MEDIA ARCHITECTURE
-- Migration: 20260814000006_storage_media_architecture.sql
-- Description: Provision authoritative storage buckets, secure RLS upload policies,
--              file type validations, and storage object permissions.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROVISION STORAGE BUCKETS
-- Product images, site images, category images, brand images, and documents
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  -- 1. Product Images Bucket (10MB max, standard web image formats)
  (
    'product-images',
    'product-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
  ),
  -- Backward-compatible alias for existing references
  (
    'product_images',
    'product_images',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
  ),
  -- 2. Site Images Bucket (Hero banners, promo banners, layout assets)
  (
    'site-images',
    'site-images',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
  ),
  -- 3. Category Images Bucket (Category cards, megamenu thumbnails)
  (
    'category-images',
    'category-images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  ),
  -- 4. Brand Images Bucket (Manufacturer logos, partner badges)
  (
    'brand-images',
    'brand-images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  ),
  -- 5. Documents Bucket (Commercial PDF spec sheets, CAD drawings, manuals)
  (
    'documents',
    'documents',
    true,
    20971520, -- 20MB
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  ),
  -- Media Library general assets bucket
  (
    'media_assets',
    'media_assets',
    true,
    20971520,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'application/pdf']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- 2. STORAGE OBJECTS ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public Read for all public storage areas
DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Product Images Hyphen" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Site Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Category Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Brand Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Media Assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Read All" ON storage.objects;

CREATE POLICY "Public Storage Read All"
  ON storage.objects FOR SELECT
  USING (
    bucket_id IN (
      'product-images',
      'product_images',
      'site-images',
      'category-images',
      'brand-images',
      'documents',
      'media_assets'
    )
  );

-- Policy 2: Authenticated Staff & Owner Upload Permissions
DROP POLICY IF EXISTS "Staff Upload Media" ON storage.objects;
DROP POLICY IF EXISTS "Staff Upload Storage Objects" ON storage.objects;

CREATE POLICY "Staff Upload Storage Objects"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN (
      'product-images',
      'product_images',
      'site-images',
      'category-images',
      'brand-images',
      'documents',
      'media_assets'
    )
    AND (
      public.is_staff_or_owner() OR
      auth.role() = 'authenticated'
    )
  );

-- Policy 3: Authenticated Staff & Owner Update Permissions
DROP POLICY IF EXISTS "Staff Update Media" ON storage.objects;
DROP POLICY IF EXISTS "Staff Update Storage Objects" ON storage.objects;

CREATE POLICY "Staff Update Storage Objects"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN (
      'product-images',
      'product_images',
      'site-images',
      'category-images',
      'brand-images',
      'documents',
      'media_assets'
    )
    AND (
      public.is_staff_or_owner() OR
      auth.role() = 'authenticated'
    )
  );

-- Policy 4: Authenticated Staff & Owner Delete Permissions
DROP POLICY IF EXISTS "Staff Delete Media" ON storage.objects;
DROP POLICY IF EXISTS "Staff Delete Storage Objects" ON storage.objects;

CREATE POLICY "Staff Delete Storage Objects"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN (
      'product-images',
      'product_images',
      'site-images',
      'category-images',
      'brand-images',
      'documents',
      'media_assets'
    )
    AND (
      public.is_staff_or_owner() OR
      auth.role() = 'authenticated'
    )
  );
