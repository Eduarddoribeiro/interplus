import {
  CONTACT_STATUS_LABEL,
  CONTACT_STATUS_COLORS,
} from "../../../constants/contactStatus";

import {
  getInitials,
  formatMessageTime,
} from "../../../helpers/chatHelpers";

export default function ConversationItem({
  conversation,
  selected,
  onClick,
}) {
  const name =
    conversation.childName ??
    conversation.responsibleName ??
    "Sem nome";

  return (
    <button
      onClick={onClick}
      className={`
        flex w-full items-start gap-4
        border-b border-neutral-100
        p-4
        text-left
        transition
        ${
          selected
            ? "bg-red-50"
            : "hover:bg-neutral-50"
        }
      `}
    >
      {/* Avatar */}

      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 font-bold text-white">

       {
  conversation.profilePicUrl ? (
    <img
      src={conversation.profilePicUrl}
      alt=""
      className="h-12 w-12 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white font-bold">
      {getInitials(
        conversation.childName ??
        conversation.responsibleName
      )}
    </div>
  )
}

      </div>

      {/* Conteúdo */}

      <div className="min-w-0 flex-1">

        <div className="flex items-center justify-between">

          <h3 className="truncate font-semibold text-neutral-900">

            {name}

          </h3>

          <span className="text-xs text-neutral-400">

            {formatMessageTime(
              conversation.lastMessageAt
            )}

          </span>

        </div>

        <p className="text-sm text-neutral-500">

          {conversation.responsibleName ?? "-"}

        </p>

        <p className="mt-1 truncate text-sm text-neutral-600">

          {conversation.lastMessage ||
            "Nenhuma mensagem"}

        </p>

        <div className="mt-3 flex items-center justify-between">

          <span
            className={`
              rounded-full
              px-2
              py-1
              text-xs
              font-semibold
              ${
                CONTACT_STATUS_COLORS[
                  conversation.status
                ] ??
                "bg-neutral-100 text-neutral-600"
              }
            `}
          >
            {CONTACT_STATUS_LABEL[
              conversation.status
            ] ??
              conversation.status}
          </span>

          {conversation.unreadCount > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">

              {conversation.unreadCount}

            </span>
          )}

        </div>

      </div>

    </button>
  );
}