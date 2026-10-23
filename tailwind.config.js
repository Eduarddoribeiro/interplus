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
        // Painel: neutros e cores com significado (ver src/admin/ui)
        ink: '#1C1F24',
        muted: '#5B616B',
        line: '#E3E6EA',
        canvas: '#F6F7F8',
        alert: { DEFAULT: '#D92D20', text: '#B42318', soft: '#FEECEB' },
        attention: { DEFAULT: '#E8A400', text: '#8A5A00', soft: '#FFF6D6' },
        ok: { DEFAULT: '#1E8E4E', soft: '#E7F6EC' },
        whatsapp: '#1F9D55',
      },
      borderRadius: {
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
