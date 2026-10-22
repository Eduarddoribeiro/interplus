import { Link } from "react-router-dom";

import CrudTable from "../components/CrudTable";
import TrainingGroupStatusBadge from "../components/TrainingGroupStatusBadge";
import { getTrainingGroupCategoryNames } from "../../../../services/administration/trainingGroups";

const COLUMNS = ["Turma", "Categorias", "Modalidade", "Local", "Situação"];

export default function TrainingGroupsTable({ groups, loading, emptyMessage = "Nenhuma turma cadastrada." }) {
  if (loading) {
    return (
      <p className="rounded-xl border border-line bg-white p-12 text-center text-sm text-muted">
        Carregando turmas…
      </p>
    );
  }

  return (
    <CrudTable columns={COLUMNS} emptyMessage={emptyMessage}>
      {groups.length
        ? groups.map((group) => (
            <tr key={group.id} className="border-t border-line hover:bg-canvas">
              <td className="px-4 py-3">
                <Link
                  to={`/admin/administration/training-groups/${group.id}`}
                  className="font-semibold text-ink underline-offset-4 hover:underline"
                >
                  {group.name}
                </Link>
              </td>

              <td className="px-4 py-3">{getTrainingGroupCategoryNames(group)}</td>

              <td className="px-4 py-3">{group.modality?.name ?? "—"}</td>

              <td className="px-4 py-3">
                {group.location?.name ?? "—"}
                {group.unit?.name && <span className="block text-muted">{group.unit.name}</span>}
              </td>

              <td className="whitespace-nowrap px-4 py-3">
                <TrainingGroupStatusBadge status={group.status} />
                {group.featured && <span className="text-muted">, destaque</span>}
              </td>
            </tr>
          ))
        : null}
    </CrudTable>
  );
}
