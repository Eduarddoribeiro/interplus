import { Pencil, Power, Trash2 } from "lucide-react";

import CrudTable from "../components/CrudTable";
import StatusBadge from "../components/StatusBadge";

import { birthYearsOf } from "../../../../helpers/categoryAge";

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

export default function CategoriesTable({
  categories,
  loading,
  onEdit,
  onToggle,
  onDelete,
}) {
  return (
    <CrudTable
      columns={[
        "Categoria",
        "Faixa etária",
        "Quantidade de turmas",
        "Status",
        "Ações",
      ]}
      emptyMessage={
        loading
          ? "Carregando..."
          : "Nenhuma categoria cadastrada."
      }
    >
      {categories.map((category) => (
        <tr
          key={category.id}
          className="border-b border-neutral-100 last:border-0"
        >
          <td className="px-6 py-4 font-medium">
            {category.name}
          </td>

          <td className="px-6 py-4">
            {category.min_age != null ? (
              <>
                {birthYearsOf(category).from === birthYearsOf(category).to
                  ? `Nascidos em ${birthYearsOf(category).from}`
                  : `Nascidos em ${birthYearsOf(category).from} a ${birthYearsOf(category).to}`}
                <span className="block text-xs text-neutral-400">
                  {category.min_age} a {category.max_age} anos no ano
                </span>
              </>
            ) : (
              <>
                {formatDate(category.min_birth_date)} até{" "}
                {formatDate(category.max_birth_date)}
              </>
            )}
          </td>

          <td className="px-6 py-4">
            {category.training_groups_count === 1
              ? "1 turma"
              : `${category.training_groups_count} turmas`}
          </td>

          <td className="px-6 py-4">
            <StatusBadge active={category.active} />
          </td>

          <td className="px-6 py-4">
            <div className="flex justify-end gap-2">

              <button
                onClick={() => onEdit(category)}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-100"
              >
                <Pencil size={16} />
                Editar
              </button>

              <button
                onClick={() => onToggle(category)}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-100"
              >
                <Power size={16} />
                {category.active ? "Desativar" : "Reativar"}
              </button>

              <button
                onClick={() => onDelete(category)}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
                Excluir
              </button>

            </div>
          </td>

        </tr>
      ))}
    </CrudTable>
  );
}
