import { describe, it, expect } from 'vitest';
import { itemTotal, computeTotals, type CostingItemRow, type CostingTotalsInput } from './formulas';

describe('itemTotal', () => {
  it('material row: qty * unit_rate', () => {
    expect(itemTotal({ section: 'Material', qty: 100, unit_rate: 5, labour_rate: null })).toBe(500);
  });
  it('labour row with labour_rate: qty * (unit_rate + labour_rate)', () => {
    expect(itemTotal({ section: 'Labour', qty: 100, unit_rate: 3, labour_rate: 2 })).toBe(500);
  });
  it('labour row without labour_rate: qty * unit_rate', () => {
    expect(itemTotal({ section: 'Labour', qty: 100, unit_rate: 3, labour_rate: null })).toBe(300);
  });
  it('zero qty', () => {
    expect(itemTotal({ section: 'Material', qty: 0, unit_rate: 99, labour_rate: null })).toBe(0);
  });
});

describe('computeTotals', () => {
  const items: CostingItemRow[] = [
    { section: 'Material', qty: 100, unit_rate: 10, labour_rate: null },
    { section: 'Labour',   qty:  50, unit_rate:  4, labour_rate: null },
    { section: 'Equipment',qty:   1, unit_rate: 50, labour_rate: null },
  ];
  const input: CostingTotalsInput = {
    items,
    overhead_pct: 10,
    profit_pct: 15,
    contingency_pct: 5,
    vat_pct: 5,
  };

  it('subtotal sums all item totals', () => {
    expect(computeTotals(input).subtotal).toBe(1250);
  });

  it('overhead, profit, contingency stack on subtotal', () => {
    const t = computeTotals(input);
    expect(t.overhead).toBe(125);
    expect(t.profit).toBe(187.5);
    expect(t.contingency).toBe(62.5);
    expect(t.pre_vat).toBe(1625);
  });

  it('VAT applies on pre_vat', () => {
    const t = computeTotals(input);
    expect(t.vat).toBe(81.25);
    expect(t.grand_total).toBe(1706.25);
  });

  it('section subtotals are exposed', () => {
    const t = computeTotals(input);
    expect(t.section_subtotals.Material).toBe(1000);
    expect(t.section_subtotals.Labour).toBe(200);
    expect(t.section_subtotals.Equipment).toBe(50);
    expect(t.section_subtotals.Transport).toBe(0);
    expect(t.section_subtotals.Other).toBe(0);
  });

  it('rounds to 2 decimals', () => {
    const t = computeTotals({ ...input, items: [{ section: 'Material', qty: 3, unit_rate: 3.333, labour_rate: null }] });
    expect(t.subtotal).toBe(10.00);
  });
});
