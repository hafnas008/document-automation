'use client';
import 'react-data-grid/lib/styles.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import DataGrid, { type Column } from 'react-data-grid';
import type { DbCostingItem, DbCostingSheet, ItemSection } from '@/lib/supabase/types';
import { computeTotals, itemTotal } from '@/lib/formulas';
import TotalsSidebar from './TotalsSidebar';
import RateSuggestionCell from './RateSuggestionCell';

type Row = DbCostingItem & { _isSectionHeader?: boolean };
const SECTIONS: ItemSection[] = ['Material','Labour','Equipment','Transport','Other'];

export default function CostingEditor({ sheet, initialItems }: { sheet: DbCostingSheet; initialItems: DbCostingItem[] }) {
  const [title, setTitle] = useState(sheet.title);
  const [pcts, setPcts] = useState({
    overhead_pct: Number(sheet.overhead_pct),
    profit_pct: Number(sheet.profit_pct),
    contingency_pct: Number(sheet.contingency_pct),
    vat_pct: Number(sheet.vat_pct),
  });
  const [items, setItems] = useState<DbCostingItem[]>(initialItems);
  const [saveState, setSaveState] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const sec of SECTIONS) {
      out.push({ id:`__${sec}`, _isSectionHeader:true, section:sec } as any);
      out.push(...items.filter(i => i.section === sec).sort((a,b)=>a.row_index-b.row_index));
    }
    return out;
  }, [items]);

  const totals = useMemo(() => computeTotals({
    items: items.map(i => ({ section: i.section, qty: Number(i.qty), unit_rate: Number(i.unit_rate), labour_rate: i.labour_rate==null?null:Number(i.labour_rate) })),
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
            description: i.description,
            qty: Number(i.qty), unit: i.unit,
            unit_rate: Number(i.unit_rate),
            labour_rate: i.labour_rate==null?null:Number(i.labour_rate),
            rate_source: i.rate_source,
          })),
        };
        const r = await fetch(`/api/costing/${sheet.id}`, { method: 'PATCH', headers: { 'content-type':'application/json' }, body: JSON.stringify(body) });
        if (!r.ok) throw new Error(await r.text());
        setSaveState('saved');
      } catch { setSaveState('error'); }
    }, 700);
  }

  function updateItem(id: string, patch: Partial<DbCostingItem>) {
    const next = items.map(i => i.id === id ? { ...i, ...patch, total: itemTotal({
      section: (patch.section ?? i.section) as ItemSection,
      qty: Number(patch.qty ?? i.qty),
      unit_rate: Number(patch.unit_rate ?? i.unit_rate),
      labour_rate: (patch.labour_rate !== undefined ? patch.labour_rate : i.labour_rate) as number | null,
    })} : i);
    scheduleSave({ items: next });
  }

  async function addRow(section: ItemSection) {
    const r = await fetch(`/api/costing/${sheet.id}/items`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ section }) });
    if (r.ok) {
      const { item } = await r.json();
      setItems(prev => [...prev, item]);
    }
  }

  const columns: Column<Row>[] = [
    { key: 'description', name: 'Description', editable: r => !r._isSectionHeader, renderCell: ({ row }) => row._isSectionHeader ? <strong className="text-ink-800/80">{row.section}</strong> : <span>{row.description}</span>, renderEditCell: ({ row, onRowChange }) => <input autoFocus className="w-full px-1" defaultValue={row.description} onBlur={e=>onRowChange({ ...row, description: e.target.value }, true)} /> },
    { key: 'qty',  name: 'Qty',  width: 90,  editable: r=>!r._isSectionHeader, renderCell: ({row}) => row._isSectionHeader?null:<span>{row.qty}</span>, renderEditCell: ({row,onRowChange}) => <input autoFocus type="number" className="w-full px-1" defaultValue={row.qty} onBlur={e=>onRowChange({ ...row, qty: Number(e.target.value)||0 }, true)} /> },
    { key: 'unit', name: 'Unit', width: 80,  editable: r=>!r._isSectionHeader, renderCell: ({row}) => row._isSectionHeader?null:<span>{row.unit}</span>, renderEditCell: ({row,onRowChange}) => <input autoFocus className="w-full px-1" defaultValue={row.unit ?? ''} onBlur={e=>onRowChange({ ...row, unit: e.target.value || null }, true)} /> },
    { key: 'unit_rate', name: 'Rate', width: 120, editable: r=>!r._isSectionHeader, renderCell: ({row}) => row._isSectionHeader?null:<RateSuggestionCell row={row} onSuggest={async()=>{
        if (!row.description || !row.unit) return;
        const r = await fetch(`/api/costing/${sheet.id}/suggest-rate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ description: row.description, unit: row.unit }) });
        if (r.ok) {
          const { rate } = await r.json();
          updateItem(row.id, { unit_rate: rate, rate_source: 'suggested' });
        }
    }} />, renderEditCell: ({row,onRowChange}) => <input autoFocus type="number" step="0.01" className="w-full px-1" defaultValue={row.unit_rate} onBlur={e=>onRowChange({ ...row, unit_rate: Number(e.target.value)||0, rate_source: 'manual' }, true)} /> },
    { key: 'total', name: 'Total', width: 120, renderCell: ({row}) => row._isSectionHeader?null:<span className="font-medium">{Number(row.total).toFixed(2)}</span> },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr,300px] gap-6">
      <div>
        <input className="text-2xl font-semibold w-full bg-transparent outline-none mb-2" value={title} onChange={e=>scheduleSave({ title: e.target.value })} />
        <div className="text-sm text-ink-800/60 mb-4">{sheet.sheet_number} · v{sheet.version} · {saveState}</div>
        <DataGrid<Row> rows={rows} columns={columns} onRowsChange={(next, info) => {
          const changed = info.indexes[0]; const row = next[changed];
          if (row._isSectionHeader) return;
          updateItem(row.id, row);
        }} className="rdg-light" />
        <div className="mt-2 flex gap-2">
          {SECTIONS.map(s => <button key={s} onClick={()=>addRow(s)} className="text-xs border rounded px-2 py-1">+ {s}</button>)}
        </div>
      </div>
      <TotalsSidebar
        sheetId={sheet.id}
        totals={totals}
        pcts={pcts}
        onPctsChange={pcts=>scheduleSave({ pcts })}
        sheetStatus={sheet.status}
        version={sheet.version}
      />
    </div>
  );
}
