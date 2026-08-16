import { findChats } from "../evolution/evolution.service.js";
import { getAll } from "../contacts/contacts.repository.js";

export async function getInbox() {

  const [chats, contacts] = await Promise.all([
    findChats(),
    getAll(),
  ]);

  const limitedChats = chats.slice(0, 50);

  const contactsMap = new Map();

  for (const contact of contacts) {
    contactsMap.set(contact.phone, contact);
  }

  const conversations = limitedChats.map((chat) => {

    const phone =
      chat.lastMessage?.key?.remoteJidAlt
        ?.replace("@s.whatsapp.net", "");

    const contact =
      contactsMap.get(phone);

    return {

      id:
        contact?.id ??
        chat.remoteJid,

      jid:
        chat.remoteJid,

      phone,

      profilePicUrl:
        chat.profilePicUrl,

      childName:
        contact?.child_name,

      responsibleName:
        contact?.responsible_name ??
        chat.pushName,

      status:
        contact?.status ??
        "new",

      unreadCount:
        chat.unreadCount ?? 0,

      lastMessage:
        getLastMessage(chat),

      lastMessageAt:
        chat.updatedAt,

      categoryName:
        contact?.category?.name ?? null,

      birthDate:
        contact?.birth_date,

      source:
        contact?.source ?? "WhatsApp",

      unit:
        contact?.unit,

    };

  });

  return conversations;

}

function getLastMessage(chat) {

  const message =
    chat.lastMessage?.message;

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