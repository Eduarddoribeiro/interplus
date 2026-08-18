import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { getMessages } from "../../../services/messages";
import { formatMessageTime } from "../../../helpers/chatHelpers";
import { socket } from "../../../services/socket"

import MessageBubble from "./MessageBubble";

function formatDate(date) {
  const d = new Date(date);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return "Hoje";
  }

  if (d.toDateString() === yesterday.toDateString()) {
    return "Ontem";
  }

  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ChatMessages({
  conversation,
  reloadKey,
}) {

    console.count("RENDER ChatMessages");

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

useEffect(() => {

  if (!conversation?.jid) {
    setMessages([]);
    return;
  }

  loadMessages();

}, [conversation?.jid, reloadKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  

async function loadMessages() {
  try {
    setLoading(true);

    const data = await getMessages(conversation.jid);

    setMessages(data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}

useEffect(() => {

  function handleNewMessage(data) {

    console.log("📩 Nova mensagem", data);

    if (data.jid !== conversation?.jid) {
      return;
    }

    loadMessages();

  }

  socket.on("new-message", handleNewMessage);

  return () => {
    socket.off("new-message", handleNewMessage);
  };

}, [conversation?.jid]);



  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-100">

        <div className="text-center">

          <div className="text-5xl">
            💬
          </div>

          <h3 className="mt-4 font-semibold">
            Selecione uma conversa
          </h3>

          <p className="mt-2 text-sm text-neutral-500">
            Escolha uma conversa para começar o atendimento.
          </p>

        </div>

      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-100">

        <Loader2
          size={28}
          className="animate-spin text-neutral-400"
        />

      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-100">

        <div className="text-center">

          <div className="text-5xl">
            💬
          </div>

          <h3 className="mt-4 font-semibold">
            Nenhuma mensagem
          </h3>

          <p className="mt-2 text-sm text-neutral-500">
            Esta conversa ainda não possui mensagens.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-100">

      <div className="mx-auto max-w-5xl px-6 py-6">

       {messages.map((message, index) => {

  const currentDate = new Date(message.created_at)
    .toDateString();

  const previousDate =
    index > 0
      ? new Date(messages[index - 1].created_at)
          .toDateString()
      : null;

  const showDate =
    currentDate !== previousDate;

  return (
    <div key={message.id}>

      {showDate && (
  <div className="my-6 flex justify-center">
    <span className="rounded-full bg-white border border-neutral-200 px-4 py-1 text-xs font-medium text-neutral-500 shadow-sm">
      {formatDate(message.created_at)}
    </span>
  </div>
)}

      <MessageBubble
        outgoing={message.direction === "outgoing"}
        text={message.message}
        status={message.status}
        time={formatMessageTime(message.created_at)}
      />

    </div>
  );

})}

        <div ref={bottomRef} />

      </div>

    </div>
  );
}