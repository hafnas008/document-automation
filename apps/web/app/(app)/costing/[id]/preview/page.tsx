import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import PreviewPane from '@/components/costing/PreviewPane';

export default async function PreviewPage({ params }: { params: { id: string } }) {
  const supa = supabaseServer();
  const { data: sheet } = await supa.from('costing_sheets').select('*').eq('id', params.id).maybeSingle();
  if (!sheet) notFound();
  const { data: items } = await supa.from('costing_items').select('*').eq('sheet_id', sheet.id).order('section').order('row_index');
  const { data: m } = await supa.from('tenant_users').select('tenant_id').single();
  const { data: tenant } = await supa.from('tenants').select('*').eq('id', m!.tenant_id).single();
  return <PreviewPane sheet={sheet} items={items ?? []} tenant={tenant!} />;
}
