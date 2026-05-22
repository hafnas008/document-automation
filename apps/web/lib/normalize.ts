// Server-only. Uses node:crypto. Do not import from edge runtimes or client components.
import { createHash } from 'node:crypto';

export function normalizeItemText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cacheKey(tenantId: string, normalizedText: string, unit: string | null): string {
  const raw = `${tenantId}|${normalizedText}|${unit ?? ''}`;
  return createHash('sha256').update(raw).digest('hex');
}
