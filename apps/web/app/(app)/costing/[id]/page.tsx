import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import CostingEditor from '@/components/costing/CostingEditor';

export const dynamic = 'force-dynamic';

export default async function CostingEditPage({ params }: { params: { id: string } }) {
  const supa = supabaseServer();
  const { data: sheet } = await supa
    .from('costing_sheets')
    .select('*')
    .eq('id', params.id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!sheet) notFound();

  const { data: items } = await supa
    .from('costing_items')
    .select('*')
    .eq('sheet_id', sheet.id)
    .order('row_index', { ascending: true });

  const { data: tenant } = await supa
    .from('tenants')
    .select('company_name, logo_url')
    .eq('id', sheet.tenant_id)
    .maybeSingle();

  return (
    <CostingEditor
      sheet={sheet}
      initialItems={items ?? []}
      companyName={tenant?.company_name ?? 'Documentation Studio'}
      logoUrl={tenant?.logo_url ?? null}
    />
  );
}
