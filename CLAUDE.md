# CRM — Escola Oficial do Inter, Unidade Viamão

Site público e painel interno (CRM) da Escola Oficial do Inter em Viamão/RS.
O painel é usado pela equipe cadastrada em `staff_users`.

> **Manter este arquivo atualizado.** Toda mudança que altere o comportamento, a estrutura, as regras ou o estado do projeto deve atualizar a seção correspondente e ganhar uma linha no **Histórico** no fim, no mesmo PR.

## Stack

- React 18, Vite 5, Tailwind 3, React Router 7, Framer Motion, Lucide.
- Supabase (Postgres + Auth). O cliente fica em `src/lib/supabase.js`.
- Deploy na Vercel (`interplus-dun.vercel.app`). Todo merge na `main` publica sozinho. `vercel.json` reescreve todas as rotas para `index.html` (SPA).
- Repositório: `Eduarddoribeiro/interplus`.
- Variáveis em `.env` (fora do git): `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. **Nunca** colocar a chave `service_role` em `VITE_*` nem na Vercel.

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # verificação obrigatória antes de commitar (não há ESLint configurado)
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
    components/          # contacts, experimentals, followUps, waitingList, common
  services/              # todo acesso ao Supabase (contacts, dashboard, reports, schedules...)
  constants/             # status, rótulos e regras (contactStatus, followUpRules...)
supabase/migrations/     # histórico parcial; o banco remoto NÃO está alinhado com ele
server/                  # backend antigo da Evolution API, desativado; a remover
```

## Dados (Supabase)

Tabelas principais: `contacts`, `experimental_sessions`, `training_groups`, `training_group_schedules`, `training_group_categories`, `training_group_schedule_coaches`, `categories`, `locations`, `units`, `modalities`, `coaches`, `coach_links`, `staff_users`.

RPCs públicas (`SECURITY DEFINER`): `public_trial_options`, `public_category_locations`, `public_register`, `coach_session_list`, `coach_mark_attendance`.

RLS: a equipe acessa tudo via `is_staff()`; o público (anon) só lê o catálogo ativo e cadastra pela RPC. O anon não tem acesso a contatos nem a sessões.

### Funil atual

- Status do contato (`src/constants/contactStatus.js`): `new_contact`, `pending_confirmation`, `confirmed`, `attended`, `no_show`, `cancelled`, `follow_up`, `waiting_list`, `enrolled`, `lost`.
- Status da experimental: `pending_confirmation`, `confirmed`, `attended`, `no_show`, `cancelled`.
- Retornos: no máximo 3 tentativas em 14 dias (`followUpRules.js`). Cada "Reagendar retorno" conta como uma tentativa.
- Nomes dos status: sempre `CONTACT_STATUS_LABEL` (ex.: `follow_up` = "Em retorno", `lost` = "Encerrado"), nunca uma lista própria na tela.
- Motivos de encerramento: sempre `LOST_REASON_OPTIONS` e `getLostReasonLabel()` de `constants/lostReasons.js`. Os códigos antigos que já estão no banco (`financial`, `location`, `no_interest`, `chose_competitor`) só são traduzidos na exibição.
- Irmãos ficam como contatos separados. O aviso de duplicado só aparece quando o telefone e o primeiro nome da criança são iguais.

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

## Padrão visual do painel

- Tokens no `tailwind.config.js`:
  - `ink #1C1F24`, `muted #5B616B`, `line #E3E6EA`, `canvas #F6F7F8`;
  - `alert` (vermelho), `attention` (amarelo), `ok` (verde), `whatsapp #1F9D55`.
