// Generates apps/web/templates/common-costing.xlsx with the full named-range
// contract baked in (matches the contract in apps/web/templates/README.md and
// the lib/xlsx-fill.ts code).
//
// Run from repo root:  node apps/web/scripts/build-template.mjs
//
// Output layout (rows on the left, columns A..F):
//
//   1  [logo anchor]    COMPANY_NAME (bold 14)
//   2                   TRN: ...
//   3                   ADDRESS
//   4  (blank)
//   5  COSTING SHEET (title bar, grey fill)
//   6  Sheet number label    SHEET_NUMBER (right)         Date: DATE
//   7  Project: TITLE
//   8  Client:  CLIENT_NAME
//   9  (blank)
//  10  Section | Description | Qty | Unit | Rate | Total   (header row, grey fill, bold)
//  11+ items block (30 rows reserved; ITEMS_START = A11)
//  42  (blank)
//  44  Subtotal                                       SUBTOTAL
//  45  Overhead %         OVERHEAD_PCT          (computed: =SUBTOTAL*OVERHEAD_PCT/100)
//  46  Profit %           PROFIT_PCT
//  47  Contingency %      CONTINGENCY_PCT
//  48  Pre-VAT                                       (=SUBTOTAL+overhead+profit+conting)
//  49  VAT %              VAT_PCT
//  50  GRAND TOTAL                                   GRAND_TOTAL (bold 12)
//  52  FOOTER (small, centred)

import XlsxPopulate from 'xlsx-populate';
import path from 'node:path';

const OUT = path.resolve('apps/web/templates/common-costing.xlsx');

const wb = await XlsxPopulate.fromBlankAsync();
const sheet = wb.sheet(0).name('Costing Sheet');

// ---------- column widths ----------
sheet.column('A').width(12);
sheet.column('B').width(40);
sheet.column('C').width(10);
sheet.column('D').width(10);
sheet.column('E').width(14);
sheet.column('F').width(16);

// ---------- header band (rows 1..3) ----------
sheet.cell('A1').value('[LOGO]').style({ italic: true, fontColor: '888888' });
sheet.cell('C1').value('Company Name').style({ bold: true, fontSize: 16 });
sheet.cell('C2').value('TRN: 000000000000000').style({ fontSize: 10, fontColor: '555555' });
sheet.cell('C3').value('Address line').style({ fontSize: 10, fontColor: '555555' });
sheet.range('A1:B3').style({ horizontalAlignment: 'left', verticalAlignment: 'top' });
sheet.range('C1:F3').style({ horizontalAlignment: 'right' });

// ---------- title bar (row 5) ----------
sheet.range('A5:F5').merged(true).value('COSTING SHEET').style({
  bold: true, fontSize: 14, horizontalAlignment: 'center',
  fill: '1a1a1a', fontColor: 'ffffff', verticalAlignment: 'center',
});
sheet.row(5).height(22);

// ---------- meta band (rows 6..8) ----------
sheet.cell('A6').value('Sheet').style({ bold: true });
sheet.cell('B6').value('').style({ bold: true });   // SHEET_NUMBER goes here
sheet.cell('D6').value('Date').style({ bold: true, horizontalAlignment: 'right' });
sheet.cell('F6').value('').style({ horizontalAlignment: 'right', numberFormat: 'yyyy-mm-dd' });
sheet.cell('A7').value('Project').style({ bold: true });
sheet.range('B7:F7').merged(true).value('');   // TITLE goes here
sheet.cell('A8').value('Client').style({ bold: true });
sheet.range('B8:F8').merged(true).value('');   // CLIENT_NAME goes here

// ---------- items header (row 10) ----------
const hdr = ['Section','Description','Qty','Unit','Rate','Total'];
hdr.forEach((h, i) => {
  sheet.row(10).cell(i+1).value(h).style({
    bold: true, fontColor: 'ffffff', fill: '404040',
    horizontalAlignment: i >= 2 ? 'right' : 'left',
    verticalAlignment: 'center',
  });
});
sheet.row(10).height(20);

// ---------- items block (rows 11..40, 30 rows reserved) ----------
for (let r = 11; r <= 40; r++) {
  sheet.row(r).cell(1).style({ horizontalAlignment: 'left' });
  sheet.row(r).cell(3).style({ horizontalAlignment: 'right' });
  sheet.row(r).cell(4).style({ horizontalAlignment: 'right' });
  sheet.row(r).cell(5).style({ horizontalAlignment: 'right', numberFormat: '#,##0.00' });
  sheet.row(r).cell(6).style({ horizontalAlignment: 'right', numberFormat: '#,##0.00' });
  // Light underline for readability
  if (r <= 40) {
    sheet.range(`A${r}:F${r}`).style({ border: { bottom: { style: 'hair', color: 'cccccc' } } });
  }
}

