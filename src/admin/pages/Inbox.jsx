import ConversationList from "../inbox/ConversationList";
import ChatWindow from "../inbox/ChatWindow";
import LeadPanel from "../inbox/LeadPanel";

export default function Inbox() {
  return (
    <div className="h-[calc(100vh-90px)]">
      <div className="grid h-full grid-cols-[340px_minmax(0,1fr)_420px] gap-6">

        <ConversationList />

        <ChatWindow />

        <LeadPanel />

      </div>
    </div>
  );
}