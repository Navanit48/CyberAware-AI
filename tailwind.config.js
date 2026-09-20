/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: 'var(--bg-main)',
          subtle: 'var(--bg-input)',
        },
        surface: {
          dark: 'var(--bg-surface)',
          card: 'var(--bg-surface)',
          hover: 'var(--bg-surface-hover)',
          glass: 'var(--bg-sidebar)',
        },
        border: {
          subtle: 'var(--border-color)',
          light: 'var(--border-light)',
          glow: 'var(--accent-emerald-border)',
        },
        emerald: {
          accent: 'var(--accent-emerald-text)',
          dim: 'var(--accent-emerald-bg)',
          glow: 'var(--accent-emerald-bg)',
          hover: 'var(--accent-emerald-hover)',
        },
        subtext: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Geist', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full-pill': '9999px',
      },
      boxShadow: {
        'emerald-soft': '0 0 25px -5px rgba(46, 230, 166, 0.15)',
        'emerald-pill': '0 4px 20px -2px rgba(46, 230, 166, 0.25)',
        'glass-smooth': 'var(--shadow-smooth)',
      }
    },
  },
  plugins: [],
}
