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

// Demo sem a marca do Inter (VITE_BRAND=exemplo): outro título, o
// favicon neutro e sem a imagem do cartão, que mostra o Inter
const NEUTRAL_TITLE = 'CRM para escolas de futebol — demonstração'
const DEMO_DESCRIPTION =
  'Painel de contatos, aulas experimentais, retornos e matrículas de uma escola de futebol infantil. Demonstração com dados fictícios.'

function demoMeta(isDemo, isNeutral) {
  return {
    name: 'demo-meta',
    transformIndexHtml(html) {
      if (!isDemo) return html

      const title = isNeutral ? NEUTRAL_TITLE : DEMO_TITLE
      const image = isNeutral
        ? ''
        : `    <meta property="og:url" content="${DEMO_URL}/" />\n` +
          `    <meta property="og:image" content="${DEMO_URL}/og-demo.png" />\n` +
          `    <meta property="og:image:width" content="1200" />\n` +
          `    <meta property="og:image:height" content="630" />\n` +
          `    <meta name="twitter:card" content="summary_large_image" />`

      const page = isNeutral
        ? html
            .replace(/\s*<link rel="icon" href="\/favicon-32.png"[^>]*>/, '')
            .replace(/\s*<link rel="apple-touch-icon"[^>]*>/, '')
            .replace('href="/favicon.svg"', 'href="/exemplo/favicon.svg"')
        : html

      return page
        .replace(/<title>.*<\/title>/, `<title>${title}</title>`)
        .replace(
          /<meta name="description" content="[^"]*" \/>/,
          `<meta name="description" content="${DEMO_DESCRIPTION}" />\n` +
            `    <meta property="og:title" content="${title}" />\n` +
            `    <meta property="og:description" content="${DEMO_DESCRIPTION}" />\n` +
            `    <meta property="og:type" content="website" />` +
            (image ? `\n${image}` : ''),
        )
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDemo = (process.env.VITE_DEMO ?? env.VITE_DEMO) === '1'
  const isNeutral = (process.env.VITE_BRAND ?? env.VITE_BRAND) === 'exemplo'

  return {
    plugins: [react(), demoMeta(isDemo, isNeutral)],
  }
})
