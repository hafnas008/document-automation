'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { ChevronRight } from './icons';

const ease = [0.22, 1, 0.36, 1] as const;

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
      transition={{ delay: 0.15 + index * 0.07, duration: 0.4, ease }}
      whileHover={ready ? { y: -3 } : undefined}
      whileTap={ready ? { scale: 0.985 } : undefined}
      className={[
        'group relative flex items-center gap-4 overflow-hidden rounded-xl2 border p-4 transition-shadow',
        ready
          ? 'border-beige-400/70 bg-beige-50/80 shadow-tile backdrop-blur hover:shadow-lift hover:border-caramel-400/60'
          : 'border-beige-400/50 bg-beige-100/60 backdrop-blur',
      ].join(' ')}
    >
      {/* corner tick decoration */}
      <span className="pointer-events-none absolute right-4 top-4 h-2 w-2 border-r border-t border-beige-400/80" />

      <span
        className={[
          'grid h-14 w-14 shrink-0 place-items-center rounded-2xl transition',
          ready
            ? 'bg-gradient-to-br from-brown-600 to-brown-800 text-beige-50 group-hover:from-brown-700 group-hover:to-brown-900'
            : 'bg-beige-300 text-brown-400',
        ].join(' ')}
      >
        <span className="[&>svg]:h-7 [&>svg]:w-7">{icon}</span>
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg font-semibold leading-tight text-brown-900">{label}</h3>
          {!ready && (
            <span className="label rounded-full bg-beige-300/70 px-2 py-0.5 text-[9px] text-brown-500">soon</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-brown-500">{desc}</p>
      </div>

      <ChevronRight
        className={[
          'h-5 w-5 shrink-0 transition',
          ready ? 'text-caramel-500 group-hover:translate-x-0.5' : 'text-brown-400/50',
        ].join(' ')}
      />
    </motion.div>
  );

  if (!ready) return <div aria-disabled>{body}</div>;
  return (
    <Link href={href} className="block rounded-xl2 outline-none focus-visible:ring-2 focus-visible:ring-caramel-500">
      {body}
    </Link>
  );
}
