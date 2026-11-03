# CRM — Escola Oficial do Inter, Unidade Viamão

Site público e painel interno (CRM) da Escola Oficial do Inter em Viamão/RS.
O painel é usado pela equipe cadastrada em `staff_users`.

> **Manter este arquivo atualizado.** Toda mudança que altere o comportamento, a estrutura, as regras ou o estado do projeto deve atualizar a seção correspondente e ganhar uma linha no **Histórico** no fim, no mesmo PR.

## Stack

- React 18, Vite 5, Tailwind 3, React Router 7, Framer Motion, Lucide.
- Supabase (Postgres + Auth). O cliente fica em `src/lib/supabase.js`.
- Deploy na Vercel (`interplus-dun.vercel.app`). Todo merge na `main` publica sozinho. `vercel.json` reescreve todas as rotas para `index.html` (SPA).
- Toda tela nova entra no `App.jsx` com `lazyPage(() => import(...))` (de `helpers/lazyPage.js`), nunca com `import` direto nem com o `lazy` puro. Assim ela não pesa no site público, e a página recarrega sozinha se a tela sumir depois de um deploy.
- Repositório: `Eduarddoribeiro/interplus`.
- Variáveis em `.env` (fora do git): `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. **Nunca** colocar a chave `service_role` em `VITE_*` nem na Vercel.

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # verificação obrigatória antes de commitar (não há ESLint configurado)
npm test         # testes (Vitest), ex.: leitura da planilha de matrículas
VITE_DEMO=1 npx vite --port 5174   # demonstração com dados fictícios, sem Supabase
```

Mudanças no `tailwind.config.js` exigem reiniciar o servidor de desenvolvimento.

## Rotas

| Rota | Tela |
| --- | --- |
| `/` | Landing (`src/pages/Landing.jsx`) |
| `/experimental` | Formulário público de aula experimental (`src/components/public/*`) |
| `/aula/:token` | Lista de presença do professor (`CoachSession.jsx`, via RPCs `coach_*`) |
| `/beneficios` | Clube de benefícios (projeto original do repositório) |
| `/admin/login` | Login do painel |
| `/admin` | Visão geral (pendências, agenda, retornos, resultado do mês) |
| `/admin/contacts`, `/admin/contacts/:id` | Contatos e detalhes do contato |
| `/admin/experimentals` | Aulas experimentais (semana, confirmar, veio/faltou) |
| `/admin/follow-ups` | Retornos (atrasados, hoje, próximos) |
| `/admin/waiting-list` | Lista de interesse e quadro de demanda |
| `/admin/students`, `/admin/students/:id` | Alunos e ficha do aluno (pós-matrícula) |
| `/admin/students/import` | Importar a planilha de matrículas (CSV) |
| `/admin/students/camisas` | Números de camisa de todos os ativos numa tela só |
| `/admin/events`, `/admin/events/:id` | Eventos (Taça Gaúcha e rodadas, passeios, copas) |
| `/admin/reports` | Relatórios |
| `/admin/administration/*` | Unidades, locais, modalidades, categorias, turmas e horários |

## Estrutura

```
src/
  pages/                 # telas públicas
  components/public/     # formulário de experimental
  admin/
    layout/              # Layout, Sidebar (com contadores), Topbar (só mobile), usePendingCounts
    ui/index.jsx         # componentes do painel: Button, Tabs, Count, Panel, urgencyRail
    pages/               # telas do painel; administration/ = cadastros (CrudPage)
    components/          # contacts, experimentals, followUps, waitingList, students, common
  services/              # todo acesso ao Supabase (contacts, students, events, dashboard, reports...)
  constants/             # status, rótulos e regras (contactStatus, followUpRules...)
supabase/migrations/     # histórico parcial; o banco remoto NÃO está alinhado com ele
src/demo/                # modo demonstração: cliente falso do Supabase + dados fictícios
```

## Modo demonstração (portfólio)

