/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': 'var(--bg-app)',
        'foreground': 'var(--text-primary)',
        'app-bg': 'var(--bg-app)',
        'panel-bg': 'var(--bg-panel)',
        'panel-header': 'var(--bg-panel-header)',
        'panel-border': 'var(--border-subtle)',
        'app-text': 'var(--text-primary)',
        'app-sub': 'var(--text-secondary)',
        'app-muted': 'var(--text-muted)',
        'primary': 'rgb(var(--primary-rgb, 59 130 246) / <alpha-value>)',
        'primary-hover': 'var(--primary-hover)',
        'secondary': 'var(--text-secondary)',
        'muted': 'var(--text-muted)',
        'card': 'var(--bg-card)',
        'border': 'var(--border-subtle)'
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-out': { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
        'zoom-in': { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'zoom-out': { '0%': { opacity: '1', transform: 'scale(1)' }, '100%': { opacity: '0', transform: 'scale(0.95)' } }
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'fade-out': 'fade-out 0.2s ease-in forwards',
        'zoom-in': 'zoom-in 0.2s ease-out forwards',
        'zoom-out': 'zoom-out 0.2s ease-in forwards',
      }
    },
  },
  plugins: [],
};
