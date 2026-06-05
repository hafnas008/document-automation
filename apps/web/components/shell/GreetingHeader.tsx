import Link from 'next/link';
import { SettingsIcon } from './icons';

export function GreetingHeader({ company }: { company: string }) {
  const first = company.split(' ')[0] || 'there';
  return (
    <header className="px-5 pt-8">
      {/* brand bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Documentation Studio" className="h-14 w-14 rounded-[1.1rem] shadow-tile" />
          <span className="label">Documentation Studio</span>
        </div>
        <Link
          href="/settings/branding"
          aria-label="Settings"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-black/[0.07] bg-graphite-800 text-mist-200 shadow-tile transition active:scale-95 hover:bg-graphite-700"
        >
          <SettingsIcon className="h-5 w-5" />
        </Link>
      </div>

      {/* greeting */}
      <div className="mt-6">
        <h1 className="font-display text-[26px] font-bold leading-tight text-mist-100">Hey, {first}</h1>
        <p className="mt-1 font-display text-base italic text-ash-400">Let’s get your documents ready.</p>
      </div>
    </header>
  );
}
