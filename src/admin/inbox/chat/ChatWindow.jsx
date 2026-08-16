import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

export default function ChatWindow({
  conversation,
}) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">

      <ChatHeader
        conversation={conversation}
      />

      <ChatMessages
        conversation={conversation}
      />

      <ChatInput
        conversation={conversation}
      />

    </section>
  );
}