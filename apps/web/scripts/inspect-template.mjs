// One-off inspection script — dumps the layout of common-costing.xlsx
// so we can decide the named-range cell targets.
// Run from repo root:  node apps/web/scripts/inspect-template.mjs

import XlsxPopulate from 'xlsx-populate';
import path from 'node:path';

const file = path.resolve('apps/web/templates/common-costing.xlsx');
const wb = await XlsxPopulate.fromFileAsync(file);

console.log('=== Sheets ===');
wb.sheets().forEach((s, i) => console.log(`  ${i}: "${s.name()}"  used: ${s.usedRange()?.address() ?? '(empty)'}`));

console.log('\n=== Existing defined names ===');
// xlsx-populate v1 exposes definedName via _node — fallback to common API
try {
  const names = wb._node?.definedNames?.definedName ?? [];
  if (Array.isArray(names) && names.length) {
    names.forEach(n => console.log(`  ${n.attributes?.name ?? '?'} -> ${n.children?.[0] ?? '?'}`));
  } else if (typeof names === 'object' && names.attributes) {
    console.log(`  ${names.attributes.name} -> ${names.children?.[0]}`);
  } else {
    console.log('  (none)');
  }
} catch (e) {
  console.log('  (could not enumerate via internal API)');
}

const sheet = wb.sheet(0);
const used = sheet.usedRange();
if (!used) { console.log('\n(sheet 0 is empty)'); process.exit(0); }

const startCol = 1;                       // A
const endCol = Math.max(8, used.endCell().columnNumber());  // at least A..H
const endRow = Math.min(60, used.endCell().rowNumber());

console.log(`\n=== Cell values  rows 1..${endRow}, cols A..${colLetter(endCol)} ===`);
console.log('(non-empty cells only — coordinate -> value)\n');

for (let r = 1; r <= endRow; r++) {
  for (let c = startCol; c <= endCol; c++) {
    const cell = sheet.row(r).cell(c);
    const v = cell.value();
    if (v !== undefined && v !== null && v !== '') {
      console.log(`  ${colLetter(c)}${r}  ${JSON.stringify(v)}`);
    }
  }
}

function colLetter(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
