'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MagneticButton } from './MagneticButton';
import { PencilIcon, MicIcon, CameraIcon, SparkIcon, SendIcon } from './icons';

type Mode = 'type' | 'speak' | 'snap';

const MODES: { key: Mode; label: string; Icon: typeof PencilIcon }[] = [
  { key: 'type', label: 'Type', Icon: PencilIcon },
  { key: 'speak', label: 'Speak', Icon: MicIcon },
  { key: 'snap', label: 'Snap', Icon: CameraIcon },
];
const SUGGESTIONS = ['Kitchen cabinets', 'Wardrobe costing', 'Pet house in MDF', 'TV unit'];
const ease = [0.16, 1, 0.3, 1] as const;

export function SmartCommand() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('type');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState<null | string>(null);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function createFrom(payload: { text?: string; image?: { data: string; media_type: string } }, label: string) {
    setError(null); setBusy(label);
    try {
      const r = await fetch('/api/costing/smart', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || 'failed');
      router.push(`/costing/${j.id}`);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong'); setBusy(null);
    }
  }

  function submitText(text?: string) {
    const t = (text ?? value).trim();
    if (!t) { inputRef.current?.focus(); return; }
    createFrom({ text: t }, 'Estimating with AI…');
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const dataUrl: string = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
    const data = dataUrl.split(',')[1] ?? '';
    createFrom({ image: { data, media_type: file.type || 'image/jpeg' }, text: value.trim() || undefined }, 'Reading photo…');
    e.target.value = '';
  }

  function startSpeak() {
    setMode('speak'); setError(null);
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError('Voice input isn’t supported on this browser — type instead.'); setMode('type'); inputRef.current?.focus(); return; }
    const rec = new SR();
    rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = false;
    rec.onresult = (ev: any) => { const t = Array.from(ev.results).map((r: any) => r[0].transcript).join(''); setValue(t); };
    rec.onerror = () => { setListening(false); };
    rec.onend = () => setListening(false);
    setListening(true); rec.start();
  }

  function onMode(k: Mode) {
    if (k === 'type') { setMode('type'); inputRef.current?.focus(); }
    if (k === 'snap') { setMode('snap'); fileRef.current?.click(); }
    if (k === 'speak') startSpeak();
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.05 }}
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
          What are we<br />documenting <span className="text-ash-500">today?</span>
        </h1>

        {/* input */}
        <div className={`mt-5 flex items-center gap-2 rounded-2xl border bg-graphite-900 p-1.5 pl-4 transition ${listening ? 'border-mist-300' : 'border-black/15'}`}>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitText()}
            placeholder={listening ? 'Listening…' : 'Describe a job, dimensions, or client…'}
            disabled={!!busy}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-mist-100 placeholder:text-ash-500 focus:outline-none disabled:opacity-60"
          />
          <MagneticButton ariaLabel="Start" onClick={() => submitText()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mist-100 text-graphite-900 transition hover:bg-mist-200">
            <SendIcon className="h-5 w-5" strokeWidth={2} />
          </MagneticButton>
        </div>

        {/* mode toggle */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {MODES.map(({ key, label, Icon }) => {
            const active = mode === key;
            return (
              <button key={key} onClick={() => onMode(key)} disabled={!!busy}
                className={['flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition active:scale-[0.98] disabled:opacity-50',
                  active ? 'border-black/15 bg-black/[0.06] text-mist-100' : 'border-black/[0.06] text-ash-400 hover:bg-black/[0.03]'].join(' ')}>
                <span className="relative">
                  <Icon className="h-4 w-4" />
                  {listening && key === 'speak' && <span className="absolute -right-1 -top-1 h-1.5 w-1.5 animate-breathe rounded-full bg-red-500" />}
                </span>
                {label}
              </button>
            );
          })}
        </div>

        {/* suggestions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s, i) => (
            <motion.button key={s} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.06, duration: 0.3, ease }}
              onClick={() => submitText(s)} disabled={!!busy}
              className="rounded-full border border-black/10 bg-black/[0.02] px-3 py-1.5 text-xs text-ash-400 transition hover:border-mist-300/40 hover:text-mist-100 disabled:opacity-50">
              {s}
            </motion.button>
          ))}
        </div>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      </div>

      {/* busy overlay */}
      {busy && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-graphite-800/85 backdrop-blur-sm">
          <SparkIcon className="h-7 w-7 animate-breathe text-mist-300" />
          <span className="label text-mist-200">{busy}</span>
          <span className="text-xs text-ash-400">Claude is building your costing…</span>
        </div>
      )}
    </motion.section>
  );
}
