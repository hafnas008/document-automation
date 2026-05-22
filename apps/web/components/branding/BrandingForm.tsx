'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DbTenant } from '@/lib/supabase/types';

export default function BrandingForm({ initial }: { initial: DbTenant }) {
  const router = useRouter();
  const [t, setT] = useState<DbTenant>(initial);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      let logo_url = t.logo_url;
      if (logoFile) {
        const fd = new FormData();
        fd.append('file', logoFile);
        const r = await fetch('/api/upload-logo', { method: 'POST', body: fd });
        if (!r.ok) throw new Error((await r.json()).error ?? 'logo upload failed');
        logo_url = (await r.json()).url;
      }
      const r = await fetch('/api/branding', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...t, logo_url }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? 'save failed');
      router.push('/costing');
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="block text-sm mb-1">Logo (PNG/SVG, max 2 MB)</label>
        <input type="file" accept="image/*" onChange={e=>setLogoFile(e.target.files?.[0] ?? null)} />
        {t.logo_url && <img src={t.logo_url} alt="logo" className="h-16 mt-2" />}
      </div>
      <Field label="Company name"  value={t.company_name}              onChange={v=>setT({...t, company_name: v})} required />
      <Field label="TRN"           value={t.trn_number ?? ''}          onChange={v=>setT({...t, trn_number: v})} required />
      <Field label="Address"       value={t.address ?? ''}             onChange={v=>setT({...t, address: v})} />
      <Field label="Footer text"   value={t.footer_text ?? ''}         onChange={v=>setT({...t, footer_text: v})} />
      <Field label="Accent color"  value={t.accent_color}              onChange={v=>setT({...t, accent_color: v})} type="color" />
      {err && <p className="md:col-span-2 text-sm text-red-600">{err}</p>}
      <div className="md:col-span-2">
        <button disabled={busy} className="rounded-md bg-ink-900 text-white px-4 py-2 text-sm">{busy?'Saving…':'Save branding'}</button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, required, type='text' }:
  { label:string; value:string; onChange:(v:string)=>void; required?:boolean; type?:string }) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input className="w-full border rounded-md px-3 py-2 text-sm" type={type} value={value} onChange={e=>onChange(e.target.value)} required={required} />
    </div>
  );
}
