import { useMemo, useState } from "react";
import {
  Filter,
  Search,
} from "lucide-react";

import ConversationItem from "./ConversationItem";

export default function ConversationList({
  loading,
  conversations,
  selectedConversation,
  onSelectConversation,
}) {
  const [search, setSearch] = useState("");

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;

    return conversations.filter((conversation) => {
      const text = [
        conversation.childName,
        conversation.responsibleName,
        conversation.phone,
        conversation.lastMessage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [conversations, search]);

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

      {/* Header */}

      <header className="border-b border-neutral-200 p-6">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-bold text-neutral-900">
              Conversas
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              {filteredConversations.length} conversas
            </p>

          </div>

          <button className="rounded-xl border border-neutral-200 p-2 transition hover:bg-neutral-50">

            <Filter size={18} />

          </button>

        </div>

        <div className="relative mt-5">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Buscar conversa..."
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-red-500 focus:bg-white"
          />

        </div>

      </header>

      <div className="flex-1 overflow-y-auto">

        {loading && (

          <div className="p-6 text-sm text-neutral-500">
            Carregando conversas...
          </div>

        )}

        {!loading &&
          filteredConversations.length === 0 && (

          <div className="p-6 text-center text-neutral-500">
            Nenhuma conversa encontrada.
          </div>

        )}

        {!loading &&
          filteredConversations.map(
            (conversation) => (

              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                selected={
                  selectedConversation?.id ===
                  conversation.id
                }
                onClick={() =>
                  onSelectConversation(
                    conversation
                  )
                }
              />

            )
          )}

      </div>

    </aside>
  );
}