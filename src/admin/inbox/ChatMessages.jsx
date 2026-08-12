export default function ChatMessages() {
  return (
    <div className="flex-1 overflow-y-auto bg-neutral-100 p-6">

      <div className="mb-4 flex">
        <div className="max-w-md rounded-2xl rounded-bl-sm bg-white p-4 shadow">
          Olá! Gostaria de saber sobre a aula experimental.
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <div className="max-w-md rounded-2xl rounded-br-sm bg-red-600 p-4 text-white shadow">
          Claro! Qual idade do atleta?
        </div>
      </div>

    </div>
  );
}