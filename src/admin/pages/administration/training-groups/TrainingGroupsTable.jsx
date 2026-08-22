import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";

export default function TrainingGroupsTable({
  groups,
  loading,
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
        Carregando...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">

      <table className="min-w-full">

        <thead className="border-b border-neutral-200 bg-neutral-50">

          <tr>

            <th className="px-6 py-4 text-left">
              Nome
            </th>

            <th className="px-6 py-4 text-left">
              Categoria
            </th>

            <th className="px-6 py-4 text-left">
              Modalidade
            </th>

            <th className="px-6 py-4 text-left">
              Unidade
            </th>

            <th className="px-6 py-4 text-left">
              Professor
            </th>

            <th className="px-6 py-4 text-left">
              Status
            </th>

            <th className="px-6 py-4 text-right">
              Ações
            </th>

          </tr>

        </thead>

        <tbody>

          {groups.length === 0 ? (

            <tr>

              <td
                colSpan={7}
                className="px-6 py-16 text-center text-neutral-500"
              >
                Nenhuma turma cadastrada.
              </td>

            </tr>

          ) : (

            groups.map((group) => (

              <tr
                key={group.id}
                className="border-b border-neutral-100 last:border-0"
              >

                <td className="px-6 py-5 font-medium">
                  {group.name}
                </td>

                <td className="px-6 py-5">
                  {group.category?.name}
                </td>

                <td className="px-6 py-5">
                  {group.modality?.name}
                </td>

                <td className="px-6 py-5">
                  {group.unit?.name}
                </td>

                <td className="px-6 py-5">
                  {group.coach?.name ?? "-"}
                </td>

                <td className="px-6 py-5">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      group.active
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {group.active ? "Ativa" : "Inativa"}
                  </span>

                </td>

                <td className="px-6 py-5 text-right">

                  <button
                    onClick={() =>
                      navigate(
                        `/admin/administration/training-groups/${group.id}`
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>
  );
}