// ---------- totals block (rows 44..50) ----------
function labelRow(r, label, bold = false) {
  sheet.range(`D${r}:E${r}`).merged(true).value(label).style({
    bold, horizontalAlignment: 'right',
  });
}
function pctRow(r, label, pctCell) {
  sheet.cell(`D${r}`).value(label).style({ horizontalAlignment: 'right' });
  sheet.cell(`E${r}`).value(0).style({ horizontalAlignment: 'right', numberFormat: '0.0"%"' });
  sheet.cell(`F${r}`).formula(`SUBTOTAL_*${pctCell}/100`).style({
    horizontalAlignment: 'right', numberFormat: '#,##0.00',
  });
}

labelRow(44, 'Subtotal', true);
sheet.cell('F44').value(0).style({
  bold: true, horizontalAlignment: 'right', numberFormat: '#,##0.00',
  border: { top: { style: 'thin' } },
});

// percentage rows — values live in column E, computed amount in F
sheet.cell('D45').value('Overhead').style({ horizontalAlignment: 'right' });
sheet.cell('E45').value(10).style({ horizontalAlignment: 'right', numberFormat: '0.0"%"' });
sheet.cell('F45').formula('F44*E45/100').style({ horizontalAlignment: 'right', numberFormat: '#,##0.00' });

sheet.cell('D46').value('Profit').style({ horizontalAlignment: 'right' });
sheet.cell('E46').value(15).style({ horizontalAlignment: 'right', numberFormat: '0.0"%"' });
sheet.cell('F46').formula('F44*E46/100').style({ horizontalAlignment: 'right', numberFormat: '#,##0.00' });

sheet.cell('D47').value('Contingency').style({ horizontalAlignment: 'right' });
sheet.cell('E47').value(5).style({ horizontalAlignment: 'right', numberFormat: '0.0"%"' });
sheet.cell('F47').formula('F44*E47/100').style({ horizontalAlignment: 'right', numberFormat: '#,##0.00' });

labelRow(48, 'Pre-VAT', true);
sheet.cell('F48').formula('F44+F45+F46+F47').style({
  bold: true, horizontalAlignment: 'right', numberFormat: '#,##0.00',
  border: { top: { style: 'thin' } },
});

sheet.cell('D49').value('VAT').style({ horizontalAlignment: 'right' });
sheet.cell('E49').value(5).style({ horizontalAlignment: 'right', numberFormat: '0.0"%"' });
sheet.cell('F49').formula('F48*E49/100').style({ horizontalAlignment: 'right', numberFormat: '#,##0.00' });

labelRow(50, 'GRAND TOTAL', true);
sheet.cell('F50').formula('F48+F49').style({
  bold: true, fontSize: 12, horizontalAlignment: 'right', numberFormat: '#,##0.00',
  fill: '1a1a1a', fontColor: 'ffffff',
  border: { top: { style: 'medium' } },
});
sheet.row(50).height(22);

// ---------- footer (row 52) ----------
sheet.range('A52:F52').merged(true).value('').style({
  fontSize: 9, fontColor: '777777', horizontalAlignment: 'center',
  border: { top: { style: 'thin', color: 'cccccc' } },
});

// ---------- print setup (skipped — xlsx-populate's API for these is per-attribute,
// not object-based, and they aren't load-bearing for v1) ----------

// ---------- defined names ----------
// xlsx-populate v1 definedName(name, cell|range)
const named = [
  ['LOGO',            sheet.cell('A1')],
  ['COMPANY_NAME',    sheet.cell('C1')],
  ['TRN',             sheet.cell('C2')],
  ['ADDRESS',         sheet.cell('C3')],
  ['FOOTER',          sheet.cell('A52')],
  ['SHEET_NUMBER',    sheet.cell('B6')],
  ['TITLE',           sheet.cell('B7')],
  ['DATE',            sheet.cell('F6')],
  ['CLIENT_NAME',     sheet.cell('B8')],
  ['ITEMS_START',     sheet.cell('A11')],
  ['SUBTOTAL',        sheet.cell('F44')],
  ['OVERHEAD_PCT',    sheet.cell('E45')],
  ['PROFIT_PCT',      sheet.cell('E46')],
  ['CONTINGENCY_PCT', sheet.cell('E47')],
  ['VAT_PCT',         sheet.cell('E49')],
  ['GRAND_TOTAL',     sheet.cell('F50')],
];
for (const [name, cell] of named) {
  wb.definedName(name, cell);
}

// Replace the broken `SUBTOTAL_*` placeholder in pctRow formulas (we didn't end
// up using pctRow — used inline formulas with F44 instead). No-op safeguard.

await wb.toFileAsync(OUT);
console.log(`Wrote ${OUT}`);
console.log(`Named ranges: ${named.map(n => n[0]).join(', ')}`);
