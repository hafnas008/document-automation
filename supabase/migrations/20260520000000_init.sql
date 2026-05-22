-- supabase/migrations/20260520000000_init.sql
-- Documentation AI v1 — initial schema
-- Convention: every domain table has id uuid pk, tenant_id uuid, created_at, updated_at.

-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. tenants ----------------------------------------------------------------
CREATE TABLE tenants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name    text NOT NULL,
  trn_number      text,
  address         text,
  logo_url        text,
  footer_text     text,
  accent_color    text DEFAULT '#1a1a1a',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. tenant_users -----------------------------------------------------------
CREATE TABLE tenant_users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'member',
  invited_by  uuid REFERENCES auth.users(id),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE TRIGGER trg_tenant_users_updated_at BEFORE UPDATE ON tenant_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Helper: resolve current user's tenant_id (used in RLS policies)
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
  SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() LIMIT 1
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. clients ----------------------------------------------------------------
CREATE TABLE clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name            text NOT NULL,
  contact_person  text,
  phone           text,
  email           text,
  address         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. projects ---------------------------------------------------------------
CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  client_id   uuid REFERENCES clients(id) ON DELETE SET NULL,
  name        text NOT NULL,
  location    text,
  status      text NOT NULL DEFAULT 'active',
  start_date  date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_tenant ON projects(tenant_id);
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. costing_sheets ---------------------------------------------------------
CREATE TABLE costing_sheets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  project_id        uuid REFERENCES projects(id) ON DELETE SET NULL,
  client_id         uuid REFERENCES clients(id) ON DELETE SET NULL,
  sheet_number      text NOT NULL,
  title             text NOT NULL,
  version           integer NOT NULL DEFAULT 1,
  parent_sheet_id   uuid REFERENCES costing_sheets(id) ON DELETE SET NULL,
  status            text NOT NULL DEFAULT 'draft',  -- draft | final
  currency          text NOT NULL DEFAULT 'AED',
  overhead_pct      numeric NOT NULL DEFAULT 10,
  profit_pct        numeric NOT NULL DEFAULT 15,
  contingency_pct   numeric NOT NULL DEFAULT 5,
  vat_pct           numeric NOT NULL DEFAULT 5,
  subtotal          numeric NOT NULL DEFAULT 0,
  grand_total       numeric NOT NULL DEFAULT 0,
  pdf_url           text,
  xlsx_url          text,
  deleted_at        timestamptz,
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('draft','final'))
);
CREATE INDEX idx_costing_sheets_tenant ON costing_sheets(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_costing_sheets_project ON costing_sheets(project_id);
CREATE TRIGGER trg_costing_sheets_updated_at BEFORE UPDATE ON costing_sheets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6. costing_items ----------------------------------------------------------
CREATE TABLE costing_items (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  sheet_id                uuid NOT NULL REFERENCES costing_sheets(id) ON DELETE CASCADE,
  section                 text NOT NULL,  -- Material | Labour | Equipment | Transport | Other
  row_index               integer NOT NULL,
  description             text NOT NULL DEFAULT '',
  item_text_normalized    text NOT NULL DEFAULT '',
  qty                     numeric NOT NULL DEFAULT 0,
  unit                    text,
  unit_rate               numeric NOT NULL DEFAULT 0,
  labour_rate             numeric,
  total                   numeric NOT NULL DEFAULT 0,
  rate_source             text NOT NULL DEFAULT 'manual', -- manual | suggested | history
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CHECK (section IN ('Material','Labour','Equipment','Transport','Other')),
  CHECK (rate_source IN ('manual','suggested','history'))
);
CREATE INDEX idx_costing_items_sheet ON costing_items(tenant_id, sheet_id, row_index);
CREATE TRIGGER trg_costing_items_updated_at BEFORE UPDATE ON costing_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. rate_history -----------------------------------------------------------
CREATE TABLE rate_history (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  item_text_normalized  text NOT NULL,
  unit                  text,
  unit_rate             numeric NOT NULL,
  sheet_id              uuid NOT NULL REFERENCES costing_sheets(id) ON DELETE CASCADE,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rate_history_lookup ON rate_history(tenant_id, item_text_normalized, unit);

-- 8. materials_catalog ------------------------------------------------------
CREATE TABLE materials_catalog (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name              text NOT NULL,
  default_unit      text,
  last_known_rate   numeric,
  category          text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE TRIGGER trg_materials_catalog_updated_at BEFORE UPDATE ON materials_catalog
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 9. labour_catalog ---------------------------------------------------------
CREATE TABLE labour_catalog (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name              text NOT NULL,
  default_unit      text,
  last_known_rate   numeric,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE TRIGGER trg_labour_catalog_updated_at BEFORE UPDATE ON labour_catalog
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 10. ai_suggestion_cache ---------------------------------------------------
CREATE TABLE ai_suggestion_cache (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  cache_key         text NOT NULL UNIQUE,
  suggested_rate    numeric NOT NULL,
  confidence        text NOT NULL,           -- high | medium | low
  evidence_json     jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at        timestamptz NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_cache_expiry ON ai_suggestion_cache(expires_at);

-- 11. generated_documents ---------------------------------------------------
CREATE TABLE generated_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  sheet_id        uuid NOT NULL REFERENCES costing_sheets(id) ON DELETE CASCADE,
  doc_type        text NOT NULL DEFAULT 'costing',
  xlsx_url        text NOT NULL,
  pdf_url         text NOT NULL,
  generated_by    uuid REFERENCES auth.users(id),
  generated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_generated_documents_recent ON generated_documents(tenant_id, sheet_id, generated_at DESC);

-- 12. audit_log -------------------------------------------------------------
CREATE TABLE audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  user_id       uuid REFERENCES auth.users(id),
  action        text NOT NULL,                -- create | update | delete | generate
  entity_type   text NOT NULL,                -- costing_sheet | costing_item | branding | etc
  entity_id     uuid,
  diff_json     jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_recent ON audit_log(tenant_id, created_at DESC);

-- Sheet number sequence per tenant
CREATE OR REPLACE FUNCTION next_sheet_number(p_tenant uuid) RETURNS text AS $$
DECLARE
  n integer;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(sheet_number,'^CS-','',''), '')::integer), 0) + 1
    INTO n
    FROM costing_sheets
   WHERE tenant_id = p_tenant
     AND sheet_number ~ '^CS-[0-9]+$';
  RETURN 'CS-' || LPAD(n::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- RLS
-- =========================================================================

ALTER TABLE tenants               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE costing_sheets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE costing_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_history          ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials_catalog     ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_catalog        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestion_cache   ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log             ENABLE ROW LEVEL SECURITY;

-- tenants: only members can SELECT their own tenant row; UPDATE allowed; no INSERT/DELETE via client
CREATE POLICY tenants_select ON tenants FOR SELECT
  USING (id = current_tenant_id());
CREATE POLICY tenants_update ON tenants FOR UPDATE
  USING (id = current_tenant_id());

-- tenant_users: read own membership
CREATE POLICY tenant_users_select ON tenant_users FOR SELECT
  USING (user_id = auth.uid() OR tenant_id = current_tenant_id());

-- generic per-tenant policies for the rest
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clients','projects','costing_sheets','costing_items',
    'rate_history','materials_catalog','labour_catalog',
    'ai_suggestion_cache','generated_documents','audit_log'
  ] LOOP
    EXECUTE format('CREATE POLICY %I_all ON %I FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())', t, t);
  END LOOP;
END $$;
