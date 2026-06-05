import Link from 'next/link';
import { SunIcon } from './icons';

export function GreetingHeader({ company }: { company: string }) {
  const first = company.split(' ')[0] || 'there';
  return (
    <header className="flex items-start justify-between px-5 pt-8">
      <div>
        <h1 className="font-display text-[26px] font-bold leading-tight text-mist-100">
          Hey, {first} <span className="align-middle">👋</span>
        </h1>
        <p className="mt-1 font-display text-base italic text-ash-400">
          Let’s get your documents ready.
        </p>
      </div>
      <Link
        href="/settings/branding"
        aria-label="Settings"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-black/[0.07] bg-graphite-800 text-mist-200 shadow-tile transition active:scale-95 hover:bg-graphite-700"
      >
        <SunIcon className="h-5 w-5" />
      </Link>
    </header>
  );
}