- Com `VITE_DEMO=1`, `src/lib/supabase.js` troca o cliente real por `createDemoClient()` (`src/demo/client.js`). Ele imita o que o painel usa do supabase-js (select com relações, filtros, insert/update/delete, rpc e auth) sobre tabelas na memória.
- Os dados vêm de `src/demo/seed.js`: inventados, determinísticos e com datas calculadas a partir de hoje. Os telefones usam o DDD 00, que não existe.
- O que o visitante muda fica na `sessionStorage` da aba. A faixa "Demonstração" no topo tem o botão "Restaurar dados".
- O login já vem preenchido, e qualquer senha entra. No menu aparece "Visitante", nunca o nome de alguém real.
- O build normal não inclui a demo: o módulo só é carregado quando `VITE_DEMO=1`.
- Na demo, a raiz `/` abre direto o painel (`App.jsx`), e o `vite.config.js` troca o título, a descrição e as tags `og:` do `index.html` por textos do CRM, para o cartão do link no LinkedIn. A imagem do cartão é `public/og-demo.png` (1200×630); se o endereço da demo mudar, atualizar `DEMO_URL` no `vite.config.js`.
- Deploy da demo: um projeto **separado** na Vercel, a partir do mesmo repositório, com só `VITE_DEMO=1` nas variáveis (sem as do Supabase).
- Se o painel passar a usar uma consulta nova (filtro, relação ou rpc), conferir se `src/demo/client.js` a cobre e se `seed.js` tem os campos.

## Dados (Supabase)

Tabelas principais: `students`, `guardians`, `student_guardians`, `enrollments`, `enrollment_tasks`, `student_health`, `events`, `event_participants` (pós-matrícula, ver abaixo), `contacts`, `experimental_sessions`, `training_groups`, `training_group_schedules`, `training_group_categories`, `training_group_schedule_coaches`, `categories`, `locations`, `units`, `modalities`, `coaches`, `coach_links`, `staff_users`.

RPCs públicas (`SECURITY DEFINER`): `public_trial_options`, `public_category_locations`, `public_register`, `coach_session_list`, `coach_mark_attendance`.

RLS: a equipe acessa tudo via `is_staff()`; o público (anon) só lê o catálogo ativo e cadastra pela RPC. O anon não tem acesso a contatos nem a sessões.

### Funil atual

- Status do contato (`src/constants/contactStatus.js`): `new_contact`, `pending_confirmation`, `confirmed`, `attended`, `no_show`, `cancelled`, `follow_up`, `waiting_list`, `enrolled`, `lost`.
- Status da experimental: `pending_confirmation`, `confirmed`, `attended`, `no_show`, `cancelled`.
- Retornos: no máximo 3 tentativas em 14 dias (`followUpRules.js`). Cada "Reagendar retorno" conta como uma tentativa.
- Nomes dos status: sempre `CONTACT_STATUS_LABEL` (ex.: `follow_up` = "Em retorno", `lost` = "Encerrado"), nunca uma lista própria na tela.
- Motivos de encerramento: sempre `LOST_REASON_OPTIONS` e `getLostReasonLabel()` de `constants/lostReasons.js`. Os códigos antigos que já estão no banco (`financial`, `location`, `no_interest`, `chose_competitor`) só são traduzidos na exibição.
- Irmãos ficam como contatos separados. O aviso de duplicado só aparece quando o telefone e o primeiro nome da criança são iguais.

### Pós-matrícula (alunos)

