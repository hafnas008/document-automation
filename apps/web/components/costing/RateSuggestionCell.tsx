'use client';
import { useState } from 'react';
import type { DbCostingItem } from '@/lib/supabase/types';

export default function RateSuggestionCell({ row, onSuggest }: { row: DbCostingItem; onSuggest: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const isSuggested = row.rate_source === 'suggested';
  return (
    <div className="flex items-center justify-between w-full pr-1">
      <span className={isSuggested ? 'text-amber-700' : ''}>
        {isSuggested && <span title="AI-suggested" className="mr-1">●</span>}
        {Number(row.unit_rate).toFixed(2)}
      </span>
      {(!row.unit_rate || row.unit_rate === 0) && row.description && row.unit && (
        <button
          className="text-xs text-blue-600 hover:underline"
          disabled={busy}
          onClick={async () => { setBusy(true); try { await onSuggest(); } finally { setBusy(false); } }}
        >{busy ? '…' : '✨'}</button>
      )}
    </div>
  );
}
