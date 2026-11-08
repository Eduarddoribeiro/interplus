/*
 * Marca do sistema. Sem VITE_BRAND, é a Escola Oficial do Inter
 * Viamão (site real e demo do portfólio). Com VITE_BRAND=exemplo,
 * a demo sai sem nome, logo, cor, telefone e sistemas da escola,
 * para apresentar o CRM a outras escolas.
 *
 * As cores ficam no tailwind.config.js (mesma variável).
 */
const INTER = {
  name: "Escola Oficial do Inter Viamão",
  // Como a escola aparece em textos formais (autorização de dados)
  formalName: "Escola Oficial do Inter, Unidade Viamão",
  shortName: "Escola do Inter",
  logoAlt: "Escola Oficial do Inter, Viamão",
  logo: "/logo-recorte-vermelho.svg",
  logoWhite: "/logo-recorte-branco.svg",
  // Logo quadrado do formulário de experimental
  publicLogo: "/logo-vermelho.png",
  badge: "Escola Oficial do Inter",
  tagline: "Contatos, experimentais, alunos e eventos da Escola Oficial do Inter em Viamão/RS.",
  city: "Viamão",
  whatsapp: "5551996476999",
  // Sistema oficial de cadastro e mensalidade, fora do CRM
  financeSystem: "Sogni",
  championship: "Taça Gaúcha",
};

const EXEMPLO = {
  name: "Escola de Futebol Exemplo",
  formalName: "Escola de Futebol Exemplo",
  shortName: "Escola Exemplo",
  logoAlt: "Escola de Futebol Exemplo",
  logo: "/exemplo/logo.svg",
  logoWhite: "/exemplo/logo-branco.svg",
  publicLogo: "/exemplo/logo.svg",
  badge: "Escola de futebol infantil",
  tagline: "Contatos, experimentais, alunos e eventos da escola, num painel só.",
  city: "Cidade Exemplo",
  whatsapp: "",
  financeSystem: "sistema financeiro",
  championship: "Copa Regional",
};

// Comparação direta: o Vite troca a variável no build e descarta a
// marca que não é usada (a demo neutra não leva os textos do Inter)
export const BRAND_KEY = import.meta.env.VITE_BRAND === "exemplo" ? "exemplo" : "inter";

export const BRAND = import.meta.env.VITE_BRAND === "exemplo" ? EXEMPLO : INTER;
