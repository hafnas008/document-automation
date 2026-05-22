// Verifies the named ranges in common-costing.xlsx by reading them back with
// the supported xlsx-populate API (the same API lib/xlsx-fill.ts uses).
//
// Run from repo root:  node apps/web/scripts/verify-template.mjs

import XlsxPopulate from 'xlsx-populate';
import path from 'node:path';

const wb = await XlsxPopulate.fromFileAsync(path.resolve('apps/web/templates/common-costing.xlsx'));

const required = [
  'LOGO','COMPANY_NAME','TRN','ADDRESS','FOOTER',
  'SHEET_NUMBER','TITLE','DATE','CLIENT_NAME',
  'ITEMS_START',
  'SUBTOTAL','OVERHEAD_PCT','PROFIT_PCT','CONTINGENCY_PCT','VAT_PCT','GRAND_TOTAL',
];

let ok = 0, missing = [];
for (const name of required) {
  const cell = wb.definedName(name);
  if (cell) { ok++; console.log(`  ✓ ${name.padEnd(18)} -> ${cell.address?.() ?? '?'}`); }
  else      { missing.push(name); console.log(`  ✗ ${name.padEnd(18)} MISSING`); }
}
console.log(`\n${ok}/${required.length} named ranges present.`);
if (missing.length) {
  console.error('MISSING:', missing.join(', '));
  process.exit(1);
}
