import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";

import TrainingGroupStatusBadge from "../components/TrainingGroupStatusBadge";
import { getTrainingGroupCategoryNames } from "../../../../services/administration/trainingGroups";

export default function TrainingGroupsTable({
  groups,
  loading,
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="rounded-xl border border-line bg-white p-12 text-center">
        Carregando...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">

      <table className="min-w-full">

        <thead className="border-b border-line bg-canvas">

          <tr>

            <th className="px-6 py-4 text-left">
              Nome
            </th>

            <th className="px-6 py-4 text-left">
              Categorias
            </th>

            <th className="px-6 py-4 text-left">
              Modalidade
            </th>

            <th className="px-6 py-4 text-left">
              Local
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
                colSpan={6}
                className="px-6 py-16 text-center text-muted"
              >
                Nenhuma turma cadastrada.
              </td>

            </tr>

          ) : (

            groups.map((group) => (

              <tr
                key={group.id}
                className="border-b border-line last:border-0"
              >

                <td className="px-6 py-5 font-medium">
                  {group.name}
                </td>

                <td className="px-6 py-5">
                  {getTrainingGroupCategoryNames(group)}
                </td>

                <td className="px-6 py-5">
                  {group.modality?.name}
                </td>

                <td className="px-6 py-5">
                  {group.location?.name ?? "-"}
                  {group.unit?.name && (
                    <span className="block text-xs text-muted">
                      {group.unit.name}
                    </span>
                  )}
                </td>


                <td className="px-6 py-5">

                  <div className="flex flex-wrap items-center gap-2">
                    <TrainingGroupStatusBadge status={group.status} />
                    {group.featured && (
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-ink">
                        Destaque
                      </span>
                    )}
                  </div>

                </td>

                <td className="px-6 py-5 text-right">

                  <button
                    onClick={() =>
                      navigate(
                        `/admin/administration/training-groups/${group.id}`
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-canvas"
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