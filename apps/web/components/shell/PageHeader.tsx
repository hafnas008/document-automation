import Link from 'next/link';
import { BackIcon } from './icons';

export function PageHeader({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <header className="px-5 pt-8 pb-5">
      <Link
        href="/home"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brown-500 transition hover:text-brown-700"
      >
        <BackIcon className="h-4 w-4" />
        Home
      </Link>
      {kicker && <p className="num text-xs uppercase tracking-[0.18em] text-caramel-600">{kicker}</p>}
      <h1 className="font-display text-2xl font-bold leading-tight text-brown-900">{title}</h1>
      <div className="rule mt-4" />
    </header>
  );
}