- Vermelho Inter só na ação principal da tela. Seleção usa `ink`.
- Urgência é indicada por uma faixa lateral de 3px (`urgencyRail`), em vermelho ou amarelo, **só onde há algo a fazer hoje** (atrasado, a confirmar, possível duplicado). Estado que não pede ação ("parado", tempo na lista de interesse) vai em texto cinza, sem faixa.
- O menu só mostra contadores vermelhos ou amarelos. Na Visão geral, o número grande também é só para pendências; os números informativos (lista de interesse com vaga, triagem) ficam numa linha discreta embaixo.
- Queda em relação ao mês anterior aparece em cinza, não em vermelho.
- Títulos em Teko, em formato de frase. Números com `tabular-nums`.
- Sem rótulos em CAIXA ALTA e sem separadores "·".
- Bordas arredondadas de 8px nos controles e 12px nos painéis. Sem sombra nos cards.
- Sem botão "Atualizar": as telas recarregam ao voltar para a aba (`visibilitychange`).
- `SectionTitle` recebe `title`, `summary` e `actions`.
- Janelas: sempre `Dialog` de `src/admin/ui`. O título diz a ação ("Agendar experimental") e a descrição diz de quem. A janela fecha com Esc, prende o foco, devolve o foco ao fechar e não fecha enquanto salva (`busy`). No celular abre de baixo, como uma folha. Botões com `DialogActions` + `Button`, nunca botões feitos à mão.
- Campos de formulário: `inputClass`. Seleção (chips, cartões de opção) em tinta, nunca em vermelho, com `aria-pressed`.
- Avisos: `toast(mensagem, { type, action })` de `common/Toaster`. Sucesso usa `role="status"`; com `action` (ex.: "Desfazer") o aviso fica 10 s e para enquanto o mouse está em cima.
- Desfazer: depois de Confirmar/Veio/Faltou e depois de arquivar (um ou em lote). Encerrar e Mover para lista em lote não têm desfazer exato, então pedem confirmação com a quantidade ("Encerrar 23 contatos?").
- Erros na tela: `errorMessage(err, "texto de reserva")` de `helpers/errorMessage.js`. Mensagens nossas (em português) aparecem; erros técnicos do Supabase viram o texto de reserva.
- Estado das listas na URL: Contatos guarda `aba`, `busca`, `categoria`, `origem`, `parados` e `pagina`; Experimentais guarda `filtro`. Ao voltar de um contato, a lista reabre no mesmo lugar.
- Cadastros (Administração): `CrudPage`, `CrudTable` (rola para o lado no celular), `CrudModal`, `ConfirmDialog` (o botão repete o verbo do título). Situação é texto colorido, sem pílula. As ações de cada linha são `Button` `quiet` `sm`.

## Landing

- O PR #21 (branch `redesign/landing-confianca`, worktree `../inter-club-lp`) está pronto, mas espera fotos e vídeo reais.
- Público: pais de crianças de 8 a 11 anos (Sub-09 e Sub-11). Diferenciais: metodologia Celeiro de Ases e seguro atleta.
- Restrições:
  - não citar nomes de professores;
  - não mostrar preços (só pelo WhatsApp);
  - não inventar números nem depoimentos.

## Pendências

- Migração do funil (ver acima).
- Filtro de local nos Relatórios: poucos contatos têm `location_id`. O local precisa ser derivado da experimental (horário → turma → local).
- Limpeza técnica:
  - remover da Vercel as variáveis antigas da integração de WhatsApp;
  - apagar a pasta `server/`;
  - remover os arquivos `chat_files.txt` e `contexto_inbox.txt`;
  - SQL para remover os contatos de TESTE.
- `README.md` está desatualizado: ainda descreve o clube de benefícios.

## Histórico

- 2026-10-16: removida a integração de WhatsApp/Evolution (mantidos os links wa.me). RLS fechado (etapas 2A, 2B e 2C).
- 2026-10-19: formulário público revisado (acessibilidade e validação, PR #20). Painel redesenhado (PRs #22–#26). Aviso de duplicado não marca mais irmãos (#27).
- 2026-10-22: horários das turmas sem os segundos (#28). Criado este CLAUDE.md (#29). Crítica Impeccable do painel: 26/40. Item 1: janela única (`Dialog`) em todas as janelas e Administração no padrão novo; a tela Modalidades, que quebrava ao abrir, foi refeita; o botão de salvar da qualificação, que estava invisível, foi corrigido (#30). Item 2: Desfazer na presença e no arquivamento, confirmação com quantidade nas ações em lote, erros sem texto técnico. Turmas inativas saem da lista principal e ficam na aba Inativas; turmas não são excluídas, para não perder o histórico das experimentais (#31). Lista de turmas sem a coluna Modalidade, e a unidade só aparece quando houver mais de uma (#32). Item 3, menos amarelo: sem faixa em "parado" e na lista de interesse, menu só com contadores de ação, informativos da Visão geral em linha discreta, nota dos Relatórios neutra, contraste do texto de exemplo dos campos e do zero nos dias de Experimentais (#33).
- 2026-10-23: Contatos com 20 por página (antes 30), troca de página também no topo ("1–20 de 119") e a tela volta ao começo da lista ao trocar (#34). Item 4: nomes de status e motivos de encerramento unificados (três telas gravavam códigos diferentes), coluna "Categoria" em Contatos, estado das listas na URL, sem "·", sem "Comparecimento 0%" em semana sem aulas, código morto removido (StatCard, Categories.jsx, SchedulesPage, sombras do Tailwind).
