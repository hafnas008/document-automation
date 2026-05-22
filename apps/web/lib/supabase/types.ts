// Hand-written DB types for v1. Generate from supabase later if useful.
export type SheetStatus = 'draft' | 'final';
export type ItemSection = 'Material' | 'Labour' | 'Equipment' | 'Transport' | 'Other';
export type RateSource = 'manual' | 'suggested' | 'history';

export interface DbTenant {
  id: string;
  company_name: string;
  trn_number: string | null;
  address: string | null;
  logo_url: string | null;
  footer_text: string | null;
  accent_color: string;
}
export interface DbCostingSheet {
  id: string;
  tenant_id: string;
  project_id: string | null;
  client_id: string | null;
  sheet_number: string;
  title: string;
  version: number;
  parent_sheet_id: string | null;
  status: SheetStatus;
  currency: string;
  overhead_pct: number;
  profit_pct: number;
  contingency_pct: number;
  vat_pct: number;
  subtotal: number;
  grand_total: number;
  pdf_url: string | null;
  xlsx_url: string | null;
  deleted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
export interface DbCostingItem {
  id: string;
  tenant_id: string;
  sheet_id: string;
  section: ItemSection;
  row_index: number;
  description: string;
  item_text_normalized: string;
  qty: number;
  unit: string | null;
  unit_rate: number;
  labour_rate: number | null;
  total: number;
  rate_source: RateSource;
}
