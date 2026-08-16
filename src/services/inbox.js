const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:3001";

export async function getInboxConversations() {

  const response = await fetch(
    `${API_URL}/api/conversations`
  );

  if (!response.ok) {
    throw new Error(
      "Erro ao carregar conversas."
    );
  }

  return await response.json();

}