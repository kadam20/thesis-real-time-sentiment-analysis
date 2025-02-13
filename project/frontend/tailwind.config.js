/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        background: 'var(--surface-overlay)',
        foreground: 'var(--surface-900)',
        primary: {
            DEFAULT: 'var(--primary-color)',
            foreground: 'var(--primary-color-text)',
        },
        secondary: {
            DEFAULT: 'var(--accent-color))',
            foreground: 'var(--surface-900)',
        },
        destructive: {
            DEFAULT: 'var(--red-500)',
            foreground: 'var(--surface-900)',
        },
        brand: {
            DEFAULT: 'hsl(225,100%,24%)',
        },
        'brand-light': {
            DEFAULT: 'hsl(190,100%,43%)',
        },
    },
    },
  },
  plugins: [require('tailwindcss-primeui')],
}
