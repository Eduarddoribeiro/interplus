import * as repository from "./contacts.repository.js";

export async function findOrCreateContact({
  jid,
  phone,
  pushName,
  instance,
}) {
  // Ignora grupos
  if (jid.endsWith("@g.us")) {
    return null;
  }

  // 1. Procura pelo JID
  let contact = await repository.findByWhatsappJid(jid);

  if (contact) {
    return contact;
  }

  // 2. Procura pelo telefone
  contact = await repository.findByPhone(phone);

  if (contact) {
    // 3. Vincula o WhatsApp ao contato existente
    await repository.attachWhatsappData(
      contact.id,
      jid,
      instance,
      pushName
    );

    return {
      ...contact,
      whatsapp_jid: jid,
      whatsapp_instance: instance,
      whatsapp_push_name: pushName,
    };
  }

  // 4. Cria somente se não existir
  contact = await repository.create({
    whatsapp_jid: jid,
    whatsapp_instance: instance,
    whatsapp_push_name: pushName,
    phone,
    responsible_name: pushName,
    child_name: null,
    status: "new",
    source: "WhatsApp",
    entry_channel: "WhatsApp",
    first_contact_at: new Date().toISOString(),
  });

  console.log("🟢 Novo contato criado");
  console.table(contact);

  return contact;
}

export async function touchConversation(
  contactId,
  timestamp
) {
  return repository.updateInboxData(
    contactId,
    timestamp
  );
}

export async function markAsRead(contactId) {
  return repository.markAsRead(contactId);
}