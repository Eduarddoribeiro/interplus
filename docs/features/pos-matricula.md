# Pós-matrícula e matrícula no CRM

Status: fases 1 e 2 em produção; fase 3 pronta no código, SQL ainda não aplicado.

## Objetivo

Hoje a matrícula entra por um Google Forms e o controle é feito numa planilha com cerca de 115 alunos. Ela guarda contrato, Taça Gaúcha e rodadas, uniforme, taxa de matrícula, 1ª mensalidade e forma de pagamento. O Sogni é a base oficial de cadastro e mensalidade, mas não controla nada disso. No CRM, o aluno parava em "Matriculado".

## Decisões (2026-10-30)

- Ordem: primeiro o pós-matrícula no painel, depois a importação de todos os alunos da planilha, avisando quem já passou por experimental.
- Formulário de matrícula: link individual enviado pelo WhatsApp, já preenchido com o que o CRM sabe.
- Saúde: guardar todos os campos da planilha (inclusive tipo sanguíneo), porque são passados ao Sogni. Ficam numa tabela separada e só aparecem ao clicar em "Mostrar".
- Perfis: por enquanto só coordenação (`is_staff()`). A saúde já fica separada para receber um perfil próprio depois.
- Contrato: vai por e-mail no momento da matrícula, então é uma pendência só, "Contrato assinado" (prazo de 7 dias). Na importação, só a coluna "Contrato assinado?" entra; gerado, digitalizado e enviado ficam de fora.

## Dono de cada dado

| Dado | Fonte da verdade |
| --- | --- |
| Cadastro (nome, nascimento, CPF, RG, endereço), mensalidade e vencimento | Sogni (o CRM guarda uma cópia para passar ao Sogni) |
| Telefone do responsável, turma, categoria | CRM |
| Contrato, taxa de matrícula, 1ª mensalidade, uniforme, comunidade | CRM (pendências) |
| Taça Gaúcha, rodadas, passeios, copas | CRM (eventos) |
| Saúde | CRM, restrita |
| Código do aluno no Sogni (`sogni_id`) | Sogni gera, o CRM guarda |

## Fases

1. **Pós-matrícula no painel** (este PR):
   - tabelas e a função `create_student_enrollment`;
   - telas Alunos, ficha do aluno e Eventos;
   - importação da planilha;
   - card "Matrículas atrasadas";
   - matricular um contato cria a ficha do aluno.
2. **Importar a planilha** (sem código novo): você exporta o CSV e importa pela tela; depois apaga o CSV.
3. **Formulário de matrícula por link individual:**
   - RPC pública com token;
   - aviso de finalidade e consentimento específico para a saúde (LGPD, arts. 11 e 14);
   - registro do consentimento (texto, versão e data);
   - Google Forms em paralelo por 2 semanas.
4. **Sogni:** exportação no layout de importação do Sogni ou API, conforme as respostas do fornecedor.

## Perguntas para o fornecedor do Sogni

- Existe API? Tem documentação, custo, autenticação, limites e ambiente de teste?
- Dá para criar aluno e responsável e ler a situação da mensalidade?
- Tem webhook?
- Existe importação por planilha? Qual o layout e quais campos são obrigatórios?
- Qual a chave única do aluno? Como ficam os irmãos?
- Guarda turma, horário e campos personalizados?
- LGPD: assina contrato de operador? Onde ficam os dados? Tem perfil de acesso para os dados de saúde?

## Registro

- 2026-10-30:
  - fase 1 implementada no branch `feat/pos-matricula`;
  - planilha real conferida só com totais (115 linhas, 115 datas lidas, nenhuma categoria desconhecida, 95 ativos e 20 que saíram, 46 na Taça Gaúcha); nenhum dado pessoal foi exibido;
  - testado na demonstração: lista, ficha, pendência com Desfazer, saúde, tabela da Taça, importação com contato repetido e matrícula de um contato criando a ficha.
- 2026-11-02:
  - fase 3 implementada no branch `feat/formulario-matricula`: o link sai da ficha do aluno (que a coordenação cria ao matricular), então o formulário completa uma ficha que já existe em vez de criar outra;
  - perguntas e opções iguais às do Google Forms, conferidas só pelos cabeçalhos e pela contagem das respostas de múltipla escolha; a foto 3x4 ainda não está no formulário;
  - testado na demonstração: link criado, validação de cada etapa, envio, link usado não abre de novo e a ficha recebe os dados e a autorização.
- 2026-11-03:
  - acompanhamento das fichas no branch `feat/fichas-familia`: Visão geral com "Fichas para conferir" e "Fichas com link vencido" como pendências e "aguardando a família" na linha discreta; tela Fichas da família; "Marcar como conferida" na ficha do aluno;
  - o link continua saindo só depois de "Registrar matrícula": o aluno conta como matriculado a partir daí, e quem não preenche aparece em "link vencido".
