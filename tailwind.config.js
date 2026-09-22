/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#171512',
          surface: '#211E19',
          raised: '#2A2520',
          line: '#3A3428',
          'line-soft': '#2A2520',
          primary: '#E8DFC9',
          'burnt-orange': '#B8623A',
          mustard: '#C49A45',
          olive: '#7B8050',
          sage: '#879477',
          'warm-brown': '#6F513A',
          danger: '#C05B4D',
        },
      },
      fontFamily: {
        display: ['"Georgia"', '"Palatino Linotype"', '"Book Antiqua"', 'serif'],
        body: ['"Inter"', '"Helvetica Neue"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      letterSpacing: {
        widest2: '0.22em',
      },
      boxShadow: {
        panel: '0 1px 0 rgba(0,0,0,0.25), 0 8px 24px -12px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};