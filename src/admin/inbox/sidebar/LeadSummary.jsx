import { formatMessageDate } from "../../../helpers/chatHelpers";

export default function LeadHistory({
  conversation,
}) {
  if (!conversation) return null;

  const {
    source,
    lastMessageAt,
  } = conversation;

  return (
    <section className="rounded-2xl border bg-white p-5">

      <h3 className="font-bold">
        Histórico
      </h3>

      <div className="mt-4 space-y-3 text-sm text-neutral-600">

        <p>
          <strong>Origem:</strong>{" "}
          {source ?? "-"}
        </p>

        <p>
          <strong>Última interação:</strong>{" "}
          {lastMessageAt
            ? formatMessageDate(lastMessageAt)
            : "-"}
        </p>

      </div>

    </section>
  );
}