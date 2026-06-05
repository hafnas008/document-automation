'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

/** Magnetic element — drifts toward the cursor with spring physics. */
export function MagneticButton({
  children,
  className,
  onClick,
  strength = 0.3,
  innerStrength = 0.15,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
  innerStrength?: number;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.6 });
  const innerX = useTransform(sx, (v) => v * innerStrength * -1);
  const innerY = useTransform(sy, (v) => v * innerStrength * -1);

  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className={className}
    >
      <motion.span style={{ x: innerX, y: innerY }} className="inline-flex items-center justify-center">
        {children}
      </motion.span>
    </motion.button>
  );
}
