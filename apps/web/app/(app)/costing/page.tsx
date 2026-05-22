import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';

export default async function CostingListPage() {
  const supa = supabaseServer();
  const { data: sheets } = await supa
    .from('costing_sheets')
    .select('id, sheet_number, title, status, version, grand_total, updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Costing sheets</h1>
        <form action="/api/costing" method="post">
          <button className="rounded-md bg-ink-900 text-white px-3 py-2 text-sm">+ New costing sheet</button>
        </form>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-ink-800/60">
            <th className="py-2">#</th><th>Title</th><th>Version</th><th>Status</th><th>Total</th><th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {(sheets ?? []).map(s => (
            <tr key={s.id} className="border-t hover:bg-white">
              <td className="py-2"><Link className="underline" href={`/costing/${s.id}`}>{s.sheet_number}</Link></td>
              <td>{s.title}</td>
              <td>v{s.version}</td>
              <td><span className={`px-2 py-0.5 rounded text-xs ${s.status==='final'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{s.status}</span></td>
              <td>{Number(s.grand_total).toLocaleString()}</td>
              <td className="text-ink-800/60">{new Date(s.updated_at).toLocaleString()}</td>
            </tr>
          ))}
          {sheets?.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-ink-800/50">No sheets yet. Create your first one.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
