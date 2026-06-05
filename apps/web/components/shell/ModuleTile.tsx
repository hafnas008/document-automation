'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function ModuleTile({
  href,
  label,
  icon,
  hint,
  disabled = false,
  index = 0,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  hint?: string;
  disabled?: boolean;
  index?: number;
}) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={[
        'relative flex aspect-square flex-col justify-between overflow-hidden rounded-xl2 border p-5 shadow-tile',
        disabled
          ? 'border-beige-400/60 bg-beige-100 text-brown-400'
          : 'border-beige-400/70 bg-beige-50 text-brown-900',
      ].join(' ')}
    >
      {/* blueprint hairline accent */}
      <span className="pointer-events-none absolute inset-x-5 top-1/2 h-px bg-beige-400/50" />
      <span
        className={[
          'inline-flex h-12 w-12 items-center justify-center rounded-2xl',
          disabled ? 'bg-beige-200 text-brown-400' : 'bg-brown-600 text-beige-50',
        ].join(' ')}
      >
        <span className="h-6 w-6 [&>svg]:h-6 [&>svg]:w-6">{icon}</span>
      </span>
      <div>
        <div className="font-display text-lg font-semibold leading-tight">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-brown-500/80">{hint}</div>}
      </div>
    </motion.div>
  );

  if (disabled) return <div aria-disabled className="cursor-default">{inner}</div>;
  return (
    <Link href={href} className="outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 rounded-xl2">
      {inner}
    </Link>
  );
}
