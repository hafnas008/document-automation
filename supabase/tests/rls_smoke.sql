-- supabase/tests/rls_smoke.sql
-- Verify cross-tenant SELECT returns 0 rows.
-- Run with: psql $DATABASE_URL -f supabase/tests/rls_smoke.sql

BEGIN;

-- Seed two tenants and one user per tenant
INSERT INTO tenants (id, company_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'TenantA'),
  ('22222222-2222-2222-2222-222222222222', 'TenantB');

-- Pretend auth.users rows (Supabase normally provides these)
INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a@test.local'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b@test.local')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_users (tenant_id, user_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Tenant A creates a costing_sheet
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
INSERT INTO costing_sheets (tenant_id, sheet_number, title)
VALUES ('11111111-1111-1111-1111-111111111111', 'CS-001', 'A sheet');

-- Switch to Tenant B
SET LOCAL "request.jwt.claim.sub" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
DO $$ DECLARE c integer; BEGIN
  SELECT count(*) INTO c FROM costing_sheets;
  IF c <> 0 THEN
    RAISE EXCEPTION 'RLS LEAK: Tenant B sees % rows from Tenant A', c;
  END IF;
  RAISE NOTICE 'RLS smoke OK: cross-tenant SELECT returned 0 rows';
END $$;

ROLLBACK;
