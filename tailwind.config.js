/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
  sans: ["Inter", "sans-serif"],
  display: ["Teko", "sans-serif"],
},
      colors: {
        inter: {
          red: '#C8102E',
          'red-dark': '#9e0d23',
          'red-light': '#f5e6e9',
        },
        // Landing: cinza frio das seções, texto e WhatsApp
        quadra: '#EEF0F2',
        grafite: '#22252A',
        whatsapp: '#1F9D55',
      },
      borderRadius: {
        '2xl': '16px',
      },
      // Telas de toque (celular, tablet): alvos de 44px no painel.
      // Mesmo critério do ajuste de 16px nos campos em index.css.
      screens: {
        touch: { raw: '(hover: none) and (pointer: coarse)' },
      },
    },
  },
  plugins: [],
}
