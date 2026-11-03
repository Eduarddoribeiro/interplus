# Tarefas da equipe

Status: em andamento (fases 1, 2 e 3 concluídas; falta a publicação; SQL ainda não aplicado).
Branch: `feat/tarefas-equipe`. Criado em 2026-11-03.

## Contexto

O CRM só registra o que é de um contato (retornos, experimentais) ou de um aluno (pendências da matrícula, eventos). As tarefas gerais da escola, como comprar coletes, fechar a lista da Taça ou postar o treino, ficam no WhatsApp ou na cabeça de alguém. A coordenação quer um quadro de tarefas no painel, para dividir o trabalho com a secretária.

## Objetivo e definição de pronto

- **Onde fica:** item "Tarefas" no menu, que abre um quadro com A fazer, Fazendo e Feito.
- **O que dá para fazer:**
  - criar, editar, excluir (com confirmação) e mover tarefas;
  - no computador, arrastar entre colunas;
  - no celular ou pelo teclado, usar "Mover para".
- **Cada tarefa tem:** título, responsável, prazo, área, observação e repetição.
- **Visão geral:** mostra "Tarefas atrasadas" e "Tarefas para hoje" como pendências. O menu ganha contador vermelho quando há atrasadas.
- **Tarefa repetida:** ao concluir, a próxima nasce sozinha com o prazo seguinte.
- **Pronto quando:**
  - o fluxo inteiro funciona na demonstração, no computador e em 375px;
  - os testes das regras de data passam;
  - o SQL foi aplicado e conferido antes do merge.

## Avaliação

- **Impacto no que existe:**
  - tela nova, tabela nova, item no menu e dois cartões na Visão geral;
  - nada do que existe muda de comportamento.
- **Riscos:**
  - **Menu e Visão geral passam a ler `staff_tasks`.** Se o código for ao site antes do SQL, o painel quebra. Por isso: SQL primeiro, conferência, só então merge.
  - **Acesso da secretária.** Com `is_staff()` ela vê tudo, inclusive a saúde. Fica registrado; os perfis por função continuam pendentes.
  - **Arraste no celular.** No toque, usamos botões "Mover para", sem dependência nova. O arraste nativo do navegador fica só no computador.
  - **Repetição duplicada.** Concluir, desmarcar e concluir de novo não pode gerar duas cópias (ver regra 6).
- **Esforço:** M, de 2 a 3 dias. Pesam o arraste com alternativa por teclado e toque, a repetição e a demonstração.
- **Decisão:** versão completa pedida, com repetição. Tarefas não se ligam a aluno nem a contato.

## Regras de negócio

1. **Colunas:** `todo` (A fazer), `doing` (Fazendo) e `done` (Feito).
   - Dentro da coluna, a ordem é por prazo: atrasadas primeiro, sem prazo por último.
   - Não há reordenação manual.
2. **Campos da tarefa:**
   - título: obrigatório, até 200 caracteres;
   - responsável: opcional, um membro de `staff_users`;
   - prazo: data, opcional;
   - área: opcional, de uma lista fixa (Secretaria, Financeiro, Eventos, Uniforme, Comunicação, Estrutura, Outros);
   - observação: opcional;
   - repetição: não repete, todo dia, toda semana ou todo mês.
3. **Prazo:**
   - atrasada: prazo antes de hoje e não feita (faixa vermelha);
   - para hoje: prazo = hoje (faixa amarela);
   - o resto fica sem faixa.
4. **Mover para Feito** grava `done_at`. Tirar de Feito apaga `done_at`.
5. **Feito** mostra só as concluídas nos últimos 14 dias. As mais antigas continuam no banco e não aparecem.
6. **Repetição:**
   - Quando uma tarefa com repetição vai para Feito pela primeira vez, nasce uma cópia em A fazer, com o mesmo título, responsável, área, observação e repetição, e com o próximo prazo.
   - O próximo prazo é o prazo anterior + 1 dia, 7 dias ou 1 mês. No mês curto, cai no último dia (31/01 → 28/02).
   - Se o prazo calculado já passou, avança até hoje ou depois. Concluir com atraso não gera uma fila de cópias vencidas.
   - Sem prazo, conta a partir de hoje.
   - A cópia nasce uma vez só: a tarefa guarda que já gerou a próxima (`next_created`).
   - Feito pelo banco, num gatilho, para valer tanto no arraste quanto nos botões.
7. **Filtro "Minhas tarefas" ou "Todas":**
   - padrão "Todas";
   - "Minhas" usa o usuário logado;
   - a escolha fica na URL (`?quem=minhas`).
