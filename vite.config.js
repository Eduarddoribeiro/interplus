import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/*
 * Na demonstração (VITE_DEMO=1) o título e a descrição da página
 * falam do CRM, porque são eles que aparecem no cartão do link no
 * LinkedIn e no WhatsApp. O site real mantém os textos da escola.
 */
const DEMO_TITLE = 'CRM Escola do Inter Viamão — demonstração'
// O LinkedIn exige endereço completo da imagem do cartão
const DEMO_URL = 'https://crm-escola-demo.vercel.app'
const DEMO_DESCRIPTION =
  'Painel de contatos, aulas experimentais, retornos e matrículas de uma escola de futebol infantil. Demonstração com dados fictícios.'

function demoMeta(isDemo) {
  return {
    name: 'demo-meta',
    transformIndexHtml(html) {
      if (!isDemo) return html

      return html
        .replace(/<title>.*<\/title>/, `<title>${DEMO_TITLE}</title>`)
        .replace(
          /<meta name="description" content="[^"]*" \/>/,
          `<meta name="description" content="${DEMO_DESCRIPTION}" />\n` +
            `    <meta property="og:title" content="${DEMO_TITLE}" />\n` +
            `    <meta property="og:description" content="${DEMO_DESCRIPTION}" />\n` +
            `    <meta property="og:type" content="website" />
` +
            `    <meta property="og:url" content="${DEMO_URL}/" />
` +
            `    <meta property="og:image" content="${DEMO_URL}/og-demo.png" />
` +
            `    <meta property="og:image:width" content="1200" />
` +
            `    <meta property="og:image:height" content="630" />
` +
            `    <meta name="twitter:card" content="summary_large_image" />`,
        )
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDemo = (process.env.VITE_DEMO ?? env.VITE_DEMO) === '1'

  return {
    plugins: [react(), demoMeta(isDemo)],
  }
})
