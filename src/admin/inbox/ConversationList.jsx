import ConversationItem from "./ConversationItem";

export default function ConversationList() {
  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">

      <div className="border-b border-neutral-200 p-5">

        <h2 className="text-xl font-bold">
          Conversas
        </h2>

        <input
          placeholder="Buscar conversa..."
          className="mt-4 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none"
        />

      </div>

      <div className="flex-1 overflow-y-auto">

        <ConversationItem />

        <ConversationItem />

        <ConversationItem />

        <ConversationItem />

      </div>

    </aside>
  );
}