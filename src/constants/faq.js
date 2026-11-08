import { BRAND } from "./brand";

/*
 * Perguntas frequentes do site público, na ordem em que a família
 * costuma pensar: idade e nível, aula experimental, rotina, escola,
 * valores.
 *
 * Só fatos confirmados pela escola: sem preço, sem nome de
 * professor, sem número inventado. Tom de professor conversando
 * com a família, nunca resposta de uma palavra. Títulos falam da
 * "criança", não só do "filho": meninas também treinam.
 *
 * Os locais e o calçado da resposta "O que levar" repetem o
 * LOCATION_DETAILS do Landing.jsx: mudou um, mude o outro.
 */
export const FAQ = [
  {
    q: "Com que idade a criança pode começar?",
    a: "As turmas começam no Sub-05. Quem define a turma é o ano de nascimento, então a criança treina com quem tem a mesma idade e está na mesma fase. No campo “Qual é a turma do meu filho?”, aqui em cima, você escolhe o ano e já vê a turma, o local e os horários.",
  },
  {
    q: "A criança precisa já saber jogar?",
    a: "Não precisa. Tem criança que chega sem nunca ter jogado e criança que já joga no time do colégio, e as duas têm lugar aqui. O professor acompanha cada uma no seu ritmo. No começo, o que importa é se divertir, ganhar confiança e fazer amigos; a evolução vem com o tempo.",
  },
  {
    q: "A aula experimental é gratuita?",
    a: "É, sim, sem custo e sem compromisso. Você agenda aqui pelo site em uns 2 minutos, e a gente confirma pelo WhatsApp. No dia, a criança treina 1 hora com a turma da idade dela, como se já fosse aluna da escola. Depois, a gente conversa com calma e tira as suas dúvidas.",
  },
  {
    q: "O que levar na aula experimental?",
    a: "Roupa confortável, uma garrafinha de água e o calçado certo para o local: tênis de futsal (ou tênis comum) no Ginásio do Krahe, que é quadra coberta, e chuteira society (ou tênis) na Arena Biguá, que é gramado sintético. Chegar uns 10 minutos antes ajuda a conhecer o professor e os colegas sem pressa.",
  },
  {
    q: "Posso assistir ao treino?",
    a: "Pode, e a família é bem-vinda. Os pais podem acompanhar os treinos, inclusive a aula experimental. Para muitas crianças, ver alguém de casa ali do lado deixa o primeiro dia bem mais tranquilo.",
  },
  {
    q: "Meninas podem treinar?",
    a: "Claro que podem, e são muito bem-vindas! Futebol é para meninas também. O treino é pensado para a idade e o ritmo de cada criança, e o agendamento da aula experimental é o mesmo para todo mundo.",
  },
  {
    q: "Meu filho ou minha filha não torce para o Inter. Tem problema?",
    a: "Nenhum! Colorado, gremista ou ainda sem time, aqui a criança vai aprender a jogar, fazer amigos e crescer com o esporte. O que a escola traz do Inter é a metodologia de treino, a Celeiro de Ases, e o cuidado com a formação de cada aluno. O time do coração continua sendo escolha de cada um.",
  },
  {
    q: "Quantas vezes por semana são os treinos?",
    a: "São 2 treinos por semana, sempre nos mesmos dias e horários da turma. Assim a criança cria uma rotina e evolui com constância. As aulas perdidas não têm reposição, por isso vale escolher o horário que cabe melhor na rotina da família. Se aparecer alguma dificuldade, é só conversar com a gente.",
  },
  {
    q: "Os alunos têm seguro?",
    a: "Têm. Todo aluno tem seguro atleta de R$ 15 mil, válido 24 horas por dia, e não só durante o treino. É uma tranquilidade a mais para a família.",
  },
  {
    q: "Tem jogos e campeonatos?",
    a: `Tem. Além dos treinos, as turmas disputam competições ao longo do ano, como a ${BRAND.championship}. É a hora de colocar em prática o que aprenderam e de viver o jogo com o time. Como funciona a participação de cada turma a gente explica na conversa depois da aula experimental.`,
  },
  {
    q: "Quanto custa?",
    a: "Os valores da mensalidade, da matrícula e do uniforme a gente passa pelo WhatsApp ou pessoalmente, depois da aula experimental. Assim dá para explicar tudo com calma, ver a turma e o horário que fazem sentido para vocês e responder o que você quiser saber.",
  },
];
