import { Check, CheckCheck } from "lucide-react";

export default function MessageBubble({
  outgoing = false,
  text,
  time,
  status = "sent",
}) {
  return (
    <div
      className={`mb-3 flex ${
        outgoing ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`
          max-w-[70%]
          rounded-2xl
          px-4
          py-3
          shadow-sm
          ${
            outgoing
              ? "rounded-br-md bg-red-600 text-white"
              : "rounded-bl-md bg-white text-neutral-800"
          }
        `}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {text}
        </p>

        <div
          className={`mt-2 flex items-center justify-end gap-1 text-[11px]
          ${
            outgoing
              ? "text-red-100"
              : "text-neutral-400"
          }`}
        >
          <span>{time}</span>

          {outgoing && (
            <>
              {status === "sent" && (
                <Check size={13} />
              )}

              {status === "delivered" && (
                <CheckCheck size={13} />
              )}

              {status === "read" && (
                <CheckCheck
                  size={13}
                  className="text-sky-300"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}