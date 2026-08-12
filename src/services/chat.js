import { sendEvolutionMessage } from "./evolution";
import { saveOutgoingMessage } from "./messages";

export async function sendChatMessage({
  contact,
  message,
}) {
  const response = await sendEvolutionMessage({
    phone: contact.phone,
    message,
  });

  await saveOutgoingMessage({
    contactId: contact.id,
    message,
    senderPhone: contact.phone,
    senderName: contact.responsible_name,
    whatsappMessageId:
      response?.key?.id ?? null,
  });

  return response;
}