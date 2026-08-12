import { Paperclip, SendHorizontal, Smile } from "lucide-react";

export default function MessageInput() {
  return (
    <div
      className="
        border-t
        border-neutral-200
        bg-white
        p-4
      "
    >
      <div className="flex items-center gap-3">

        <button className="text-neutral-500">
          <Smile size={21}/>
        </button>

        <button className="text-neutral-500">
          <Paperclip size={20}/>
        </button>

        <input
          placeholder="Digite uma mensagem..."
          className="
            flex-1
            rounded-xl
            border
            border-neutral-200
            px-4
            py-3
            text-sm
            outline-none
            focus:border-inter-red
          "
        />

        <button
          className="
            rounded-xl
            bg-inter-red
            p-3
            text-white
            transition
            hover:opacity-90
          "
        >
          <SendHorizontal size={18}/>
        </button>

      </div>
    </div>
  );
}