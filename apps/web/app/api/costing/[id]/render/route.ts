// apps/web/app/api/costing/[id]/render/route.ts
import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fillCostingXlsx } from '@/lib/xlsx-fill';
import { xlsxToPdf } from '@/lib/vps-render';
import { audit } from '@/lib/audit';

const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'common-costing.xlsx');

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: sheet } = await supa.from('costing_sheets').select('*').eq('id', params.id).maybeSingle();
  if (!sheet) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const { data: m } = await supa.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();
  if (!m || m.tenant_id !== sheet.tenant_id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data: tenant } = await supa.from('tenants').select('*').eq('id', m.tenant_id).single();
  if (!tenant?.company_name || !tenant?.trn_number || !tenant?.logo_url) {
    return NextResponse.json({ error: 'complete branding first (logo + company_name + trn required)' }, { status: 400 });
  }

  const { data: items } = await supa.from('costing_items').select('*').eq('sheet_id', sheet.id).order('section').order('row_index');
  const { data: client } = sheet.client_id
    ? await supa.from('clients').select('name').eq('id', sheet.client_id).maybeSingle()
    : { data: null };

  const templateBuf = await readFile(TEMPLATE_PATH);
  const xlsxBuf = await fillCostingXlsx(templateBuf, {
    tenant: {
      company_name: tenant.company_name,
      trn_number: tenant.trn_number,
      address: tenant.address,
      footer_text: tenant.footer_text,
      logo_url: tenant.logo_url,
    },
    sheet: {
      sheet_number: sheet.sheet_number,
      title: sheet.title,
      overhead_pct: Number(sheet.overhead_pct),
      profit_pct: Number(sheet.profit_pct),
      contingency_pct: Number(sheet.contingency_pct),
      vat_pct: Number(sheet.vat_pct),
    },
    client_name: client?.name ?? null,
    items: (items ?? []).map(i => ({
      section: i.section,
      description: i.description,
      qty: Number(i.qty),
      unit: i.unit,
      unit_rate: Number(i.unit_rate),
      labour_rate: i.labour_rate == null ? null : Number(i.labour_rate),
    })),
  });

  const pdfBuf = await xlsxToPdf(xlsxBuf);

  const admin = supabaseAdmin();
  const folder = `${tenant.id}/costing`;
  const xlsxPath = `${folder}/${sheet.id}-v${sheet.version}.xlsx`;
  const pdfPath  = `${folder}/${sheet.id}-v${sheet.version}.pdf`;

  await admin.storage.from('generated-docs').upload(xlsxPath, xlsxBuf, { upsert: true, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  await admin.storage.from('generated-docs').upload(pdfPath,  pdfBuf,  { upsert: true, contentType: 'application/pdf' });

  const { data: xlsxSigned } = await admin.storage.from('generated-docs').createSignedUrl(xlsxPath, 60*60*24*7);
  const { data: pdfSigned }  = await admin.storage.from('generated-docs').createSignedUrl(pdfPath,  60*60*24*7);

  await admin.from('generated_documents').insert({
    tenant_id: tenant.id,
    sheet_id: sheet.id,
    doc_type: 'costing',
    xlsx_url: xlsxSigned!.signedUrl,
    pdf_url:  pdfSigned!.signedUrl,
    generated_by: user.id,
  });

  await admin.from('costing_sheets').update({
    status: 'final',
    xlsx_url: xlsxSigned!.signedUrl,
    pdf_url: pdfSigned!.signedUrl,
  }).eq('id', sheet.id);

  await audit(admin, {
    tenant_id: tenant.id, user_id: user.id,
    action: 'generate', entity_type: 'costing_sheet',
    entity_id: sheet.id,
    diff: { version: sheet.version, status: 'final' },
  });

  return NextResponse.redirect(new URL(`/costing/${sheet.id}`, req.url), { status: 303 });
}
