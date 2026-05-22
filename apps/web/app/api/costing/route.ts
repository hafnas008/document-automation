import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: m } = await supa.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();
  if (!m) return NextResponse.json({ error: 'no tenant' }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: numRow } = await admin.rpc('next_sheet_number', { p_tenant: m.tenant_id }) as any;
  const sheet_number = numRow ?? `CS-${Date.now()}`;

  const { data: sheet, error } = await supa
    .from('costing_sheets')
    .insert({
      tenant_id: m.tenant_id,
      sheet_number,
      title: 'Untitled costing',
      created_by: user.id,
    })
    .select('id').single();
  if (error || !sheet) return NextResponse.json({ error: error?.message ?? 'failed' }, { status: 500 });

  // form POST -> redirect to editor
  return NextResponse.redirect(new URL(`/costing/${sheet.id}`, req.url), { status: 303 });
}
