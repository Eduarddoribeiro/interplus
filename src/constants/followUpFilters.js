export const FOLLOW_UP_FILTER = {
  TODAY: "today",
  OVERDUE: "overdue",
  UPCOMING: "upcoming",
  ALL: "all",
  WAITING_LIST: "waiting_list",
};

export const FOLLOW_UP_FILTER_OPTIONS = [
  {
    value: FOLLOW_UP_FILTER.TODAY,
    label: "Hoje",
  },
  {
    value: FOLLOW_UP_FILTER.OVERDUE,
    label: "Atrasados",
  },
  {
    value: FOLLOW_UP_FILTER.UPCOMING,
    label: "Próximos",
  },
  {
    value: FOLLOW_UP_FILTER.ALL,
    label: "Todos",
  },
  {
    value: FOLLOW_UP_FILTER.WAITING_LIST,
    label: "Lista de interesse",
  },
];