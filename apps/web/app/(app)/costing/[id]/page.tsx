import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import CostingEditor from '@/components/costing/CostingEditor';

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

  return <CostingEditor sheet={sheet} initialItems={items ?? []} />;
}
