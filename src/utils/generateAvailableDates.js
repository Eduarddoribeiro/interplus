import { WEEKDAY_LABELS } from "../constants/weekdays";

/**
 * Calcula a próxima ocorrência (a partir de hoje) de um dia da
 * semana específico.
 *
 * O parâmetro `weekday` segue o mesmo padrão numérico utilizado em
 * training_group_schedules.weekday e em constants/weekdays.js:
 * 1 = Segunda-feira ... 7 = Domingo.
 *
 * Retorna { iso, date, label } ou null quando não for possível
 * calcular (weekday ausente ou inválido).
 */
export function getNextOccurrence(weekday, daysAhead = 60) {
  const numericWeekday = Number(weekday);

  if (!numericWeekday || numericWeekday < 1 || numericWeekday > 7) {
    return null;
  }

  // constants/weekdays.js usa 1=Segunda...7=Domingo.
  // Date.prototype.getDay() usa 0=Domingo...6=Sábado.
  const jsTargetDay = numericWeekday % 7;

  const today = new Date();

  for (let i = 0; i <= daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    if (date.getDay() !== jsTargetDay) continue;

    // Data local (toISOString usaria UTC e, à noite no Brasil,
    // devolveria o dia seguinte).
    const iso = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    return {
      iso,
      date,
      label: date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    };
  }

  return null;
}

export { WEEKDAY_LABELS };