const BASE_URL = process.env.EVOLUTION_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE;

export async function findChats() {
  const response = await fetch(
    `${BASE_URL}/chat/findChats/${INSTANCE}`,
    {
      method: "POST",
      headers: {
        apikey: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        take: 50,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar chats.");
  }

  return await response.json();
}

export async function findMessages(jid) {
  const response = await fetch(
    `${BASE_URL}/chat/findMessages/${INSTANCE}`,
    {
      method: "POST",
      headers: {
        apikey: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        where: {
          key: {
            remoteJid: jid,
          },
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar mensagens.");
  }

  return await response.json();
}

export async function sendTextMessage(jid, text) {
  const response = await fetch(
    `${BASE_URL}/message/sendText/${INSTANCE}`,
    {
      method: "POST",
      headers: {
        apikey: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: jid,
        text,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}