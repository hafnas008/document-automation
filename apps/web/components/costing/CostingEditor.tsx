'use client';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import type { DbCostingItem, DbCostingSheet, ItemSection } from '@/lib/supabase/types';
import { computeTotals, itemTotal } from '@/lib/formulas';
import TotalsSidebar from './TotalsSidebar';
import { BackIcon, SparkIcon } from '@/components/shell/icons';

const SECTIONS: ItemSection[] = ['Material', 'Labour', 'Equipment', 'Transport', 'Other'];

// Shared column template — header and every row use this exact grid, so
// columns are always aligned.
const COLS = 'grid grid-cols-[minmax(140px,1fr)_66px_78px_112px_112px]';
const SAVE_LABEL: Record<string, string> = { idle: 'Saved', saving: 'Saving…', saved: 'Saved', error: 'Save failed' };

export default function CostingEditor({ sheet, initialItems }: { sheet: DbCostingSheet; initialItems: DbCostingItem[] }) {
  const [title, setTitle] = useState(sheet.title);
  const [pcts, setPcts] = useState({
    overhead_pct: Number(sheet.overhead_pct),
    profit_pct: Number(sheet.profit_pct),
    contingency_pct: Number(sheet.contingency_pct),
    vat_pct: Number(sheet.vat_pct),
  });
  const [items, setItems] = useState<DbCostingItem[]>(initialItems);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [busyRate, setBusyRate] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totals = useMemo(() => computeTotals({
    items: items.map(i => ({ section: i.section, qty: Number(i.qty), unit_rate: Number(i.unit_rate), labour_rate: i.labour_rate == null ? null : Number(i.labour_rate) })),
    ...pcts,
  }), [items, pcts]);

  function scheduleSave(next: { title?: string; pcts?: typeof pcts; items?: DbCostingItem[] }) {
    if (next.title !== undefined) setTitle(next.title);
    if (next.pcts) setPcts(next.pcts);
    if (next.items) setItems(next.items);
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const body = {
          title: next.title ?? title,
          ...(next.pcts ?? pcts),
          items: (next.items ?? items).map(i => ({
            id: i.id, section: i.section, row_index: i.row_index,
            description: i.description, qty: Number(i.qty), unit: i.unit,
            unit_rate: Number(i.unit_rate),
            labour_rate: i.labour_rate == null ? null : Number(i.labour_rate),
            rate_source: i.rate_source,
          })),
        };
        const r = await fetch(`/api/costing/${sheet.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        if (!r.ok) throw new Error(await r.text());
        setSaveState('saved');
      } catch { setSaveState('error'); }
    }, 700);
  }

  function updateItem(id: string, patch: Partial<DbCostingItem>) {
    const next = items.map(i => i.id === id ? {
      ...i, ...patch,
      total: itemTotal({
        section: (patch.section ?? i.section) as ItemSection,
        qty: Number(patch.qty ?? i.qty),
        unit_rate: Number(patch.unit_rate ?? i.unit_rate),
        labour_rate: (patch.labour_rate !== undefined ? patch.labour_rate : i.labour_rate) as number | null,
      }),
    } : i);
    scheduleSave({ items: next });
  }

  async function addRow(section: ItemSection) {
    const r = await fetch(`/api/costing/${sheet.id}/items`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ section }) });
    if (r.ok) { const { item } = await r.json(); setItems(prev => [...prev, item]); }
  }

  async function suggestRate(row: DbCostingItem) {
    if (!row.description || !row.unit) return;
    setBusyRate(row.id);
    try {
      const r = await fetch(`/api/costing/${sheet.id}/suggest-rate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ description: row.description, unit: row.unit }) });
      if (r.ok) { const { rate } = await r.json(); updateItem(row.id, { unit_rate: rate, rate_source: 'suggested' }); }
    } finally { setBusyRate(null); }
  }

  const cellInput = 'w-full bg-transparent px-2.5 py-2.5 text-sm text-mist-100 outline-none focus:bg-black/[0.03]';
  const divider = 'border-l border-black/[0.06]';

  return (
    <div className="pb-4">
      {/* header */}
      <header className="px-5 pt-8 pb-4">
        <Link href="/costing" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ash-400 transition hover:text-mist-100">
          <BackIcon className="h-4 w-4" /> Costing
        </Link>
        <input
          className="w-full bg-transparent font-display text-2xl font-bold text-mist-100 outline-none placeholder:text-ash-500"
          value={title}
          placeholder="Untitled costing"
          onChange={e => scheduleSave({ title: e.target.value })}
        />
        <div className="mt-1 flex items-center gap-2 label">
          <span>{sheet.sheet_number}</span><span>·</span><span>v{sheet.version}</span><span>·</span>
          <span className={saveState === 'error' ? 'text-red-600' : 'text-ash-400'}>{SAVE_LABEL[saveState]}</span>
        </div>
        <div className="rule mt-4" />
      </header>

      <div className="grid grid-cols-1 gap-5 px-4 md:grid-cols-[1fr_300px]">
        {/* items table */}
        <div>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[520px]">
                {/* header row */}
                <div className={`${COLS} border-b border-black/[0.08] bg-graphite-850`}>
                  <div className="px-2.5 py-2.5 label">Description</div>
                  <div className={`px-2.5 py-2.5 text-right label ${divider}`}>Qty</div>
                  <div className={`px-2.5 py-2.5 text-center label ${divider}`}>Unit</div>
                  <div className={`px-2.5 py-2.5 text-right label ${divider}`}>Rate</div>
                  <div className={`px-2.5 py-2.5 text-right label ${divider}`}>Total</div>
                </div>

                {/* body */}
                {SECTIONS.map(sec => {
                  const secItems = items.filter(i => i.section === sec).sort((a, b) => a.row_index - b.row_index);
                  return (
                    <div key={sec}>
                      <div className="border-b border-black/[0.06] bg-graphite-700/60 px-2.5 py-1.5 label text-mist-200">{sec}</div>
                      {secItems.length === 0 && (
                        <div className="border-b border-black/[0.06] px-2.5 py-2.5 text-xs text-ash-500">No {sec.toLowerCase()} items yet.</div>
                      )}
                      {secItems.map(row => {
                        const isSuggested = row.rate_source === 'suggested';
                        const canSuggest = (!row.unit_rate || Number(row.unit_rate) === 0) && row.description && row.unit;
                        return (
                          <div key={row.id} className={`${COLS} border-b border-black/[0.05]`}>
                            <input className={cellInput} value={row.description} placeholder="Description…" onChange={e => updateItem(row.id, { description: e.target.value })} />
                            <input className={`${cellInput} ${divider} text-right`} type="number" value={Number(row.qty)} onChange={e => updateItem(row.id, { qty: Number(e.target.value) || 0 })} />
                            <input className={`${cellInput} ${divider} text-center`} value={row.unit ?? ''} placeholder="—" onChange={e => updateItem(row.id, { unit: e.target.value || null })} />
                            <div className={`relative flex items-center ${divider}`}>
                              <input className={`${cellInput} text-right num ${isSuggested ? 'text-amber-700' : ''}`} type="number" step="0.01" value={Number(row.unit_rate)} onChange={e => updateItem(row.id, { unit_rate: Number(e.target.value) || 0, rate_source: 'manual' })} />
                              {canSuggest && (
                                <button
                                  type="button"
                                  onClick={() => suggestRate(row)}
                                  disabled={busyRate === row.id}
                                  title="AI-suggest rate"
                                  className="absolute right-1.5 grid h-6 w-6 place-items-center rounded-md text-ash-400 transition hover:bg-black/[0.05] hover:text-mist-100"
                                >
                                  {busyRate === row.id ? <span className="text-[10px]">…</span> : <SparkIcon className="h-3.5 w-3.5" />}
                                </button>
                              )}
                            </div>
                            <div className={`flex items-center justify-end px-2.5 py-2.5 num text-sm font-medium text-mist-100 ${divider}`}>
                              {Number(row.total).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* add-row buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {SECTIONS.map(s => (
              <button key={s} onClick={() => addRow(s)} className="btn-ghost px-3 py-2 text-xs">+ {s}</button>
            ))}
          </div>
        </div>

        <TotalsSidebar
          sheetId={sheet.id}
          totals={totals}
          pcts={pcts}
          onPctsChange={pcts => scheduleSave({ pcts })}
          sheetStatus={sheet.status}
          version={sheet.version}
        />
      </div>
    </div>
  );
}
