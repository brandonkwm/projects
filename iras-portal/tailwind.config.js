/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1B3A6B',
        'navy-dark': '#142D55',
        teal: '#0F7B6C',
        'teal-hover': '#0A6057',
        orange: '#E85B04',
        'iras-gray': '#F5F6F8',
        'iras-border': '#D9DBE0',
      },
    },
  },
  plugins: [],
}
