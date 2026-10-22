/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        felid: {
          dark: '#070c09',
          pine: '#0d1611',
          surface: '#142019',
          'surface-hover': '#1b2b22',
          border: '#23352a',
          'border-light': '#324a3c',
          accent: '#e5a93b',
          'accent-hover': '#f59e0b',
          'accent-muted': 'rgba(229, 169, 59, 0.15)',
          ivory: '#f6f4ee',
          'ivory-dim': '#d8d4c7',
          muted: '#93a298',
          danger: '#ef4444',
          warning: '#f59e0b',
          success: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'forest-glow': '0 0 25px -5px rgba(229, 169, 59, 0.15)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'topo-subtle': "radial-gradient(circle at 50% 0%, rgba(229, 169, 59, 0.05) 0%, transparent 60%)",
      }
    },
  },
  plugins: [],
}
