export function getTodayISO() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function addDaysISO(
  dateString,
  days
) {
  const date =
    new Date(
      `${dateString}T12:00:00`
    );

  date.setDate(
    date.getDate() + days
  );

  return dateToISO(date);
}

export function getMondayISO(
  dateString
) {
  const date =
    new Date(
      `${dateString}T12:00:00`
    );

  const weekday =
    date.getDay();

  const difference =
    weekday === 0
      ? -6
      : 1 - weekday;

  date.setDate(
    date.getDate() +
      difference
  );

  return dateToISO(date);
}

function dateToISO(date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatShortDate(
  dateString
) {
  if (!dateString) return "";

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    new Date(
      `${dateString}T12:00:00`
    )
  );
}

export function formatFullDate(
  dateString
) {
  if (!dateString) return "";

  const text =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ).format(
      new Date(
        `${dateString}T12:00:00`
      )
    );

  return capitalize(text);
}

export function formatDayMonth(
  dateString
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
    }
  ).format(
    new Date(
      `${dateString}T12:00:00`
    )
  );
}

export function getWeekdayShort(
  dateString
) {
  const value =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        weekday: "short",
      }
    ).format(
      new Date(
        `${dateString}T12:00:00`
      )
    );

  const short = value.replace(".", "");

  return short.charAt(0).toUpperCase() + short.slice(1);
}

export function getWeekdayLong(
  dateString
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      weekday: "long",
    }
  ).format(
    new Date(
      `${dateString}T12:00:00`
    )
  );
}

export function formatTime(value) {
  if (!value) return "";

  return value.slice(0, 5);
}

function capitalize(value) {
  if (!value) return "";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}
