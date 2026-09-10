import { useRef } from "react";

import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

export default function ChatWindow({
  conversation,
}) {

  const chatMessagesRef = useRef(null);

  function handleMessageSent(newMessage) {
    chatMessagesRef.current?.addMessage(newMessage);
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">

      <ChatHeader
        conversation={conversation}
      />

      <ChatMessages
        ref={chatMessagesRef}
        conversation={conversation}
      />

      <ChatInput
        conversation={conversation}
        onMessageSent={handleMessageSent}
      />

    </section>
  );
}