'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PencilIcon, MicIcon, CameraIcon, SparkIcon, SendIcon } from './icons';

type Mode = 'type' | 'speak' | 'snap';

const MODES: { key: Mode; label: string; Icon: typeof PencilIcon }[] = [
  { key: 'type', label: 'Type', Icon: PencilIcon },
  { key: 'speak', label: 'Speak', Icon: MicIcon },
  { key: 'snap', label: 'Snap', Icon: CameraIcon },
];

const SUGGESTIONS = ['Kitchen cabinets', 'Wardrobe costing', 'Site measurement', 'Client quotation'];

const ease = [0.22, 1, 0.36, 1] as const;

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
      transition={{ duration: 0.5, ease }}
      className="relative mx-4 mt-2 overflow-hidden rounded-[1.8rem] border border-brown-700/40 bg-gradient-to-b from-brown-700 to-brown-900 p-5 text-beige-50 shadow-lift"
    >
      {/* glow */}
      <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-caramel-500/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.06]" />

      <div className="relative">
        <div className="flex items-center gap-2 text-caramel-300">
          <SparkIcon className="h-4 w-4" />
          <span className="label text-caramel-300">AI Document Assistant</span>
        </div>

        <h1 className="mt-3 font-display text-[26px] font-medium leading-[1.15] tracking-tight">
          What are we
          <br />
          <span className="italic text-caramel-300">documenting</span> today?
        </h1>

        {/* input */}
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-beige-50/15 bg-beige-50/10 p-1.5 pl-4 backdrop-blur">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
            placeholder="Describe a job, dimensions, or client…"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-beige-50 placeholder:text-beige-200/50 focus:outline-none"
          />
          <button
            onClick={go}
            aria-label="Start"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-caramel-500 text-brown-900 transition active:scale-95 hover:bg-caramel-400"
          >
            <SendIcon className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* mode toggle */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {MODES.map(({ key, label, Icon }) => {
            const active = mode === key;
            return (
              <button
                key={key}
                onClick={() => { setMode(key); }}
                className={[
                  'flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition active:scale-[0.98]',
                  active
                    ? 'border-caramel-400/60 bg-beige-50/15 text-beige-50'
                    : 'border-beige-50/10 bg-transparent text-beige-200/70 hover:bg-beige-50/5',
                ].join(' ')}
              >
                <span className="relative">
                  <Icon className="h-4 w-4" />
                  {active && key === 'speak' && (
                    <span className="absolute -right-1 -top-1 h-1.5 w-1.5 animate-breathe rounded-full bg-caramel-300" />
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
              className="rounded-full border border-beige-50/15 bg-beige-50/5 px-3 py-1.5 text-xs text-beige-100/80 transition hover:border-caramel-400/50 hover:text-beige-50"
            >
              {s}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
