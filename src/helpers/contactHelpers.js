/* =========================================================
 * TEXTO
 * =======================================================*/

export function cleanOptionalText(value) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const text = value.trim();

  return text || null;
}

/* =========================================================
 * DATAS
 * =======================================================*/

export function nowISO() {
  return new Date().toISOString();
}

export function todayBR() {
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date()
  );
}

/* =========================================================
 * NOTAS INTERNAS
 * =======================================================*/

export function appendInternalNote(
  currentNotes,
  note
) {
  const cleanNote = cleanOptionalText(note);

  if (!cleanNote) {
    return currentNotes || null;
  }

  const line = `[${todayBR()}] ${cleanNote}`;

  if (!currentNotes?.trim()) {
    return line;
  }

  return `${currentNotes.trim()}\n\n${line}`;
}

/* =========================================================
 * HELPERS DO SUPABASE
 * =======================================================*/

export function ensureUpdated(data) {
  if (!data || data.length === 0) {
    throw new Error(
      "O Supabase não atualizou nenhuma linha."
    );
  }

  return data[0];
}