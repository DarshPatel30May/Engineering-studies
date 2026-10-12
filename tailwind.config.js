/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        civil: { DEFAULT: '#2e7d32', light: '#4caf50', soft: '#e8f5e9', dark: '#1b5e20' },
        transport: { DEFAULT: '#ea580c', light: '#fb923c', soft: '#fff7ed', dark: '#9a3412' },
        aero: { DEFAULT: '#0284c7', light: '#38bdf8', soft: '#f0f9ff', dark: '#075985' },
        telecom: { DEFAULT: '#7c3aed', light: '#a78bfa', soft: '#f5f3ff', dark: '#5b21b6' },
        ink: {
          50: '#f6f8f8', 100: '#eceff0', 200: '#d6dcde', 300: '#b3bdc1', 400: '#85939a',
          500: '#64737a', 600: '#4d5a60', 700: '#3c464b', 800: '#252c30', 900: '#161b1e', 950: '#0d1113',
        },
      },
    },
  },
  plugins: [],
};
