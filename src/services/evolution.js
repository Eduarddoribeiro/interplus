const EVOLUTION_URL = import.meta.env.VITE_EVOLUTION_URL;
const API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY;
const INSTANCE = import.meta.env.VITE_EVOLUTION_INSTANCE;

export async function sendEvolutionMessage({ phone, message }) {
  const cleanPhone = phone.replace(/\D/g, "");

  const number = cleanPhone.startsWith("55")
    ? cleanPhone
    : `55${cleanPhone}`;

  const response = await fetch(
    `${EVOLUTION_URL}/message/sendText/${INSTANCE}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: API_KEY,
      },
      body: JSON.stringify({
        number,
        text: message,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.response?.message || "Erro ao enviar mensagem");
  }

  return data;
}