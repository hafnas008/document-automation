import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const Body = z.object({
  company_name: z.string().min(2).max(120),
  trn_number: z.string().min(3).max(40),
  address: z.string().max(500).nullable().optional(),
  footer_text: z.string().max(500).nullable().optional(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logo_url: z.string().url().nullable().optional(),
});

export async function PATCH(req: Request) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'bad input' }, { status: 400 });

  const { data: m } = await supa.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();
  if (!m) return NextResponse.json({ error: 'no tenant' }, { status: 400 });

  const { error } = await supa.from('tenants').update(parsed.data).eq('id', m.tenant_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
