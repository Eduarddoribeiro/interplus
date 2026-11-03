/*
 * Formulário de matrícula que a família preenche pelo link.
 * Mesmas perguntas e opções do Google Forms antigo.
 *
 * Mudou o texto da autorização? Troque a versão: cada aceite fica
 * gravado com a versão e o texto que a família leu.
 */

export const CONSENT_VERSION = "2026-11-02";

export const PURPOSE_TEXT =
  "Os dados deste formulário são usados pela Escola Oficial do Inter, Unidade Viamão, para fazer e manter a matrícula do aluno: cadastro no sistema da escola, contrato, mensalidades, uniforme, contato com a família e inscrição em jogos e eventos. Eles ficam guardados com acesso restrito à coordenação e só são compartilhados quando for necessário para essas finalidades. A qualquer momento você pode pedir à coordenação para ver, corrigir ou apagar os dados.";

export const HEALTH_TEXT =
  "As informações de saúde são obrigatórias: a escola precisa delas para cuidar do aluno nos treinos, jogos e viagens, por exemplo em caso de alergia ou emergência. O acesso é restrito à coordenação, que repassa aos professores apenas o necessário para a segurança do aluno.";

export const PURPOSE_ACCEPT =
  "Sou pai, mãe ou responsável legal pelo aluno e autorizo o uso desses dados, inclusive os de saúde, para as finalidades acima.";

export const LINK_DAYS = 7;

export const GENDER_OPTIONS = ["Masculino", "Feminino"];

export const SCHOOL_TYPE_OPTIONS = ["Pública", "Particular"];

export const UNIFORM_SIZE_OPTIONS = [
  "Tamanho 8",
  "Tamanho 10",
  "Tamanho 12",
  "Tamanho 14",
  "PP",
  "P",
  "M",
  "G",
  "GG",
];

// Mesma lista e grafia do Sogni, para o cadastro bater lá
// ("Não Informado" fica de fora: a pergunta é opcional)
export const HOW_FOUND_OPTIONS = [
  "Site da escola",
  "Google",
  "Facebook",
  "Twitter",
  "Mídias Sociais",
  "Outros sites na internet",
  "Rádio",
  "Jornal",
  "Televisão",
  "Panfleto",
  "Carro de som",
  "Adesivo em carro",
  "Propaganda rua/van/ônibus",
  "Outdoor",
  "Faixas",
  "Placas",
  "Muro pintado",
  "Campeonatos/Eventos",
  "Indicação de amigo/familiar",
  "Indicação de professor da escolinha",
  "Já foi aluno",
  "Passou perto da escolinha",
  "Indicação de outro aluno",
  "Na sua escola",
  "Sacolas Plásticas",
  "Outros",
];

export const DUE_DAY_OPTIONS = [1, 5, 7];

export const BLOOD_TYPE_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Não sei"];

export const STATE_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

// Perguntas de saúde, com o texto do Forms
export const HEALTH_QUESTIONS = [
  { name: "health_plan", label: "Plano de saúde? Se sim, qual?" },
  {
    name: "first_aid_medication",
    label: "O professor pode prestar os primeiros socorros com medicamento básico? Se sim, quais medicamentos?",
  },
  { name: "physical_activity", label: "Pratica outra atividade física? Se sim, quais?" },
  { name: "injuries", label: "Fraturas e/ou lesões? Se sim, quais?" },
  { name: "surgeries", label: "Cirurgias? Se sim, quais?" },
  { name: "diseases", label: "Doenças? Se sim, quais?" },
  { name: "medications", label: "Utiliza algum medicamento? Se sim, quais?" },
  { name: "drug_allergies", label: "Alergia a medicamentos? Se sim, quais?" },
  { name: "medical_notes", label: "Indicações médicas? Se sim, quais?" },
];
