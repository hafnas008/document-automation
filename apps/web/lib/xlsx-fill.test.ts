import { describe, it, expect, beforeAll } from 'vitest';
import XlsxPopulate from 'xlsx-populate';
import { fillCostingXlsx, type FillInput } from './xlsx-fill';

/** Build a synthetic template in memory with the named ranges xlsx-fill expects. */
async function buildFixtureTemplate(): Promise<Buffer> {
  const wb = await XlsxPopulate.fromBlankAsync();
  const sheet = wb.sheet(0);

  const named: Array<[string, string]> = [
    ['COMPANY_NAME', 'B2'], ['TRN', 'B3'], ['ADDRESS', 'B4'], ['FOOTER', 'A50'],
    ['SHEET_NUMBER', 'F2'], ['TITLE', 'B6'], ['DATE', 'F3'], ['CLIENT_NAME', 'B7'],
    ['OVERHEAD_PCT', 'E45'], ['PROFIT_PCT', 'E46'],
    ['CONTINGENCY_PCT', 'E47'], ['VAT_PCT', 'E48'],
    ['SUBTOTAL', 'F44'], ['GRAND_TOTAL', 'F49'],
    ['ITEMS_START', 'A10'],
  ];
  for (const [name, addr] of named) {
    wb.definedName(name, sheet.cell(addr));
  }
  return (await wb.outputAsync('nodebuffer')) as Buffer;
}

const sampleInput: FillInput = {
  tenant: {
    company_name: 'Aspect Interior LLC',
    trn_number: '100123456789',
    address: 'Dubai, UAE',
    footer_text: '+971 50 000 0000 | hello@aspect.example',
    logo_url: null,
  },
  sheet: {
    sheet_number: 'CS-001',
    title: 'Villa Painting',
    overhead_pct: 10,
    profit_pct: 15,
    contingency_pct: 5,
    vat_pct: 5,
  },
  client_name: 'Al Furjan Villa Owner',
  items: [
    { section: 'Material', description: 'Premium emulsion paint', qty: 2500, unit: 'sqft', unit_rate: 6.5, labour_rate: null },
    { section: 'Labour',   description: 'Painting labour',         qty: 2500, unit: 'sqft', unit_rate: 3,   labour_rate: null },
  ],
};

let template: Buffer;
beforeAll(async () => { template = await buildFixtureTemplate(); });

describe('fillCostingXlsx', () => {
  it('returns a Buffer', async () => {
    const out = await fillCostingXlsx(template, sampleInput);
    expect(out).toBeInstanceOf(Buffer);
    expect(out.length).toBeGreaterThan(1000);
  });

  it('writes COMPANY_NAME named range', async () => {
    const out = await fillCostingXlsx(template, sampleInput);
    const wb = await XlsxPopulate.fromDataAsync(out);
    expect(wb.definedName('COMPANY_NAME')?.value()).toBe('Aspect Interior LLC');
  });

  it('writes SHEET_NUMBER, TITLE, CLIENT_NAME', async () => {
    const out = await fillCostingXlsx(template, sampleInput);
    const wb = await XlsxPopulate.fromDataAsync(out);
    expect(wb.definedName('SHEET_NUMBER')?.value()).toBe('CS-001');
    expect(wb.definedName('TITLE')?.value()).toBe('Villa Painting');
    expect(wb.definedName('CLIENT_NAME')?.value()).toBe('Al Furjan Villa Owner');
  });

  it('writes percentages and totals', async () => {
    const out = await fillCostingXlsx(template, sampleInput);
    const wb = await XlsxPopulate.fromDataAsync(out);
    expect(wb.definedName('OVERHEAD_PCT')?.value()).toBe(10);
    expect(wb.definedName('PROFIT_PCT')?.value()).toBe(15);
    expect(wb.definedName('VAT_PCT')?.value()).toBe(5);
    // Subtotal = 2500*6.5 + 2500*3 = 16250 + 7500 = 23750
    expect(wb.definedName('SUBTOTAL')?.value()).toBe(23750);
  });

  it('writes all item rows starting at ITEMS_START', async () => {
    const out = await fillCostingXlsx(template, sampleInput);
    const wb = await XlsxPopulate.fromDataAsync(out);
    const anchor = wb.definedName('ITEMS_START');
    expect(anchor).toBeDefined();
    // First row: Section in col, Description in col+1
    const sheet = anchor!.sheet();
    const startRow = anchor!.rowNumber();
    const startCol = anchor!.columnNumber();
    expect(sheet.row(startRow).cell(startCol + 1).value()).toBe('Premium emulsion paint');
    expect(sheet.row(startRow + 1).cell(startCol + 1).value()).toBe('Painting labour');
  });

  it('null client_name becomes em-dash', async () => {
    const out = await fillCostingXlsx(template, { ...sampleInput, client_name: null });
    const wb = await XlsxPopulate.fromDataAsync(out);
    expect(wb.definedName('CLIENT_NAME')?.value()).toBe('—');
  });
});
