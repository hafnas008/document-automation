// apps/web/app/api/costing/[id]/duplicate/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: orig } = await supa.from('costing_sheets').select('*').eq('id', params.id).maybeSingle();
  if (!orig) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const admin = supabaseAdmin();

  const { data: next, error: nErr } = await admin
    .from('costing_sheets')
    .insert({
      tenant_id: orig.tenant_id,
      project_id: orig.project_id,
      client_id: orig.client_id,
      sheet_number: orig.sheet_number,             // keep number
      title: orig.title,
      version: orig.version + 1,
      parent_sheet_id: orig.id,
      status: 'draft',
      currency: orig.currency,
      overhead_pct: orig.overhead_pct,
      profit_pct: orig.profit_pct,
      contingency_pct: orig.contingency_pct,
      vat_pct: orig.vat_pct,
      subtotal: orig.subtotal,
      grand_total: orig.grand_total,
      created_by: user.id,
    })
    .select('id').single();
  if (nErr || !next) return NextResponse.json({ error: nErr?.message ?? 'failed' }, { status: 500 });

  const { data: items } = await admin.from('costing_items').select('*').eq('sheet_id', orig.id);
  if (items && items.length) {
    const copies = items.map(({ id, created_at, updated_at, ...rest }: any) => ({ ...rest, sheet_id: next.id }));
    const { error: cErr } = await admin.from('costing_items').insert(copies);
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL(`/costing/${next.id}`, req.url), { status: 303 });
}
