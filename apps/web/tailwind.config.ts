import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Warm beige + brown "intelligent studio" palette
        beige: {
          50: '#FCF8F0',
          100: '#F6EFE1',
          200: '#F0E6D3', // canvas
          300: '#E6D8BE',
          400: '#D8C7A8', // sand hairline
        },
        brown: {
          400: '#977654',
          500: '#735639',
          600: '#5C4433',
          700: '#473226',
          800: '#36251B',
          900: '#251913', // near-espresso
        },
        caramel: {
          300: '#D7A877',
          400: '#C08A5E',
          500: '#A9744F', // accent
          600: '#8E5E3E',
        },
      },
      boxShadow: {
        tile: '0 1px 2px rgba(37,25,19,0.05), 0 14px 40px -18px rgba(37,25,19,0.30)',
        lift: '0 2px 4px rgba(37,25,19,0.06), 0 26px 60px -24px rgba(37,25,19,0.45)',
        bar: '0 -1px 0 rgba(216,199,168,0.6), 0 -16px 40px -22px rgba(37,25,19,0.4)',
        glow: '0 0 0 1px rgba(169,116,79,0.30), 0 18px 50px -16px rgba(169,116,79,0.45)',
      },
      borderRadius: { xl2: '1.4rem' },
      keyframes: {
        breathe: {
          '0%,100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.35)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        breathe: 'breathe 2.4s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
      },
    },
  },
};
export default config;
