/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        felid: {
          // Core canvas & surface hierarchy (CSS variable backed for light/dark)
          bg: 'rgb(var(--felid-bg-rgb) / <alpha-value>)',
          surface: 'rgb(var(--felid-surface-rgb) / <alpha-value>)',
          elevated: 'rgb(var(--felid-elevated-rgb) / <alpha-value>)',
          hover: 'rgb(var(--felid-surface-hover-rgb) / <alpha-value>)',

          // Borders & hairlines
          border: 'rgb(var(--felid-border-rgb) / <alpha-value>)',
          'border-strong': 'rgb(var(--felid-border-strong-rgb) / <alpha-value>)',

          // Text hierarchy
          ink: 'rgb(var(--felid-ink-rgb) / <alpha-value>)',
          muted: 'rgb(var(--felid-muted-rgb) / <alpha-value>)',
          'muted-ink': 'rgb(var(--felid-muted-ink-rgb) / <alpha-value>)',

          // Primary action (Light: Royal Cobalt #344E8C | Dark: Dusty Rose #C58C91)
          accent: 'rgb(var(--felid-accent-rgb) / <alpha-value>)',
          'accent-hover': 'rgb(var(--felid-accent-hover-rgb) / <alpha-value>)',
          'accent-ink': 'rgb(var(--felid-accent-ink-rgb) / <alpha-value>)',
          'on-accent': 'rgb(var(--felid-on-accent-rgb) / <alpha-value>)',

          // Secondary accent (Light: Pomegranate #B74750 | Dark: Cobalt #526DA8)
          secondary: 'rgb(var(--felid-secondary-rgb) / <alpha-value>)',
          'secondary-ink': 'rgb(var(--felid-secondary-ink-rgb) / <alpha-value>)',
          'on-secondary': 'rgb(var(--felid-on-secondary-rgb) / <alpha-value>)',

          // Persistent Cobalt & Pomegranate brand anchors across light & dark
          cobalt: 'rgb(var(--felid-cobalt-rgb) / <alpha-value>)',
          'cobalt-hover': 'rgb(var(--felid-cobalt-hover-rgb) / <alpha-value>)',
          'cobalt-ink': 'rgb(var(--felid-cobalt-ink-rgb) / <alpha-value>)',
          'cobalt-line': 'rgb(var(--felid-cobalt-line-rgb) / <alpha-value>)',
          'on-cobalt': 'rgb(var(--felid-on-cobalt-rgb) / <alpha-value>)',

          pomegranate: 'rgb(var(--felid-pomegranate-rgb) / <alpha-value>)',
          'pomegranate-hover': 'rgb(var(--felid-pomegranate-hover-rgb) / <alpha-value>)',
          'pomegranate-ink': 'rgb(var(--felid-pomegranate-ink-rgb) / <alpha-value>)',
          'pomegranate-line': 'rgb(var(--felid-pomegranate-line-rgb) / <alpha-value>)',
          'on-pomegranate': 'rgb(var(--felid-on-pomegranate-rgb) / <alpha-value>)',

          // Burnished Gold highlight (used sparingly)
          highlight: 'rgb(var(--felid-highlight-rgb) / <alpha-value>)',
          'highlight-ink': 'rgb(var(--felid-highlight-ink-rgb) / <alpha-value>)',
          'highlight-line': 'rgb(var(--felid-highlight-line-rgb) / <alpha-value>)',
          'on-highlight': 'rgb(var(--felid-on-highlight-rgb) / <alpha-value>)',

          // Semantic status tokens (Cobalt / Gold / Pomegranate; zero green)
          success: 'rgb(var(--felid-success-rgb) / <alpha-value>)',
          warning: 'rgb(var(--felid-warning-rgb) / <alpha-value>)',
          danger: 'rgb(var(--felid-danger-rgb) / <alpha-value>)',

          // Photography overlays & scrims
          scrim: 'rgb(var(--felid-scrim-rgb) / <alpha-value>)',
          'photo-scrim': 'rgb(var(--felid-photo-scrim-rgb) / <alpha-value>)',
          'photo-ink': 'rgb(var(--felid-photo-ink-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        serif: ['Fraunces', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['DM Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        plate: 'var(--felid-shadow-plate)',
        'plate-hover': 'var(--felid-shadow-plate-hover)',
        modal: 'var(--felid-shadow-modal)',
      },
    },
  },
  plugins: [],
};
