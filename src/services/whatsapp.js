import { sendEvolutionMessage } from "./evolution";

export async function sendWhatsAppMessage({
  phone,
  message,
}) {
  return sendEvolutionMessage({
    phone,
    message,
  });
}