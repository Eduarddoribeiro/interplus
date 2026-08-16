import { getAge } from "../../../helpers/dateHelpers";
import { formatPhone } from "../../../helpers/phoneHelpers";

export default function LeadInfo({
  conversation,
}) {
  if (!conversation) return null;

  const {
    responsibleName,
    phone,
    categoryName,
    birthDate,
    source,
  } = conversation;

  const age = getAge(birthDate);

  return (
    <section className="rounded-2xl border bg-white p-5">

      <h3 className="font-bold">
        Dados
      </h3>

      <div className="mt-5 space-y-4">

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">
            Responsável
          </span>

          <span className="font-medium text-neutral-900">
            {responsibleName ?? "-"}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">
            Telefone
          </span>

          <span className="font-medium text-neutral-900">
            {formatPhone(phone)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">
            Categoria
          </span>

          <span className="font-medium text-neutral-900">
            {categoryName ?? "-"}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">
            Idade
          </span>

          <span className="font-medium text-neutral-900">
            {age ? `${age} anos` : "-"}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">
            Origem
          </span>

          <span className="font-medium text-neutral-900">
            {source ?? "-"}
          </span>
        </div>

      </div>

    </section>
  );
}