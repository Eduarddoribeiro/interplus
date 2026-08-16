import * as repository from "./messages.repository.js";
import { findMessages, sendTextMessage } from "../evolution/evolution.service.js";



export async function saveIncomingMessage({
  contact,
  payload,
  text,
}) {
  const message = payload.data;

  return repository.create({
    contact_id: contact.id,
    direction: "incoming",
    message: text,
    message_type: message.messageType ?? "text",
    status: "received",
    whatsapp_message_id: message.key.id,
    sender_phone: contact.phone,
    sender_name: contact.whatsapp_push_name,
    instance_name: payload.instance,
    created_at: new Date(
      message.messageTimestamp * 1000
    ).toISOString(),
  });
}

export async function getMessages(jid) {

  const response =
    await findMessages(jid);

  const messages =
  (response.messages?.records ?? [])
    .sort(
      (a, b) =>
        a.messageTimestamp - b.messageTimestamp
    );

  console.log("Quantidade:", messages.length);
  console.log(response.messages);

  return messages.map((item) => ({

    id: item.id,

    direction:
      item.key?.fromMe
        ? "outgoing"
        : "incoming",

    message:
      item.message?.conversation ??
      item.message?.extendedTextMessage?.text ??
      item.message?.imageMessage?.caption ??
      item.message?.videoMessage?.caption ??
      (item.message?.imageMessage && "📷 Foto") ??
      (item.message?.videoMessage && "🎥 Vídeo") ??
      (item.message?.audioMessage && "🎤 Áudio") ??
      (item.message?.documentMessage && "📄 Documento") ??
      (item.message?.stickerMessage && "😀 Figurinha") ??
      "Mensagem",

    created_at: new Date(
      item.messageTimestamp * 1000
    ).toISOString(),

    status:
      item.MessageUpdate?.at(-1)?.status?.toLowerCase() ??
      "sent",

    message_type:
      item.messageType,

    whatsapp_message_id:
      item.key?.id,

  }));

}

export async function sendMessage({ jid, message }) {
  return await sendTextMessage(jid, message);
}