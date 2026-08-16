const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:3001";

/**
 * Lista mensagens de uma conversa
 */
export async function getMessages(jid) {
  const response = await fetch(
    `${API_URL}/api/messages/${encodeURIComponent(jid)}`
  );

  if (!response.ok) {
    throw new Error("Erro ao carregar mensagens.");
  }

  return await response.json();
}

/**
 * Envia mensagem
 */
export async function sendMessage({
  jid,
  message,
}) {
  const response = await fetch(
    `${API_URL}/api/messages/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jid,
        message,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao enviar mensagem.");
  }

  return await response.json();
}