'use client';
import type { CostingTotalsOutput } from '@/lib/formulas';

type Pcts = { overhead_pct: number; profit_pct: number; contingency_pct: number; vat_pct: number };

export default function TotalsSidebar({
  sheetId, totals, pcts, onPctsChange, sheetStatus, version,
}: {
  sheetId: string;
  totals: CostingTotalsOutput;
  pcts: Pcts;
  onPctsChange: (next: Pcts) => void;
  sheetStatus: 'draft' | 'final';
  version: number;
}) {
  return (
    <aside className="card sticky top-4 self-start p-5 text-sm">
      <h2 className="label mb-3">Summary</h2>
      <div className="space-y-2.5">
        <Row label="Subtotal" value={totals.subtotal} />
        <PctRow label="Overhead" pct={pcts.overhead_pct} value={totals.overhead} onChange={v => onPctsChange({ ...pcts, overhead_pct: v })} />
        <PctRow label="Profit" pct={pcts.profit_pct} value={totals.profit} onChange={v => onPctsChange({ ...pcts, profit_pct: v })} />
        <PctRow label="Contingency" pct={pcts.contingency_pct} value={totals.contingency} onChange={v => onPctsChange({ ...pcts, contingency_pct: v })} />
        <div className="rule my-1" />
        <Row label="Pre-VAT" value={totals.pre_vat} />
        <PctRow label="VAT" pct={pcts.vat_pct} value={totals.vat} onChange={v => onPctsChange({ ...pcts, vat_pct: v })} />
        <div className="rule my-1" />
        <Row label="Grand total" value={totals.grand_total} strong />
      </div>

      <div className="mt-5 space-y-2">
        <a href={`/costing/${sheetId}/preview`} className="btn-ghost w-full">Preview</a>
        <form action={`/api/costing/${sheetId}/render`} method="post">
          <button className="btn-primary w-full">Generate final</button>
        </form>
        {sheetStatus === 'final' && (
          <form action={`/api/costing/${sheetId}/duplicate`} method="post">
            <button className="btn-ghost w-full">Duplicate as v{version + 1}</button>
          </form>
        )}
      </div>
    </aside>
  );
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={['flex items-center justify-between', strong ? 'text-base font-bold text-mist-100' : 'text-mist-200'].join(' ')}>
      <span>{label}</span>
      <span className="num">{value.toFixed(2)}</span>
    </div>
  );
}

function PctRow({ label, pct, value, onChange }: { label: string; pct: number; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 text-mist-200">
      <span className="flex-1">{label}</span>
      <div className="flex items-center rounded-lg border border-black/10 bg-black/[0.03]">
        <input
          type="number" step="0.01" value={pct}
          onChange={e => onChange(Number(e.target.value) || 0)}
          className="w-12 bg-transparent px-1.5 py-1 text-right num text-xs outline-none"
        />
        <span className="pr-1.5 text-[10px] text-ash-500">%</span>
      </div>
      <span className="w-20 text-right num text-xs text-ash-400">{value.toFixed(2)}</span>
    </div>
  );
}
