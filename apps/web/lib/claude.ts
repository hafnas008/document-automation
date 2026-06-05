// apps/web/lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-6';

/* ── Smart costing extraction (photo / voice / text → item list) ──────── */
export interface ExtractedItem { item: string; qty: number; cost_unit: number; }
export interface ExtractedCosting { project_name: string; size: string; items: ExtractedItem[]; }

const EXTRACT_SYSTEM =
`You are a quantity surveyor / estimator for an interior-fit-out & joinery firm in Qatar (currency QAR).
From the user's photo, voice transcript or text, produce a costing item breakdown.
Return STRICT JSON only, no prose:
{ "project_name": string, "size": string, "items": [ { "item": string, "qty": number, "cost_unit": number } ] }
Rules:
- "item" = short material/labour/service name (e.g. "18mm laminated MDF", "CNC cutting", "Lipping", "Carpenter labour").
- "qty" = best-estimate quantity (integer/decimal); if unknown use 1.
- "cost_unit" = estimated COST (not selling) per unit in QAR based on typical Qatar market rates; if unsure give a sensible number, never 0 unless truly free.
- "size" = any dimension/size mentioned (e.g. "1000mm") else "".
- Break a fabrication job into its real materials + labour lines (5-12 items typical).`;

export async function extractCosting(input: { text?: string; image?: { data: string; media_type: string } }): Promise<ExtractedCosting> {
  const content: any[] = [];
  if (input.image) {
    content.push({ type: 'image', source: { type: 'base64', media_type: input.image.media_type, data: input.image.data } });
    content.push({ type: 'text', text: input.text?.trim() || 'Estimate a full costing breakdown for the item in this photo.' });
  } else {
    content.push({ type: 'text', text: input.text?.trim() || 'Create a costing breakdown.' });
  }

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: EXTRACT_SYSTEM,
    messages: [{ role: 'user', content }],
  });

  const text = res.content.map(b => (b as any).text ?? '').join('').trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Claude returned non-JSON: ${text.slice(0, 200)}`);
  const parsed = JSON.parse(match[0]);
  const items: ExtractedItem[] = Array.isArray(parsed.items) ? parsed.items.map((i: any) => ({
    item: String(i.item ?? '').slice(0, 200),
    qty: Number(i.qty) || 0,
    cost_unit: Number(i.cost_unit) || 0,
  })) : [];
  return { project_name: String(parsed.project_name ?? '').slice(0, 300), size: String(parsed.size ?? ''), items };
}

export interface RateEvidence {
  sheet_number: string;
  date: string;     // ISO
  rate: number;
  unit: string | null;
}

export interface RateSuggestion {
  rate: number;
  confidence: 'high' | 'medium' | 'low';
}

export async function suggestRate(opts: {
  description: string;
  unit: string;
  evidence: RateEvidence[];
}): Promise<RateSuggestion> {
  const evidenceLines = opts.evidence.length === 0
    ? '(no past rates)'
    : opts.evidence.map(e => `  - ${e.sheet_number} on ${e.date.slice(0,10)}: AED ${e.rate}/${e.unit ?? '-'}`).join('\n');

  const userMsg =
`Suggest a unit rate for the following line item.
Description: ${opts.description}
Unit: ${opts.unit}
Tenant's past rates for similar items:
${evidenceLines}

If past rates exist, anchor on them but adjust for sensible drift.
If no past rates, output your best estimate with confidence "low".`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: 'You are a contracting estimator helping fill a Costing Sheet. Output strictly JSON: { "rate": <number>, "confidence": "high"|"medium"|"low" }. Currency: AED. No prose, no explanation.',
    messages: [{ role: 'user', content: userMsg }],
  });

  const text = res.content.map(b => (b as any).text ?? '').join('').trim();
  // Extract JSON even if model wraps it
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Claude returned non-JSON: ${text}`);
  const parsed = JSON.parse(match[0]);
  if (typeof parsed.rate !== 'number') throw new Error('Claude returned non-numeric rate');
  if (!['high','medium','low'].includes(parsed.confidence)) parsed.confidence = 'low';
  return { rate: parsed.rate, confidence: parsed.confidence };
}
