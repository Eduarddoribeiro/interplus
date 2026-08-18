import { useEffect, useState } from "react";

import { getInboxConversations } from "../../services/inbox";

import ConversationList from "../inbox/conversation-list/ConversationList";
import ChatWindow from "../inbox/chat/ChatWindow";
import LeadSidebar from "../inbox/sidebar/LeadSidebar";
import { socket } from "../../services/socket";

export default function Inbox() {

  console.count("RENDER Inbox");
  const [loading, setLoading] = useState(true);

  const [conversations, setConversations] = useState([]);

  const [selectedConversation, setSelectedConversation] =
    useState(null);

  useEffect(() => {
    loadInbox();

     console.log("Socket:", socket.id);
  }, []);

  useEffect(() => {
  function handleNewMessage(data) {
    console.log("📩 Atualizando inbox", data);

    setConversations((current) => {
      const index = current.findIndex(
        (c) => c.jid === data.jid
      );

      // conversa ainda não está na lista
      if (index === -1) {
        loadInbox();
        return current;
      }

      const updated = [...current];

      const conversation = {
        ...updated[index],
        lastMessage: data.message,
        lastMessageAt: data.created_at,
        unreadCount:
          (updated[index].unreadCount ?? 0) + 1,
      };

      updated.splice(index, 1);
      updated.unshift(conversation);

      return updated;
    });
  }

  socket.on("new-message", handleNewMessage);

  return () => {
    socket.off("new-message", handleNewMessage);
  };
}, []);

  async function loadInbox() {
    try {
      setLoading(true);

      const data =
        await getInboxConversations();

      setConversations(data);

      if (data.length > 0) {
        setSelectedConversation(data[0]);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-[calc(100vh-90px)]">

      <div className="grid h-full grid-cols-[340px_minmax(0,1fr)_420px] gap-6">

        <ConversationList
          loading={loading}
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={
            setSelectedConversation
          }
        />

        <ChatWindow
          conversation={selectedConversation}
        />

        <LeadSidebar
          conversation={selectedConversation}
        />

      </div>

    </div>
  );
}