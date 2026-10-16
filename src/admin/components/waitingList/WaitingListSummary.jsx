// src/admin/components/waitingList/WaitingListSummary.jsx

import {
  CheckCircle2,
  Clock3,
  ListChecks,
  Users,
} from "lucide-react";

import {
  getWaitingListQualification,
} from "../../../helpers/waitingListRules";

/* =========================================================
 * SUMMARY DA LISTA DE INTERESSE
 * =======================================================*/

export default function WaitingListSummary({
  items = [],
}) {
  /* =======================================================
   * ESTATÍSTICAS
   * =====================================================*/

  const total = items.length;

  const qualifications = items.map(
    getWaitingListQualification,
  );

  const qualified = qualifications.filter(
    (qualification) => qualification.isComplete,
  ).length;

  const incomplete = qualifications.filter(
    (qualification) => !qualification.isComplete,
  ).length;

  const averageWaitingDays =
    calculateAverageWaitingDays(items);

  /* =======================================================
   * CARDS
   * =====================================================*/

  const cards = [
    {
      key: "total",
      label: "Famílias",
      value: total,
      description: "na lista",
      icon: Users,
    },

    {
      key: "qualified",
      label: "Qualificados",
      value: qualified,
      description: "prontos para contato",
      icon: CheckCircle2,
    },

    {
      key: "incomplete",
      label: "Incompletos",
      value: incomplete,
      description: "precisam de dados",
      icon: ListChecks,
    },

    {
      key: "waiting",
      label: "Espera média",
      value: `${averageWaitingDays} ${
        averageWaitingDays === 1 ? "dia" : "dias"
      }`,
      description: "tempo na lista",
      icon: Clock3,
    },
  ];

  /* =======================================================
   * RENDER
   * =====================================================*/

  return (
    <div
      className="
        grid
        grid-cols-2
        gap-3
        xl:grid-cols-4
      "
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            className="
              flex
              min-w-0
              items-center
              gap-4
              rounded-2xl
              border
              border-neutral-200
              bg-white
              px-4
              py-4
              shadow-sm
            "
          >
            {/* ÍCONE */}

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-neutral-100
                text-neutral-600
              "
            >
              <Icon size={19} />
            </div>

            {/* INFORMAÇÃO */}

            <div className="min-w-0">
              <p
                className="
                  truncate
                  text-xs
                  font-semibold
                  text-neutral-500
                "
              >
                {card.label}
              </p>

              <div
                className="
                  mt-0.5
                  flex
                  flex-wrap
                  items-baseline
                  gap-x-2
                "
              >
                <span
                  className="
                    text-xl
                    font-bold
                    leading-none
                    text-neutral-900
                  "
                >
                  {card.value}
                </span>

                <span
                  className="
                    hidden
                    text-xs
                    text-neutral-400
                    2xl:inline
                  "
                >
                  {card.description}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
 * TEMPO MÉDIO NA LISTA
 * =======================================================*/

function calculateAverageWaitingDays(items) {
  if (!items.length) {
    return 0;
  }

  const now = new Date();

  const waitingTimes = items
    .map((item) => {
      const startDate =
        item.waiting_list_at ||
        item.created_at;

      if (!startDate) {
        return null;
      }

      const start = new Date(startDate);

      if (Number.isNaN(start.getTime())) {
        return null;
      }

      const difference =
        now.getTime() - start.getTime();

      const days = Math.max(
        0,
        difference / (1000 * 60 * 60 * 24),
      );

      return days;
    })
    .filter((value) => value !== null);

  if (!waitingTimes.length) {
    return 0;
  }

  const totalDays = waitingTimes.reduce(
    (sum, days) => sum + days,
    0,
  );

  return Math.round(
    totalDays / waitingTimes.length,
  );
}