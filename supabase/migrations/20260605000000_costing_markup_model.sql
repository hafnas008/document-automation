-- Costing markup model (Step #2) — Hafnas's real costing logic.
-- Additive: keeps existing columns; adds header + markup fields.
ALTER TABLE costing_sheets
  ADD COLUMN IF NOT EXISTS client_name   text,
  ADD COLUMN IF NOT EXISTS done_by       text,
  ADD COLUMN IF NOT EXISTS doc_date      date,
  ADD COLUMN IF NOT EXISTS project_size  text,
  ADD COLUMN IF NOT EXISTS markup_pct    numeric NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS labour_cnc    numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_selling numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS photo_url     text;
