import { CONTACT_STATUS_LABEL } from "../../../constants/contactStatus";

export default function LeadHeader({
  conversation,
}) {
  if (!conversation) return null;

  const {
    childName,
    responsibleName,
    status,
  } = conversation;

  const title =
    childName ??
    responsibleName ??
    "Sem nome";

  return (
    <section className="rounded-2xl border bg-white p-5">

      <h2 className="text-xl font-bold">
        {title}
      </h2>

      <p className="mt-1 text-sm text-neutral-500">
        {CONTACT_STATUS_LABEL[status] ?? status}
      </p>

    </section>
  );
}