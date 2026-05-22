// apps/web/lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-6';

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
