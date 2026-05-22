import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { computeTotals } from '@/lib/formulas';
import { normalizeItemText } from '@/lib/normalize';

const ItemSchema = z.object({
  id: z.string().uuid(),
  section: z.enum(['Material','Labour','Equipment','Transport','Other']),
  row_index: z.number().int(),
  description: z.string().default(''),
  qty: z.number(),
  unit: z.string().nullable(),
  unit_rate: z.number(),
  labour_rate: z.number().nullable(),
  rate_source: z.enum(['manual','suggested','history']).default('manual'),
});

const Body = z.object({
  title: z.string().min(1).max(200),
  overhead_pct: z.number(),
  profit_pct: z.number(),
  contingency_pct: z.number(),
  vat_pct: z.number(),
  items: z.array(ItemSchema),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'bad input', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;

  // Reject edits to finalized sheets
  const { data: sheet } = await supa.from('costing_sheets').select('id, status').eq('id', params.id).single();
  if (!sheet) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (sheet.status === 'final') return NextResponse.json({ error: 'sheet is finalized; duplicate to edit' }, { status: 409 });

  const totals = computeTotals({
    items: body.items.map(i => ({ section: i.section, qty: i.qty, unit_rate: i.unit_rate, labour_rate: i.labour_rate })),
    overhead_pct: body.overhead_pct, profit_pct: body.profit_pct,
    contingency_pct: body.contingency_pct, vat_pct: body.vat_pct,
  });

  const { error: sErr } = await supa.from('costing_sheets').update({
    title: body.title,
    overhead_pct: body.overhead_pct,
    profit_pct: body.profit_pct,
    contingency_pct: body.contingency_pct,
    vat_pct: body.vat_pct,
    subtotal: totals.subtotal,
    grand_total: totals.grand_total,
  }).eq('id', params.id);
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  for (const it of body.items) {
    const effRate = it.section === 'Labour' && it.labour_rate != null ? it.unit_rate + it.labour_rate : it.unit_rate;
    const total = Math.round(it.qty * effRate * 100) / 100;
    const { error } = await supa.from('costing_items').update({
      section: it.section,
      row_index: it.row_index,
      description: it.description,
      item_text_normalized: normalizeItemText(it.description),
      qty: it.qty, unit: it.unit,
      unit_rate: it.unit_rate, labour_rate: it.labour_rate,
      rate_source: it.rate_source,
      total,
    }).eq('id', it.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, totals });
}
