import { useState } from "react";
import { Send } from "lucide-react";

import { sendMessage } from "../../../services/messages";

export default function ChatInput({
  conversation,
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

async function handleSend() {

  console.log("1 - Clique");

  if (!message.trim()) {
    console.log("2 - Mensagem vazia");
    return;
  }

  if (!conversation?.jid) {
    console.log("3 - Sem conversa", conversation);
    return;
  }

  console.log("4 - Vai enviar");
  console.log({
    jid: conversation.jid,
    message,
  });

  try {

    setSending(true);

    console.log("5 - Antes do fetch");

    const result = await sendMessage({
      jid: conversation.jid,
      message,
    });

    console.log("6 - Resposta", result);

    setMessage("");

  } catch (err) {

    console.error("ERRO:", err);

  } finally {

    console.log("7 - Finalizou");

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