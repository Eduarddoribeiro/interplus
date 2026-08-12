import { CheckCheck } from "lucide-react";

export default function MessageBubble({ message }) {
  const outgoing = message.direction === "outgoing";

  return (
    <div
      className={`flex ${
        outgoing
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`
          max-w-[75%]
          rounded-2xl
          px-4
          py-3
          shadow-sm

          ${
            outgoing
              ? "bg-inter-red text-white"
              : "border border-neutral-200 bg-white text-neutral-800"
          }
        `}
      >
        <p className="text-sm leading-relaxed">
          {message.text}
        </p>

        <div
          className={`
            mt-2
            flex
            items-center
            justify-end
            gap-1
            text-xs

            ${
              outgoing
                ? "text-red-100"
                : "text-neutral-400"
            }
          `}
        >
          {message.created_at}

          {outgoing && (
            <CheckCheck size={14}/>
          )}
        </div>
      </div>
    </div>
  );
}