// apps/web/app/api/costing/[id]/suggest-rate/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { normalizeItemText, cacheKey } from '@/lib/normalize';
import { suggestRate, type RateEvidence } from '@/lib/claude';

const Body = z.object({
  description: z.string().min(1),
  unit: z.string().min(1),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'bad input' }, { status: 400 });

  const { data: sheet } = await supa.from('costing_sheets').select('tenant_id').eq('id', params.id).single();
  if (!sheet) return NextResponse.json({ error: 'sheet not found' }, { status: 404 });

  const norm = normalizeItemText(parsed.data.description);
  const key = cacheKey(sheet.tenant_id, norm, parsed.data.unit);

  // 1. Cache lookup
  const { data: cached } = await supa
    .from('ai_suggestion_cache')
    .select('suggested_rate, confidence, evidence_json, expires_at')
    .eq('cache_key', key)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (cached) {
    return NextResponse.json({
      rate: Number(cached.suggested_rate),
      confidence: cached.confidence,
      evidence: cached.evidence_json,
      source: 'cache',
    });
  }

  // 2. Evidence from rate_history (top 5 most recent)
  const { data: hist } = await supa
    .from('rate_history')
    .select('unit_rate, unit, created_at, sheet_id')
    .eq('item_text_normalized', norm)
    .eq('unit', parsed.data.unit)
    .order('created_at', { ascending: false })
    .limit(5);

  const sheetIds = (hist ?? []).map(h => h.sheet_id);
  const { data: sheetNumbers } = sheetIds.length > 0
    ? await supa.from('costing_sheets').select('id, sheet_number').in('id', sheetIds)
    : { data: [] };
  const idToNumber = new Map((sheetNumbers ?? []).map((s: any) => [s.id, s.sheet_number]));

  const evidence: RateEvidence[] = (hist ?? []).map(h => ({
    sheet_number: idToNumber.get(h.sheet_id) ?? '?',
    date: h.created_at as string,
    rate: Number(h.unit_rate),
    unit: h.unit as string | null,
  }));

  // 3. Ask Claude
  const result = await suggestRate({
    description: parsed.data.description,
    unit: parsed.data.unit,
    evidence,
  });

  // 4. Cache 24h
  const expires = new Date(Date.now() + 24*60*60*1000).toISOString();
  await supa.from('ai_suggestion_cache').upsert({
    tenant_id: sheet.tenant_id,
    cache_key: key,
    suggested_rate: result.rate,
    confidence: result.confidence,
    evidence_json: evidence,
    expires_at: expires,
  });

  return NextResponse.json({ rate: result.rate, confidence: result.confidence, evidence, source: 'fresh' });
}
