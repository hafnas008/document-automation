'use client';
import { Fragment } from 'react';
import type { DbCostingItem, DbCostingSheet, DbTenant, ItemSection } from '@/lib/supabase/types';
import { computeTotals } from '@/lib/formulas';

const SECTIONS: ItemSection[] = ['Material','Labour','Equipment','Transport','Other'];

export default function PreviewPane({ sheet, items, tenant }: { sheet: DbCostingSheet; items: DbCostingItem[]; tenant: DbTenant }) {
  const totals = computeTotals({
    items: items.map(i => ({ section: i.section, qty: Number(i.qty), unit_rate: Number(i.unit_rate), labour_rate: i.labour_rate==null?null:Number(i.labour_rate) })),
    overhead_pct: Number(sheet.overhead_pct),
    profit_pct: Number(sheet.profit_pct),
    contingency_pct: Number(sheet.contingency_pct),
    vat_pct: Number(sheet.vat_pct),
  });

  return (
    <div className="bg-white border rounded-lg p-8 max-w-3xl mx-auto" style={{ ['--accent' as any]: tenant.accent_color }}>
      <header className="flex justify-between items-start mb-6">
        <div>{tenant.logo_url && <img src={tenant.logo_url} className="h-12" alt="logo" />}</div>
        <div className="text-right">
          <h1 className="text-xl font-semibold">Costing Sheet</h1>
          <div className="text-sm text-ink-800/70">{sheet.sheet_number} · v{sheet.version}</div>
          <div className="text-sm text-ink-800/70">{new Date().toLocaleDateString()}</div>
        </div>
      </header>
      <section className="mb-6 text-sm">
        <div className="font-semibold">{tenant.company_name}</div>
        <div className="text-ink-800/70">{tenant.address}</div>
        <div className="text-ink-800/70">TRN {tenant.trn_number}</div>
      </section>
      <h2 className="text-lg font-medium mb-3">{sheet.title}</h2>
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left"><th>Description</th><th>Qty</th><th>Unit</th><th className="text-right">Rate</th><th className="text-right">Total</th></tr></thead>
        <tbody>
          {SECTIONS.map(sec => {
            const rows = items.filter(i => i.section === sec);
            if (rows.length === 0) return null;
            return (
              <Fragment key={sec}>
                <tr><td colSpan={5} className="bg-ink-50 px-2 py-1 font-medium">{sec}</td></tr>
                {rows.map(r => (
                  <tr key={r.id} className="border-b">
                    <td>{r.description}</td>
                    <td>{Number(r.qty)}</td>
                    <td>{r.unit}</td>
                    <td className="text-right">{Number(r.unit_rate).toFixed(2)}</td>
                    <td className="text-right">{Number(r.total).toFixed(2)}</td>
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      <section className="mt-6 max-w-xs ml-auto text-sm space-y-1">
        <Row label="Subtotal" value={totals.subtotal} />
        <Row label={`Overhead ${sheet.overhead_pct}%`} value={totals.overhead} />
        <Row label={`Profit ${sheet.profit_pct}%`} value={totals.profit} />
        <Row label={`Contingency ${sheet.contingency_pct}%`} value={totals.contingency} />
        <Row label="Pre-VAT" value={totals.pre_vat} />
        <Row label={`VAT ${sheet.vat_pct}%`} value={totals.vat} />
        <div className="border-t pt-1 font-semibold"><Row label="Grand total" value={totals.grand_total} /></div>
      </section>
      <footer className="mt-10 text-xs text-ink-800/60 text-center border-t pt-3">{tenant.footer_text}</footer>
    </div>
  );
}
function Row({ label, value }: { label:string; value:number }) {
  return <div className="flex justify-between"><span>{label}</span><span>{value.toFixed(2)}</span></div>;
}
