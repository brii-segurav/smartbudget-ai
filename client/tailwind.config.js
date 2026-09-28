/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#f2f5f5',
          800: '#ffffff',
          700: '#dce5e5',
        },
        mustard: {
          500: '#087e78',
          600: '#066862',
        },
      },
      fontFamily: {
        sans: ['Aptos', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 10px 30px rgba(15, 45, 48, 0.06)',
      },
    },
  },
  plugins: [],
};