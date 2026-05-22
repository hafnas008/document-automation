import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const Body = z.object({ company_name: z.string().min(2).max(120) });

export async function POST(req: Request) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'bad input' }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: existing } = await admin.from('tenant_users').select('tenant_id').eq('user_id', user.id).maybeSingle();
  if (existing) return NextResponse.json({ tenant_id: existing.tenant_id });

  const { data: tenant, error: tErr } = await admin
    .from('tenants')
    .insert({ company_name: parsed.data.company_name })
    .select('id').single();
  if (tErr || !tenant) return NextResponse.json({ error: tErr?.message ?? 'failed' }, { status: 500 });

  const { error: muErr } = await admin
    .from('tenant_users')
    .insert({ tenant_id: tenant.id, user_id: user.id, role: 'member' });
  if (muErr) return NextResponse.json({ error: muErr.message }, { status: 500 });

  return NextResponse.json({ tenant_id: tenant.id });
}
