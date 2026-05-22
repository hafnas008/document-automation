'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const r = await fetch('/api/onboarding', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ company_name: name }),
    });
    setBusy(false);
    if (!r.ok) { setErr((await r.json()).error ?? 'Failed'); return; }
    router.push('/settings/branding');
    router.refresh();
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold mb-1">Welcome</h1>
      <p className="text-sm text-ink-800/70 mb-6">Set up your company tenant.</p>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Company name" value={name} onChange={e=>setName(e.target.value)} required />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className="rounded-md bg-ink-900 text-white px-4 py-2 text-sm">{busy?'Creating…':'Create tenant'}</button>
      </form>
    </div>
  );
}
