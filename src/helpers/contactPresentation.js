/* =========================================================
 * DATAS
 * =======================================================*/

/**
 * Formata uma data no padrão YYYY-MM-DD para pt-BR.
 *
 * Usamos horário local explícito para evitar problemas
 * de timezone transformando a data no dia anterior.
 */
export function formatContactDate(dateString) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(
    `${dateString}T00:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("pt-BR");
}

/**
 * Formata timestamps vindos do banco.
 *
 * Exemplo:
 * 2026-08-03T15:30:00Z
 * →
 * 03/08/2026
 */
export function formatContactDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("pt-BR");
}

/* =========================================================
 * DIFERENÇA ENTRE DATAS
 * =======================================================*/

/**
 * Calcula quantos dias existem entre duas datas
 * no formato YYYY-MM-DD.
 *
 * Nunca retorna valor negativo.
 */
export function daysBetweenDates(from, to) {
  if (!from || !to) {
    return 0;
  }

  const start = new Date(
    `${from}T12:00:00`,
  );

  const end = new Date(
    `${to}T12:00:00`,
  );

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  const difference =
    end.getTime() - start.getTime();

  return Math.max(
    0,
    Math.floor(
      difference / millisecondsPerDay,
    ),
  );
}

/* =========================================================
 * TELEFONE
 * =======================================================*/

/**
 * Mantém somente os números de um telefone.
 */
export function normalizePhone(phone) {
  if (!phone) {
    return "";
  }

  return String(phone).replace(/\D/g, "");
}

/**
 * Converte o telefone para o padrão internacional
 * utilizado pelo WhatsApp.
 *
 * Como a operação é brasileira, adicionamos 55
 * quando o telefone ainda não possui DDI.
 */
export function getWhatsAppPhone(phone) {
  const numbers = normalizePhone(phone);

  if (!numbers) {
    return null;
  }

  if (numbers.startsWith("55")) {
    return numbers;
  }

  return `55${numbers}`;
}

/* =========================================================
 * WHATSAPP
 * =======================================================*/

/**
 * Cria o link para abrir uma conversa no WhatsApp.
 */
export function createWhatsAppUrl(phone) {
  const whatsappPhone =
    getWhatsAppPhone(phone);

  if (!whatsappPhone) {
    return null;
  }

  return `https://wa.me/${whatsappPhone}`;
}

export function getTodayISO() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}