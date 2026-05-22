'use client';
import type { CostingTotalsOutput } from '@/lib/formulas';

type Pcts = { overhead_pct:number; profit_pct:number; contingency_pct:number; vat_pct:number };

export default function TotalsSidebar({
  sheetId, totals, pcts, onPctsChange, sheetStatus, version,
}: {
  sheetId: string;
  totals: CostingTotalsOutput;
  pcts: Pcts;
  onPctsChange: (next: Pcts) => void;
  sheetStatus: 'draft'|'final';
  version: number;
}) {
  return (
    <aside className="sticky top-4 self-start border rounded-lg bg-white p-4 text-sm space-y-2">
      <Row label="Subtotal" value={totals.subtotal} />
      <PctRow label="Overhead %" pct={pcts.overhead_pct} value={totals.overhead} onChange={v=>onPctsChange({...pcts, overhead_pct:v})} />
      <PctRow label="Profit %"   pct={pcts.profit_pct}   value={totals.profit}   onChange={v=>onPctsChange({...pcts, profit_pct:v})} />
      <PctRow label="Contingency %" pct={pcts.contingency_pct} value={totals.contingency} onChange={v=>onPctsChange({...pcts, contingency_pct:v})} />
      <div className="border-t pt-2"><Row label="Pre-VAT" value={totals.pre_vat} /></div>
      <PctRow label="VAT %" pct={pcts.vat_pct} value={totals.vat} onChange={v=>onPctsChange({...pcts, vat_pct:v})} />
      <div className="border-t pt-2 text-base font-semibold"><Row label="Grand total" value={totals.grand_total} /></div>

      <div className="pt-4 space-y-2">
        <a href={`/costing/${sheetId}/preview`} className="block text-center border rounded-md py-2">Preview</a>
        <form action={`/api/costing/${sheetId}/render`} method="post">
          <button className="w-full bg-ink-900 text-white rounded-md py-2">Generate final</button>
        </form>
        {sheetStatus === 'final' && (
          <form action={`/api/costing/${sheetId}/duplicate`} method="post">
            <button className="w-full border rounded-md py-2">Duplicate as v{version+1}</button>
          </form>
        )}
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return <div className="flex justify-between"><span>{label}</span><span>{value.toFixed(2)}</span></div>;
}
function PctRow({ label, pct, value, onChange }: { label:string; pct:number; value:number; onChange:(v:number)=>void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex-1">{label}</span>
      <input type="number" step="0.01" className="w-16 border rounded px-1 py-0.5 text-right text-xs" value={pct} onChange={e=>onChange(Number(e.target.value)||0)} />
      <span className="w-20 text-right">{value.toFixed(2)}</span>
    </div>
  );
}
