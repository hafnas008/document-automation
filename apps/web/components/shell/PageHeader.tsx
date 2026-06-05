import Link from 'next/link';
import { BackIcon } from './icons';

export function PageHeader({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <header className="px-5 pt-8 pb-5">
      <Link
        href="/home"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ash-400 transition hover:text-mist-100"
      >
        <BackIcon className="h-4 w-4" />
        Home
      </Link>
      {kicker && <p className="label">{kicker}</p>}
      <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-mist-100">{title}</h1>
      <div className="rule mt-4" />
    </header>
  );
}
