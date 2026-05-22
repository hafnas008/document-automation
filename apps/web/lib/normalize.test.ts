import { describe, it, expect } from 'vitest';
import { normalizeItemText, cacheKey } from './normalize';

describe('normalizeItemText', () => {
  it('lowercases', () => {
    expect(normalizeItemText('GYPSUM Ceiling')).toBe('gypsum ceiling');
  });
  it('collapses whitespace', () => {
    expect(normalizeItemText('  gypsum   ceiling  ')).toBe('gypsum ceiling');
  });
  it('strips punctuation', () => {
    expect(normalizeItemText('gypsum, ceiling (12mm)!')).toBe('gypsum ceiling 12mm');
  });
  it('handles empty', () => {
    expect(normalizeItemText('')).toBe('');
    expect(normalizeItemText('   ')).toBe('');
  });
  it('preserves letters from non-Latin scripts (Arabic, future EN/AR)', () => {
    expect(normalizeItemText('جبس Ceiling, 12mm!')).toBe('جبس ceiling 12mm');
  });
});

describe('cacheKey', () => {
  it('is stable for the same inputs', () => {
    const a = cacheKey('t1', 'gypsum ceiling', 'sqft');
    const b = cacheKey('t1', 'gypsum ceiling', 'sqft');
    expect(a).toBe(b);
  });
  it('differs when any input differs', () => {
    const a = cacheKey('t1', 'gypsum ceiling', 'sqft');
    const b = cacheKey('t1', 'gypsum ceiling', 'nos');
    expect(a).not.toBe(b);
  });
});
