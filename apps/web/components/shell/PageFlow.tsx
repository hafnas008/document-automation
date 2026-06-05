'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useMemo } from 'react';

// Deterministic pseudo-random — identical SSR/CSR markup.
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Path = { d: string; opacity: number; width: number };

/** Flowing-line field drifting on scroll — silver-gray, behind everything. */
export function PageFlow() {
  const paths = useMemo<Path[]>(() => {
    const rand = mulberry32(13);
    const W = 1440;
    const H = 2000;
    const lineCount = 24;
    const out: Path[] = [];
    for (let i = 0; i < lineCount; i++) {
      const yMid = (i / (lineCount - 1)) * H;
      const segs = 9;
      let d = '';
      let prevX = 0;
      let prevY = yMid;
      for (let s = 0; s <= segs; s++) {
        const x = (s / segs) * W;
        const wobble = (rand() - 0.5) * 150 * Math.sin(i * 0.5 + s * 0.7);
        const y = yMid + wobble;
        if (s === 0) {
          d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        } else {
          const cx = prevX + (x - prevX) * 0.5;
          d += ` C ${cx.toFixed(1)} ${prevY.toFixed(1)} ${cx.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        prevX = x;
        prevY = y;
      }
      out.push({ d, opacity: 0.14 + rand() * 0.26, width: 0.7 + rand() * 1.1 });
    }
    return out;
  }, []);

  const { scrollYProgress } = useScroll();
  const yDrift = useTransform(scrollYProgress, [0, 1], ['0%', '-40%']);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden tech-grid"
      style={{ contain: 'strict', willChange: 'transform' }}
    >
      {/* ambient halos */}
      <div
        className="absolute left-1/2 top-[-18%] h-[1100px] w-[1100px] -translate-x-1/2"
        style={{ background: 'radial-gradient(closest-side, rgba(207,208,212,0.10), rgba(207,208,212,0.03) 40%, transparent 75%)' }}
      />
      <div
        className="absolute left-[-12%] top-[58%] h-[900px] w-[900px]"
        style={{ background: 'radial-gradient(closest-side, rgba(207,208,212,0.06), transparent 70%)' }}
      />
      <motion.svg
        viewBox="0 0 1440 2000"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-x-0 top-0 h-[180vh] w-full"
        style={{ y: yDrift, willChange: 'transform' }}
      >
        <defs>
          <linearGradient id="pf-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#CFD0D4" stopOpacity="0" />
            <stop offset="25%" stopColor="#CFD0D4" stopOpacity="0.5" />
            <stop offset="75%" stopColor="#CFD0D4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#CFD0D4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#pf-grad)" strokeLinecap="round">
          {paths.map((p, i) => (
            <path key={i} d={p.d} strokeWidth={p.width} opacity={p.opacity} />
          ))}
        </g>
      </motion.svg>
    </div>
  );
}
