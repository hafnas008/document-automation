-- supabase/seed.sql
-- Seed Aspect Interior as tenant #1.
-- FILL IN the four placeholders below before running this seed.

INSERT INTO tenants (id, company_name, trn_number, address, footer_text, accent_color)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Aspect Interior LLC',
  '<FILL IN: Aspect TRN>',
  '<FILL IN: Aspect address>',
  '<FILL IN: Aspect footer text — phone | email | web>',
  '#1a1a1a'
) ON CONFLICT (id) DO NOTHING;