8. **Visão geral e menu:**
   - "Tarefas atrasadas" é pendência vermelha;
   - "Tarefas para hoje" é amarela;
   - ambas contam as tarefas de todos;
   - o contador do menu mostra só as atrasadas.
9. **Excluir:** pede confirmação ("Excluir tarefa?"). Apaga de vez, sem desfazer, porque a tarefa não tem histórico ligado a ela.

## Fluxo do usuário

1. **Criar:** Tarefas → "Nova tarefa". A janela pede título, responsável, prazo, área, repetição e observação. A tarefa nasce em A fazer.
2. **Mover no computador:** arrastar o cartão para outra coluna.
3. **Mover no celular ou pelo teclado:** no cartão, "Mover para" → Fazendo ou Feito.
4. **Editar ou excluir:** tocar no cartão abre a janela de edição, onde ficam também "Excluir" e "Mover para".
5. **Concluir uma repetida:** aparece o aviso "Concluída. A próxima ficou para 10/11." A nova tarefa já está em A fazer.
6. **Visão geral:** o cartão "Tarefas atrasadas" abre `/admin/tarefas?prazo=atrasadas`, só com essas tarefas.
7. **Erros:** os erros de rede usam `errorMessage` e não perdem o que foi digitado. Se um movimento falhar, o cartão volta para a coluna de onde saiu.

## Mudanças técnicas

### Banco de dados

| Tabela | Mudança | Migração | Observação |
| --- | --- | --- | --- |
| `staff_tasks` | nova | aditiva | id, title, notes, area, status, due_date, assigned_to, repeat, next_created, done_at, created_by, created_at, updated_at |

- **Checks:**
  - `status in ('todo','doing','done')`;
  - `repeat in ('none','daily','weekly','monthly')`;
  - `char_length(title) between 1 and 200`.
- **RLS:** `staff_all` com `is_staff()`. O anon fica sem acesso. O `authenticated` tem select, insert, update e delete, com o RLS barrando quem não é da equipe.
- **Gatilho `staff_tasks_repeat`:**
  - roda depois de um update para `done`, quando `repeat <> 'none'` e `next_created = false`;
  - insere a próxima tarefa e marca `next_created = true`.
- **Índices:** `(status, due_date)` e `(assigned_to)`.
- **Responsável:** `staff_users` só tem `user_id` e `created_at` (conferido na fase 0). Ganha a coluna opcional `name`, com o nome curto no quadro, preenchida uma vez por SQL. A lista vem da função `staff_members()` (SECURITY DEFINER, só responde para a equipe), que devolve `user_id` e o nome, ou o começo do e-mail quando não houver nome. As policies de `staff_users` não mudam. `assigned_to` referencia `auth.users(id)`, com `on delete set null`.

### Front-end e serviços

- **`src/helpers/taskBoard.js`:**
  - `nextDueDate`, `taskUrgency`, `boardColumns` (agrupar, ordenar, Feito em 14 dias) e `taskCounts`;
  - testes em `taskBoard.test.js`;
  - a regra de `nextDueDate` também fica no SQL. Os testes provam o comportamento esperado, e a demonstração usa a versão em JS.
- **`src/services/tasks.js`:** `getTasks`, `createTask`, `updateTask`, `moveTask`, `deleteTask` e `getStaffOptions`.
- **`src/constants/tasks.js`:** colunas, áreas e opções de repetição.
- **`src/admin/pages/Tasks.jsx`:**
  - rota `/admin/tarefas`, carregada com `lazyPage`;
  - quadro com 3 colunas no computador; no celular, abas por coluna, porque três colunas não cabem em 375px;
  - recarrega ao voltar para a aba.
- **`src/admin/components/tasks/TaskCard.jsx` e `TaskDialog.jsx`:** usam `Dialog`, `DialogActions`, `ConfirmDialog`, `inputClass` e `toast`.
- **Arraste:**
  - HTML5 nativo (`draggable`), só quando o aparelho tem mouse (`(hover: hover)`);
  - "Mover para" sempre disponível, com `aria-label`.
- **Menu (`Sidebar` e `usePendingCounts`):** item "Tarefas", com contador de atrasadas.
- **Visão geral (`services/dashboard.js` e `Dashboard.jsx`):** os dois cartões novos.
- **Demonstração:** tarefas inventadas em `seed.js` (algumas atrasadas, de hoje, futuras, feitas e repetidas) e o gatilho de repetição imitado em `client.js`.
- **`CLAUDE.md`:** rota, tabela, regra e linha no Histórico.

