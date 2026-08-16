import { getAll } from "../contacts/contacts.repository.js";


export async function findOrCreateContact({
  jid,
  phone,
  pushName,
  instance,
}) {
  let contact =
    await repository.findByWhatsappJid(jid);

  if (contact) {
    return contact;
  }

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

  

  console.log("");

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