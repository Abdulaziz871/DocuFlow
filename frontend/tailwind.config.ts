import type { Config } from 'tailwindcss';

// DocuFlow AI design system — a clean, professional B2B SaaS palette
// (slate neutrals + a single indigo accent), each token with one fixed role:
//   ink      -> headings / primary text          (near-black slate)
//   muted    -> secondary text, borders, labels   (mid slate)
//   border   -> hairline borders / dividers       (light slate)
//   canvas   -> page background                    (near-white slate)
//   sidebar  -> sidebar / dark surfaces             (deep navy-black)
//   brand    -> buttons, links, active states, focus rings (indigo)
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F172A',
        muted: '#64748B',
        border: '#E2E8F0',
        canvas: '#F7F8FB',
        sidebar: { DEFAULT: '#0B1220', foreground: '#E2E8F0' },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          DEFAULT: '#4F46E5',
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['var(--font-cairo)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.06)',
        popover: '0 8px 24px -4px rgba(15, 23, 42, 0.12), 0 2px 8px -2px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        xl: '0.875rem',
      },
    },
  },
  plugins: [],
};

export default config;
