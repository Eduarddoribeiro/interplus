import { Phone, Video } from "lucide-react";

export default function ChatHeader() {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">

      <div>

        <h2 className="font-bold">
          João Pedro
        </h2>

        <p className="text-sm text-neutral-500">
          Carlos (Pai)
        </p>

      </div>

      <div className="flex gap-2">

        <button className="rounded-xl border p-3">
          <Phone size={18}/>
        </button>

        <button className="rounded-xl border p-3">
          <Video size={18}/>
        </button>

      </div>

    </header>
  );
}