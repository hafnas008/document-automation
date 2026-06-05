import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
        display: ['var(--font-display)', 'var(--font-inter)', 'ui-sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Light beige + brown "professional engineering" palette
        beige: {
          50: '#FBF7EF', // cream surface
          100: '#F6EFE1',
          200: '#F2EADB', // app canvas
          300: '#E8DCC6',
          400: '#D8C7A8', // sand hairline
        },
        brown: {
          400: '#8A6A4F',
          500: '#6F503A',
          600: '#5C4433', // primary
          700: '#4A3527', // primary hover
          800: '#3A291E',
          900: '#2E2620', // espresso text
        },
        caramel: {
          400: '#C08A5E',
          500: '#A9744F', // accent
          600: '#8E5E3E',
        },
        // legacy aliases so existing pages don't break before reskin
        ink: { 950: '#2E2620', 900: '#2E2620', 800: '#4A3527', 50: '#FBF7EF' },
      },
      boxShadow: {
        tile: '0 1px 2px rgba(46,38,32,0.06), 0 8px 24px -12px rgba(46,38,32,0.18)',
        bar: '0 -1px 0 rgba(216,199,168,0.7), 0 -8px 24px -16px rgba(46,38,32,0.25)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
};
export default config;
