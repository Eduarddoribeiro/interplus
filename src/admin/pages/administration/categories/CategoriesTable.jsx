import { Pencil, Power, Trash2 } from "lucide-react";

import CrudTable from "../components/CrudTable";
import StatusBadge from "../components/StatusBadge";

import { birthYearsOf } from "../../../../helpers/categoryAge";
import { Button } from "../../../ui";

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
        "Situação",
        "",
      ]}
      emptyMessage={
        loading
          ? "Carregando…"
          : "Nenhuma categoria cadastrada."
      }
    >
      {categories.map((category) => (
        <tr
          key={category.id}
          className="border-t border-line"
        >
          <td className="px-4 py-3 font-medium">
            {category.name}
          </td>

          <td className="px-4 py-3">
            {category.min_age != null ? (
              <>
                {birthYearsOf(category).from === birthYearsOf(category).to
                  ? `Nascidos em ${birthYearsOf(category).from}`
                  : `Nascidos em ${birthYearsOf(category).from} a ${birthYearsOf(category).to}`}
                <span className="block text-xs text-muted">
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

          <td className="px-4 py-3">
            {category.training_groups_count === 1
              ? "1 turma"
              : `${category.training_groups_count} turmas`}
          </td>

          <td className="px-4 py-3">
            <StatusBadge active={category.active} />
          </td>

          <td className="px-4 py-3">
            <div className="flex justify-end gap-1">

              <Button size="sm" variant="quiet" onClick={() => onEdit(category)}>
                <Pencil size={15} aria-hidden="true" />
                Editar
              </Button>

              <Button size="sm" variant="quiet" onClick={() => onToggle(category)}>
                <Power size={15} aria-hidden="true" />
                {category.active ? "Desativar" : "Reativar"}
              </Button>

              <Button
                size="sm"
                variant="quiet"
                onClick={() => onDelete(category)}
                className="hover:!bg-alert-soft hover:!text-alert-text"
              >
                <Trash2 size={15} aria-hidden="true" />
                Excluir
              </Button>

            </div>
          </td>

        </tr>
      ))}
    </CrudTable>
  );
}