## Fases

### Fase 0: conferir `staff_users` (só leitura)

- [x] Consulta das colunas de `staff_users`, sem nenhum dado: só `user_id` e `created_at`.
- **Pronto quando:** souber qual coluna liga ao `auth.users` e onde está o nome.

### Fase 1: banco e regras

- [x] Migration `staff_tasks` (tabela, RLS, gatilho), mais o SQL de conferência e o de reversão no scratchpad.
- [x] `helpers/taskBoard.js` com testes: próximo prazo (dia, semana, mês, fim de mês, atrasada), urgência, colunas e Feito em 14 dias.
- [x] `services/tasks.js` e `constants/tasks.js`.
- **Testes:** Vitest, com as regras de data e agrupamento.
- **Pronto quando:** os testes passam e o build passa. O SQL é revisado por você, mas não roda ainda.

### Fase 2: tela Tarefas

- [x] Quadro, cartão, janela de criar e editar, excluir com confirmação, "Mover para" e arraste no computador.
- [x] Filtro Minhas ou Todas, e filtro de prazo vindo da Visão geral, ambos na URL.
- [x] Demonstração com dados e repetição.
- **Testes:**
  - na demonstração: criar, editar, mover arrastando e por botão, concluir uma repetida (nasce a próxima, e desmarcar e concluir de novo não duplica) e excluir;
  - em 375px, sem rolagem lateral.
- **Pronto quando:** o fluxo inteiro funciona na demonstração.

### Fase 3: menu e Visão geral

- [x] Item no menu com contador, e os cartões "Tarefas atrasadas" e "Tarefas para hoje".
- [x] `CLAUDE.md` e este arquivo atualizados.
- **Pronto quando:** cada cartão abre a lista com exatamente o número que mostra.

### Publicação

1. Você roda o SQL e a conferência.
2. Commit com a sua aprovação.
3. PR, e merge com a sua aprovação.

## Reversão

- **Código:** revert do PR.
- **Banco:** `drop trigger`, `drop function` e `drop table staff_tasks`, no SQL de reversão. Apaga as tarefas criadas, então só serve logo depois de publicar ou com a sua aprovação.

## Fora do escopo

- Ligar uma tarefa a um aluno ou contato: o que é de aluno tem as pendências da matrícula, e o que é de contato tem Retornos.
- Reordenar à mão dentro da coluna.
- Avisos fora do painel (WhatsApp, e-mail, notificação).
- Comentários, anexos e histórico de mudanças da tarefa.
- Perfis de acesso: a secretária só nas tarefas, sem acesso à saúde.
- Repetição em dias específicos (ex.: segunda e quinta) ou "a cada N semanas".

## Registro de execução

- 2026-11-03: plano escrito. Decisões do usuário: com responsável, aparece na Visão geral, com repetição já na primeira versão, sem ligação a aluno ou contato.
- 2026-11-03: plano aprovado. Fase 0: `staff_users` só tem `user_id` e `created_at`, então o nome entra como coluna nova e a lista vem de `staff_members()`. Fase 1 concluída: migration, regras de data com 7 testes (fim de mês, ano bissexto, conclusão atrasada) e serviço. `getTasks` traz todas as tarefas, porque são poucas, e o quadro esconde as feitas antigas. O cliente da demonstração não tem `.or()`.
- 2026-11-03: fase 2 concluída. Os botões do cartão têm o verbo da ação ("Começar", "Concluir", "Voltar para A fazer", "Reabrir"), mais claros que "Mover para". O cartão feito mostra "Concluída em", e não o prazo. Ao criar, o foco vai para o título. Testado na demonstração:
  - criar, editar, excluir com confirmação e arrastar;
  - concluir uma repetida (a próxima nasce com o prazo certo), reabrir e concluir de novo sem duplicar;
  - filtros Minhas e prazo;
  - 375px com uma coluna por aba e sem rolagem lateral.
- 2026-11-03: fase 3 concluída. Item "Tarefas" no menu (depois de Alunos) com contador vermelho só das atrasadas; cartões "Tarefas atrasadas" e "Tarefas para hoje" na Visão geral, com a mesma conta do quadro (`taskCounts`), abrindo `?prazo=atrasadas` e `?prazo=hoje`. Se a leitura das tarefas falhar, o resto da Visão geral continua. `CLAUDE.md` com a rota, a tabela, as regras e o Histórico.
