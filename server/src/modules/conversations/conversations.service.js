import { findChats } from "../evolution/evolution.service.js";
import { getAll } from "../contacts/contacts.repository.js";

function normalizePhone(value) {
  return value
    ?.replace("@s.whatsapp.net", "")
    ?.replace("@lid", "")
    ?.replace(/\D/g, "");
}

function getResponsibleName(contact, chat) {
  const name = contact?.responsible_name?.trim();

  if (name && name !== ".") {
    return name;
  }

  return chat.pushName ?? "Sem nome";
}

export async function getInbox() {
  const [chats, contacts] = await Promise.all([
    findChats(),
    getAll(),
  ]);
console.table(
  chats.slice(0, 10).map(chat => ({
    pushName: chat.pushName,
    updatedAt: chat.updatedAt,
    messageTimestamp: chat.lastMessage?.messageTimestamp,
    remoteJid: chat.remoteJid,
  }))
);
  const orderedChats = chats.sort(
    (a, b) =>
      (b.lastMessage?.messageTimestamp ?? 0) -
      (a.lastMessage?.messageTimestamp ?? 0)
  );

  const limitedChats = orderedChats.slice(0, 50);

  const contactsMap = new Map();

  for (const contact of contacts) {
    contactsMap.set(
      normalizePhone(contact.phone),
      contact
    );
  }

  const conversations = limitedChats.map((chat) => {
   const phone = normalizePhone(
  chat.lastMessage?.key?.remoteJidAlt ??
  chat.lastMessage?.key?.remoteJid
);
    const contact = contactsMap.get(phone);
    console.table({
  phone,
  found: !!contact,
  contactId: contact?.id,
  chatJid: chat.remoteJid,
});
 

    return {
      id: contact?.id ?? chat.remoteJid,

      jid: chat.remoteJid,

      phone,

      profilePicUrl: chat.profilePicUrl,

      childName: contact?.child_name,

      responsibleName: getResponsibleName(
        contact,
        chat
      ),

      status: contact?.status ?? "new",

      unreadCount: chat.unreadCount ?? 0,

      lastMessage: getLastMessage(chat),

      lastMessageAt:
        chat.lastMessage?.messageTimestamp
          ? new Date(
              chat.lastMessage.messageTimestamp *
                1000
            ).toISOString()
          : chat.updatedAt,

      categoryName:
        contact?.category?.name ?? null,

      birthDate: contact?.birth_date,

      source:
        contact?.source ?? "WhatsApp",

      unit: contact?.unit,
    };
  });

  return conversations;
}

function getLastMessage(chat) {
  const message = chat.lastMessage?.message;

  if (!message) {
    return "";
  }

  if (message.conversation) {
    return message.conversation;
  }

  if (message.extendedTextMessage?.text) {
    return message.extendedTextMessage.text;
  }

  if (message.imageMessage) {
    return "📷 Foto";
  }

  if (message.videoMessage) {
    return "🎥 Vídeo";
  }

  if (message.audioMessage) {
    return "🎤 Áudio";
  }

  if (message.documentMessage) {
    return "📄 Documento";
  }

  if (message.stickerMessage) {
    return "😀 Figurinha";
  }

  if (message.reactionMessage) {
    return "❤️ Reação";
  }

  return chat.lastMessage?.messageType ?? "";
}