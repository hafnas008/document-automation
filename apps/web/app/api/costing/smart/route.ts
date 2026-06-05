import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { extractCosting } from '@/lib/claude';
import { normalizeItemText } from '@/lib/normalize';

export const maxDuration = 60;

const Body = z.object({
  text: z.string().optional(),
  image: z.object({ data: z.string(), media_type: z.string() }).optional(),
});

export async function POST(req: Request) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: m } = await supa.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();
  if (!m) return NextResponse.json({ error: 'no tenant' }, { status: 400 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'bad input' }, { status: 400 });
  if (!parsed.data.text && !parsed.data.image) return NextResponse.json({ error: 'provide text or image' }, { status: 400 });

  // 1. Claude Sonnet extracts the costing breakdown.
  let extracted;
  try {
    extracted = await extractCosting(parsed.data);
  } catch (e: any) {
    return NextResponse.json({ error: 'AI extraction failed', detail: String(e?.message ?? e) }, { status: 502 });
  }

  // 2. Create the sheet.
  const admin = supabaseAdmin();
  const { data: numRow } = await admin.rpc('next_sheet_number', { p_tenant: m.tenant_id }) as any;
  const sheet_number = numRow ?? `CS-${Date.now()}`;

  const { data: sheet, error: sErr } = await supa.from('costing_sheets').insert({
    tenant_id: m.tenant_id,
    sheet_number,
    title: extracted.project_name || 'Untitled costing',
    created_by: user.id,
  }).select('id').single();
  if (sErr || !sheet) return NextResponse.json({ error: sErr?.message ?? 'create failed' }, { status: 500 });

  // 3. Insert extracted items.
  if (extracted.items.length) {
    const rows = extracted.items.map((it, i) => ({
      tenant_id: m.tenant_id,
      sheet_id: sheet.id,
      section: 'Material',
      row_index: i,
      description: it.item,
      item_text_normalized: normalizeItemText(it.item),
      qty: it.qty,
      unit_rate: it.cost_unit,
      total: Math.round(it.qty * it.cost_unit * 100) / 100,
    }));
    await supa.from('costing_items').insert(rows);
  }

  // 4. Optional: store the snapped photo + size (requires markup-model columns; ignore if not yet migrated).
  let photo_url: string | null = null;
  if (parsed.data.image) {
    try {
      const path = `${m.tenant_id}/costing/${sheet.id}.jpg`;
      const buf = Buffer.from(parsed.data.image.data, 'base64');
      const up = await admin.storage.from('tenant-logos').upload(path, buf, { contentType: parsed.data.image.media_type, upsert: true });
      if (!up.error) photo_url = admin.storage.from('tenant-logos').getPublicUrl(path).data.publicUrl;
    } catch { /* ignore */ }
  }
  try {
    await supa.from('costing_sheets').update({ project_size: extracted.size || null, photo_url }).eq('id', sheet.id);
  } catch { /* pre-migration: columns may not exist yet */ }

  return NextResponse.json({ id: sheet.id, items: extracted.items.length });
}
