'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supa = supabaseBrowser();
    const { error } = await supa.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push('/costing');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input className="w-full border rounded-md px-3 py-2 text-sm" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
      <input className="w-full border rounded-md px-3 py-2 text-sm" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="w-full rounded-md bg-ink-900 text-white py-2 text-sm">
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-xs text-ink-800/60 pt-3">No account? Request access from your admin.</p>
    </form>
  );
}
