'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, DocsIcon, SettingsIcon } from './icons';

const items = [
  { href: '/home', label: 'Home', Icon: HomeIcon, match: (p: string) => p === '/home' },
  { href: '/costing', label: 'Documents', Icon: DocsIcon, match: (p: string) => p.startsWith('/costing') || p.startsWith('/quotation') || p.startsWith('/invoice') },
  { href: '/settings/branding', label: 'Settings', Icon: SettingsIcon, match: (p: string) => p.startsWith('/settings') },
];

export function BottomNav() {
  const pathname = usePathname() || '';
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-beige-400/70 bg-beige-50/95 shadow-bar backdrop-blur"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="mx-auto flex max-w-xl items-stretch justify-around px-2">
        {items.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition',
                active ? 'text-brown-700' : 'text-brown-400 hover:text-brown-600',
              ].join(' ')}
            >
              <Icon className={['h-6 w-6 transition', active ? 'scale-105' : ''].join(' ')} />
              {label}
              <span className={['h-0.5 w-6 rounded-full transition', active ? 'bg-caramel-500' : 'bg-transparent'].join(' ')} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
