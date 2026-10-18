/*
 * Links para salvar a aula experimental na agenda do responsável.
 * Horários sempre no fuso de Viamão (America/Sao_Paulo).
 */

const TIMEZONE = "America/Sao_Paulo";

// "2026-10-20" + "19:00:00" -> "20261020T190000"
function toCalendarDate(date, time) {
  return `${date.replaceAll("-", "")}T${time.slice(0, 8).replaceAll(":", "").padEnd(6, "0")}`;
}

export function googleCalendarUrl({ title, date, start, end, location, details }) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toCalendarDate(date, start)}/${toCalendarDate(date, end)}`,
    ctz: TIMEZONE,
    location: location ?? "",
    details: details ?? "",
  });

  return `https://calendar.google.com/calendar/render?${params}`;
}

function escapeIcs(text = "") {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

/**
 * Baixa um arquivo .ics (agenda do iPhone e outros apps).
 */
export function downloadIcs({ title, date, start, end, location, details }) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Escola do Inter Viamao//Aula experimental//PT",
    "BEGIN:VEVENT",
    `UID:${stamp}-${Math.random().toString(36).slice(2)}@escoladointer`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${TIMEZONE}:${toCalendarDate(date, start)}`,
    `DTEND;TZID=${TIMEZONE}:${toCalendarDate(date, end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `LOCATION:${escapeIcs(location)}`,
    `DESCRIPTION:${escapeIcs(details)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");

  link.href = url;
  link.download = "aula-experimental.ics";
  link.click();

  URL.revokeObjectURL(url);
}

export function mapsUrl(name, address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [name, address].filter(Boolean).join(", "),
  )}`;
}
