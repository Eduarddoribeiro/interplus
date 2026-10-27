# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Equipe da escola (painel `/admin`):** 1 ou 2 pessoas, da coordenação e do atendimento, fazem todo o trabalho de captação. Usam o painel meio a meio: no computador para organizar a semana (agenda de experimentais, relatórios, cadastros) e no celular para o que acontece na hora (confirmar aula, marcar veio ou faltou, ligar, abrir o WhatsApp do responsável). Usam todo dia, conhecem o fluxo e precisam de rapidez, não de explicação.
- **Pais e responsáveis (site público):** pais de crianças de 8 a 11 anos (Sub-09 e Sub-11) em Viamão/RS e arredores. Chegam pelo Instagram, por indicação, pelo Google ou pelo WhatsApp, quase sempre no celular, e querem agendar uma aula experimental gratuita para o filho.
- **Professores (`/aula/:token`):** abrem um link sem login, no celular e no campo, para ver quem vem à experimental do dia e marcar a presença.

## Product Purpose

Levar o interessado do primeiro contato até a matrícula na Escola Oficial do Inter, Unidade Viamão: o pai agenda a experimental sozinho pelo site, a equipe confirma, registra se a criança veio, faz até 3 retornos em 14 dias e fecha com matrícula, lista de interesse (sem vaga) ou encerramento com motivo. O sistema vai só até a matrícula.

Sucesso é nenhuma experimental ficar sem baixa de presença, nenhum retorno atrasar e a equipe pequena dar conta do funil sem planilha nem caderno.

## Positioning

É a escola oficial do Sport Club Internacional na cidade: a criança treina com a metodologia do clube (Celeiro de Ases), com uniforme oficial e seguro atleta. O sistema foi feito para essa unidade e o funil dela (aula experimental como porta de entrada), não é um CRM genérico de vendas.

## Operating Context

- O contato com as famílias acontece pelo WhatsApp (links `wa.me`, mensagens prontas no painel). Não há integração automática de mensagens.
- A aula experimental é o centro do funil: o horário vem das turmas cadastradas (categoria por ano de nascimento, local, dia e hora).
- Os professores marcam a presença pelo link da aula; a equipe dá a baixa e decide o próximo passo.
- O painel é usado nos dois aparelhos com a mesma frequência, então toda tela precisa funcionar bem no celular, não só caber nele.

## Capabilities and Constraints

- Funil, status e regras: ver `CLAUDE.md` (seções "Funil atual" e "Migração planejada do funil"). Nomes de status e motivos sempre das constantes do projeto.
- Os dados são de menores de idade e ficam no Supabase de produção. Nada de dado pessoal em URL, em log ou em material de divulgação.
- O cadastro público e a lista do professor funcionam sem login, só pelas RPCs públicas.
- Interface sempre em português do Brasil.
- Um projeto antigo (clube de benefícios, `/beneficios`) convive no repositório e não faz parte do CRM.

## Brand Commitments

- Nome: Escola Oficial do Inter, Unidade Viamão (no logo: "Escola do Inter, Viamão - RS").
- Logos em `public/`: `logo-vermelho.png` e `logo-vermelho.svg` (vermelho sobre claro) e `logo.svg` (branco, para fundo vermelho). Vermelho do Inter: `#C8102E`.
- Tom com as famílias: próximo e acolhedor, como um professor conversando com a família. Simples, caloroso, sem formalidade e sem jargão de vendas.
- Não citar nomes de professores. Não mostrar preços (só pelo WhatsApp).
- O nome e o escudo do Inter são marcas do clube: usar só como identidade da unidade, nunca em nome de produto.

## Evidence on Hand

- Diferenciais confirmados: metodologia Celeiro de Ases e seguro atleta.
- Não há depoimentos, números de alunos, prêmios nem resultados autorizados. Não inventar nenhum.
- Fotos: nenhuma foto aprovada no projeto. Fotos de alunos só com autorização dos pais; rosto de criança reconhecível exige autorização por escrito. A Landing nova (PR #21) espera fotos e vídeo reais.

## Product Principles

1. **A equipe é pequena: cada tela economiza tempo.** O que precisa de ação hoje aparece primeiro, o resto fica quieto.
2. **Celular e computador valem o mesmo.** Ação feita na rua (confirmar, marcar presença, ligar) tem que ser fácil com uma mão.
3. **Nada se perde no funil.** Toda experimental termina com baixa de presença e todo contato tem um próximo passo ou um motivo de encerramento.
4. **Verdade antes de persuasão.** O site público convence com fatos reais da escola, nunca com números, depoimentos ou promessas inventadas.
5. **Dados de criança são tratados com cuidado.** Mostrar o mínimo necessário, nunca expor fora do painel.

## Accessibility & Inclusion

- Pais usam o site no celular, muitas vezes com pressa: formulários curtos, campos ligados aos rótulos, erros claros e anunciados.
- O painel segue as regras de foco, teclado e janelas descritas no `CLAUDE.md` (Padrão visual do painel).
