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
        // Light grayscale system.
        // graphite = light SURFACES (canvas / cards), mist = dark INK (text),
        // ash = mid grays (muted text / hairlines).
        graphite: {
          950: '#E4E4E7',
          900: '#ECECEE', // app canvas
          850: '#F5F5F6',
          800: '#FFFFFF', // card
          700: '#F1F1F3', // hover
          600: '#E8E8EB',
          500: '#DCDCE0',
        },
        ash: {
          600: '#C2C2C8', // faint hairline
          500: '#9A9AA2', // faint text
          400: '#6B6B72', // muted text
          300: '#52525B',
        },
        mist: {
          300: '#52525B', // accent / icon stroke
          200: '#33333A',
          100: '#18181B', // primary text
        },
        // legacy tokens — keep old (un-reskinned) settings/onboarding pages readable
        ink: { 950: '#0a0a0a', 900: '#171717', 800: '#262626', 50: '#fafafa' },
      },
      letterSpacing: { ultra: '0.42em' },
      boxShadow: {
        tile: '0 1px 2px rgba(24,24,27,0.04), 0 14px 36px -20px rgba(24,24,27,0.22)',
        lift: '0 2px 6px rgba(24,24,27,0.06), 0 30px 64px -28px rgba(24,24,27,0.30)',
        bar: '0 -1px 0 rgba(24,24,27,0.06), 0 -16px 40px -24px rgba(24,24,27,0.18)',
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
