import { computeMarkupTotals } from '@/lib/formulas';

export interface CostingDocData {
  sheetNumber: string;
  projectName: string;
  client: string;
  doneBy: string;
  date: string;
  size: string;
  photoUrl: string | null;
  markupPct: number;
  labourCnc: number;
  items: { item: string; qty: number; cost_unit: number }[];
  brand: { company: string; logo: string | null; address: string | null; trn: string | null; footer: string | null; accent: string; currency: string };
}

const money = (n: number) => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function CostingDoc({ d }: { d: CostingDocData }) {
  const t = computeMarkupTotals(d.items.map(i => ({ qty: i.qty, cost_unit: i.cost_unit })), d.labourCnc, d.markupPct);
  const factor = t.total_cost ? t.total_selling / t.total_cost : 1;
  const accent = d.brand.accent || '#1a1a1a';
  const cur = d.brand.currency || 'QAR';

  const th: React.CSSProperties = { background: accent, color: '#fff', padding: '6px 8px', fontSize: '8.5pt', letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'left' };
  const td: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid #e5e0d6', fontSize: '10pt' };
  const tdR: React.CSSProperties = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

  return (
    <div className="doc">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {d.brand.logo && <img src={d.brand.logo} alt="" style={{ height: 54, objectFit: 'contain' }} />}
          <div>
            <div style={{ fontSize: '15pt', fontWeight: 800, color: accent, lineHeight: 1.1 }}>{d.brand.company}</div>
            {d.brand.address && <div style={{ fontSize: '8.5pt', color: '#666', whiteSpace: 'pre-line' }}>{d.brand.address}</div>}
            {d.brand.trn && <div style={{ fontSize: '8.5pt', color: '#666' }}>TRN: {d.brand.trn}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20pt', fontWeight: 800, color: accent, letterSpacing: '0.04em' }}>COSTING SHEET</div>
          <div style={{ fontSize: '9.5pt', color: '#444', marginTop: 2 }}>{d.sheetNumber}</div>
          <div style={{ fontSize: '9.5pt', color: '#444' }}>{d.date}</div>
        </div>
      </div>

      <div style={{ height: 4, background: accent, margin: '12px 0 16px', borderRadius: 2 }} />

      {/* Meta + photo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <table style={{ borderCollapse: 'collapse', flex: 1 }}>
          <tbody>
            {[['Client', d.client], ['Done by', d.doneBy], ['Size', d.size]].filter(r => r[1]).map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: '3px 10px 3px 0', color: '#888', fontSize: '9pt', verticalAlign: 'top', width: 70 }}>{k}</td>
                <td style={{ padding: '3px 0', fontWeight: 600, fontSize: '10pt' }}>{v}</td>
              </tr>
            ))}
            {d.projectName && (
              <tr><td style={{ padding: '3px 10px 3px 0', color: '#888', fontSize: '9pt', verticalAlign: 'top' }}>Project</td>
                <td style={{ padding: '3px 0', fontWeight: 600, fontSize: '10pt' }}>{d.projectName}</td></tr>
            )}
          </tbody>
        </table>
        {d.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.photoUrl} alt="" style={{ width: '52mm', height: '40mm', objectFit: 'cover', border: '1px solid #e5e0d6', borderRadius: 4 }} />
        )}
      </div>

      {/* Items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 32, textAlign: 'center' }}>#</th>
            <th style={th}>Item</th>
            <th style={{ ...th, width: 50, textAlign: 'right' }}>Qty</th>
            <th style={{ ...th, width: 90, textAlign: 'right' }}>Cost Unit</th>
            <th style={{ ...th, width: 95, textAlign: 'right' }}>Total Cost</th>
            <th style={{ ...th, width: 100, textAlign: 'right' }}>Total Selling</th>
          </tr>
        </thead>
        <tbody>
          {d.items.map((it, i) => {
            const tc = (Number(it.qty) || 0) * (Number(it.cost_unit) || 0);
            return (
              <tr key={i}>
                <td style={{ ...td, textAlign: 'center', color: '#888' }}>{i + 1}</td>
                <td style={td}>{it.item || '—'}</td>
                <td style={tdR}>{it.qty}</td>
                <td style={tdR}>{money(it.cost_unit)}</td>
                <td style={tdR}>{money(tc)}</td>
                <td style={tdR}>{money(tc * factor)}</td>
              </tr>
            );
          })}
          {d.items.length === 0 && <tr><td style={{ ...td, textAlign: 'center', color: '#aaa' }} colSpan={6}>No items</td></tr>}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '95mm' }}>
          <tbody>
            <Row label="Items" cost={money(t.items_cost)} sell={money(t.items_cost * factor)} cur={cur} />
            {!!t.labour_cnc && <Row label="Labour & CNC" cost={money(t.labour_cnc)} sell={money(t.labour_cnc * factor)} cur={cur} />}
            <Row label="Total" cost={money(t.total_cost)} sell={money(t.total_selling)} cur={cur} accent={accent} bold />
          </tbody>
        </table>
      </div>
      <div style={{ textAlign: 'right', marginTop: 6, fontSize: '9.5pt', color: '#444' }}>
        Profit: {cur} {money(t.profit)} &nbsp;·&nbsp; Margin: {t.margin}% &nbsp;·&nbsp; Markup: {d.markupPct}%
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', left: '14mm', right: '14mm', bottom: '12mm' }}>
        <div style={{ height: 1, background: '#e5e0d6', marginBottom: 6 }} />
        <div style={{ fontSize: '8pt', color: '#888', textAlign: 'center' }}>{d.brand.footer || `${d.brand.company} · Generated ${d.date}`}</div>
      </div>
    </div>
  );
}

function Row({ label, cost, sell, cur, bold, accent }: { label: string; cost: string; sell: string; cur: string; bold?: boolean; accent?: string }) {
  const base: React.CSSProperties = { padding: '5px 10px', fontSize: bold ? '11pt' : '10pt', fontWeight: bold ? 800 : 400 };
  return (
    <tr style={bold ? { borderTop: `2px solid ${accent}`, color: accent } : { borderBottom: '1px solid #eee', color: '#333' }}>
      <td style={{ ...base, textAlign: 'left' }}>{label}</td>
      <td style={{ ...base, textAlign: 'right', color: '#888', fontWeight: 400, fontSize: '8pt' }}>COST</td>
      <td style={{ ...base, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{cur} {cost}</td>
      <td style={{ ...base, textAlign: 'right', color: '#888', fontWeight: 400, fontSize: '8pt' }}>SELL</td>
      <td style={{ ...base, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{cur} {sell}</td>
    </tr>
  );
}
