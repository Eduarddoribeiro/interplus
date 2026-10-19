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
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.08)',
        'card-hover': '0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)',
      },
    },
  },
  plugins: [],
}
