import {
  PREFERRED_SHIFT,
} from "../../../constants/preferredShift";

import {
  WAITING_LIST_REASON,
} from "../../../constants/waitingListReasons";

import {
  getWaitingListQualification,
} from "../../../helpers/waitingListRules";

export default function WaitingListDashboard({ items = [] }) {
  const qualifications = items.map(
    getWaitingListQualification,
  );

  const stats = {
    total: items.length,

    qualified: qualifications.filter(
      (qualification) => qualification.isComplete,
    ).length,

    incomplete: qualifications.filter(
      (qualification) => !qualification.isComplete,
    ).length,

    morning: items.filter(
      (item) =>
        item.preferred_shift ===
        PREFERRED_SHIFT.MORNING,
    ).length,

    evening: items.filter(
      (item) =>
        item.preferred_shift ===
        PREFERRED_SHIFT.EVENING,
    ).length,

    future: items.filter(
      (item) =>
        item.waiting_list_reason ===
        WAITING_LIST_REASON.AGE_CATEGORY,
    ).length,
  };

  const cards = [
    {
      title: "Famílias",
      value: stats.total,
      description: "Na lista de interesse",
    },
    {
      title: "Cadastros qualificados",
      value: stats.qualified,
      description: "Prontos para contato",
    },
    {
      title: "Cadastros incompletos",
      value: stats.incomplete,
      description: "Precisam de atualização",
    },
    {
      title: "Preferência manhã",
      value: stats.morning,
      description: "Nova turma",
    },
    {
      title: "Preferência noite",
      value: stats.evening,
      description: "Turno noturno",
    },
    {
      title: "Leads futuros",
      value: stats.future,
      description: "Ainda fora da idade",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="
            rounded-2xl
            border
            border-neutral-200
            bg-white
            p-5
          "
        >
          <p className="text-sm font-medium text-neutral-500">
            {card.title}
          </p>

          <p className="mt-2 text-3xl font-bold text-neutral-900">
            {card.value}
          </p>

          <p className="mt-1 text-sm text-neutral-400">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  );
}
