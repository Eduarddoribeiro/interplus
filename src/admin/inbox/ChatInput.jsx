import { Paperclip, Send } from "lucide-react";

export default function ChatInput() {
  return (
    <footer className="border-t border-neutral-200 p-4">

      <div className="flex gap-3">

        <button className="rounded-xl border p-3">
          <Paperclip size={18}/>
        </button>

        <input
          className="flex-1 rounded-xl border px-4"
          placeholder="Digite uma mensagem..."
        />

        <button className="rounded-xl bg-red-600 px-5 text-white">
          <Send size={18}/>
        </button>

      </div>

    </footer>
  );
}