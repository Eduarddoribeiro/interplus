import { useState } from "react";
import { Send } from "lucide-react";

export default function ChatInput() {

  const [message, setMessage] = useState("");

  function handleSend() {
    if (!message.trim()) return;

    console.log(message);

    setMessage("");
  }

  return (
    <footer className="border-t border-neutral-200 bg-white p-4">

      <div className="flex gap-3">

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 outline-none"
        />

        <button
          onClick={handleSend}
          className="rounded-xl bg-red-600 px-5 text-white"
        >
          <Send size={18} />
        </button>

      </div>

    </footer>
  );
}