/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f3fa',
          100: '#dde4f2',
          200: '#c0cee7',
          300: '#95add7',
          400: '#6485c2',
          500: '#4263ab',
          600: '#314c8f',
          700: '#283c74',
          800: '#253562',
          900: '#1e294f',
          950: '#10152b', // Deep Navy Blue
        }
      }
    },
  },
  plugins: [],
}
