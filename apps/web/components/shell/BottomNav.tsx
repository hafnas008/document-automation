'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, DocsIcon, SettingsIcon } from './icons';

const items = [
  { href: '/home', label: 'Home', Icon: HomeIcon, match: (p: string) => p === '/home' },
  { href: '/costing', label: 'Docs', Icon: DocsIcon, match: (p: string) => p.startsWith('/costing') || p.startsWith('/quotation') || p.startsWith('/invoice') },
  { href: '/settings/branding', label: 'Settings', Icon: SettingsIcon, match: (p: string) => p.startsWith('/settings') },
];

export function BottomNav() {
  const pathname = usePathname() || '';
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-beige-400/60 bg-beige-100/80 shadow-bar backdrop-blur-xl"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="mx-auto flex max-w-xl items-stretch justify-around px-3">
        {items.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex flex-1 flex-col items-center gap-1 py-2.5 transition',
                active ? 'text-brown-800' : 'text-brown-400 hover:text-brown-600',
              ].join(' ')}
            >
              <span
                className={[
                  'grid h-9 w-9 place-items-center rounded-xl transition',
                  active ? 'bg-brown-700 text-beige-50 shadow-tile' : 'bg-transparent',
                ].join(' ')}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="label text-[9px] tracking-[0.16em]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
