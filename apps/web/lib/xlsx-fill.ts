// apps/web/lib/xlsx-fill.ts
// Fills the master xlsx with tenant branding + sheet items.
// Uses xlsx-populate's named-range API. The named-range contract lives in
// apps/web/templates/README.md — do not drift from it.

import XlsxPopulate from 'xlsx-populate';
import { computeTotals, type Section } from './formulas';

export interface FillInput {
  tenant: {
    company_name: string;
    trn_number: string | null;
    address: string | null;
    footer_text: string | null;
    logo_url: string | null;  // public URL; embedding the image is v1.1
  };
  sheet: {
    sheet_number: string;
    title: string;
    overhead_pct: number;
    profit_pct: number;
    contingency_pct: number;
    vat_pct: number;
  };
  client_name: string | null;
  items: Array<{
    section: Section;
    description: string;
    qty: number;
    unit: string | null;
    unit_rate: number;
    labour_rate: number | null;
  }>;
}

function setNamedIfPresent(wb: any, name: string, value: unknown) {
  const cell = wb.definedName(name);
  if (cell) cell.value(value ?? '');
}

export async function fillCostingXlsx(templateBuffer: Buffer, input: FillInput): Promise<Buffer> {
  const wb = await XlsxPopulate.fromDataAsync(templateBuffer);

  setNamedIfPresent(wb, 'COMPANY_NAME',   input.tenant.company_name);
  setNamedIfPresent(wb, 'TRN',            input.tenant.trn_number);
  setNamedIfPresent(wb, 'ADDRESS',        input.tenant.address);
  setNamedIfPresent(wb, 'FOOTER',         input.tenant.footer_text);
  setNamedIfPresent(wb, 'SHEET_NUMBER',   input.sheet.sheet_number);
  setNamedIfPresent(wb, 'TITLE',          input.sheet.title);
  setNamedIfPresent(wb, 'DATE',           new Date());
  setNamedIfPresent(wb, 'CLIENT_NAME',    input.client_name ?? '—');
  setNamedIfPresent(wb, 'OVERHEAD_PCT',   input.sheet.overhead_pct);
  setNamedIfPresent(wb, 'PROFIT_PCT',     input.sheet.profit_pct);
  setNamedIfPresent(wb, 'CONTINGENCY_PCT',input.sheet.contingency_pct);
  setNamedIfPresent(wb, 'VAT_PCT',        input.sheet.vat_pct);

  const totals = computeTotals({
    items: input.items.map(i => ({
      section: i.section, qty: i.qty, unit_rate: i.unit_rate, labour_rate: i.labour_rate,
    })),
    overhead_pct: input.sheet.overhead_pct,
    profit_pct: input.sheet.profit_pct,
    contingency_pct: input.sheet.contingency_pct,
    vat_pct: input.sheet.vat_pct,
  });
  setNamedIfPresent(wb, 'SUBTOTAL',    totals.subtotal);
  setNamedIfPresent(wb, 'GRAND_TOTAL', totals.grand_total);

  const itemsAnchor = wb.definedName('ITEMS_START');
  if (itemsAnchor) {
    const sheet = itemsAnchor.sheet();
    const startRow = itemsAnchor.rowNumber();
    const startCol = itemsAnchor.columnNumber();
    // Columns: Section | Description | Qty | Unit | Rate | Total
    input.items.forEach((it, idx) => {
      const r = startRow + idx;
      sheet.row(r).cell(startCol + 0).value(it.section);
      sheet.row(r).cell(startCol + 1).value(it.description);
      sheet.row(r).cell(startCol + 2).value(it.qty);
      sheet.row(r).cell(startCol + 3).value(it.unit ?? '');
      sheet.row(r).cell(startCol + 4).value(it.unit_rate);
      const effRate = it.section === 'Labour' && it.labour_rate != null
        ? it.unit_rate + it.labour_rate : it.unit_rate;
      sheet.row(r).cell(startCol + 5).value(it.qty * effRate);
    });
  }

  return await wb.outputAsync('nodebuffer') as Buffer;
}
