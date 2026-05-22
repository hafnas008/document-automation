-- supabase/migrations/20260520000001_rate_history_trigger.sql
-- When a costing_sheet flips from draft -> final, freeze its items into rate_history.
-- Idempotent: re-finalizing a sheet does not duplicate rows.

CREATE OR REPLACE FUNCTION freeze_rate_history() RETURNS trigger AS $$
BEGIN
  -- Only insert if we haven't already frozen this sheet's items
  IF NOT EXISTS (SELECT 1 FROM rate_history WHERE sheet_id = NEW.id) THEN
    INSERT INTO rate_history (tenant_id, item_text_normalized, unit, unit_rate, sheet_id)
    SELECT tenant_id, item_text_normalized, unit, unit_rate, sheet_id
      FROM costing_items
     WHERE sheet_id = NEW.id
       AND item_text_normalized <> ''
       AND unit_rate > 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_freeze_rate_history
  AFTER UPDATE OF status ON costing_sheets
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'final')
  EXECUTE FUNCTION freeze_rate_history();