- SQL: `supabase/migrations/20261030120000_pos_matricula.sql`. Só cria tabelas e a função `create_student_enrollment`; não altera nada que já existe. Acesso só da equipe (`is_staff()`), nada para o público.
- Matricular um contato (ficha do contato, resultado da experimental ou Retornos) cria a ficha do aluno pela função `create_student_enrollment`, numa transação: aluno, responsáveis, matrícula da temporada e as pendências. O painel mostra 5 (Sogni, comunidade, contrato assinado, taxa de matrícula, uniforme), de `STUDENT_TASKS`; a 1ª mensalidade, paga direto no Sogni, ainda é criada pela função, mas o painel a ignora em tudo, inclusive nos atrasados. Se falhar, a matrícula do contato vale e a página do contato mostra "Criar ficha do aluno".
- Pendências e prazos (dias depois do início): `constants/studentTasks.js`, iguais aos da função no banco. Mudar um exige mudar o outro.
- Responsável é tabela própria, ligada ao aluno por `student_guardians` (irmãos dividem o responsável; o parentesco fica na ligação).
- Uma matrícula por aluno e temporada (`enrollments`); rematrícula = linha nova.
- Saúde em `student_health`, separada para, quando houver outros perfis, liberar só para a coordenação. Na ficha só carrega ao clicar em "Mostrar".
- Eventos: rodada = evento filho (`parent_id`) do campeonato. A situação de cada aluno (`event_participants.status`): interessado, confirmado, pagamento pendente, pago, isento, não participou, devolver.
- Tela do evento: abre só na rodada atual (a última com alguém marcado), com "Todas as rodadas" para o histórico. Busca por nome, filtros de categoria e de situação ("Vão jogar" = confirmado, pagamento pendente, pago ou isento), ordem por categoria, nome ou situação. "Copiar lista da Rodada N" copia quem vai jogar, por categoria, para colar no WhatsApp. Quem saiu da escola fica escondido (botão "Mostrar quem saiu da escola", `?saiu=1`) e não conta em "vão jogar", na lista copiada, no total de alunos nem em "para cobrar ou devolver" (também na lista de Eventos).
- Dono de cada dado: o Sogni é a base oficial de cadastro e mensalidade. O CRM guarda o que o Sogni não controla: contrato, taxas, rodadas, uniforme, comunidade. O CPF e os documentos ficam nos dois, porque são passados ao Sogni.
- Importação da planilha (`helpers/studentImport.js`, com testes): lê o CSV no navegador, reconhece as colunas pelo cabeçalho e avisa quem já existe como contato (mesmo telefone e primeiro nome, ou mesmo nome e nascimento) ou já foi importado. Pagamento com "—" vira "Não se aplica"; "Ativo: Não" entra como aluno que saiu.
- Número da camisa (`students.shirt_number`, único na escola toda, inclusive com quem saiu) e goleiro (`students.goalkeeper`). Linha recebe o próximo número depois do maior da linha; goleiro usa 1, 12, 23, 34... (de 11 em 11), e esses números nunca vão para a linha. A regra fica em `helpers/shirtNumbers.js` (com testes). O número aparece na ficha, na lista de alunos, na tabela do evento (com ordem por número) e na lista copiada.
- Visão geral e menu: "Matrículas atrasadas" = alunos ativos com alguma pendência vencida (aba "Atrasadas" em Alunos).

### Migração planejada do funil (não aplicada)

- 7 etapas: `new_contact`, `trial_scheduled`, `trial_done`, `follow_up`, `waiting_list`, `enrolled`, `lost`. O status da aula passa a existir só em `experimental_sessions`.
- Decisões D1–D11 já tomadas; D2 e D3 continuam abertas.
- Só começa quando "Presenças sem baixa" estiver em zero.
- Ao migrar, `public_register` precisa passar a gravar `trial_scheduled`.

## Regras de trabalho

- **O Supabase é produção, com dados reais de menores.** Nunca rodar migrations, alterar policies ou dados, nem executar consultas por conta própria.
  - Todo SQL é preparado no scratchpad, explicado, revisado e aprovado pelo usuário.
  - O próprio usuário executa no SQL Editor.
  - Consultas devem ser só leitura e sem dados pessoais.
  - "Success" no SQL Editor não prova nada: sempre conferir com uma consulta de verificação.
- Não usar `supabase db push` nem `supabase db query --linked`.
- Git: um branch por mudança, PR no GitHub e merge só com aprovação explícita do usuário.
- Commits: usar a skill `commit-semantico` (Conventional Commits em português, aprovação antes do commit).
- No Chrome, só olhar o layout, numa aba própria, sem copiar dados pessoais.
- Interface em português do Brasil.
- Vocabulário da escola, não de vendas: "família", "interessado", "contato", "acompanhamento", "matrícula". Nunca "lead", "oportunidade", "funil", "comercial" ou "conversão" na tela (nos nomes internos do código pode). Fechar um contato é sempre "Encerrar": item do menu, título da janela e botão.

## Padrão visual do painel

- Tokens no `tailwind.config.js`:
  - `ink #1C1F24`, `muted #5B616B`, `line #E3E6EA`, `canvas #F6F7F8`;
  - `alert` (vermelho), `attention` (amarelo), `ok` (verde `#17713E`, AA também sobre `ok-soft`), `whatsapp #1F9D55`.
