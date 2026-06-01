/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './**/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      colors: {
        primary: '#2563eb',
        success: '#16a34a',
        danger: '#dc2626'
      }
    }
  },
  plugins: []
};