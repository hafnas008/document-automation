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

CREATE POLICY "logo update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'tenant-logos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = current_tenant_id()::text
  )
  WITH CHECK (
    bucket_id = 'tenant-logos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = current_tenant_id()::text
  );

CREATE POLICY "logo delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tenant-logos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = current_tenant_id()::text
  );

-- NOTE: generated-docs writes are performed server-side using the service_role key
-- (see apps/web/lib/supabase/admin.ts). service_role bypasses RLS, so no
-- INSERT/UPDATE/DELETE policies are needed here. SELECT policy below scopes
-- end-user reads to their own tenant folder.
CREATE POLICY "generated read own" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'generated-docs'
    AND (storage.foldername(name))[1] = current_tenant_id()::text
  );
