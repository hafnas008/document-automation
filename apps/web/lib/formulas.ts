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

/* ── Markup model (Step #2 — Hafnas's real costing logic) ──────────────
   total_cost    = qty × cost_unit (per item)
   cost_base     = Σ item costs + labour_cnc
   total_selling = cost_base × (1 + markup/100)
   profit        = selling − cost ; margin = profit / selling × 100
   Reverse:  margin% M → markup = M/(100−M)×100 ; profit P → markup = P/cost×100 */
export interface MarkupItem { qty: number; cost_unit: number; }
export interface MarkupTotals {
  items_cost: number; labour_cnc: number; total_cost: number;
  total_selling: number; profit: number; margin: number;
}
export function lineCost(qty: number, costUnit: number): number {
  return round2((Number(qty) || 0) * (Number(costUnit) || 0));
}
export function computeMarkupTotals(items: MarkupItem[], labourCnc: number, markupPct: number): MarkupTotals {
  const items_cost = round2(items.reduce((s, i) => s + lineCost(i.qty, i.cost_unit), 0));
  const labour_cnc = round2(Number(labourCnc) || 0);
  const total_cost = round2(items_cost + labour_cnc);
  const total_selling = round2(total_cost * (1 + (Number(markupPct) || 0) / 100));
  const profit = round2(total_selling - total_cost);
  const margin = total_selling > 0 ? round2((profit / total_selling) * 100) : 0;
  return { items_cost, labour_cnc, total_cost, total_selling, profit, margin };
}
/** margin % → markup % (avoids /0 at 100%). */
export function marginToMarkup(marginPct: number): number {
  const M = Number(marginPct) || 0;
  if (M >= 100) return 0;
  return round2((M / (100 - M)) * 100);
}
/** target profit amount → markup % given total cost. */
export function profitToMarkup(profit: number, totalCost: number): number {
  if (!totalCost) return 0;
  return round2(((Number(profit) || 0) / totalCost) * 100);
}

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
