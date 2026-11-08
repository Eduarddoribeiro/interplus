
import { formatShortDate, getWeekdayLong, formatTime } from "./experimentalDates";

export function createCoachWhatsAppText(
  date,
  sessions
) {
  if (!sessions.length) {
    return "";
  }

  const header =
    `🔴 *${getWeekdayLong(
      date
    ).toUpperCase()} (${formatShortDate(
      date
    )})*`;

  // Um bloco por local (cada professor recebe o do seu ginásio)
  const byLocation = sortByLocation(sessions).reduce(
    (acc, session) => {
      const name = getLocationName(session);

      (acc[name] ||= []).push(session);

      return acc;
    },
    {}
  );

  const sections = Object.entries(byLocation).map(
    ([locationName, locationSessions]) =>
      `📍 *${locationName}*\n\n${buildCoachBlocks(
        locationSessions
      ).join("\n\n---\n\n")}`
  );

  return `${header}\n\n${sections.join(
    "\n\n━━━━━━━━━━\n\n"
  )}`;
}

function buildCoachBlocks(sessions) {
  return sessions.map((session) => {
      const contact =
        session.contact || {};

      const lines = [
        `⚽ Atleta: ${
          contact.child_name ||
          "Não informado"
        }`,

        `🏆 Categoria: ${
          session.category?.name ||
          "Não informada"
        }`,

        `👤 Responsável: ${
          contact.responsible_name ||
          "Não informado"
        }`,
      ];

      const time =
        session.experimental_time ||
        session.schedule?.start_time;

      if (time) {
        lines.push(
          `🕒 Horário: ${formatTime(
            time
          )}`
        );
      }

      if (
        session.coach_notes?.trim()
      ) {
        lines.push(
          `📝 Observação: ${session.coach_notes.trim()}`
        );
      }

      return lines.join("\n");
    });
}

// Local da experimental (via horário da turma); null em agendamentos antigos
export function getSessionLocation(session) {
  return session?.schedule?.training_group?.location ?? null;
}

export function getLocationName(session) {
  if (!session) return null;

  return getSessionLocation(session)?.name ?? "Sem local definido";
}

// Por local e, dentro do local, por horário
export function sortByLocation(sessions) {
  return [...sessions].sort((a, b) => {
    const byLocation = getLocationName(a).localeCompare(
      getLocationName(b)
    );

    if (byLocation !== 0) return byLocation;

    const timeA =
      a.experimental_time ||
      a.schedule?.start_time ||
      "";

    const timeB =
      b.experimental_time ||
      b.schedule?.start_time ||
      "";

    return timeA.localeCompare(timeB);
  });
}
