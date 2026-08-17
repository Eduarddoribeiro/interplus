import { useState } from "react";

import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

export default function ChatWindow({
  conversation,
}) {

  const [reloadKey, setReloadKey] = useState(0);

  function reloadMessages() {
    setReloadKey((v) => v + 1);
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">

      <ChatHeader
        conversation={conversation}
      />

      <ChatMessages
        conversation={conversation}
        reloadKey={reloadKey}
      />

      <ChatInput
        conversation={conversation}
        onMessageSent={reloadMessages}
      />

    </section>
  );
}