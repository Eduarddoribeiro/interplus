import { MessageCircle, Phone } from "lucide-react";

export default function ChatHeader({ contact }) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        border-b
        border-neutral-200
        px-6
        py-5
      "
    >
      <div>
        <h2 className="text-lg font-bold text-neutral-900">
          {contact.child_name}
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          {contact.responsible_name}
        </p>

        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          WhatsApp
        </p>
      </div>

      <div className="flex gap-2">

        <button
          className="
            rounded-xl
            border
            border-neutral-200
            p-3
            transition
            hover:bg-neutral-50
          "
        >
          <Phone size={18}/>
        </button>

        <button
          className="
            rounded-xl
            bg-inter-red
            p-3
            text-white
          "
        >
          <MessageCircle size={18}/>
        </button>

      </div>
    </div>
  );
}