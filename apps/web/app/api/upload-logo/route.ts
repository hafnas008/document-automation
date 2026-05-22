import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: m } = await supa.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();
  if (!m) return NextResponse.json({ error: 'no tenant' }, { status: 400 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'no file' }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'file too large (max 2MB)' }, { status: 400 });

  const ext = file.name.split('.').pop() ?? 'png';
  const objectPath = `${m.tenant_id}/logo.${ext}`;

  const { error } = await supa.storage.from('tenant-logos')
    .upload(objectPath, await file.arrayBuffer(), { upsert: true, contentType: file.type });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supa.storage.from('tenant-logos').getPublicUrl(objectPath);
  return NextResponse.json({ url: data.publicUrl });
}