- Vermelho Inter só na ação principal da tela. Seleção usa `ink`.
- Exceção: no computador, o login tem o painel da marca em vermelho, com o logo branco, e ali o botão Entrar fica em tinta (`lg:bg-ink`) para não competir com o painel. No celular não há painel, e o botão volta ao vermelho. Para pôr uma foto no painel da marca, preencher `BRAND_PHOTO` em `Login.jsx` (de treino visto de longe ou de costas, sem rosto de criança reconhecível sem autorização).
- Logos no painel: `logo-recorte-vermelho.svg` e `logo-recorte-branco.svg`, já recortados (sem margem) e com o texto em contorno. Usar com `w-*` + `h-auto`, sem `object-cover`. Os arquivos quadrados antigos (`logo-vermelho.png`, `logo.svg`) ficam só nas telas públicas.
- Favicon: `public/favicon.svg` é só o escudo, recortado de `logo-recorte-vermelho.svg` pelo `viewBox` (sem o texto, que some em 16–32px). Há também `favicon-32.png` e `apple-touch-icon.png` (180px, fundo branco), ligados no `index.html`.
- Em telas de toque, todo campo (`input`, `select`, `textarea`) com `text-sm` ou `text-xs` sobe para 16px por uma regra em `src/index.css`; abaixo disso o iPhone dá zoom ao tocar. Não é preciso tratar campo por campo; no computador continua 14px.
- Urgência é indicada por uma faixa lateral de 3px (`urgencyRail`), em vermelho ou amarelo, **só onde há algo a fazer hoje** (atrasado, a confirmar, possível duplicado). Estado que não pede ação ("parado", tempo na lista de interesse) vai em texto cinza, sem faixa.
- Menu lateral recolhível no computador (botão ao lado do logo): fica só com os ícones (64px), o contador vira um ponto colorido no ícone e o nome aparece ao passar o mouse. A escolha fica no `localStorage` (`admin-sidebar-collapsed`). No celular a gaveta abre sempre inteira.
- O menu só mostra contadores vermelhos ou amarelos. Na Visão geral, o número grande também é só para pendências; os números informativos (lista de interesse com vaga, triagem) ficam numa linha discreta embaixo.
- Queda em relação ao mês anterior aparece em cinza, não em vermelho.
- Títulos em Teko, em formato de frase. Números com `tabular-nums`.
- Sem rótulos em CAIXA ALTA e sem separadores "·".
- Bordas arredondadas de 8px nos controles e 12px nos painéis. Sem sombra nos cards.
- Sem botão "Atualizar": as telas recarregam ao voltar para a aba (`visibilitychange`).
- `SectionTitle` recebe `title`, `summary` e `actions`.
- Janelas: sempre `Dialog` de `src/admin/ui`. O título diz a ação ("Agendar experimental") e a descrição diz de quem. A janela fecha com Esc, prende o foco, devolve o foco ao fechar e não fecha enquanto salva (`busy`). No celular abre de baixo, como uma folha. Botões com `DialogActions` + `Button`, nunca botões feitos à mão.
- Telas de toque: a variante `touch:` do Tailwind (`(hover: none) and (pointer: coarse)`) deixa botões, abas e ícones de WhatsApp com 44px no celular e no tablet, sem mudar o computador. Use `touch:h-11` em alvos pequenos novos.
- Campos de formulário: `inputClass`. Seleção (chips, cartões de opção) em tinta, nunca em vermelho, com `aria-pressed`.
- Avisos: `toast(mensagem, { type, action })` de `common/Toaster`. Sucesso usa `role="status"`; com `action` (ex.: "Desfazer") o aviso fica 10 s e para enquanto o mouse está em cima.
- Desfazer: depois de Confirmar/Veio/Faltou e depois de arquivar (um ou em lote). Encerrar e Mover para lista em lote não têm desfazer exato, então pedem confirmação com a quantidade ("Encerrar 23 contatos?").
- Erros na tela: `errorMessage(err, "texto de reserva")` de `helpers/errorMessage.js`. Mensagens nossas (em português) aparecem; erros técnicos do Supabase viram o texto de reserva.
- Estado das listas na URL: Contatos guarda `aba`, `busca`, `categoria`, `origem`, `parados` e `pagina`; Experimentais e Retornos guardam `filtro`; Alunos guarda `aba`, `busca` e `categoria`; o evento guarda `rodada`, `busca`, `categoria`, `situacao`, `ordem` e `saiu`. A busca de Alunos, de Números de camisa e do evento também acha pelo número da camisa. Cada card da Visão geral abre uma aba com exatamente o número que mostra (ex.: "Retornos atrasados" → `?filtro=overdue`, "Aulas para confirmar" → aba "A confirmar", mesma regra de 48h via `CONFIRM_DAYS`). Ao voltar de um contato, a lista reabre no mesmo lugar.
- Cadastros (Administração): `CrudPage`, `CrudTable` (rola para o lado no celular), `CrudModal`, `ConfirmDialog` (o botão repete o verbo do título). Situação é texto colorido, sem pílula. As ações de cada linha são `Button` `quiet` `sm`.

