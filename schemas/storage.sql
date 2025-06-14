-- ========== Supabase Storage Configuration ==========
-- Storage bucket for AI-generated images
-- This replaces the previous base64 storage approach with proper file storage

-- ========== Create Storage Bucket ==========
-- Create the generated-images bucket for storing AI-generated images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-images',
  'generated-images', 
  true, -- Public bucket for easy access
  52428800, -- 50MB file size limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp']
) ON CONFLICT (id) DO NOTHING;

-- ========== Storage Security Policies ==========
-- Create RLS policies for storage.objects table

-- Policy 1: Allow authenticated users to upload images
CREATE POLICY "Allow authenticated image uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'generated-images');

-- Policy 2: Allow public read access to generated images  
CREATE POLICY "Allow public image access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'generated-images');

-- Policy 3: Allow authenticated users to update images
CREATE POLICY "Allow authenticated image updates" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'generated-images')
WITH CHECK (bucket_id = 'generated-images');

-- Policy 4: Allow authenticated users to delete images
CREATE POLICY "Allow authenticated image deletion" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'generated-images');

-- ========== Storage Helper Functions ==========

-- Function to generate unique filename for images
CREATE OR REPLACE FUNCTION generate_image_filename(
  file_extension TEXT DEFAULT 'png'
)
RETURNS TEXT AS $$
BEGIN
  RETURN 'generated-' || extract(epoch from now())::bigint || '-' || 
         substr(md5(random()::text), 1, 8) || '.' || file_extension;
END;
$$ LANGUAGE plpgsql;

-- Function to get old generated images for cleanup
CREATE OR REPLACE FUNCTION get_old_generated_images(
  days_old INTEGER DEFAULT 30
)
RETURNS TABLE(file_name TEXT, file_created_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT name::TEXT, created_at
  FROM storage.objects 
  WHERE bucket_id = 'generated-images' 
  AND created_at < (NOW() - INTERVAL '1 day' * days_old);
END;
$$ LANGUAGE plpgsql;

-- Function to get storage statistics
CREATE OR REPLACE FUNCTION get_generated_images_stats()
RETURNS TABLE(
  total_files BIGINT,
  total_size_bytes BIGINT,
  oldest_file_date TIMESTAMPTZ,
  newest_file_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_files,
    COALESCE(SUM(metadata->>'size')::BIGINT, 0) as total_size_bytes,
    MIN(created_at) as oldest_file_date,
    MAX(created_at) as newest_file_date
  FROM storage.objects 
  WHERE bucket_id = 'generated-images';
END;
$$ LANGUAGE plpgsql;

-- ========== Comments and Documentation ==========
COMMENT ON FUNCTION generate_image_filename(TEXT) IS 'Generates unique filename for AI-generated images with timestamp and random hash';
COMMENT ON FUNCTION get_old_generated_images(INTEGER) IS 'Returns list of generated images older than specified days for cleanup purposes';
COMMENT ON FUNCTION get_generated_images_stats() IS 'Returns statistics about generated images in storage';

-- ========== Storage Configuration Validation ==========
-- Verify bucket was created successfully
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'generated-images'
  ) THEN
    RAISE EXCEPTION 'Failed to create generated-images storage bucket';
  END IF;
  
  RAISE NOTICE 'Generated images storage bucket configured successfully';
  RAISE NOTICE 'Storage policies have been created for the generated-images bucket';
END $$;