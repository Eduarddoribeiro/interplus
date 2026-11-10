/*
 * Poucos contatos têm o local gravado. Quando falta, usa o local da
 * experimental mais recente (que não foi cancelada).
 */
export function withSessionLocation(contacts, sessions) {
  const latest = new Map();

  sessions.forEach((session) => {
    const location = session.schedule?.training_group?.location;
    if (!location?.id || session.status === "cancelled") return;

    const current = latest.get(session.contact_id);
    if (!current || String(session.experimental_date) > String(current.date)) {
      latest.set(session.contact_id, { date: session.experimental_date, location });
    }
  });

  return contacts.map((contact) => {
    if (contact.location_id && contact.location) return contact;

    const fromSession = latest.get(contact.id)?.location;
    return fromSession ? { ...contact, location_id: fromSession.id, location: fromSession } : contact;
  });
}
