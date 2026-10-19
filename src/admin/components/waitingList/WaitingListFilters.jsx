// src/admin/components/followUps/WaitingListFilters.jsx

import {
  INTEREST_QUALIFICATION,
  INTEREST_QUALIFICATION_LABELS,
} from "../../../constants/interestQualification";

import {
  PREFERRED_SHIFT,
  PREFERRED_SHIFT_LABELS,
} from "../../../constants/preferredShift";

import { WAITING_LIST_FILTER } from "../../../constants/waitingListFilters";

import {
  PREFERRED_DAY_LABELS,
  PREFERRED_DAY_OPTIONS,
} from "../../../constants/preferredDays";

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
    filters.preferredDay !== WAITING_LIST_FILTER.ALL ||
    filters.qualification !== WAITING_LIST_FILTER.ALL;

  const canClear = typeof onClear === "function";

  /* =======================================================
   * ATUALIZAÇÃO
   * =====================================================*/

  function updateFilter(key, value) {
    onChange({
      ...filters,
      [key]: value,
    });
  }

  function removeFilter(key) {
    updateFilter(key, WAITING_LIST_FILTER.ALL);
  }

  /* =======================================================
   * LABELS DOS FILTROS ATIVOS
   * =====================================================*/

  const selectedCategory = categories.find(
    (category) => String(category.id) === String(filters.categoryId),
  );

  const activeFilters = [];

  if (filters.categoryId !== WAITING_LIST_FILTER.ALL) {
    activeFilters.push({
      key: "categoryId",
      label: selectedCategory?.name || "Categoria",
    });
  }

  if (filters.preferredShift !== WAITING_LIST_FILTER.ALL) {
    activeFilters.push({
      key: "preferredShift",
      label:
        PREFERRED_SHIFT_LABELS[filters.preferredShift] ||
        filters.preferredShift,
    });
  }

  if (filters.preferredDay !== WAITING_LIST_FILTER.ALL) {
    activeFilters.push({
      key: "preferredDay",
      label: PREFERRED_DAY_LABELS[filters.preferredDay] || filters.preferredDay,
    });
  }

  if (filters.qualification !== WAITING_LIST_FILTER.ALL) {
    activeFilters.push({
      key: "qualification",
      label:
        INTEREST_QUALIFICATION_LABELS[filters.qualification] ||
        filters.qualification,
    });
  }

  /* =======================================================
   * RENDER
   * =====================================================*/

  return (
    <div>
      <h2 className="mb-2 font-semibold">Filtrar famílias</h2>

      {/* =================================================
       * FILTROS
       * =============================================== */}

      <div
        className="
          mt-5
          grid
          gap-3
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        {/* CATEGORIA */}

        <FilterField label="Categoria" id="waiting-list-category-filter">
          <select
            id="waiting-list-category-filter"
            value={filters.categoryId}
            onChange={(event) => updateFilter("categoryId", event.target.value)}
            className={selectClass}
          >
            <option value={WAITING_LIST_FILTER.ALL}>Todas as categorias</option>

            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>
        </FilterField>

        {/* TURNO */}

        <FilterField label="Turno" id="waiting-list-shift-filter">
          <select
            id="waiting-list-shift-filter"
            value={filters.preferredShift}
            onChange={(event) =>
              updateFilter("preferredShift", event.target.value)
            }
            className={selectClass}
          >
            <option value={WAITING_LIST_FILTER.ALL}>Todos os turnos</option>

            {Object.values(PREFERRED_SHIFT).map((shift) => (
              <option key={shift} value={shift}>
                {PREFERRED_SHIFT_LABELS[shift] || shift}
              </option>
            ))}
          </select>
        </FilterField>

        {/* DIA PREFERIDO */}

        <FilterField label="Dia preferido" id="waiting-list-day-filter">
          <select
            id="waiting-list-day-filter"
            value={filters.preferredDay}
            onChange={(event) =>
              updateFilter("preferredDay", event.target.value)
            }
            className={selectClass}
          >
            <option value={WAITING_LIST_FILTER.ALL}>Todos os dias</option>
            {PREFERRED_DAY_OPTIONS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </FilterField>

        {/* QUALIFICAÇÃO */}

        <FilterField
          label="Qualificação"
          id="waiting-list-qualification-filter"
        >
          <select
            id="waiting-list-qualification-filter"
            value={filters.qualification}
            onChange={(event) =>
              updateFilter("qualification", event.target.value)
            }
            className={selectClass}
          >
            <option value={WAITING_LIST_FILTER.ALL}>
              Todas as qualificações
            </option>

            {Object.values(INTEREST_QUALIFICATION).map((qualification) => (
              <option key={qualification} value={qualification}>
                {INTEREST_QUALIFICATION_LABELS[qualification] || qualification}
              </option>
            ))}
          </select>
        </FilterField>
      </div>

      {/* =================================================
       * FILTROS ATIVOS
       * =============================================== */}

      {hasActiveFilters && (
        <div
          className="
            mt-4
            flex
            flex-wrap
            items-center
            gap-2
            border-t
            border-line
            pt-4
          "
        >
          <span
            className="
              mr-1
              text-xs
              font-semibold
              text-muted
            "
          >
            Filtros ativos:
          </span>

          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => removeFilter(filter.key)}
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-alert-soft
                px-3
                py-1.5
                text-xs
                font-semibold
                text-inter-red
                transition
                hover:bg-red-100
              "
              title="Remover filtro"
            >
              {filter.label}

              <span
                className="
                  text-sm
                  leading-none
                  opacity-60
                "
              >
                ×
              </span>
            </button>
          ))}

          {canClear && (
            <button
              type="button"
              onClick={onClear}
              className="
                ml-1
                text-xs
                font-semibold
                text-muted
                underline-offset-4
                transition
                hover:text-inter-red
                hover:underline
              "
            >
              Limpar todos
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
 * CAMPO
 * =======================================================*/

function FilterField({ label, id, children }) {
  return (
    <div>
      <label
        htmlFor={id}
className="text-sm text-muted"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
 * ESTILO
 * =======================================================*/

const selectClass = `
  mt-2
  w-full
  rounded-xl
  border
  border-line
  bg-white
  px-4
  py-3
  text-sm
  font-medium
  text-ink
  outline-none
  transition
  focus:border-ink
  focus:ring-2
  focus:ring-neutral-200
`;
