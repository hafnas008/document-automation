import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { CostingDoc } from '@/components/print/CostingDoc';
import { PrintBar } from '@/components/print/PrintBar';

export const dynamic = 'force-dynamic';

export default async function CostingPrintPage({ params }: { params: { id: string } }) {
  const supa = supabaseServer();
  const { data: sheet } = await supa.from('costing_sheets').select('*').eq('id', params.id).is('deleted_at', null).maybeSingle();
  if (!sheet) notFound();

  const { data: items } = await supa.from('costing_items').select('*').eq('sheet_id', sheet.id).order('row_index', { ascending: true });
  const { data: tenant } = await supa.from('tenants').select('company_name, logo_url, address, trn_number, footer_text, accent_color').eq('id', sheet.tenant_id).maybeSingle();

  return (
    <>
      <PrintBar backHref={`/costing/${sheet.id}`} />
      <CostingDoc d={{
        sheetNumber: sheet.sheet_number,
        projectName: sheet.title === 'Untitled costing' ? '' : sheet.title,
        client: sheet.client_name ?? '',
        doneBy: sheet.done_by ?? '',
        date: sheet.doc_date ?? '',
        size: sheet.project_size ?? '',
        photoUrl: sheet.photo_url ?? null,
        markupPct: Number(sheet.markup_pct ?? 100),
        labourCnc: Number(sheet.labour_cnc ?? 0),
        items: (items ?? []).map(i => ({ item: i.description, qty: Number(i.qty), cost_unit: Number(i.unit_rate) })),
        brand: {
          company: tenant?.company_name ?? 'Documentation Studio',
          logo: tenant?.logo_url ?? null,
          address: tenant?.address ?? null,
          trn: tenant?.trn_number ?? null,
          footer: tenant?.footer_text ?? null,
          accent: tenant?.accent_color ?? '#1a1a1a',
          currency: sheet.currency ?? 'QAR',
        },
      }} />
    </>
  );
}
