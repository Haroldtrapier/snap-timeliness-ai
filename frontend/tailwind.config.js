/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        snap: {
          green: '#2D7D46',
          'green-light': '#4CAF70',
          'green-dark': '#1B5E2D',
          blue: '#1565C0',
          'blue-light': '#1976D2',
          orange: '#E65100',
          red: '#C62828',
        },
      },
    },
  },
  plugins: [],
}
