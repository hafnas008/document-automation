# Costing template

`common-costing.xlsx` is the master template. Per-tenant branding + per-sheet data are injected at generation time via named ranges.

## Named-range contract

| Name | Type | Source |
|---|---|---|
| LOGO | image anchor | tenant.logo_url (downloaded, embedded) |
| COMPANY_NAME | text | tenant.company_name |
| TRN | text | tenant.trn_number |
| ADDRESS | text | tenant.address |
| FOOTER | text | tenant.footer_text |
| SHEET_NUMBER | text | sheet.sheet_number |
| TITLE | text | sheet.title |
| DATE | date | today (UTC) |
| CLIENT_NAME | text | client.name (or '—') |
| ITEMS_START | range anchor | first row of item block; subsequent rows filled by lib/xlsx-fill.ts |
| OVERHEAD_PCT | number | sheet.overhead_pct |
| PROFIT_PCT | number | sheet.profit_pct |
| CONTINGENCY_PCT | number | sheet.contingency_pct |
| VAT_PCT | number | sheet.vat_pct |
| SUBTOTAL | number | computeTotals().subtotal |
| GRAND_TOTAL | number | computeTotals().grand_total |

## Initial setup (one-time, done by tenant administrator)

The shipped `common-costing.xlsx` does NOT yet have these named ranges defined. They must be added once, in Excel or LibreOffice Calc:

1. Open `common-costing.xlsx`.
2. For each name in the table above, select the target cell or range, then Formulas → Define Name → enter the name (UPPERCASE).
3. Save. Commit. The next deploy picks up the new layout.

The xlsx already contains the styled rows + formulas from Aspect's existing format — DO NOT replace the file. Modify in place.

## Programmatic verification

`apps/web/lib/xlsx-fill.ts` uses `xlsx-populate`'s `definedName(name)` API. Missing names are skipped silently (using `setNamedIfPresent` helper). To verify which names are defined:

```js
import XlsxPopulate from 'xlsx-populate';
const wb = await XlsxPopulate.fromFileAsync('apps/web/templates/common-costing.xlsx');
console.log(wb.definedName('COMPANY_NAME'));  // prints the cell ref if defined, undefined otherwise
```
