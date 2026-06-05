'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MagneticButton } from './MagneticButton';
import { PencilIcon, MicIcon, CameraIcon, SparkIcon, SendIcon } from './icons';

type Mode = 'type' | 'speak' | 'snap';

const MODES: { key: Mode; label: string; Icon: typeof PencilIcon }[] = [
  { key: 'type', label: 'Type', Icon: PencilIcon },
  { key: 'speak', label: 'Speak', Icon: MicIcon },
  { key: 'snap', label: 'Snap', Icon: CameraIcon },
];

const SUGGESTIONS = ['Kitchen cabinets', 'Wardrobe costing', 'Site measurement', 'Client quotation'];
const ease = [0.16, 1, 0.3, 1] as const;

export function SmartCommand() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('type');
  const [value, setValue] = useState('');

  // For now every entry point opens the Costing module (the first smart flow).
  const go = () => router.push('/costing');

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease, delay: 0.05 }}
      className="relative mx-4 mt-2 overflow-hidden rounded-[1.8rem] border border-black/[0.07] bg-graphite-800 p-5 shadow-lift"
    >
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-mist-100/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/10 to-transparent" />

      <div className="relative">
        <div className="flex items-center gap-2 text-mist-300">
          <SparkIcon className="h-4 w-4" />
          <span className="label">AI Document Assistant</span>
        </div>

        <h1 className="mt-3 font-display text-[27px] font-bold leading-[1.12] tracking-tight text-mist-100">
          What are we
          <br />
          documenting <span className="text-ash-500">today?</span>
        </h1>

        {/* input */}
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-black/10 bg-black/[0.03] p-1.5 pl-4">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
            placeholder="Describe a job, dimensions, or client…"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-mist-100 placeholder:text-ash-500 focus:outline-none"
          />
          <MagneticButton
            ariaLabel="Start"
            onClick={go}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mist-100 text-graphite-900 transition hover:bg-mist-200"
          >
            <SendIcon className="h-5 w-5" strokeWidth={2} />
          </MagneticButton>
        </div>

        {/* mode toggle */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {MODES.map(({ key, label, Icon }) => {
            const active = mode === key;
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={[
                  'flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition active:scale-[0.98]',
                  active
                    ? 'border-black/15 bg-black/[0.06] text-mist-100'
                    : 'border-black/[0.06] text-ash-400 hover:bg-black/[0.03]',
                ].join(' ')}
              >
                <span className="relative">
                  <Icon className="h-4 w-4" />
                  {active && key === 'speak' && (
                    <span className="absolute -right-1 -top-1 h-1.5 w-1.5 animate-breathe rounded-full bg-mist-300" />
                  )}
                </span>
                {label}
              </button>
            );
          })}
        </div>

        {/* suggestions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={s}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.06, duration: 0.3, ease }}
              onClick={go}
              className="rounded-full border border-black/10 bg-black/[0.02] px-3 py-1.5 text-xs text-ash-400 transition hover:border-mist-300/40 hover:text-mist-100"
            >
              {s}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
