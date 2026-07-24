const WEEKDAY_MAP = {
  "Domingo": 0,
  "Segunda-feira": 1,
  "Terça-feira": 2,
  "Quarta-feira": 3,
  "Quinta-feira": 4,
  "Sexta-feira": 5,
  "Sábado": 6,
};

export function generateAvailableDates(weekday, daysAhead = 30) {
  if (!weekday) return [];

  const targetDay = WEEKDAY_MAP[weekday];

  if (targetDay === undefined) return [];

  const sessions = [];
  const today = new Date();

  for (let i = 0; i <= daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    if (date.getDay() !== targetDay) continue;

    const iso = date.toISOString().split("T")[0];

    sessions.push({
      id: iso,
      date,
      iso,
      label: date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    });
  }

  return sessions;
}

export const WEEKDAY_LABEL = {
  "Domingo": "Domingo",
  "Segunda-feira": "Segunda-feira",
  "Terça-feira": "Terça-feira",
  "Quarta-feira": "Quarta-feira",
  "Quinta-feira": "Quinta-feira",
  "Sexta-feira": "Sexta-feira",
  "Sábado": "Sábado",
};