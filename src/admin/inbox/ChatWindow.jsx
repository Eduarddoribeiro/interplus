import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

export default function ChatWindow() {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">

      <ChatHeader />

      <ChatMessages />

      <ChatInput />

    </section>
  );
}