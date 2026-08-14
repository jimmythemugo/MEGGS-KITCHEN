-- ============================================================================
-- MEGGS KITCHEN — SUPABASE STORAGE BUCKETS & POLICIES
-- Migration: 20260814000003_storage_buckets.sql
-- Description: Provision storage buckets for product imagery, media library,
--              commercial PDF spec sheets, and invoices.
-- ============================================================================

-- Create storage buckets if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product_images', 'product_images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('media_assets', 'media_assets', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'application/pdf']),
  ('documents', 'documents', true, 20971520, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('invoice_pdfs', 'invoice_pdfs', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- STORAGE SECURITY POLICIES
-- ----------------------------------------------------------------------------

-- Public read access for public buckets
CREATE POLICY "Public Read Product Images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product_images');

CREATE POLICY "Public Read Media Assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media_assets');

CREATE POLICY "Public Read Documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

-- Authenticated / Staff upload to product_images and media_assets
CREATE POLICY "Staff Upload Media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('product_images', 'media_assets', 'documents', 'invoice_pdfs'));

CREATE POLICY "Staff Update Media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('product_images', 'media_assets', 'documents', 'invoice_pdfs'));

CREATE POLICY "Staff Delete Media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('product_images', 'media_assets', 'documents', 'invoice_pdfs'));
