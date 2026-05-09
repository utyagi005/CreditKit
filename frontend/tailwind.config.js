/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Instrument Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: { 950: '#0c0f14', 900: '#141922', 700: '#2a3344', 500: '#5c6b83' },
        mist: '#e8ecf2',
        accent: '#2d6a4f',
        warn: '#bc6c25',
      },
    },
  },
  plugins: [],
};
