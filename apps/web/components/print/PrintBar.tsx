'use client';
import { useRouter } from 'next/navigation';

export function PrintBar({ backHref }: { backHref: string }) {
  const router = useRouter();
  return (
    <div className="no-print print-bar flex items-center justify-between bg-graphite-900/90 px-4 py-3 backdrop-blur">
      <button onClick={() => router.push(backHref)} className="text-sm font-medium text-ash-400 hover:text-mist-100">← Back to editor</button>
      <button onClick={() => window.print()} className="btn-primary px-5 py-2.5 text-sm">Save / Print PDF</button>
    </div>
  );
}
