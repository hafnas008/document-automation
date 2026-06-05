import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { computeMarkupTotals, lineCost } from '@/lib/formulas';
import { normalizeItemText } from '@/lib/normalize';
import { audit } from '@/lib/audit';

const ItemSchema = z.object({
  id: z.string().uuid(),
  row_index: z.number().int(),
  description: z.string().default(''),
  qty: z.number(),
  cost_unit: z.number(),
});

const Body = z.object({
  title: z.string().max(400).default('Untitled costing'),
  client_name: z.string().nullable().optional(),
  done_by: z.string().nullable().optional(),
  doc_date: z.string().nullable().optional(),
  project_size: z.string().nullable().optional(),
  markup_pct: z.number(),
  labour_cnc: z.number(),
  photo_url: z.string().nullable().optional(),
  items: z.array(ItemSchema),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'bad input', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;

  const { data: sheet } = await supa.from('costing_sheets').select('id, status, tenant_id').eq('id', params.id).single();
  if (!sheet) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (sheet.status === 'final') return NextResponse.json({ error: 'sheet is finalized; duplicate to edit' }, { status: 409 });

  const totals = computeMarkupTotals(
    body.items.map(i => ({ qty: i.qty, cost_unit: i.cost_unit })),
    body.labour_cnc,
    body.markup_pct,
  );

  const { error: sErr } = await supa.from('costing_sheets').update({
    title: body.title || 'Untitled costing',
    client_name: body.client_name ?? null,
    done_by: body.done_by ?? null,
    doc_date: body.doc_date || null,
    project_size: body.project_size ?? null,
    markup_pct: body.markup_pct,
    labour_cnc: body.labour_cnc,
    photo_url: body.photo_url ?? null,
    subtotal: totals.items_cost,
    grand_total: totals.total_cost,
    total_selling: totals.total_selling,
  }).eq('id', params.id);
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  for (const it of body.items) {
    const { error } = await supa.from('costing_items').update({
      row_index: it.row_index,
      description: it.description,
      item_text_normalized: normalizeItemText(it.description),
      qty: it.qty,
      unit_rate: it.cost_unit,
      total: lineCost(it.qty, it.cost_unit),
    }).eq('id', it.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Reconcile deletions: drop any items no longer in the payload.
  const keepIds = body.items.map(i => i.id);
  const del = supa.from('costing_items').delete().eq('sheet_id', params.id);
  await (keepIds.length ? del.not('id', 'in', `(${keepIds.join(',')})`) : del);

  await audit(supa, {
    tenant_id: sheet.tenant_id, user_id: user.id,
    action: 'update', entity_type: 'costing_sheet', entity_id: params.id,
    diff: { title: body.title, items_count: body.items.length },
  });

  return NextResponse.json({ ok: true, totals });
}