## Landing

- O PR #21 (branch `redesign/landing-confianca`, worktree `../inter-club-lp`) está pronto, mas espera fotos e vídeo reais.
- Público: pais de crianças de 8 a 11 anos (Sub-09 e Sub-11). Diferenciais: metodologia Celeiro de Ases e seguro atleta.
- Restrições:
  - não citar nomes de professores;
  - não mostrar preços (só pelo WhatsApp);
  - não inventar números nem depoimentos.

## Pendências

- Pós-matrícula: aplicar `20261030120000_pos_matricula.sql` no SQL Editor (verificação e reversão no scratchpad), publicar e importar a planilha.
- Pós-matrícula, próximas fases: formulário de matrícula por link individual no WhatsApp (com aviso de finalidade e consentimento para a saúde), envio ao Sogni (depende das respostas do fornecedor) e perfis de acesso.
- Migração do funil (ver acima).
- Filtro de local nos Relatórios: poucos contatos têm `location_id`. O local precisa ser derivado da experimental (horário → turma → local).
- Limpeza técnica:
  - remover da Vercel as variáveis antigas da integração de WhatsApp;
  - SQL para remover os contatos de TESTE.

## Histórico

- 2026-10-16: removida a integração de WhatsApp/Evolution (mantidos os links wa.me). RLS fechado (etapas 2A, 2B e 2C).
- 2026-10-19: formulário público revisado (acessibilidade e validação, PR #20). Painel redesenhado (PRs #22–#26). Aviso de duplicado não marca mais irmãos (#27).
- 2026-10-22: horários das turmas sem os segundos (#28). Criado este CLAUDE.md (#29). Crítica Impeccable do painel: 26/40. Item 1: janela única (`Dialog`) em todas as janelas e Administração no padrão novo; a tela Modalidades, que quebrava ao abrir, foi refeita; o botão de salvar da qualificação, que estava invisível, foi corrigido (#30). Item 2: Desfazer na presença e no arquivamento, confirmação com quantidade nas ações em lote, erros sem texto técnico. Turmas inativas saem da lista principal e ficam na aba Inativas; turmas não são excluídas, para não perder o histórico das experimentais (#31). Lista de turmas sem a coluna Modalidade, e a unidade só aparece quando houver mais de uma (#32). Item 3, menos amarelo: sem faixa em "parado" e na lista de interesse, menu só com contadores de ação, informativos da Visão geral em linha discreta, nota dos Relatórios neutra, contraste do texto de exemplo dos campos e do zero nos dias de Experimentais (#33).
- 2026-10-23: Contatos com 20 por página (antes 30), troca de página também no topo ("1–20 de 119") e a tela volta ao começo da lista ao trocar (#34). Item 4: nomes de status e motivos de encerramento unificados (três telas gravavam códigos diferentes), coluna "Categoria" em Contatos, estado das listas na URL, sem "·", sem "Comparecimento 0%" em semana sem aulas, código morto removido (StatCard, Categories.jsx, SchedulesPage, sombras do Tailwind) (#35, #36). Tela de Administração em duas colunas no computador, com os itens "em breve" numa célula só e descrições mais claras.
- 2026-10-24: limpeza: removidos a pasta `server/` (backend antigo da Evolution API), `chat_files.txt`, `contexto_inbox.txt` e as fontes sem uso (Bebas Neue, Manrope). README reescrito e pacote renomeado para `crm-inter-viamao`. Telas carregadas sob demanda (`React.lazy` em `App.jsx`, `Suspense` no `Layout`): o formulário público baixa 558 kB em vez de 980 kB e não leva mais o código do painel. Login refeito: painel da marca em vermelho com o logo no computador, logo em cima no celular, título em Teko, campos no padrão do painel, mostrar senha, erro que distingue senha errada de falha de conexão, e quem já está logado vai direto ao painel. Depois de um deploy, quem estava com o site aberto não vê mais a tela quebrar ao trocar de página: a página recarrega uma vez e pega a versão nova (`lazyPage`). Crítica Impeccable do login: 25/40. Contexto do produto em `PRODUCT.md`. Login no celular refeito: logo recortado e centralizado, "Painel da equipe" no topo, botão vermelho, campos de 16px sem zoom, teclado com "Próximo" e "Ir", sem foco automático, "Esqueceu a senha? Fale com a coordenação." Entrar mostra carregamento com a marca e já baixa o painel antes; erro ligado aos campos. Logos recortados no menu e na barra do topo; Inter carregada só pelo `@fontsource`. Em telas de toque, todos os campos do site e do painel passam a ter 16px, sem o zoom do iPhone.
- 2026-10-27: modo demonstração para o portfólio (`VITE_DEMO=1`), com cliente falso do Supabase e dados fictícios. Na demo, a raiz abre o painel e o cartão do link descreve o CRM.
- 2026-10-27: menu lateral recolhível no computador. Segunda crítica Impeccable: 27/40.
- 2026-10-27: imagem do cartão do link da demo (`og:image`).
- 2026-10-27: README de portfólio (problema, funcionalidades, decisões técnicas, como rodar a demo) com prints da demo em `docs/screenshots/`.
- 2026-10-27: item 5, celular: botões e abas com 44px em telas de toque, "Próxima ação" no topo da página do contato abaixo do xl e ações da triagem numa linha própria no celular. Stack do README descrita por camada, com PostgreSQL em destaque.
- 2026-10-27: números da Visão geral batem com a lista que abrem (retornos atrasados, aba "A confirmar" em Experimentais, Retornos com filtro na URL); faixa de urgência corrigida em "Retornos para fazer" (`divide-y` pintava de cinza); verde `ok` escurecido para contraste AA; placeholder da busca da Lista de interesse; título h2 nos Relatórios.
- 2026-10-27: vocabulário da escola em todo o painel ("É interessado" no lugar de "É lead", "Encerrar" no menu, título e botão, Relatórios sem "funil comercial"); "É interessado" da triagem passa a ser botão secundário.
- 2026-10-28: lista do professor (`/aula/:token`) refeita no padrão do painel: logo recortado, data e local no topo com progresso ("1 de 3 marcadas"), crianças agrupadas por horário, Veio/Faltou de 48px (Veio verde, Faltou tinta), recado da coordenação sem emoji, avaliação com "Avaliação salva" e erros em português. A demo passou a devolver os mesmos campos de `coach_session_list`.
- 2026-10-29: favicon com o escudo da escola (SVG, PNG 32px e ícone da tela inicial do iPhone).
- 2026-10-30: pós-matrícula no painel: telas Alunos (pendências da matrícula, responsáveis, dados, saúde só ao abrir, saída) e Eventos (Taça Gaúcha com tabela aluno x rodada), importação da planilha de matrículas com aviso de quem já passou pelo CRM, card "Matrículas atrasadas" na Visão geral. Matricular um contato cria a ficha do aluno. SQL aplicado e planilha importada.
- 2026-10-30: tela do evento com a rodada atual em destaque, busca, filtros, ordem e "Copiar lista" da rodada para o WhatsApp. A 1ª mensalidade deixa de aparecer como pendência (é paga direto no Sogni).
- 2026-10-30: quem saiu da escola fica escondido nos eventos e não conta em "vão jogar" nem nas cobranças.
- 2026-10-31: número da camisa e goleiro na ficha do aluno, com a tela "Números de camisa" para preencher todos e a sugestão do próximo número (linha em ordem, goleiro de 11 em 11). SQL aplicado e numeração atual (88 alunos) gravada a partir da lista da escola.
