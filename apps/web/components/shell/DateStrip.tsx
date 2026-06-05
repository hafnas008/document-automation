'use client';

import { useMemo } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DateStrip() {
  const { week, todayIdx } = useMemo(() => {
    const today = new Date();
    const dow = today.getDay(); // 0=Sun
    // Start the strip on Monday.
    const monOffset = (dow + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - monOffset);
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
    const todayIdx = monOffset; // today's index within the Mon-start week
    return { week, todayIdx };
  }, []);

  return (
    <div className="mt-5 flex justify-between gap-1.5 px-4">
      {week.map((d, i) => {
        const active = i === todayIdx;
        return (
          <div
            key={i}
            className={[
              'flex flex-1 flex-col items-center gap-1 rounded-2xl py-2.5 transition',
              active ? 'bg-mist-100 text-graphite-900 shadow-tile' : 'text-ash-400',
            ].join(' ')}
          >
            <span className={['label text-[9px]', active ? 'text-graphite-900/70' : 'text-ash-500'].join(' ')}>
              {DAYS[d.getDay()]}
            </span>
            <span className={['num text-base font-semibold', active ? 'text-graphite-900' : 'text-mist-100'].join(' ')}>
              {d.getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
