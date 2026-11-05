import { BRAND } from "./brand";

/*
 * Pendências criadas junto com cada matrícula.
 *
 * days = prazo em dias depois do início da matrícula. A lista e os
 * prazos são os mesmos da função create_student_enrollment no banco
 * (supabase/migrations/20261030120000_pos_matricula.sql), menos a
 * 1ª mensalidade: ela é paga direto no Sogni. A função ainda cria
 * essa pendência, e o painel a ignora (só conta o que está aqui).
 */
export const STUDENT_TASKS = [
  { kind: "sogni", label: `Cadastrado no ${BRAND.financeSystem}`, group: "Cadastro", days: 3 },
  { kind: "community", label: "Entrou na comunidade", group: "Cadastro", days: 3 },
  // O contrato vai por e-mail no momento da matrícula: só falta a assinatura
  { kind: "contract_signed", label: "Contrato assinado", group: "Cadastro", days: 7 },
  { kind: "enrollment_fee", label: "Taxa de matrícula paga", group: "Pagamentos", days: 7 },
  { kind: "uniform", label: "Uniforme pago", group: "Pagamentos", days: 15 },
];

export const STUDENT_TASK_LABEL = Object.fromEntries(
  STUDENT_TASKS.map((task) => [task.kind, task.label]),
);

export const TASK_STATUS = {
  PENDING: "pending",
  DONE: "done",
  EXEMPT: "exempt",
};

export const TASK_STATUS_LABEL = {
  pending: "Pendente",
  done: "Feito",
  exempt: "Não se aplica",
};

export const PAYMENT_METHOD_LABEL = {
  pix: "Pix",
  card: "Cartão",
  boleto: "Boleto",
};

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => ({
  value,
  label,
}));

export const STUDENT_STATUS_LABEL = {
  active: "Ativo",
  left: "Saiu",
};
