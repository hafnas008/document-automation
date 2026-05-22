import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const Body = z.object({ section: z.enum(['Material','Labour','Equipment','Transport','Other']) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'bad input' }, { status: 400 });

  const { data: sheet } = await supa.from('costing_sheets').select('id, tenant_id, status').eq('id', params.id).single();
  if (!sheet) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (sheet.status === 'final') return NextResponse.json({ error: 'finalized' }, { status: 409 });

  const { data: maxRow } = await supa.from('costing_items').select('row_index').eq('sheet_id', params.id).eq('section', parsed.data.section).order('row_index', { ascending: false }).limit(1).maybeSingle();
  const row_index = (maxRow?.row_index ?? -1) + 1;

  const { data: item, error } = await supa.from('costing_items').insert({
    tenant_id: sheet.tenant_id,
    sheet_id: params.id,
    section: parsed.data.section,
    row_index,
  }).select('*').single();
  if (error || !item) return NextResponse.json({ error: error?.message ?? 'failed' }, { status: 500 });
  return NextResponse.json({ item });
}
