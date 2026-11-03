/*
 * Regras do formulário de matrícula da família: máscaras, validação
 * de cada etapa e o pacote enviado para public_enrollment_submit.
 */

import { CONSENT_VERSION, HEALTH_QUESTIONS, HEALTH_TEXT, PURPOSE_ACCEPT, PURPOSE_TEXT } from "../constants/enrollmentForm.js";

const digits = (value) => String(value ?? "").replace(/\D/g, "");

export function isValidCpf(value) {
  const cpf = digits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const check = (length) => {
    const sum = [...cpf.slice(0, length)].reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return check(9) === Number(cpf[9]) && check(10) === Number(cpf[10]);
}

export function maskCpf(value) {
  const cpf = digits(value).slice(0, 11);
  return cpf
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export function maskPhone(value) {
  const phone = digits(value).slice(0, 11);
  if (phone.length <= 2) return phone;
  if (phone.length <= 6) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
  if (phone.length <= 10) return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
}

export function maskCep(value) {
  const cep = digits(value).slice(0, 8);
  return cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}

const isPhone = (value) => [10, 11].includes(digits(value).length);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
const filled = (value) => String(value ?? "").trim() !== "";

function isBirthDate(value, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  const years = Number(today.slice(0, 4)) - Number(value.slice(0, 4));
  return value < today && years >= 2 && years <= 25;
}

export const emptyGuardian = () => ({
  name: "",
  email: "",
  phone: "",
  gender: "",
  cpf: "",
  rg: "",
  profession: "",
  zip_code: "",
  address: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
});

// Formulário vazio, com o que o CRM já sabe (prefill da função)
export function initialForm(prefill = {}) {
  const guardians = [0, 1].map((index) => {
    const known = prefill.guardians?.[index] ?? {};
    return {
      ...emptyGuardian(),
      name: known.name ?? "",
      email: known.email ?? "",
      phone: known.phone ? maskPhone(known.phone.replace(/^55(?=\d{10,11}$)/, "")) : "",
    };
  });

  return {
    student: {
      name: prefill.student?.name ?? "",
      birth_date: prefill.student?.birth_date ?? "",
      gender: "",
      cpf: "",
      rg: "",
      phone: "",
      school: "",
      school_type: "",
      field_position: "",
      club_team: "",
      favorite_player: "",
      idol: "",
      how_found: "",
    },
    enrollment: { uniform_size: "", due_day: "" },
    guardians,
    health: {},
    accepted: false,
    acceptedBy: guardians[0].name,
  };
}

/*
 * Erros de uma etapa: { "student.name": "mensagem" }.
 * Etapas: student, guardians, health, confirm. A saúde é obrigatória
 * (como no Google Forms): quem não tem nada escreve "Não".
 */
export function validateStep(step, form, today) {
  const errors = {};
  const need = (key, ok, message) => {
    if (!ok) errors[key] = message;
  };

  if (step === "student") {
    const { student, enrollment } = form;
    need("student.name", filled(student.name), "Informe o nome completo do aluno.");
    need("student.birth_date", isBirthDate(student.birth_date, today), "Informe a data de nascimento.");
    need("student.gender", filled(student.gender), "Escolha o sexo.");
    need("student.cpf", isValidCpf(student.cpf), "Confira o CPF do aluno.");
    if (filled(student.phone)) need("student.phone", isPhone(student.phone), "Confira o celular, com DDD.");
    need("student.school", filled(student.school), "Informe a escola.");
    need("student.school_type", filled(student.school_type), "Escolha pública ou particular.");
    need("enrollment.uniform_size", filled(enrollment.uniform_size), "Escolha o tamanho do uniforme.");
    need("enrollment.due_day", filled(enrollment.due_day), "Escolha o dia de vencimento.");
  }

  if (step === "guardians") {
    const [first, second] = form.guardians;
    need("guardians.0.name", filled(first.name), "Informe o nome do responsável.");
    need("guardians.0.phone", isPhone(first.phone), "Confira o celular, com DDD.");
    need("guardians.0.email", isEmail(first.email), "Confira o e-mail.");
    need("guardians.0.gender", filled(first.gender), "Escolha o sexo.");
    need("guardians.0.cpf", isValidCpf(first.cpf), "Confira o CPF.");
    need("guardians.0.rg", filled(first.rg), "Informe o RG.");
    need("guardians.0.profession", filled(first.profession), "Informe a profissão.");
    need("guardians.0.zip_code", digits(first.zip_code).length === 8, "Confira o CEP.");
    need("guardians.0.address", filled(first.address), "Informe a rua e o número.");
    need("guardians.0.neighborhood", filled(first.neighborhood), "Informe o bairro.");
    need("guardians.0.city", filled(first.city), "Informe a cidade.");
    need("guardians.0.state", filled(first.state), "Escolha o estado.");

    // Segundo responsável é opcional, mas o que vier precisa estar certo
    const anySecond = ["name", "phone", "email", "cpf", "rg"].some((key) => filled(second[key]));
    if (anySecond) need("guardians.1.name", filled(second.name), "Informe o nome do segundo responsável.");
    if (filled(second.phone)) need("guardians.1.phone", isPhone(second.phone), "Confira o celular, com DDD.");
    if (filled(second.email)) need("guardians.1.email", isEmail(second.email), "Confira o e-mail.");
    if (filled(second.cpf)) need("guardians.1.cpf", isValidCpf(second.cpf), "Confira o CPF.");
  }

  if (step === "health") {
    HEALTH_QUESTIONS.forEach(({ name }) =>
      need(`health.${name}`, filled(form.health[name]), "Responda. Se não houver, escreva Não."),
    );
  }

  if (step === "confirm") {
    need("accepted", form.accepted, "Marque a autorização para enviar.");
    need("acceptedBy", filled(form.acceptedBy), "Informe o seu nome.");
  }

  return errors;
}

const trimAll = (object) =>
  Object.fromEntries(Object.entries(object).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));

// Pacote para public_enrollment_submit
export function buildPayload(form) {
  return {
    student: trimAll({ ...form.student, cpf: maskCpf(form.student.cpf), phone: maskPhone(form.student.phone) }),
    guardians: form.guardians
      .filter((guardian) => guardian.name.trim())
      .map((guardian) =>
        trimAll({
          ...guardian,
          cpf: maskCpf(guardian.cpf),
          phone: maskPhone(guardian.phone),
          zip_code: maskCep(guardian.zip_code),
        }),
      ),
    enrollment: { uniform_size: form.enrollment.uniform_size, due_day: Number(form.enrollment.due_day) || null },
    health: trimAll(form.health),
    consent: {
      accepted: form.accepted,
      version: CONSENT_VERSION,
      purpose_text: `${PURPOSE_TEXT}\n\n${PURPOSE_ACCEPT}`,
      health: true,
      health_text: HEALTH_TEXT,
      accepted_by: form.acceptedBy.trim(),
    },
  };
}
