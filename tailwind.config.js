/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#0f172a',
        'foreground': '#f8fafc',
        'primary': '#3b82f6',
        'primary-hover': '#2563eb',
        'secondary': '#1e293b',
        'border': '#334155'
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'zoom-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'zoom-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        }
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
}
