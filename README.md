# CRM — Escola Oficial do Inter, Unidade Viamão

Site público e painel interno da Escola Oficial do Inter em Viamão/RS:

- landing e formulário de aula experimental para os pais;
- lista de presença para o professor (`/aula/:token`);
- painel da equipe (`/admin`): contatos, experimentais, retornos, lista de interesse, relatórios e cadastros;
- clube de benefícios (`/beneficios`).

## Stack

React 18, Vite 5, Tailwind 3, React Router 7 e Supabase (Postgres + Auth). Deploy na Vercel a cada merge na `main`.

## Como rodar

Crie um `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` e rode:

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Documentação

As regras do projeto, a estrutura, o padrão visual e o histórico de mudanças estão no [CLAUDE.md](CLAUDE.md).
