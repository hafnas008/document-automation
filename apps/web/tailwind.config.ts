import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        display: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Graphite → silver grayscale system
        graphite: {
          950: '#09090B',
          900: '#0C0C0E', // app base
          850: '#121214',
          800: '#161619', // card
          700: '#1E1E22',
          600: '#26262B',
          500: '#33333A',
        },
        ash: {
          600: '#56565E',
          500: '#74747C',
          400: '#9A9AA2', // muted text
          300: '#B8B8BE',
        },
        mist: {
          300: '#CFD0D4', // silver accent
          200: '#E2E2E5',
          100: '#F1F1F3', // primary text
        },
        // legacy tokens — keep old (un-reskinned) costing/settings pages readable
        ink: { 950: '#0a0a0a', 900: '#171717', 800: '#262626', 50: '#fafafa' },
      },
      letterSpacing: { ultra: '0.42em' },
      boxShadow: {
        tile: '0 1px 2px rgba(0,0,0,0.4), 0 18px 50px -22px rgba(0,0,0,0.8)',
        lift: '0 2px 6px rgba(0,0,0,0.5), 0 32px 70px -28px rgba(0,0,0,0.9)',
        bar: '0 -1px 0 rgba(255,255,255,0.06), 0 -18px 40px -22px rgba(0,0,0,0.7)',
      },
      borderRadius: { xl2: '1.4rem' },
      keyframes: {
        breathe: {
          '0%,100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.4)' },
        },
      },
      animation: { breathe: 'breathe 2.4s ease-in-out infinite' },
      transitionTimingFunction: { entrance: 'cubic-bezier(0.16,1,0.3,1)' },
    },
  },
};
export default config;
