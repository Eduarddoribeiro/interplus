import * as repository from "./messages.repository.js";
import {
  findMessages,
  sendTextMessage,
} from "../evolution/evolution.service.js";

import { getIO } from "../../socket.js";

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
  const response = await findMessages(jid);

  const messages =
    (response.messages?.records ?? [])
      .sort(
        (a, b) =>
          a.messageTimestamp -
          b.messageTimestamp
      );

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
      item.MessageUpdate
        ?.at(-1)
        ?.status?.toLowerCase() ??
      "sent",

    message_type:
      item.messageType,

    whatsapp_message_id:
      item.key?.id,
  }));
}

export async function sendMessage({
  jid,
  message,
  contactId,
}) {
  // Envia para a Evolution
  const response =
    await sendTextMessage(
      jid,
      message
    );

  console.log(
    "📤 Evolution:",
    response
  );

  // Salva no banco
  const savedMessage =
    await repository.create({
      contact_id: contactId,
      direction: "outgoing",
      message,
      message_type: "text",
      status: "sent",

      whatsapp_message_id:
        response?.key?.id ??
        response?.message?.key?.id ??
        null,

      sender_phone: null,
      sender_name: null,

      instance_name:
        process.env.EVOLUTION_INSTANCE,

      created_at:
        new Date().toISOString(),
    });

  // Aguarda a Evolution persistir
  await new Promise((resolve) =>
    setTimeout(resolve, 300)
  );

  // Atualiza todos os clientes
  const io = getIO();

  io.emit("new-message", {
    jid,
    message: savedMessage.message,
    created_at:
      savedMessage.created_at,
    direction:
      savedMessage.direction,
  });

  return savedMessage;
}