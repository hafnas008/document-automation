import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { BackIcon, ChevronRight, CostingIcon } from '@/components/shell/icons';

export const dynamic = 'force-dynamic';

export default async function CostingListPage() {
  const supa = supabaseServer();
  const { data: sheets } = await supa
    .from('costing_sheets')
    .select('id, sheet_number, title, status, version, grand_total, updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(100);

  const list = sheets ?? [];

  return (
    <div>
      {/* header */}
      <header className="px-5 pt-8 pb-5">
        <Link href="/home" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ash-400 transition hover:text-mist-100">
          <BackIcon className="h-4 w-4" /> Home
        </Link>
        <p className="label">Module</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold leading-tight text-mist-100">Costing</h1>
          <form action="/api/costing" method="post">
            <button className="btn-primary px-4 py-2.5 text-sm">+ New sheet</button>
          </form>
        </div>
        <div className="rule mt-4" />
      </header>

      {/* list */}
      <section className="px-4">
        <div className="mb-3 flex items-end justify-between px-1">
          <h2 className="label">Costing sheets</h2>
          <span className="label">{list.length} total</span>
        </div>

        {list.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-black/10 bg-black/[0.03] text-ash-400">
              <CostingIcon className="h-6 w-6" />
            </span>
            <p className="text-sm text-ash-400">No costing sheets yet.</p>
            <form action="/api/costing" method="post">
              <button className="btn-ghost text-sm">Create your first sheet</button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((s) => {
              const isFinal = s.status === 'final';
              return (
                <Link
                  key={s.id}
                  href={`/costing/${s.id}`}
                  className="card group flex items-center gap-4 p-4 transition hover:border-black/15 hover:shadow-lift"
                >
                  <span className="num grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-black/10 bg-black/[0.03] text-xs font-medium text-mist-200">
                    {s.sheet_number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-mist-100">{s.title || 'Untitled costing'}</h3>
                      <span className="num text-[11px] text-ash-500">v{s.version}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-ash-400">
                      <span className={[
                        'label rounded-full px-2 py-0.5 text-[9px]',
                        isFinal ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                      ].join(' ')}>{s.status}</span>
                      <span className="num text-mist-200">{Number(s.grand_total).toLocaleString()}</span>
                      <span className="text-ash-500">·</span>
                      <span>{new Date(s.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-mist-300 transition group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
