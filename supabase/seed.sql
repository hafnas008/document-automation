-- supabase/seed.sql
-- Seed Aspect Interior as tenant #1.
-- All four branding fields ship as benign placeholders below.
-- The user updates them via /settings/branding after first login (the auth
-- middleware enforces the branding gate so PDF generation can't fire until
-- logo + company_name + trn are all real).

INSERT INTO tenants (id, company_name, trn_number, address, footer_text, accent_color)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Aspect Interior LLC',
  'TBD-TRN-EDIT-IN-UI',
  'TBD address — edit in /settings/branding',
  'TBD footer — phone | email | website',
  '#1a1a1a'
) ON CONFLICT (id) DO NOTHING;
