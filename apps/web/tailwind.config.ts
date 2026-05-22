import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter','ui-sans-serif','system-ui'] },
      colors: {
        ink: { 950: '#0a0a0a', 900: '#171717', 800: '#262626', 50: '#fafafa' },
      },
    },
  },
};
export default config;
