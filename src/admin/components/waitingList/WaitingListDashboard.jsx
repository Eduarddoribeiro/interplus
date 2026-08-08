import {
  buildWaitingListKPIs,
  buildCategoryDistribution,
  buildShiftDistribution,
  buildPreferredDaysDistribution,
  buildReasonDistribution,
  buildWaitingTimeDistribution,
  buildDashboardInsights,
} from "../../../helpers/waitingListDashboard";

import {
  INTEREST_QUALIFICATION,
} from "../../../constants/interestQualification";

import {
  WAITING_LIST_FILTER,
} from "../../../constants/waitingListFilters";

export default function WaitingListDashboard({
  items = [],
  filters = {},
  onFilter,
}) {
  const kpis = buildWaitingListKPIs(items);

  const categories =
    buildCategoryDistribution(items);

  const shifts =
    buildShiftDistribution(items);

  const preferredDays =
    buildPreferredDaysDistribution(items);

  const reasons =
    buildReasonDistribution(items);

  const waitingTime =
    buildWaitingTimeDistribution(items);

  const insights =
    buildDashboardInsights(items);

  const cards = [
    {
      key: "total",
      title: "Famílias",
      value: kpis.total,
      description: "Na lista de interesse",
    },
    {
      key: "qualified",
      title: "Cadastros qualificados",
      value: kpis.qualified,
      description: "Prontos para contato",
      filterType: "qualification",
      filterValue:
        INTEREST_QUALIFICATION.COMPLETE,
      active:
        filters.qualification ===
        INTEREST_QUALIFICATION.COMPLETE,
    },
    {
      key: "incomplete",
      title: "Cadastros incompletos",
      value: kpis.incomplete,
      description: "Precisam de atualização",
      filterType: "qualification",
      filterValue:
        INTEREST_QUALIFICATION.INCOMPLETE,
      active:
        filters.qualification ===
        INTEREST_QUALIFICATION.INCOMPLETE,
    },
    {
      key: "waiting",
      title: "Espera média",
      value: `${kpis.averageWaitingDays} dias`,
      description: "Tempo médio na lista",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ===================================================
          KPIs
      =================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <KpiCard
            key={card.key}
            card={card}
            onFilter={onFilter}
          />
        ))}
      </div>

      {/* ===================================================
          DISTRIBUIÇÕES
      =================================================== */}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <DistributionBlock
          title="Categorias"
          items={categories}
          filterType="category"
          activeValue={filters.categoryId}
          onFilter={onFilter}
        />

        <DistributionBlock
          title="Turnos"
          items={shifts}
          filterType="shift"
          activeValue={filters.preferredShift}
          onFilter={onFilter}
        />

        <DistributionBlock
          title="Dias preferidos"
          items={preferredDays}
          filterType="day"
          activeValue={filters.preferredDay}
          onFilter={onFilter}
          hideZero
        />

        <DistributionBlock
          title="Motivos da espera"
          items={reasons}
        />

        <DistributionBlock
          title="Tempo de espera"
          items={waitingTime}
        />

        <InsightsBlock insights={insights} />
      </div>
    </div>
  );
}

/* =========================================================
 * KPI
 * =======================================================*/

function KpiCard({
  card,
  onFilter,
}) {
  const clickable =
    Boolean(card.filterType) &&
    Boolean(onFilter);

  const Component = clickable
    ? "button"
    : "div";

  return (
    <Component
      type={clickable ? "button" : undefined}
      onClick={
        clickable
          ? () =>
              onFilter(
                card.filterType,
                card.filterValue,
              )
          : undefined
      }
      className={`
        rounded-2xl
        border
        bg-white
        p-5
        text-left
        transition
        ${
          card.active
            ? "border-inter-red ring-2 ring-red-100"
            : "border-neutral-200"
        }
        ${
          clickable
            ? "cursor-pointer hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
            : ""
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-neutral-500">
          {card.title}
        </p>

        {card.active && (
          <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-inter-red">
            Ativo
          </span>
        )}
      </div>

      <p className="mt-2 text-3xl font-bold text-neutral-900">
        {card.value}
      </p>

      <p className="mt-1 text-sm text-neutral-400">
        {card.description}
      </p>
    </Component>
  );
}

/* =========================================================
 * DISTRIBUIÇÃO
 * =======================================================*/

function DistributionBlock({
  title,
  items = [],
  filterType = null,
  activeValue = WAITING_LIST_FILTER.ALL,
  onFilter,
  hideZero = false,
}) {
  const visibleItems = hideZero
    ? items.filter((item) => item.value > 0)
    : items;

  const maxValue = Math.max(
    ...visibleItems.map(
      (item) => item.value,
    ),
    1,
  );

  const clickable =
    Boolean(filterType) &&
    Boolean(onFilter);

  return (
    <section
      className="
        rounded-2xl
        border
        border-neutral-200
        bg-white
        p-5
      "
    >
      <div className="mb-5">
        <h3 className="font-bold text-neutral-900">
          {title}
        </h3>

        {clickable && (
          <p className="mt-1 text-xs text-neutral-400">
            Clique para filtrar a lista
          </p>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <p className="text-sm text-neutral-400">
          Nenhum dado disponível.
        </p>
      ) : (
        <div className="space-y-2">
          {visibleItems.map((item) => {
            const percentage =
              (item.value / maxValue) * 100;

            const active =
              String(activeValue) ===
              String(item.key);

            const Component = clickable
              ? "button"
              : "div";

            return (
              <Component
                key={item.key || item.label}
                type={
                  clickable
                    ? "button"
                    : undefined
                }
                onClick={
                  clickable
                    ? () =>
                        onFilter(
                          filterType,
                          item.key,
                        )
                    : undefined
                }
                className={`
                  w-full
                  rounded-xl
                  p-2
                  text-left
                  transition
                  ${
                    active
                      ? "bg-red-50 ring-1 ring-red-100"
                      : ""
                  }
                  ${
                    clickable
                      ? "cursor-pointer hover:bg-neutral-50"
                      : ""
                  }
                `}
              >
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={`
                      truncate
                      text-sm
                      font-medium
                      ${
                        active
                          ? "text-inter-red"
                          : "text-neutral-600"
                      }
                    `}
                  >
                    {item.label}
                  </span>

                  <span
                    className={`
                      shrink-0
                      text-sm
                      font-bold
                      ${
                        active
                          ? "text-inter-red"
                          : "text-neutral-900"
                      }
                    `}
                  >
                    {item.value}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={`
                      h-full
                      rounded-full
                      transition-all
                      ${
                        active
                          ? "bg-inter-red"
                          : "bg-neutral-800"
                      }
                    `}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </Component>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* =========================================================
 * INSIGHTS
 * =======================================================*/

function InsightsBlock({
  insights = [],
}) {
  return (
    <section
      className="
        rounded-2xl
        border
        border-neutral-200
        bg-neutral-900
        p-5
        text-white
      "
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
          Inteligência comercial
        </p>

        <h3 className="mt-1 text-lg font-bold">
          Insights da lista
        </h3>
      </div>

      {insights.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-neutral-400">
          Ainda não existem dados suficientes
          para gerar insights.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {insights.map(
            (insight, index) => (
              <div
                key={`${index}-${insight}`}
                className="
                  rounded-xl
                  bg-white/5
                  px-4
                  py-3
                "
              >
                <p className="text-sm leading-6 text-neutral-200">
                  {insight}
                </p>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}