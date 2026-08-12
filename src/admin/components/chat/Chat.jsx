import { useEffect, useState } from "react";

import { getMessages } from "../../../services/messages";

import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function Chat({ contact }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadMessages();
  }, [contact.id]);

  async function loadMessages() {
    const data = await getMessages(contact.id);
    setMessages(data);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">

      <div className="border-b border-neutral-100 px-6 py-4">
        <h2 className="text-lg font-bold">
          Conversa
        </h2>

        <p className="text-sm text-neutral-500">
          Histórico de mensagens do WhatsApp
        </p>
      </div>

      <MessageList messages={messages} />

      <MessageInput
        contact={contact}
        onSent={loadMessages}
      />

    </div>
  );
}