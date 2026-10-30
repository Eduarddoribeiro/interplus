/*
 * Situação de um aluno num evento (inscrição na Taça, cada rodada,
 * passeio). Os nomes seguem os que a escola já usava na planilha.
 */
export const EVENT_STATUS_LABEL = {
  interested: "Interessado",
  confirmed: "Confirmado",
  pending: "Pagamento pendente",
  paid: "Pago",
  exempt: "Isento",
  absent: "Não participou",
  refund: "Devolver",
};

export const EVENT_STATUS_OPTIONS = Object.entries(EVENT_STATUS_LABEL).map(([value, label]) => ({
  value,
  label,
}));

// Só o que pede ação ganha cor
export const EVENT_STATUS_TONE = {
  pending: "text-attention-text",
  refund: "text-attention-text",
};

// Pede ação da escola (cobrar ou devolver)
export const EVENT_STATUS_OPEN = new Set(["pending", "refund"]);

// Vai jogar a rodada (entra na lista para a comissão)
export const EVENT_STATUS_PLAYING = new Set(["confirmed", "pending", "paid", "exempt"]);

// Ordem de "Situação": primeiro o que pede ação
export const EVENT_STATUS_ORDER = ["pending", "refund", "confirmed", "interested", "paid", "exempt", "absent"];
