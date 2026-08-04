// src/admin/components/followUps/WaitingListFilters.jsx

import {
  INTEREST_QUALIFICATION,
  INTEREST_QUALIFICATION_LABELS,
} from "../../../constants/interestQualification";

import {
  PREFERRED_SHIFT,
  PREFERRED_SHIFT_LABELS,
} from "../../../constants/preferredShift";

 import {
  WAITING_LIST_FILTER,
} from "../../../constants/waitingListFilters";

/* =========================================================
 * COMPONENTE
 * =======================================================*/

export default function WaitingListFilters({
  categories = [],
  filters,
  onChange,
  onClear,
}) {
  const hasActiveFilters =
    filters.categoryId !== WAITING_LIST_FILTER.ALL ||
    filters.preferredShift !== WAITING_LIST_FILTER.ALL ||
    filters.qualification !== WAITING_LIST_FILTER.ALL;

  const canClear = typeof onClear === "function";

  function updateFilter(key, value) {
    onChange({
      ...filters,
      [key]: value,
    });
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
      {/* =================================================
       * CABEÇALHO
       * =============================================== */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-neutral-900">
            Filtrar lista de interesse
          </p>

          <p className="mt-1 text-sm text-neutral-500">
            Encontre famílias por categoria,
            turno e qualificação.
          </p>
        </div>

        {hasActiveFilters && canClear && (
          <button
            type="button"
            onClick={onClear}
            className="w-fit text-sm font-semibold text-red-600 transition hover:text-red-700"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* =================================================
       * FILTROS
       * =============================================== */}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {/* CATEGORIA */}

        <div>
          <label
            htmlFor="waiting-list-category-filter"
            className="text-xs font-semibold uppercase tracking-wide text-neutral-500"
          >
            Categoria
          </label>

          <select
            id="waiting-list-category-filter"
            value={filters.categoryId}
            onChange={(event) =>
              updateFilter(
                "categoryId",
                event.target.value,
              )
            }
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-neutral-200
              bg-white
              px-4
              py-3
              text-sm
              text-neutral-800
              outline-none
              transition
              focus:border-red-500
              focus:ring-2
              focus:ring-red-100
            "
          >
            <option value={WAITING_LIST_FILTER.ALL}>
              Todas as categorias
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={String(category.id)}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* TURNO */}

        <div>
          <label
            htmlFor="waiting-list-shift-filter"
            className="text-xs font-semibold uppercase tracking-wide text-neutral-500"
          >
            Turno
          </label>

          <select
            id="waiting-list-shift-filter"
            value={filters.preferredShift}
            onChange={(event) =>
              updateFilter(
                "preferredShift",
                event.target.value,
              )
            }
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-neutral-200
              bg-white
              px-4
              py-3
              text-sm
              text-neutral-800
              outline-none
              transition
              focus:border-red-500
              focus:ring-2
              focus:ring-red-100
            "
          >
            <option value={WAITING_LIST_FILTER.ALL}>
              Todos os turnos
            </option>

            {Object.values(
              PREFERRED_SHIFT,
            ).map((shift) => (
              <option
                key={shift}
                value={shift}
              >
                {PREFERRED_SHIFT_LABELS[
                  shift
                ] || shift}
              </option>
            ))}
          </select>
        </div>

        {/* QUALIFICAÇÃO */}

        <div>
          <label
            htmlFor="waiting-list-qualification-filter"
            className="text-xs font-semibold uppercase tracking-wide text-neutral-500"
          >
            Qualificação
          </label>

          <select
            id="waiting-list-qualification-filter"
            value={filters.qualification}
            onChange={(event) =>
              updateFilter(
                "qualification",
                event.target.value,
              )
            }
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-neutral-200
              bg-white
              px-4
              py-3
              text-sm
              text-neutral-800
              outline-none
              transition
              focus:border-red-500
              focus:ring-2
              focus:ring-red-100
            "
          >
            <option value={WAITING_LIST_FILTER.ALL}>
              Todas as qualificações
            </option>

            {Object.values(
              INTEREST_QUALIFICATION,
            ).map((qualification) => (
              <option
                key={qualification}
                value={qualification}
              >
                {INTEREST_QUALIFICATION_LABELS[
                  qualification
                ] || qualification}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
