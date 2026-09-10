import { useState } from "react";
import { Send } from "lucide-react";

import { sendMessage } from "../../../services/messages";

export default function ChatInput({ conversation, onMessageSent }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  async function handleSend() {
    if (sending) {
      return;
    }

    if (!message.trim()) {
      return;
    }

    if (!conversation?.jid) {
      return;
    }

    const textToSend = message;

    try {
      setSending(true);
      setError(null);

      const sentMessage = await sendMessage({
        jid: conversation.jid,
        contactId: conversation.id,
        message: textToSend,
      });

      setMessage("");

      onMessageSent?.(sentMessage);
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      setError("Não foi possível enviar a mensagem. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <footer className="border-t border-neutral-200 bg-white p-4">
      {error && (
        <p className="mb-2 text-xs text-red-600">{error}</p>
      )}
      <div className="flex gap-3">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          placeholder="Digite uma mensagem..."
          className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 outline-none"
        />

        <button
          onClick={handleSend}
          disabled={sending}
          className="rounded-xl bg-red-600 px-5 text-white disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </footer>
  );
}
