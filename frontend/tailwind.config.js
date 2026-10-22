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
          // Pinky-gray dark theme palette
          dark: '#0c0a0e',             // Deepest velvet charcoal-mauve
          pine: '#141218',             // Deep slate-charcoal (card base)
          charcoal: '#141218',
          surface: '#1d1922',          // Elevated mauve-slate surface
          'surface-hover': '#26222d',
          border: '#332c3a',           // Delicate ash-rose border
          'border-light': '#483f52',
          
          // Feline pink accents
          accent: '#f472b6',           // Vibrant soft rose pink
          'accent-hover': '#fb7185',   // Coral rose hover
          'accent-muted': 'rgba(244, 114, 182, 0.15)',
          'pink-soft': '#fbcfe8',      // Pastel blush
          'pink-deep': '#db2777',      // Deep feline magenta
          'pink-blush': '#fdf2f8',
          
          // Typography
          ivory: '#fcf8fa',            // Porcelain blush-white text
          'ivory-dim': '#e2dbe3',      // Soft pearl-gray text
          muted: '#9e94a4',            // Silvery lavender-slate
          
          // Status
          danger: '#f43f5e',
          warning: '#fb923c',
          success: '#34d399',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'forest-glow': '0 0 25px -4px rgba(244, 114, 182, 0.25)',
        'pink-glow': '0 0 25px -4px rgba(244, 114, 182, 0.35)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        'topo-subtle': "radial-gradient(circle at 50% 0%, rgba(244, 114, 182, 0.08) 0%, transparent 65%)",
        'paw-glow': "radial-gradient(circle at 100% 100%, rgba(251, 113, 133, 0.06) 0%, transparent 50%)",
      }
    },
  },
  plugins: [],
}
