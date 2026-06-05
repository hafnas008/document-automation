'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus } from './icons';

/** Floating create button, sits above the bottom nav (reference style). */
export function Fab({ href = '/costing' }: { href?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed right-5 z-50"
      style={{ bottom: 'calc(var(--safe-bottom) + 5.5rem)' }}
    >
      <Link
        href={href}
        aria-label="New document"
        className="grid h-14 w-14 place-items-center rounded-full bg-mist-100 text-graphite-900 shadow-lift transition active:scale-95 hover:bg-mist-200"
      >
        <Plus className="h-6 w-6" strokeWidth={2.2} />
      </Link>
    </motion.div>
  );
}
