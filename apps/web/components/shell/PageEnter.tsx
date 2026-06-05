'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Cinematic curtain intro — plays once per full page load. */
export function PageEnter() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1650);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="page-enter"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-graphite-900"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 bg-graphite-950"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-101%' }}
            transition={{ duration: 0.85, ease: EASE }}
          />
          <motion.div
            className="absolute inset-y-0 right-0 w-1/2 bg-graphite-950"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '101%' }}
            transition={{ duration: 0.85, ease: EASE }}
          />
          <motion.div
            className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-mist-300 to-transparent"
            initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: EASE, delay: 0.1 }}
          />
          <motion.div
            className="relative z-10 flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
          >
            <span className="font-display text-2xl font-bold tracking-tight text-mist-100">
              Documentation
            </span>
            <motion.span
              initial={{ opacity: 0, letterSpacing: '0.2em' }}
              animate={{ opacity: 1, letterSpacing: '0.42em' }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.55 }}
              className="font-mono text-[10px] uppercase text-ash-400"
            >
              Studio
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
