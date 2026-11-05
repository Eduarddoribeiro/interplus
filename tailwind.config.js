/*
 * VITE_BRAND=exemplo: demo sem a marca do Inter (ver src/constants/brand.js).
 * O nome do token continua inter-red para não mudar as telas.
 */
const brandColors =
  process.env.VITE_BRAND === 'exemplo'
    ? { red: '#1D4ED8', 'red-dark': '#1E40AF', 'red-light': '#E8EEFC' }
    : { red: '#C8102E', 'red-dark': '#9e0d23', 'red-light': '#f5e6e9' }

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
        inter: brandColors,
        // Painel: neutros e cores com significado (ver src/admin/ui)
        ink: '#1C1F24',
        muted: '#5B616B',
        line: '#E3E6EA',
        canvas: '#F6F7F8',
        alert: { DEFAULT: '#D92D20', text: '#B42318', soft: '#FEECEB' },
        attention: { DEFAULT: '#E8A400', text: '#8A5A00', soft: '#FFF6D6' },
        // #17713E: contraste AA também sobre o fundo verde claro (soft)
        ok: { DEFAULT: '#17713E', soft: '#E7F6EC' },
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
