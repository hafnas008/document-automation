'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { ChevronRight } from './icons';

const ease = [0.16, 1, 0.3, 1] as const;

export function ModuleCard({
  href,
  label,
  desc,
  icon,
  status = 'ready',
  index = 0,
}: {
  href: string;
  label: string;
  desc: string;
  icon: ReactNode;
  status?: 'ready' | 'soon';
  index?: number;
}) {
  const ready = status === 'ready';

  const body = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.07, duration: 0.45, ease }}
      whileHover={ready ? { y: -3 } : undefined}
      whileTap={ready ? { scale: 0.985 } : undefined}
      className={[
        'group relative flex items-center gap-4 overflow-hidden rounded-xl2 border p-4 transition',
        ready
          ? 'border-black/[0.07] bg-graphite-800 shadow-tile hover:border-black/15 hover:shadow-lift'
          : 'border-black/[0.05] bg-graphite-850',
      ].join(' ')}
    >
      <span className="pointer-events-none absolute right-4 top-4 h-2 w-2 border-r border-t border-black/15" />

      <span
        className={[
          'grid h-14 w-14 shrink-0 place-items-center rounded-2xl border transition',
          ready
            ? 'border-black/10 bg-mist-100 text-graphite-900 group-hover:bg-mist-200'
            : 'border-black/[0.06] bg-black/[0.03] text-ash-500',
        ].join(' ')}
      >
        <span className="[&>svg]:h-7 [&>svg]:w-7">{icon}</span>
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className={['font-display text-lg font-bold leading-tight', ready ? 'text-mist-100' : 'text-ash-400'].join(' ')}>{label}</h3>
          {!ready && <span className="label rounded-full border border-black/10 px-2 py-0.5 text-[9px] text-ash-500">soon</span>}
        </div>
        <p className="mt-0.5 truncate text-sm text-ash-400">{desc}</p>
      </div>

      <ChevronRight className={['h-5 w-5 shrink-0 transition', ready ? 'text-mist-300 group-hover:translate-x-0.5' : 'text-ash-500'].join(' ')} />
    </motion.div>
  );

  if (!ready) return <div aria-disabled>{body}</div>;
  return (
    <Link href={href} className="block rounded-xl2 outline-none focus-visible:ring-2 focus-visible:ring-mist-300/40">
      {body}
    </Link>
  );
}
