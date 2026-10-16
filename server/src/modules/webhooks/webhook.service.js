import {
  findOrCreateContact,
  touchConversation,
} from "../contacts/contacts.service.js";

import { saveIncomingMessage } from "../messages/messages.service.js";
import { getIO } from "../../socket.js";

export async function processEvolutionWebhook(payload) {
  if (payload.event !== "messages.upsert") {
    return;
  }

  const message = payload.data;

  const jid = message.key.remoteJid;

  const phone = jid
    ?.replace("@s.whatsapp.net", "")
    ?.replace("@lid", "");

  const responsibleName =
    message.pushName ?? "Sem nome";

  const text =
    message.message?.conversation ??
    message.message?.extendedTextMessage?.text ??
    "";

  const direction =
    message.key.fromMe
      ? "outgoing"
      : "incoming";

  // Só processa mensagens recebidas
  if (direction === "outgoing") {
    return;
  }

  const messageId = message.key.id;

  const timestamp = new Date(
    message.messageTimestamp * 1000
  );

  // ===== LOGS DE DIAGNÓSTICO =====
  console.log("");
  console.log("========== WEBHOOK RECEBIDO ==========");
  console.log("RAW JID:", jid);
  console.log("PHONE:", phone);
  console.log("PHONE LENGTH:", phone?.length);
  console.log("INSTANCE:", payload.instance);
  console.log("PUSH NAME:", responsibleName);

  console.table({
    jid,
    phone,
    responsibleName,
    direction,
    messageId,
  });

  const contact = await findOrCreateContact({
    jid,
    phone,
    pushName: responsibleName,
    instance: payload.instance,
  });

  console.log("CONTATO ENCONTRADO/CRIADO:");
  console.table(contact);

  if (!contact) {
    return;
  }

  const savedMessage =
    await saveIncomingMessage({
      contact,
      payload,
      text,
    });

  await touchConversation(
    contact.id,
    timestamp.toISOString()
  );

  const io = getIO();

  console.log("📡 Emitindo new-message", {
    jid,
    socketCount: io.engine.clientsCount,
  });

  io.emit("new-message", {
    jid,
    message: savedMessage.message,
    created_at: savedMessage.created_at,
    direction: savedMessage.direction,
  });

  console.log("");
  console.log("========== NOVA MENSAGEM ==========");

  console.table({
    contactId: contact.id,
    phone,
    jid,
    responsibleName,
    direction,
    text,
    messageId,
    timestamp,
  });

  console.log("===================================");
}