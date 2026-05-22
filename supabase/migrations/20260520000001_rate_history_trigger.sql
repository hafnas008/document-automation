-- supabase/migrations/20260520000001_rate_history_trigger.sql
-- When a costing_sheet flips from draft -> final, freeze its items into rate_history.

CREATE OR REPLACE FUNCTION freeze_rate_history() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'draft' AND NEW.status = 'final' THEN
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
  AFTER UPDATE ON costing_sheets
  FOR EACH ROW EXECUTE FUNCTION freeze_rate_history();
