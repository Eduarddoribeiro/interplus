import MessageBubble from "./MessageBubble";

const fakeMessages = [
  {
    id: 1,
    direction: "incoming",
    text: "Olá! Gostaria de saber sobre a aula experimental.",
    created_at: "09:15",
  },
  {
    id: 2,
    direction: "outgoing",
    text: "Bom dia! Claro. Qual a idade do atleta?",
    created_at: "09:17",
  },
  {
    id: 3,
    direction: "incoming",
    text: "Ele tem 9 anos.",
    created_at: "09:18",
  },
];

export default function MessageList() {
  return (
    <div
      className="
        flex-1
        overflow-y-auto
        bg-neutral-50
        px-6
        py-6
      "
    >
      <div className="space-y-4">

        {fakeMessages.map((message)=>(
          <MessageBubble
            key={message.id}
            message={message}
          />
        ))}

      </div>
    </div>
  );
}