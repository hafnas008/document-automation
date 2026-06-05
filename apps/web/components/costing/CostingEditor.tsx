'use client';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import type { DbCostingItem, DbCostingSheet } from '@/lib/supabase/types';
import { computeMarkupTotals, marginToMarkup, profitToMarkup } from '@/lib/formulas';
import { BackIcon, CameraIcon, Plus, SparkIcon } from '@/components/shell/icons';

type Row = { id: string; description: string; qty: number; cost_unit: number; row_index: number };
const SAVE: Record<string, string> = { idle: 'Saved', saving: 'Saving…', saved: 'Saved', error: 'Save failed' };
const fmt = (n: number) => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const COLS = 'grid grid-cols-[28px_minmax(120px,1fr)_56px_84px_92px_92px_28px]';

export default function CostingEditor({
  sheet, initialItems, companyName, logoUrl,
}: {
  sheet: DbCostingSheet; initialItems: DbCostingItem[]; companyName: string; logoUrl: string | null;
}) {
  const [title, setTitle] = useState(sheet.title === 'Untitled costing' ? '' : sheet.title);
  const [client, setClient] = useState(sheet.client_name ?? '');
  const [doneBy, setDoneBy] = useState(sheet.done_by ?? '');
  const [date, setDate] = useState(sheet.doc_date ?? new Date().toISOString().split('T')[0]);
  const [size, setSize] = useState(sheet.project_size ?? '');
  const [markup, setMarkup] = useState(Number(sheet.markup_pct ?? 100));
  const [labourCnc, setLabourCnc] = useState(Number(sheet.labour_cnc ?? 0));
  const [photoUrl, setPhotoUrl] = useState<string | null>(sheet.photo_url ?? null);
  const [rows, setRows] = useState<Row[]>(
    initialItems.map(i => ({ id: i.id, description: i.description, qty: Number(i.qty), cost_unit: Number(i.unit_rate), row_index: i.row_index }))
  );
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const [making, setMaking] = useState(false);
  const [busyRate, setBusyRate] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totals = useMemo(
    () => computeMarkupTotals(rows.map(r => ({ qty: r.qty, cost_unit: r.cost_unit })), labourCnc, markup),
    [rows, labourCnc, markup]
  );

  function save(over: Partial<{ title: string; client: string; doneBy: string; date: string; size: string; markup: number; labourCnc: number; photoUrl: string | null; rows: Row[] }> = {}) {
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const snap = {
      title: over.title ?? title, client: over.client ?? client, doneBy: over.doneBy ?? doneBy,
      date: over.date ?? date, size: over.size ?? size, markup: over.markup ?? markup,
      labourCnc: over.labourCnc ?? labourCnc, photoUrl: over.photoUrl !== undefined ? over.photoUrl : photoUrl,
      rows: over.rows ?? rows,
    };
    saveTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/costing/${sheet.id}`, {
          method: 'PATCH', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: snap.title || 'Untitled costing',
            client_name: snap.client || null, done_by: snap.doneBy || null,
            doc_date: snap.date || null, project_size: snap.size || null,
            markup_pct: snap.markup, labour_cnc: snap.labourCnc, photo_url: snap.photoUrl,
            items: snap.rows.map((r, i) => ({ id: r.id, row_index: i, description: r.description, qty: r.qty, cost_unit: r.cost_unit })),
          }),
        });
        if (!r.ok) throw new Error(await r.text());
        setSaveState('saved');
      } catch { setSaveState('error'); }
    }, 600);
  }

  function patchRow(id: string, p: Partial<Row>) {
    const next = rows.map(r => (r.id === id ? { ...r, ...p } : r));
    setRows(next); save({ rows: next });
  }
  async function addRow() {
    const r = await fetch(`/api/costing/${sheet.id}/items`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    if (r.ok) { const { item } = await r.json(); setRows(prev => [...prev, { id: item.id, description: '', qty: 0, cost_unit: 0, row_index: prev.length }]); }
  }
  function removeRow(id: string) { const next = rows.filter(r => r.id !== id); setRows(next); save({ rows: next }); }

  async function suggestCost(r: Row) {
    if (!r.description) return;
    setBusyRate(r.id);
    try {
      const res = await fetch(`/api/costing/${sheet.id}/suggest-rate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ description: r.description }) });
      const j = await res.json();
      if (res.ok && typeof j.rate === 'number') patchRow(r.id, { cost_unit: j.rate });
    } finally { setBusyRate(null); }
  }

  // markup helpers
  const setMk = (v: number) => { setMarkup(v); save({ markup: v }); };
  const onMargin = (v: number) => setMk(marginToMarkup(v));
  const onProfit = (v: number) => setMk(profitToMarkup(v, totals.total_cost));

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = await fetch(`/api/costing/${sheet.id}/photo`, { method: 'POST', body: fd });
      const j = await r.json();
      if (r.ok && j.url) { const url = j.url as string; setPhotoUrl(url); save({ photoUrl: url }); }
    } finally { setUploading(false); }
  }

  async function makePdf() {
    setMaking(true);
    try {
      const { generateCostingPdf } = await import('@/lib/pdf/costingPdf');
      await generateCostingPdf({
        sheetNumber: sheet.sheet_number, projectName: title, client, doneBy, date, size,
        photoUrl: photoUrl ? `${photoUrl}?v=${date}` : null,
        logoUrl: logoUrl || '/logo.png', companyName, currency: sheet.currency || 'QAR',
        items: rows.map((r, i) => ({ number: i + 1, item: r.description, qty: r.qty, cost_unit: r.cost_unit, total_cost: r.qty * r.cost_unit, total_selling: 0 })).map(it => ({ ...it, total_selling: (it.total_cost) * (1 + markup / 100) })),
        totals,
      });
    } finally { setMaking(false); }
  }

  const inp = 'w-full bg-transparent outline-none text-mist-100 placeholder:text-ash-500';
  const cell = 'bg-transparent px-2 py-2.5 text-sm text-mist-100 outline-none focus:bg-black/[0.03]';
  const div = 'border-l border-black/[0.06]';

  return (
    <div className="pb-4">
      <header className="px-5 pt-8 pb-4">
        <Link href="/costing" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ash-400 transition hover:text-mist-100">
          <BackIcon className="h-4 w-4" /> Costing
        </Link>
        <input className="w-full bg-transparent font-display text-2xl font-bold text-mist-100 outline-none placeholder:text-ash-500"
          value={title} placeholder="Project description…" onChange={e => { setTitle(e.target.value); save({ title: e.target.value }); }} />
        <div className="mt-1 flex items-center gap-2 label">
          <span>{sheet.sheet_number}</span><span>·</span>
          <span className={saveState === 'error' ? 'text-red-600' : 'text-ash-400'}>{SAVE[saveState]}</span>
        </div>
        <div className="rule mt-4" />
      </header>

      <div className="space-y-5 px-4">
        {/* header fields + photo */}
        <div className="card grid grid-cols-2 gap-3 p-4">
          <Field label="Client"><input className={inp} value={client} onChange={e => { setClient(e.target.value); save({ client: e.target.value }); }} placeholder="Client name" /></Field>
          <Field label="Done by"><input className={inp} value={doneBy} onChange={e => { setDoneBy(e.target.value); save({ doneBy: e.target.value }); }} placeholder="Your name" /></Field>
          <Field label="Date"><input type="date" className={inp} value={date} onChange={e => { setDate(e.target.value); save({ date: e.target.value }); }} /></Field>
          <Field label="Size"><input className={inp} value={size} onChange={e => { setSize(e.target.value); save({ size: e.target.value }); }} placeholder="e.g. 1000" /></Field>
          <div className="col-span-2">
            <span className="label">Product photo</span>
            <div className="mt-2 flex items-center gap-3">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${photoUrl}?v=${date}`} alt="" className="h-16 w-16 rounded-xl border border-black/10 object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-black/15 text-ash-400"><CameraIcon className="h-6 w-6" /></div>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
              <button className="btn-ghost text-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : photoUrl ? 'Replace photo' : 'Add photo'}
              </button>
              {photoUrl && <button className="text-sm text-ash-400 hover:text-red-600" onClick={() => { setPhotoUrl(null); save({ photoUrl: null }); }}>Remove</button>}
            </div>
          </div>
        </div>

        {/* items */}
        <div>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto"><div className="min-w-[480px]">
              <div className={`${COLS} border-b border-black/[0.08] bg-graphite-850`}>
                <div className="px-2 py-2.5 label text-center">#</div>
                <div className="px-2 py-2.5 label">Item</div>
                <div className={`px-2 py-2.5 label text-right ${div}`}>Qty</div>
                <div className={`px-2 py-2.5 label text-right ${div}`}>Cost Unit</div>
                <div className={`px-2 py-2.5 label text-right ${div}`}>Total Cost</div>
                <div className={`px-2 py-2.5 label text-right ${div}`}>Selling</div>
                <div className={`${div}`} />
              </div>
              {rows.length === 0 && <div className="px-3 py-4 text-xs text-ash-500">No items yet — tap “Add item”.</div>}
              {rows.map((r, i) => {
                const tc = r.qty * r.cost_unit;
                return (
                  <div key={r.id} className={`${COLS} border-b border-black/[0.05]`}>
                    <div className="grid place-items-center num text-xs text-ash-400">{i + 1}</div>
                    <input className={cell} value={r.description} placeholder="Item…" onChange={e => patchRow(r.id, { description: e.target.value })} />
                    <input className={`${cell} ${div} text-right`} type="number" value={r.qty} onChange={e => patchRow(r.id, { qty: Number(e.target.value) || 0 })} />
                    <div className={`relative flex items-center ${div}`}>
                      <input className={`${cell} w-full text-right num`} type="number" step="0.01" value={r.cost_unit} onChange={e => patchRow(r.id, { cost_unit: Number(e.target.value) || 0 })} />
                      {!r.cost_unit && r.description && (
                        <button type="button" onClick={() => suggestCost(r)} disabled={busyRate === r.id} title="AI cost estimate"
                          className="absolute right-1 grid h-6 w-6 place-items-center rounded-md text-ash-400 transition hover:bg-black/[0.06] hover:text-mist-100">
                          {busyRate === r.id ? <span className="text-[10px]">…</span> : <SparkIcon className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                    <div className={`flex items-center justify-end px-2 num text-sm text-mist-100 ${div}`}>{tc ? fmt(tc) : '—'}</div>
                    <div className={`flex items-center justify-end px-2 num text-sm text-mist-200 ${div}`}>{tc ? fmt(tc * (1 + markup / 100)) : '—'}</div>
                    <button className={`grid place-items-center text-ash-400 hover:text-red-600 ${div}`} onClick={() => removeRow(r.id)} aria-label="Remove">×</button>
                  </div>
                );
              })}
            </div></div>
          </div>
          <button onClick={addRow} className="btn-ghost mt-3 text-sm"><Plus className="h-4 w-4" /> Add item</button>
        </div>

        {/* markup + labour */}
        <div className="card space-y-4 p-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="label">Profit Markup</span>
              <span className="text-xs text-ash-400">applied to all selling prices</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button className="btn-ghost h-10 w-10 p-0 text-lg" onClick={() => setMk(Math.max(0, markup - 5))}>−</button>
              <div className="flex flex-1 items-center rounded-xl border border-black/15 bg-graphite-900 px-3">
                <input type="number" className="w-full bg-transparent py-2.5 num text-lg font-semibold text-mist-100 outline-none" value={markup} onChange={e => setMk(Number(e.target.value) || 0)} />
                <span className="text-mist-300">%</span>
              </div>
              <button className="btn-ghost h-10 w-10 p-0 text-lg" onClick={() => setMk(markup + 5)}>+</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Labour & CNC (cost)"><input type="number" className={`${inp} num`} value={labourCnc} onChange={e => { const v = Number(e.target.value) || 0; setLabourCnc(v); save({ labourCnc: v }); }} /></Field>
            <Field label="Margin %"><div className="flex items-center"><input type="number" className={`${inp} num`} value={totals.margin} onChange={e => onMargin(Number(e.target.value) || 0)} /><span className="text-ash-400">%</span></div></Field>
          </div>
        </div>

        {/* summary */}
        <div className="card p-4 text-sm">
          <h2 className="label mb-3">Summary</h2>
          <div className="space-y-2.5">
            <SumRow label="Total Cost" value={fmt(totals.total_cost)} />
            <SumRow label="Total Selling" value={fmt(totals.total_selling)} />
            <div className="rule my-1" />
            <div className="flex items-center justify-between">
              <span className="flex-1 text-mist-200">Profit</span>
              <input type="number" className="w-28 rounded-lg border border-black/15 bg-graphite-900 px-2 py-1.5 text-right num text-xs outline-none focus:bg-white" value={totals.profit} onChange={e => onProfit(Number(e.target.value) || 0)} />
            </div>
            <SumRow label="Margin" value={`${totals.margin}%`} />
          </div>
          <button onClick={makePdf} disabled={making} className="btn-primary mt-5 w-full">{making ? 'Generating…' : 'Generate PDF'}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label text-[9px]">{label}</span>
      <div className="mt-1.5 flex items-center rounded-xl border border-black/15 bg-graphite-900 px-3 py-2.5 transition focus-within:border-mist-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-mist-300/15">
        {children}
      </div>
    </div>
  );
}
function SumRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between text-mist-200"><span>{label}</span><span className="num font-medium text-mist-100">{value}</span></div>;
}
