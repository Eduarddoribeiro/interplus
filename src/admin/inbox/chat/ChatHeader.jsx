import {
  MoreVertical,
  Phone,
  Search,
  Video,
} from "lucide-react";

import {
  CONTACT_STATUS_LABEL,
  CONTACT_STATUS_COLORS,
} from "../../../constants/contactStatus";

import {
  getInitials,
} from "../../../helpers/chatHelpers";

export default function ChatHeader({
  conversation,
}) {
  if (!conversation) return null;

  const {
    childName,
    responsibleName,
    phone,
    categoryName,
    age,
    status,
    profilePicUrl
  } = conversation;

  const displayName =
    childName ??
    responsibleName ??
    "Sem nome";

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-5">

      {/* Esquerda */}

      <div className="flex items-center gap-4">

        <div className="relative">

          {profilePicUrl ? (
  <img
    src={profilePicUrl}
    alt={displayName}
    className="
      h-14
      w-14
      rounded-full
      object-cover
      shadow-sm
    "
  />
) : (
  <div
    className="
      flex
      h-14
      w-14
      items-center
      justify-center
      rounded-full
      bg-gradient-to-br
      from-red-600
      to-red-700
      text-lg
      font-bold
      text-white
      shadow-sm
    "
  >
    {getInitials(displayName)}
  </div>
)}

          <span
            className="
              absolute
              bottom-0
              right-0
              h-3.5
              w-3.5
              rounded-full
              border-2
              border-white
              bg-emerald-500
            "
          />

        </div>

        <div>

          <h2 className="text-lg font-bold text-neutral-900">
            {displayName}
          </h2>

          <p className="text-sm text-neutral-500">
            {responsibleName ?? "Responsável não informado"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                CONTACT_STATUS_COLORS[status] ??
                "bg-neutral-100 text-neutral-600"
              }`}
            >
              {CONTACT_STATUS_LABEL[status] ??
                status}
            </span>

            {categoryName && (
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                {categoryName}
              </span>
            )}

            {age && (
              <span className="text-xs text-neutral-500">
                {age} anos
              </span>
            )}

          </div>

        </div>

      </div>

      {/* Direita */}

      <div className="flex items-center gap-2">

        <button className="rounded-xl border border-neutral-200 p-3 transition hover:bg-neutral-100">

          <Search size={18} />

        </button>

        {phone && (
          <a
            href={`tel:${phone}`}
            className="rounded-xl border border-neutral-200 p-3 transition hover:bg-neutral-100"
          >
            <Phone size={18} />
          </a>
        )}

        <button className="rounded-xl border border-neutral-200 p-3 transition hover:bg-neutral-100">

          <Video size={18} />

        </button>

        <button className="rounded-xl border border-neutral-200 p-3 transition hover:bg-neutral-100">

          <MoreVertical size={18} />

        </button>

      </div>

    </header>
  );
}