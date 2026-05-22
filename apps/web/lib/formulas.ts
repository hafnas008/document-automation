export type Section = 'Material' | 'Labour' | 'Equipment' | 'Transport' | 'Other';

export interface CostingItemRow {
  section: Section;
  qty: number;
  unit_rate: number;
  labour_rate: number | null;
}

export interface CostingTotalsInput {
  items: CostingItemRow[];
  overhead_pct: number;
  profit_pct: number;
  contingency_pct: number;
  vat_pct: number;
}

export interface CostingTotalsOutput {
  section_subtotals: Record<Section, number>;
  subtotal: number;
  overhead: number;
  profit: number;
  contingency: number;
  pre_vat: number;
  vat: number;
  grand_total: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function itemTotal(row: CostingItemRow): number {
  const effectiveRate = row.section === 'Labour' && row.labour_rate != null
    ? row.unit_rate + row.labour_rate
    : row.unit_rate;
  return round2(row.qty * effectiveRate);
}

export function computeTotals(input: CostingTotalsInput): CostingTotalsOutput {
  const section_subtotals: Record<Section, number> = {
    Material: 0, Labour: 0, Equipment: 0, Transport: 0, Other: 0,
  };
  for (const row of input.items) {
    section_subtotals[row.section] = round2(section_subtotals[row.section] + itemTotal(row));
  }
  const subtotal = round2(
    section_subtotals.Material + section_subtotals.Labour +
    section_subtotals.Equipment + section_subtotals.Transport + section_subtotals.Other
  );
  const overhead    = round2(subtotal * input.overhead_pct / 100);
  const profit      = round2(subtotal * input.profit_pct / 100);
  const contingency = round2(subtotal * input.contingency_pct / 100);
  const pre_vat     = round2(subtotal + overhead + profit + contingency);
  const vat         = round2(pre_vat * input.vat_pct / 100);
  const grand_total = round2(pre_vat + vat);

  return { section_subtotals, subtotal, overhead, profit, contingency, pre_vat, vat, grand_total };
}
