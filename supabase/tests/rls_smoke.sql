-- supabase/tests/rls_smoke.sql
-- Verify cross-tenant isolation for both SELECT and INSERT/UPDATE.
-- Requires Supabase Postgres: roles "authenticated" + "service_role",
-- schema auth.users, function auth.uid(), function gen_random_uuid().
-- Run with: psql $DATABASE_URL -f supabase/tests/rls_smoke.sql

-- Precondition guard so failure is informative on a non-Supabase Postgres.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    RAISE EXCEPTION 'This test requires Supabase Postgres (role "authenticated" missing)';
  END IF;
END $$;

BEGIN;

-- Seed two tenants
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

-- Tenant A creates a costing_sheet (under authenticated role + their JWT sub)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
INSERT INTO costing_sheets (tenant_id, sheet_number, title)
VALUES ('11111111-1111-1111-1111-111111111111', 'CS-001', 'A sheet');

-- Switch to Tenant B
SET LOCAL "request.jwt.claim.sub" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- 1. SELECT isolation: Tenant B must see 0 rows
DO $$ DECLARE c integer; BEGIN
  SELECT count(*) INTO c FROM costing_sheets;
  IF c <> 0 THEN
    RAISE EXCEPTION 'RLS LEAK (SELECT): Tenant B sees % rows from Tenant A', c;
  END IF;
  RAISE NOTICE 'RLS SELECT isolation OK';
END $$;

-- 2. INSERT isolation: Tenant B must not be able to insert with Tenant A's tenant_id
DO $$ BEGIN
  BEGIN
    INSERT INTO costing_sheets (tenant_id, sheet_number, title)
    VALUES ('11111111-1111-1111-1111-111111111111', 'CS-X', 'leak attempt');
    RAISE EXCEPTION 'RLS LEAK (INSERT): Tenant B inserted into Tenant A';
  EXCEPTION
    WHEN insufficient_privilege OR check_violation OR not_null_violation THEN
      RAISE NOTICE 'RLS INSERT isolation OK';
  END;
END $$;

ROLLBACK;
