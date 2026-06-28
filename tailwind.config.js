/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        inter: {
          red: '#C8102E',
          'red-dark': '#9e0d23',
          'red-light': '#f5e6e9',
        },
      },
      borderRadius: {
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.08)',
        'card-hover': '0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)',
      },
    },
  },
  plugins: [],
}
