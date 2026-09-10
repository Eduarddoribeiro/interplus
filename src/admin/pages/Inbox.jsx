import { useEffect, useRef, useState } from "react";

import {
  getInboxConversations,
  markConversationAsRead,
} from "../../services/inbox";

import ConversationList from "../inbox/conversation-list/ConversationList";
import ChatWindow from "../inbox/chat/ChatWindow";
import LeadSidebar from "../inbox/sidebar/LeadSidebar";

import { socket } from "../../services/socket";

export default function Inbox() {
  console.count("RENDER Inbox");

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const selectedConversationRef = useRef(null);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    loadInbox();

    console.log("Socket conectado:", socket.id);
  }, []);

  useEffect(() => {
    function handleNewMessage(data) {
      console.log("📩 Atualizando inbox", data);

      let foundConversation = false;

      setConversations((current) => {
        const index = current.findIndex(
          (conversation) => conversation.jid === data.jid
        );

        if (index === -1) {
          return current;
        }

        foundConversation = true;

        const updated = [...current];

        const conversation = {
          ...updated[index],
          lastMessage: data.message,
          lastMessageAt: data.created_at,
          unreadCount:
            selectedConversationRef.current?.jid === data.jid
              ? 0
              : (updated[index].unreadCount ?? 0) + 1,
        };

        updated.splice(index, 1);
        updated.unshift(conversation);

        return updated;
      });

      if (!foundConversation) {
        loadInbox();
      }
    }

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, []);

  async function loadInbox() {
    try {
      setLoading(true);

      const data = await getInboxConversations();

      setConversations(data);

      setSelectedConversation((current) => {
        if (current) return current;

        return data.length ? data[0] : null;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectConversation(conversation) {
    setSelectedConversation(conversation);

    if (!conversation.unreadCount) {
      return;
    }

    try {
      await markConversationAsRead(conversation.id);

      setConversations((current) =>
        current.map((c) =>
          c.id === conversation.id
            ? {
                ...c,
                unreadCount: 0,
              }
            : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="h-[calc(100vh-90px)]">
      <div className="grid h-full grid-cols-[340px_minmax(0,1fr)_420px] gap-6">
        <ConversationList
          loading={loading}
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
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