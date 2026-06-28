# Clube de Benefícios – Família Inter Viamão

Site institucional premium para o Clube de Benefícios da Escola Oficial do Inter, Unidade Viamão.

## Stack

- **React 18** + **Vite**
- **Tailwind CSS**
- **Framer Motion** (animações)
- **Lucide React** (ícones)
- Dados em **JSON** (sem banco de dados)

## Instalação

```bash
npm install
npm run dev
```

## Build para produção

```bash
npm run build
```

## Deploy na Vercel

1. Faça push do projeto para GitHub
2. Acesse [vercel.com](https://vercel.com) e importe o repositório
3. A Vercel detecta Vite automaticamente
4. Clique em **Deploy** ✅

## Estrutura

```
src/
├── components/
│   ├── Navbar.jsx          # Navbar fixa com blur e menu mobile
│   ├── Hero.jsx            # Hero com campo desfocado e overlay vermelho
│   ├── Stats.jsx           # Cards de estatísticas com ícones
│   ├── HowItWorks.jsx      # 3 passos com timeline
│   ├── Partners.jsx        # Grid de parceiros com filtro por categoria
│   ├── PartnerCard.jsx     # Card individual de parceiro
│   ├── Banner.jsx          # Faixa dark com CTAs para redes sociais
│   ├── BecomePartner.jsx   # Seção fundo vermelho para novos parceiros
│   ├── FAQ.jsx             # Accordion de perguntas frequentes
│   └── Footer.jsx          # Rodapé com links e contato
├── data/
│   ├── partners.json       # Lista de parceiros (edite aqui!)
│   ├── stats.json          # Números das estatísticas
│   └── faq.json            # Perguntas e respostas
├── hooks/
│   └── useScrolled.js      # Hook para detectar scroll da navbar
├── App.jsx
├── main.jsx
└── index.css
```

## Adicionando parceiros

Edite `src/data/partners.json` adicionando um objeto com os campos:

```json
{
  "id": 9,
  "nome": "Nome da Empresa",
  "categoria": "Alimentação",
  "logo": "🍽️",
  "imagem": "https://url-da-imagem.com/foto.jpg",
  "desconto": "10% OFF",
  "descricao": "Descrição curta do benefício.",
  "instagram": "https://instagram.com/empresa",
  "site": "https://empresa.com.br",
  "whatsapp": "5551999990000",
  "endereco": "Rua Exemplo, 123",
  "cidade": "Viamão"
}
```

Categorias disponíveis: `Alimentação`, `Saúde`, `Esporte`, `Educação`, `Beleza`, `Serviços`
