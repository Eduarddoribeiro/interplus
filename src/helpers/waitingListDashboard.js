import { INTEREST_QUALIFICATION } from "../constants/interestQualification";
import { PREFERRED_SHIFT } from "../constants/preferredShift";
import { WAITING_LIST_REASONS } from "../constants/waitingListReasons";
import { PREFERRED_DAY_OPTIONS } from "../constants/preferredDays";
import { getWaitingListQualification } from "./waitingListRules";

/* =========================================================
 * HELPERS
 * =======================================================*/

function daysWaiting(date) {
  if (!date) return 0;

  const start = new Date(date);
  const today = new Date();

  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor((today - start) / (1000 * 60 * 60 * 24)),
  );
}

function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

/* =========================================================
 * KPIs
 * =======================================================*/

export function buildWaitingListKPIs(items = []) {
  const total = items.length;

  let qualified = 0;
  let incomplete = 0;
  let confirmation = 0;
  let waitingDaysTotal = 0;

  items.forEach((item) => {
    const qualification =
      getWaitingListQualification(item);

    if (qualification.isComplete) {
      qualified += 1;
    } else {
      incomplete += 1;
    }

    if (qualification.needsConfirmation) {
      confirmation += 1;
    }

    waitingDaysTotal += daysWaiting(
      item.waiting_list_at,
    );
  });

  return {
    total,
    qualified,
    incomplete,
    confirmation,

    averageWaitingDays:
      total === 0
        ? 0
        : Math.round(waitingDaysTotal / total),
  };
}

/* =========================================================
 * CATEGORIAS
 * =======================================================*/

export function buildCategoryDistribution(items) {
  const map = new Map();

  items.forEach((item) => {
    const category =
      item.interest_category ||
      item.category ||
      null;

    const key = category?.id
      ? String(category.id)
      : "unknown";

    const label =
      category?.name || "Não informado";

    if (!map.has(key)) {
      map.set(key, {
        key,
        label,
        value: 0,
      });
    }

    map.get(key).value += 1;
  });

  return Array.from(map.values()).sort(
    (a, b) => b.value - a.value,
  );
}

/* =========================================================
 * TURNOS
 * =======================================================*/

export function buildShiftDistribution(items) {
  const labels = {
    [PREFERRED_SHIFT.MORNING]: "Manhã",
    [PREFERRED_SHIFT.AFTERNOON]: "Tarde",
    [PREFERRED_SHIFT.EVENING]: "Noite",
    [PREFERRED_SHIFT.ANY]: "Indiferente",
    unknown: "Não informado",
  };

  const map = {};

  items.forEach((item) => {
    increment(
      map,
      item.preferred_shift || "unknown",
    );
  });

  return Object.entries(map)
    .map(([key, value]) => ({
      key,
      label: labels[key],
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

/* =========================================================
 * DIAS PREFERIDOS
 * =======================================================*/

export function buildPreferredDaysDistribution(items) {
  const labels = Object.fromEntries(
    PREFERRED_DAY_OPTIONS.map((day) => [
      day.value,
      day.label,
    ]),
  );

  const map = {};

  items.forEach((item) => {
    if (!Array.isArray(item.preferred_days)) {
      return;
    }

    item.preferred_days.forEach((day) => {
      increment(map, day);
    });
  });

  return PREFERRED_DAY_OPTIONS.map((day) => ({
    key: day.value,
    label: labels[day.value],
    value: map[day.value] || 0,
  }));
}

/* =========================================================
 * MOTIVOS
 * =======================================================*/

export function buildReasonDistribution(items) {
  const labels = Object.fromEntries(
    WAITING_LIST_REASONS.map((reason) => [
      reason.value,
      reason.label,
    ]),
  );

  const map = {};

  items.forEach((item) => {
    increment(
      map,
      item.waiting_list_reason || "unknown",
    );
  });

  return Object.entries(map)
    .map(([key, value]) => ({
      key,
      label: labels[key] || "Não informado",
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

/* =========================================================
 * FAIXAS DE ESPERA
 * =======================================================*/

export function buildWaitingTimeDistribution(items) {
  const buckets = [
    {
      key: "under30",
      label: "Até 30 dias",
      value: 0,
    },
    {
      key: "31to60",
      label: "31–60 dias",
      value: 0,
    },
    {
      key: "61to90",
      label: "61–90 dias",
      value: 0,
    },
    {
      key: "90plus",
      label: "90+ dias",
      value: 0,
    },
  ];

  items.forEach((item) => {
    const days = daysWaiting(item.waiting_list_at);

    if (days <= 30) {
      buckets[0].value++;
    } else if (days <= 60) {
      buckets[1].value++;
    } else if (days <= 90) {
      buckets[2].value++;
    } else {
      buckets[3].value++;
    }
  });

  return buckets;
}

/* =========================================================
 * INSIGHTS
 * =======================================================*/

export function buildDashboardInsights(items) {
  const shifts = buildShiftDistribution(items);
  const categories =
    buildCategoryDistribution(items);

  const insights = [];

  const biggestShift = shifts[0];

  if (biggestShift?.value >= 5) {
    insights.push(
      `${biggestShift.value} famílias demonstraram interesse no turno ${biggestShift.label.toLowerCase()}.`,
    );
  }

  const biggestCategory = categories[0];

  if (biggestCategory?.value >= 5) {
    insights.push(
      `${biggestCategory.value} famílias aguardam vaga para ${biggestCategory.label}.`,
    );
  }

  const kpis = buildWaitingListKPIs(items);

  if (kpis.incomplete > 0) {
    insights.push(
      `${kpis.incomplete} cadastros ainda precisam ser qualificados.`,
    );
  }

  if (kpis.averageWaitingDays > 60) {
    insights.push(
      "O tempo médio de espera está elevado. Vale revisar a abertura de novas turmas.",
    );
  }

  return insights;
}