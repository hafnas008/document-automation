-- supabase/migrations/20260520000002_storage_buckets.sql

-- Public read, authenticated write, 2 MB limit, image/* only
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-logos', 'tenant-logos', true, 2097152,
  ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Private: signed URLs only
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-docs', 'generated-docs', false, 20971520,
  ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload to tenant-logos under their tenant prefix
CREATE POLICY "logo upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tenant-logos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = current_tenant_id()::text
  );

CREATE POLICY "logo read" ON storage.objects FOR SELECT
  USING (bucket_id = 'tenant-logos');

CREATE POLICY "generated read own" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'generated-docs'
    AND (storage.foldername(name))[1] = current_tenant_id()::text
  );
