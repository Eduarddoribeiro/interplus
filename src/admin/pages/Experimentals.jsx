import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  CircleCheckBig,
  Clock3,
  MessageCircle,
  UserCheck,
  UserX,
  RefreshCw,
  History,
  CalendarRange,
  GraduationCap,
  PhoneCall,
  XCircle,
  X,
  CalendarPlus,
  CalendarClock,
  ArchiveX,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Users,
  Pencil,
  Save,
  Check,
  MapPin,
} from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import TrialSlotPicker from "../components/experimentals/TrialSlotPicker";
import { WEEKDAY_LABELS } from "../../constants/weekdays";

import {
  getExperimentals,
  updateExperimentalSessionStatus,
  updateExperimentalCoachNotes,
  saveExperimentalResult,
  rescheduleExperimental,
  scheduleFollowUp,
  closeNoShowOpportunity,
} from "../../services/contacts";

/*
 * =========================================================
 * CONSTANTES
 * =========================================================
 */

const FILTERS = [
  { value: "week", label: "Semana" },
  { value: "today", label: "Hoje" },
  { value: "future", label: "Todos futuros" },
  { value: "history", label: "Histórico" },
];

const LOST_REASONS = [
  {
    value: "price",
    label: "Valor",
  },
  {
    value: "schedule",
    label: "Horário incompatível",
  },
  {
    value: "distance",
    label: "Distância / deslocamento",
  },
  {
    value: "other_school",
    label: "Escolheu outra escola",
  },
  {
    value: "child_not_interested",
    label: "Criança não quis continuar",
  },
  {
    value: "no_response",
    label: "Família não respondeu",
  },
  {
    value: "no_interest",
    label: "Não tem mais interesse",
  },
  {
    value: "other",
    label: "Outro",
  },
];

/*
 * =========================================================
 * PÁGINA
 * =========================================================
 */

export default function Experimentals() {
  const [experimentals, setExperimentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [activeFilter, setActiveFilter] = useState("week");
  const [weekAnchor, setWeekAnchor] = useState(getTodayISO());

  /*
   * MODAIS
   */

  const [resultSession, setResultSession] = useState(null);

  const [rescheduleSession, setRescheduleSession] =
    useState(null);

  const [followUpSession, setFollowUpSession] =
    useState(null);

  const [
    closeOpportunitySession,
    setCloseOpportunitySession,
  ] = useState(null);

  const [coachListOpen, setCoachListOpen] =
    useState(false);

  /*
   * SALVAMENTOS
   */

  const [savingResult, setSavingResult] =
    useState(false);

  const [savingReschedule, setSavingReschedule] =
    useState(false);

  const [savingFollowUp, setSavingFollowUp] =
    useState(false);

  const [
    savingCloseOpportunity,
    setSavingCloseOpportunity,
  ] = useState(false);

  /*
   * LOCAL (Krahe, Biguá...)
   */

  const [locationFilter, setLocationFilter] =
    useState("all");

  const locationOptions = useMemo(() => {
    const map = new Map();

    experimentals.forEach((item) => {
      const location = getSessionLocation(item);

      if (location) {
        map.set(String(location.id), location.name);
      }
    });

    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [experimentals]);

  const scopedExperimentals = useMemo(() => {
    if (locationFilter === "all") {
      return experimentals;
    }

    return experimentals.filter((item) => {
      const location = getSessionLocation(item);

      return locationFilter === "none"
        ? !location
        : String(location?.id) === locationFilter;
    });
  }, [experimentals, locationFilter]);

  const today = getTodayISO();
  const tomorrow = addDaysISO(today, 1);

  const weekStart = useMemo(
    () => getMondayISO(weekAnchor),
    [weekAnchor]
  );

  const weekEnd = useMemo(
    () => addDaysISO(weekStart, 6),
    [weekStart]
  );

  const weekDays = useMemo(
    () =>
      Array.from(
        { length: 7 },
        (_, index) =>
          addDaysISO(weekStart, index)
      ),
    [weekStart]
  );

  useEffect(() => {
    loadExperimentals();
  }, []);

  /*
   * =======================================================
   * CARREGAMENTO
   * =======================================================
   */

  async function loadExperimentals() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getExperimentals();

      setExperimentals(data || []);
    } catch (err) {
      console.error(
        "Erro ao carregar experimentais:",
        err
      );

      setError(
        err?.message ||
          "Não foi possível carregar as aulas experimentais."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =======================================================
   * STATUS DA SESSÃO
   * =======================================================
   */

  async function handleStatusChange(
    sessionId,
    newStatus
  ) {
    try {
      setUpdatingId(sessionId);

      const updated =
        await updateExperimentalSessionStatus(
          sessionId,
          newStatus
        );

      setExperimentals((current) =>
        current.map((item) =>
          item.id === sessionId
            ? updated
            : item
        )
      );
    } catch (err) {
      console.error(
        "ERRO AO ATUALIZAR EXPERIMENTAL:",
        err
      );

      alert(
        err?.message ||
          "Não foi possível atualizar a experimental."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /*
   * =======================================================
   * OBSERVAÇÃO PARA PROFESSORES
   * =======================================================
   */

  async function handleSaveCoachNotes(
    sessionId,
    coachNotes
  ) {
    try {
      const updated =
        await updateExperimentalCoachNotes(
          sessionId,
          coachNotes
        );

      setExperimentals((current) =>
        current.map((item) =>
          item.id === sessionId
            ? updated
            : item
        )
      );

      return updated;
    } catch (err) {
      console.error(
        "ERRO AO SALVAR OBSERVAÇÃO DOS PROFESSORES:",
        err
      );

      throw err;
    }
  }

  /*
   * =======================================================
   * RESULTADO COMERCIAL
   * =======================================================
   */

  async function handleExperimentalResult({
    result,
    followUpDate,
    notes,
    lostReason,
  }) {
    if (!resultSession?.contact?.id) {
      return;
    }

    try {
      setSavingResult(true);

      await saveExperimentalResult(
        resultSession.contact.id,
        {
          result,
          followUpDate,
          notes,
          lostReason,
        }
      );

      await loadExperimentals();

      setResultSession(null);
    } catch (err) {
      console.error(
        "ERRO AO SALVAR RESULTADO:",
        err
      );

      alert(
        err?.message ||
          "Não foi possível salvar o resultado da experimental."
      );
    } finally {
      setSavingResult(false);
    }
  }

  /*
   * =======================================================
   * REAGENDAMENTO
   * =======================================================
   */

  async function handleReschedule({
    slot,
    notes,
    coachNotes,
  }) {
    if (
      !rescheduleSession?.contact?.id ||
      !rescheduleSession?.category?.id
    ) {
      return;
    }

    try {
      setSavingReschedule(true);

      await rescheduleExperimental(
        rescheduleSession.contact.id,
        {
          categoryId:
            rescheduleSession.category.id,

          trainingGroupScheduleId:
            slot.scheduleId,

          experimentalDate: slot.date,
          notes,
          coachNotes,
        }
      );

      await loadExperimentals();

      setRescheduleSession(null);
    } catch (err) {
      console.error(
        "ERRO AO REAGENDAR:",
        err
      );

      alert(
        err?.message ||
          "Não foi possível reagendar a experimental."
      );
    } finally {
      setSavingReschedule(false);
    }
  }

  /*
   * =======================================================
   * RETORNO APÓS FALTA
   * =======================================================
   */

  async function handleNoShowFollowUp({
    followUpDate,
    notes,
  }) {
    if (!followUpSession?.contact?.id) {
      return;
    }

    try {
      setSavingFollowUp(true);

      await scheduleFollowUp(
        followUpSession.contact.id,
        followUpDate,
        notes
      );

      await loadExperimentals();

      setFollowUpSession(null);
    } catch (err) {
      console.error(
        "ERRO AO PROGRAMAR RETORNO:",
        err
      );

      alert(
        err?.message ||
          "Não foi possível programar o retorno."
      );
    } finally {
      setSavingFollowUp(false);
    }
  }

  /*
   * =======================================================
   * ENCERRAMENTO APÓS FALTA
   * =======================================================
   */

  async function handleCloseNoShowOpportunity({
    lostReason,
    notes,
  }) {
    if (
      !closeOpportunitySession?.contact?.id
    ) {
      return;
    }

    try {
      setSavingCloseOpportunity(true);

      await closeNoShowOpportunity(
        closeOpportunitySession.contact.id,
        {
          lostReason,
          notes,
        }
      );

      await loadExperimentals();

      setCloseOpportunitySession(null);
    } catch (err) {
      console.error(
        "ERRO AO ENCERRAR OPORTUNIDADE:",
        err
      );

      alert(
        err?.message ||
          "Não foi possível encerrar a oportunidade."
      );
    } finally {
      setSavingCloseOpportunity(false);
    }
  }

  /*
   * =======================================================
   * INDICADORES
   * =======================================================
   */

  const stats = useMemo(() => {
    const todayItems =
      scopedExperimentals.filter(
        (item) =>
          item.experimental_date === today
      );

    const weekItems =
      scopedExperimentals.filter(
        (item) =>
          item.experimental_date >=
            weekStart &&
          item.experimental_date <= weekEnd
      );

    const pending =
      weekItems.filter(
        (item) =>
          item.status ===
          "pending_confirmation"
      ).length;

    const completed =
      weekItems.filter((item) =>
        ["attended", "no_show"].includes(
          item.status
        )
      );

    const attended =
      completed.filter(
        (item) =>
          item.status === "attended"
      ).length;

    const attendanceRate =
      completed.length
        ? Math.round(
            (attended /
              completed.length) *
              100
          )
        : 0;

    return {
      today: todayItems.length,
      week: weekItems.length,
      pending,
      attendanceRate,
    };
  }, [
    scopedExperimentals,
    today,
    weekStart,
    weekEnd,
  ]);

  /*
   * =======================================================
   * RESUMO SEMANAL
   * =======================================================
   */

  const weekSummary = useMemo(() => {
    return weekDays.map((date) => {
      const items =
        scopedExperimentals.filter(
          (item) =>
            item.experimental_date === date
        );

      const categories =
        items.reduce((acc, item) => {
          const name =
            item.category?.name ||
            "Sem categoria";

          acc[name] =
            (acc[name] || 0) + 1;

          return acc;
        }, {});

      return {
        date,
        total: items.length,

        confirmed:
          items.filter(
            (item) =>
              item.status === "confirmed"
          ).length,

        pending:
          items.filter(
            (item) =>
              item.status ===
              "pending_confirmation"
          ).length,

        attended:
          items.filter(
            (item) =>
              item.status === "attended"
          ).length,

        noShow:
          items.filter(
            (item) =>
              item.status === "no_show"
          ).length,

        categories,
      };
    });
  }, [scopedExperimentals, weekDays]);

  function goToPreviousWeek() {
    setWeekAnchor(
      addDaysISO(weekStart, -7)
    );

    setActiveFilter("week");
  }

  function goToNextWeek() {
    setWeekAnchor(
      addDaysISO(weekStart, 7)
    );

    setActiveFilter("week");
  }

  function goToCurrentWeek() {
    setWeekAnchor(today);
    setActiveFilter("week");
  }

  function openDay(date) {
    setWeekAnchor(date);

    setActiveFilter(
      date === today
        ? "today"
        : `day:${date}`
    );
  }

  /*
   * =======================================================
   * FILTROS
   * =======================================================
   */

  const filteredExperimentals =
    useMemo(() => {
      let result = [];

      if (
        activeFilter.startsWith("day:")
      ) {
        const selectedDate =
          activeFilter.replace(
            "day:",
            ""
          );

        result =
          scopedExperimentals.filter(
            (item) =>
              item.experimental_date ===
              selectedDate
          );
      } else {
        switch (activeFilter) {
          case "today":
            result =
              scopedExperimentals.filter(
                (item) =>
                  item.experimental_date ===
                  today
              );
            break;

          case "week":
            result =
              scopedExperimentals.filter(
                (item) =>
                  item.experimental_date >=
                    weekStart &&
                  item.experimental_date <=
                    weekEnd
              );
            break;

          case "future":
            result =
              scopedExperimentals.filter(
                (item) =>
                  item.experimental_date >=
                  today
              );
            break;

          case "history":
            result =
              scopedExperimentals.filter(
                (item) =>
                  item.experimental_date <
                  today
              );
            break;

          default:
            result = scopedExperimentals;
        }
      }

      return [...result].sort(
        (a, b) => {
          const dateA =
            `${a.experimental_date}T${
              a.experimental_time ||
              "00:00:00"
            }`;

          const dateB =
            `${b.experimental_date}T${
              b.experimental_time ||
              "00:00:00"
            }`;

          return activeFilter ===
            "history"
            ? dateB.localeCompare(dateA)
            : dateA.localeCompare(dateB);
        }
      );
    }, [
      scopedExperimentals,
      activeFilter,
      today,
      weekStart,
      weekEnd,
    ]);

  /*
   * =======================================================
   * AGRUPAMENTO
   * =======================================================
   */

  const groupedExperimentals =
    useMemo(() => {
      return filteredExperimentals.reduce(
        (groups, item) => {
          const date =
            item.experimental_date;

          if (!groups[date]) {
            groups[date] = [];
          }

          groups[date].push(item);

          return groups;
        },
        {}
      );
    }, [filteredExperimentals]);

  const groupedDates =
    Object.keys(groupedExperimentals);

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Experimentais"
        description="Acompanhe confirmações, presença, reagendamentos e resultados das aulas experimentais."
      />

      {/* INDICADORES */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
        <StatCard
          title="Hoje"
          value={stats.today}
          icon={CalendarDays}
          subtitle="Experimentais na agenda"
        />

        <StatCard
          title="Nesta semana"
          value={stats.week}
          icon={CalendarRange}
          subtitle={`${formatShortDate(
            weekStart
          )} a ${formatShortDate(
            weekEnd
          )}`}
        />

        <StatCard
          title="A confirmar"
          value={stats.pending}
          icon={Clock3}
          subtitle="Nesta semana"
        />

        <StatCard
          title="Comparecimento"
          value={`${stats.attendanceRate}%`}
          icon={CircleCheckBig}
          subtitle="Das aulas já realizadas"
        />
      </div>

      {/* CABEÇALHO */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">
            Agenda de experimentais
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Cada card representa uma
            tentativa de aula experimental.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              setCoachListOpen(true)
            }
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-neutral-900
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-neutral-800
            "
          >
            <Users size={17} />
            Lista dos professores
          </button>

          <button
            type="button"
            onClick={loadExperimentals}
            disabled={loading}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-neutral-200
              bg-white
              px-4
              py-3
              text-sm
              font-semibold
              text-neutral-700
              transition
              hover:bg-neutral-50
              disabled:opacity-50
            "
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Atualizar
          </button>
        </div>
      </div>

      {/* VISÃO SEMANAL */}

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
              Visão semanal
            </p>

            <h3 className="mt-1 text-lg font-bold text-neutral-900">
              {formatWeekRange(
                weekStart,
                weekEnd
              )}
            </h3>

            <p className="mt-1 text-sm text-neutral-500">
              Clique em um dia para abrir
              as experimentais.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousWeek}
              className="rounded-xl border border-neutral-200 p-2.5 hover:bg-neutral-50"
              aria-label="Semana anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={goToCurrentWeek}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50"
            >
              Semana atual
            </button>

            <button
              type="button"
              onClick={goToNextWeek}
              className="rounded-xl border border-neutral-200 p-2.5 hover:bg-neutral-50"
              aria-label="Próxima semana"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {weekSummary.map((day) => (
            <WeekDayCard
              key={day.date}
              day={day}
              today={today}
              active={
                activeFilter ===
                  `day:${day.date}` ||
                (activeFilter ===
                  "today" &&
                  day.date === today)
              }
              onClick={() =>
                openDay(day.date)
              }
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-neutral-100 pt-4 text-xs text-neutral-500">
          <span>
            <strong className="text-neutral-900">
              {stats.week}
            </strong>{" "}
            experimentais
          </span>

          <span>
            <strong className="text-amber-700">
              {stats.pending}
            </strong>{" "}
            a confirmar
          </span>

          <span>
            Comparecimento:{" "}
            <strong className="text-green-700">
              {stats.attendanceRate}%
            </strong>
          </span>
        </div>
      </div>

      {/* FILTROS */}

      <div className="flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-white p-3">
        {FILTERS.map((filter) => {
          const active =
            activeFilter ===
            filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() =>
                setActiveFilter(
                  filter.value
                )
              }
              className={`
                rounded-xl
                px-4
                py-2.5
                text-sm
                font-semibold
                transition
                ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }
              `}
            >
              {filter.value ===
                "history" && (
                <History
                  size={15}
                  className="mr-2 inline"
                />
              )}

              {filter.label}
            </button>
          );
        })}

        {locationOptions.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-2 sm:ml-auto sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
            {[
              { id: "all", name: "Todos os locais" },
              ...locationOptions,
            ].map((location) => {
              const active =
                locationFilter === location.id;

              return (
                <button
                  key={location.id}
                  type="button"
                  onClick={() =>
                    setLocationFilter(location.id)
                  }
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-red-600 text-white"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {location.id !== "all" && (
                    <MapPin size={15} />
                  )}
                  {location.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* LOADING */}

      {loading && (
        <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-red-600" />

          <p className="mt-4 text-sm text-neutral-500">
            Carregando experimentais...
          </p>
        </div>
      )}

      {/* ERRO */}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={loadExperimentals}
            className="mt-3 text-sm font-semibold text-red-700 underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* VAZIO */}

      {!loading &&
        !error &&
        filteredExperimentals.length ===
          0 && (
          <EmptyState
            filter={activeFilter}
          />
        )}

      {/* AGENDA */}

      {!loading &&
        !error &&
        filteredExperimentals.length >
          0 && (
          <div className="space-y-10">
            {groupedDates.map(
              (date) => {
                const items =
                  groupedExperimentals[
                    date
                  ];

                return (
                  <section key={date}>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
                          {getDateRelativeLabel(
                            date,
                            today,
                            tomorrow
                          )}
                        </p>

                        <h3 className="mt-1 text-xl font-bold text-neutral-900">
                          {formatFullDate(
                            date
                          )}
                        </h3>
                      </div>

                      <p className="text-sm font-medium text-neutral-500">
                        {items.length}{" "}
                        {items.length ===
                        1
                          ? "experimental"
                          : "experimentais"}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {sortByLocation(items).map(
                        (item, index, sorted) => (
                          <div key={item.id} className="space-y-4">
                          {getLocationName(item) !==
                            getLocationName(sorted[index - 1]) && (
                            <p className="flex items-center gap-1.5 pt-2 text-sm font-bold text-neutral-700">
                              <MapPin
                                size={15}
                                className="text-red-600"
                              />
                              {getLocationName(item)}
                            </p>
                          )}

                          <ExperimentalCard
                            key={item.id}
                            item={item}
                            today={today}
                            updating={
                              updatingId ===
                              item.id
                            }
                            onStatusChange={
                              handleStatusChange
                            }
                            onSaveCoachNotes={
                              handleSaveCoachNotes
                            }
                            onOpenResult={() =>
                              setResultSession(
                                item
                              )
                            }
                            onReschedule={() =>
                              setRescheduleSession(
                                item
                              )
                            }
                            onScheduleFollowUp={() =>
                              setFollowUpSession(
                                item
                              )
                            }
                            onCloseOpportunity={() =>
                              setCloseOpportunitySession(
                                item
                              )
                            }
                          />
                          </div>
                        )
                      )}
                    </div>
                  </section>
                );
              }
            )}
          </div>
        )}

      {/* LISTA PROFESSORES */}

      {coachListOpen && (
        <CoachListModal
          experimentals={
            scopedExperimentals
          }
          initialDate={today}
          onClose={() =>
            setCoachListOpen(false)
          }
        />
      )}

      {/* RESULTADO */}

      {resultSession && (
        <ExperimentalResultModal
          session={resultSession}
          saving={savingResult}
          onClose={() => {
            if (!savingResult) {
              setResultSession(null);
            }
          }}
          onSave={
            handleExperimentalResult
          }
        />
      )}

      {/* REAGENDAMENTO */}

      {rescheduleSession && (
        <RescheduleExperimentalModal
          session={rescheduleSession}
          saving={savingReschedule}
          onClose={() => {
            if (!savingReschedule) {
              setRescheduleSession(
                null
              );
            }
          }}
          onSave={handleReschedule}
        />
      )}

      {/* RETORNO */}

      {followUpSession && (
        <NoShowFollowUpModal
          session={followUpSession}
          saving={savingFollowUp}
          onClose={() => {
            if (!savingFollowUp) {
              setFollowUpSession(null);
            }
          }}
          onSave={handleNoShowFollowUp}
        />
      )}

      {/* ENCERRAMENTO */}

      {closeOpportunitySession && (
        <CloseNoShowOpportunityModal
          session={
            closeOpportunitySession
          }
          saving={
            savingCloseOpportunity
          }
          onClose={() => {
            if (
              !savingCloseOpportunity
            ) {
              setCloseOpportunitySession(
                null
              );
            }
          }}
          onSave={
            handleCloseNoShowOpportunity
          }
        />
      )}
    </div>
  );
}

/*
 * =========================================================
 * CARD DA EXPERIMENTAL
 * =========================================================
 */

function ExperimentalCard({
  item,
  today,
  updating,
  onStatusChange,
  onSaveCoachNotes,
  onOpenResult,
  onReschedule,
  onScheduleFollowUp,
  onCloseOpportunity,
}) {
const contact = item.contact || {};

const isPending =
  item.status === "pending_confirmation";

const isConfirmed =
  item.status === "confirmed";

const isAttended =
  item.status === "attended";

const isNoShow =
  item.status === "no_show";

const isCancelled =
  item.status === "cancelled";

const isReschedule =
  isPending || isConfirmed;

  const canRegisterAttendance =
    item.experimental_date <= today;

  const whatsappUrl =
    createWhatsAppUrl(contact.phone);

  const displayTime =
    item.experimental_time ||
    item.schedule?.start_time;

  const trainingGroup =
    item.schedule?.training_group;

  const commercialResult =
    contact.experimental_result;

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-md">
      <div className="p-5 sm:p-6">
        {/* TOPO */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {displayTime && (
                <span className="text-lg font-bold text-red-600">
                  {formatTime(
                    displayTime
                  )}
                </span>
              )}

              {displayTime &&
                item.category?.name && (
                  <span className="text-neutral-300">
                    •
                  </span>
                )}

              {item.category?.name && (
                <span className="text-sm font-semibold text-neutral-600">
                  {item.category.name}
                </span>
              )}
            </div>

            <h3 className="mt-3 break-words text-xl font-bold text-neutral-900">
              {contact.child_name ||
                "Aluno não informado"}
            </h3>

            <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
              <MapPin size={14} />
              {trainingGroup
                ? `${trainingGroup.location?.name ?? "Sem local"} · ${trainingGroup.name}`
                : "Sem turma definida (agendamento antigo)"}
            </p>
          </div>

          <SessionStatusBadge
            status={item.status}
          />
        </div>

        {/* DADOS */}

        <div className="mt-6 grid gap-5 border-t border-neutral-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Info
            label="Responsável"
            value={
              contact.responsible_name
            }
          />

          <Info
            label="WhatsApp"
            value={contact.phone}
          />

          <Info
            label="Origem"
            value={contact.source}
          />

          <Info
            label="Bairro"
            value={
              contact.neighborhood
            }
          />
        </div>

        {/* PROFESSORES */}

        <CoachNotesEditor
          sessionId={item.id}
          initialValue={
            item.coach_notes || ""
          }
          onSave={
            onSaveCoachNotes
          }
        />

        {/* AÇÕES */}

        <div className="mt-6 flex flex-col gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:flex-wrap">
          {whatsappUrl &&
            !isNoShow && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 sm:w-auto"
              >
                <MessageCircle
                  size={17}
                />
                WhatsApp
              </a>
            )}

            {isReschedule && (
  <button
    type="button"
    onClick={onReschedule}
    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 sm:w-auto"
  >
    <CalendarPlus size={17} />
    Remarcar experimental
  </button>
)}

          {isPending && (
            <button
              type="button"
              disabled={updating}
              onClick={() =>
                onStatusChange(
                  item.id,
                  "confirmed"
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 sm:w-auto"
            >
              <CircleCheckBig
                size={17}
              />

              {updating
                ? "Salvando..."
                : "Confirmar aula"}
            </button>
          )}

          {isConfirmed &&
            canRegisterAttendance && (
              <>
                <button
                  type="button"
                  disabled={updating}
                  onClick={() =>
                    onStatusChange(
                      item.id,
                      "attended"
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 sm:w-auto"
                >
                  <UserCheck
                    size={17}
                  />
                  Compareceu
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={() =>
                    onStatusChange(
                      item.id,
                      "no_show"
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 sm:w-auto"
                >
                  <UserX size={17} />
                  Não compareceu
                </button>
              </>
            )}

          {isConfirmed &&
            !canRegisterAttendance && (
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <CircleCheckBig
                  size={17}
                />
                Aula confirmada. Presença
                disponível no dia da aula.
              </div>
            )}

          {isAttended && (
            <AttendedActions
              commercialResult={
                commercialResult
              }
              contact={contact}
              onOpenResult={
                onOpenResult
              }
            />
          )}

          {isNoShow && (
            <NoShowActions
              contact={contact}
              whatsappUrl={
                whatsappUrl
              }
              onReschedule={
                onReschedule
              }
              onScheduleFollowUp={
                onScheduleFollowUp
              }
              onCloseOpportunity={
                onCloseOpportunity
              }
              
            />
          )}

          {isCancelled && (
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
              <XCircle size={17} />
              Experimental cancelada.
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/*
 * =========================================================
 * OBSERVAÇÃO PARA PROFESSORES
 * =========================================================
 */

function CoachNotesEditor({
  sessionId,
  initialValue,
  onSave,
}) {
  const [editing, setEditing] =
    useState(false);

  const [value, setValue] =
    useState(initialValue || "");

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    if (!editing) {
      setValue(initialValue || "");
    }
  }, [initialValue, editing]);

  async function handleSave() {
    try {
      setSaving(true);
      setSaved(false);

      await onSave(
        sessionId,
        value
      );

      setEditing(false);
      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (err) {
      alert(
        err?.message ||
          "Não foi possível salvar a observação."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users
              size={17}
              className="text-blue-700"
            />

            <p className="text-sm font-bold text-neutral-900">
              Observação para professores
            </p>
          </div>

          <p className="mt-1 text-xs text-neutral-500">
            Apenas informações esportivas
            ou operacionais que podem ser
            compartilhadas com a comissão.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={() =>
              setEditing(true)
            }
            className="flex shrink-0 items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            <Pencil size={14} />
            {initialValue
              ? "Editar"
              : "Adicionar"}
          </button>
        )}
      </div>

      {!editing && (
        <>
          {initialValue ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
              {initialValue}
            </p>
          ) : (
            <p className="mt-4 text-sm italic text-neutral-400">
              Nenhuma observação para os
              professores.
            </p>
          )}

          {saved && (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-green-700">
              <Check size={14} />
              Observação salva.
            </div>
          )}
        </>
      )}

      {editing && (
        <div className="mt-4">
          <textarea
            value={value}
            onChange={(event) =>
              setValue(
                event.target.value
              )
            }
            rows={3}
            placeholder="Ex.: Goleiro. Já treina com categoria acima. Avaliar nível técnico."
            className="w-full resize-none rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setValue(
                  initialValue || ""
                );
                setEditing(false);
              }}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              <Save size={16} />

              {saving
                ? "Salvando..."
                : "Salvar observação"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * =========================================================
 * LISTA PARA PROFESSORES
 * =========================================================
 */

function CoachListModal({
  experimentals,
  initialDate,
  onClose,
}) {
  const [selectedDate, setSelectedDate] =
    useState(initialDate);

  const [copied, setCopied] =
    useState(false);

  const sessions = useMemo(() => {
    return experimentals
      .filter(
        (item) =>
          item.experimental_date ===
            selectedDate &&
          [
            "pending_confirmation",
            "confirmed",
          ].includes(item.status)
      )
      .sort((a, b) => {
        const timeA =
          a.experimental_time ||
          a.schedule?.start_time ||
          "00:00";

        const timeB =
          b.experimental_time ||
          b.schedule?.start_time ||
          "00:00";

        return timeA.localeCompare(
          timeB
        );
      });
  }, [
    experimentals,
    selectedDate,
  ]);

  const text = useMemo(
    () =>
      createCoachWhatsAppText(
        selectedDate,
        sessions
      ),
    [selectedDate, sessions]
  );

  async function copyList() {
    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (err) {
      console.error(
        "Erro ao copiar:",
        err
      );

      fallbackCopy(text);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between border-b border-neutral-100 p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
            Comissão técnica
          </p>

          <h2 className="mt-2 text-2xl font-bold text-neutral-900">
            Lista dos professores
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Gere a relação de
            experimentais pronta para
            enviar no grupo do WhatsApp.
          </p>
        </div>

        <CloseButton
          onClick={onClose}
        />
      </div>

      <div className="p-6">
        <label className="text-sm font-semibold text-neutral-900">
          Dia do treino
        </label>

        <input
          type="date"
          value={selectedDate}
          onChange={(event) => {
            setSelectedDate(
              event.target.value
            );
            setCopied(false);
          }}
          className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
        />

        <div className="mt-5 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <span className="text-sm text-neutral-600">
            Experimentais na lista
          </span>

          <strong className="text-lg text-neutral-900">
            {sessions.length}
          </strong>
        </div>

        {sessions.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 px-5 py-10 text-center">
            <Users
              size={30}
              className="mx-auto text-neutral-300"
            />

            <p className="mt-3 font-semibold text-neutral-700">
              Nenhuma experimental ativa
              neste dia.
            </p>

            <p className="mt-1 text-sm text-neutral-400">
              A lista considera aulas
              aguardando confirmação ou
              confirmadas.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5">
              <p className="text-sm font-semibold text-neutral-900">
                Prévia da mensagem
              </p>

              <div className="mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-neutral-800">
                  {text}
                </pre>
              </div>
            </div>

            <button
              type="button"
              onClick={copyList}
              className={`
                mt-5
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                px-5
                py-3.5
                text-sm
                font-semibold
                text-white
                transition
                ${
                  copied
                    ? "bg-green-700"
                    : "bg-neutral-900 hover:bg-neutral-800"
                }
              `}
            >
              {copied ? (
                <>
                  <Check size={18} />
                  Lista copiada
                </>
              ) : (
                <>
                  <ClipboardCopy
                    size={18}
                  />
                  Copiar lista para
                  WhatsApp
                </>
              )}
            </button>
          </>
        )}
      </div>
    </ModalShell>
  );
}

/*
 * =========================================================
 * NÃO COMPARECEU
 * =========================================================
 */

function NoShowActions({
  contact,
  whatsappUrl,
  onReschedule,
  onScheduleFollowUp,
  onCloseOpportunity,
}) {
  if (contact.status === "lost") {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
          <UserX size={17} />
          Ausência registrada.
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <ArchiveX
              size={20}
              className="mt-0.5 shrink-0 text-neutral-500"
            />

            <div>
              <p className="font-semibold text-neutral-900">
                Oportunidade encerrada
              </p>

              <p className="mt-1 text-sm text-neutral-500">
                Este contato não seguirá
                no fluxo comercial.
              </p>

              {contact.lost_reason && (
                <p className="mt-2 text-sm text-neutral-600">
                  Motivo:{" "}
                  <strong>
                    {getLostReasonLabel(
                      contact.lost_reason
                    )}
                  </strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (
    contact.status === "follow_up" &&
    contact.follow_up_date
  ) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
          <UserX size={17} />
          Ausência registrada.
        </div>

        <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <CalendarClock
              size={20}
              className="mt-0.5 shrink-0 text-violet-700"
            />

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-violet-900">
                Retorno programado
              </p>

              <p className="mt-1 text-sm text-violet-700">
                Próximo contato:{" "}
                <strong>
                  {formatShortDate(
                    contact.follow_up_date
                  )}
                </strong>
              </p>
            </div>
          </div>

          <NoShowActionButtons
            whatsappUrl={whatsappUrl}
            onReschedule={onReschedule}
            onScheduleFollowUp={
              onScheduleFollowUp
            }
            onCloseOpportunity={
              onCloseOpportunity
            }
            followUpExists
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
        <UserX size={17} />
        Ausência registrada.
      </div>

      <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/50 p-4 sm:p-5">
        <p className="font-semibold text-neutral-900">
          Não deixe essa oportunidade
          morrer.
        </p>

        <p className="mt-1 text-sm text-neutral-500">
          Entre em contato com a família
          e defina o próximo passo.
        </p>

        <NoShowActionButtons
          whatsappUrl={whatsappUrl}
          onReschedule={onReschedule}
          onScheduleFollowUp={
            onScheduleFollowUp
          }
          onCloseOpportunity={
            onCloseOpportunity
          }
        />
      </div>
    </div>
  );
}

function NoShowActionButtons({
  whatsappUrl,
  onReschedule,
  onScheduleFollowUp,
  onCloseOpportunity,
  followUpExists = false,
}) {
  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          <MessageCircle size={17} />
          {followUpExists
            ? "WhatsApp"
            : "Chamar no WhatsApp"}
        </a>
      )}

      

      <button
        type="button"
        onClick={onReschedule}
        className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        <CalendarPlus size={17} />
        Reagendar experimental
      </button>

      <button
        type="button"
        onClick={onScheduleFollowUp}
        className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
      >
        <CalendarClock size={17} />
        {followUpExists
          ? "Alterar retorno"
          : "Programar retorno"}
      </button>

      <button
        type="button"
        onClick={onCloseOpportunity}
        className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
      >
        <ArchiveX size={17} />
        Encerrar oportunidade
      </button>
    </div>
  );
}

/*
 * =========================================================
 * COMPARECEU
 * =========================================================
 */

function AttendedActions({
  commercialResult,
  contact,
  onOpenResult,
}) {
  if (
    commercialResult === "enrolled" ||
    contact.status === "enrolled"
  ) {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
        <GraduationCap size={17} />
        Compareceu e matriculou.
      </div>
    );
  }

  if (
    commercialResult === "follow_up" ||
    contact.status === "follow_up"
  ) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
          <PhoneCall size={17} />
          Compareceu. Retorno agendado.
        </div>

        {contact.follow_up_date && (
          <p className="text-sm text-neutral-500">
            Próximo contato:{" "}
            <strong>
              {formatShortDate(
                contact.follow_up_date
              )}
            </strong>
          </p>
        )}
      </div>
    );
  }

  if (
    commercialResult === "lost" ||
    contact.status === "lost"
  ) {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-600">
        <XCircle size={17} />
        Compareceu, mas não converteu.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
        <UserCheck size={17} />
        Presença registrada.
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
        <p className="font-semibold text-neutral-900">
          Aguardando decisão da família
        </p>

        <p className="mt-1 text-sm text-neutral-500">
          Quando houver uma definição,
          registre o resultado comercial.
        </p>

        <button
          type="button"
          onClick={onOpenResult}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          <GraduationCap size={17} />
          Registrar resultado
        </button>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * MODAL RESULTADO
 * =========================================================
 */

function ExperimentalResultModal({
  session,
  saving,
  onClose,
  onSave,
}) {
  const contact =
    session.contact || {};

  const [result, setResult] =
    useState("enrolled");

  const [
    followUpDate,
    setFollowUpDate,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  const [
    lostReason,
    setLostReason,
  ] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (
      result === "follow_up" &&
      !followUpDate
    ) {
      alert(
        "Informe a data do retorno."
      );
      return;
    }

    if (
      result === "lost" &&
      !lostReason
    ) {
      alert(
        "Informe o motivo da não conversão."
      );
      return;
    }

    onSave({
      result,
      followUpDate:
        result === "follow_up"
          ? followUpDate
          : null,
      notes,
      lostReason:
        result === "lost"
          ? lostReason
          : null,
    });
  }

  return (
    <ModalShell
      onClose={onClose}
      disableClose={saving}
    >
    <ModalHeader
  eyebrow="Resultado da experimental"
  title={contact.child_name}
  description="Registre o resultado comercial após a aula experimental."
  onClose={onClose}
  saving={saving}
/>
      <form
        onSubmit={handleSubmit}
        className="p-6"
      >
        <p className="text-sm font-semibold text-neutral-900">
          Qual foi o resultado?
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <ResultOption
            active={
              result === "enrolled"
            }
            icon={GraduationCap}
            label="Matriculou"
            onClick={() =>
              setResult("enrolled")
            }
          />

          <ResultOption
            active={
              result === "follow_up"
            }
            icon={PhoneCall}
            label="Retorno"
            onClick={() =>
              setResult("follow_up")
            }
          />

          <ResultOption
            active={
              result === "lost"
            }
            icon={XCircle}
            label="Não converteu"
            onClick={() =>
              setResult("lost")
            }
          />
        </div>

        {result === "enrolled" && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="font-semibold text-green-900">
              Matrícula realizada
            </p>

            <p className="mt-1 text-sm text-green-700">
              O contato será marcado como
              matriculado.
            </p>
          </div>
        )}

        {result === "follow_up" && (
          <FormDate
            label="Data do próximo contato"
            value={followUpDate}
            min={getTodayISO()}
            onChange={setFollowUpDate}
          />
        )}

        {result === "lost" && (
          <LostReasonSelect
            value={lostReason}
            onChange={setLostReason}
            label="Motivo da não conversão"
          />
        )}

        <FormTextarea
          label="Observação"
          value={notes}
          onChange={setNotes}
          placeholder="Adicione uma observação sobre a decisão da família..."
        />

        <ModalActions
          saving={saving}
          onClose={onClose}
          submitLabel={
            result === "enrolled"
              ? "Confirmar matrícula"
              : result === "follow_up"
              ? "Agendar retorno"
              : "Registrar não conversão"
          }
        />
      </form>
    </ModalShell>
  );
}

/*
 * =========================================================
 * MODAL REAGENDAMENTO
 * =========================================================
 */

function RescheduleExperimentalModal({
  session,
  saving,
  onClose,
  onSave,
}) {

  
  const contact =
    session.contact || {};

  // Turma + horário + data escolhidos no TrialSlotPicker
  const [slot, setSlot] =
    useState(null);

  const [formError, setFormError] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [
    coachNotes,
    setCoachNotes,
  ] = useState(
    session.coach_notes || ""
  );

  function handleSubmit(event) {
    event.preventDefault();

    if (!slot) {
      setFormError(
        "Escolha a turma, o horário e a nova data."
      );
      return;
    }

    onSave({
      slot,
      notes,
      coachNotes,
    });
  }

  return (
    <ModalShell
      onClose={onClose}
      disableClose={saving}
    >
      <ModalHeader
        eyebrow="Reagendar experimental"
        title={contact.child_name}
        description="A ausência anterior continuará registrada no histórico."
        onClose={onClose}
        saving={saving}
      />

      <form
        onSubmit={handleSubmit}
        className="p-6"
      >
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-red-600">
            Tentativa anterior
          </p>

          <p className="mt-2 font-semibold text-neutral-900">
            {formatShortDate(
              session.experimental_date
            )}
            {session.experimental_time
              ? ` às ${formatTime(
                  session.experimental_time
                )}`
              : ""}
          </p>

          <p className="mt-1 text-sm text-red-700">
            {session.status === "no_show"
              ? "Não compareceu"
              : "Será substituída pela nova data"}
          </p>
        </div>

        <div className="mt-6">
          <label className="text-sm font-semibold text-neutral-900">
            Categoria
          </label>

          <div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">
            {session.category?.name ||
              "Categoria não informada"}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-neutral-900">
            Nova turma, horário e data
          </p>

          <div className="mt-2">
            <TrialSlotPicker
              categoryId={session.category?.id}
              value={slot}
              onChange={(value) => {
                setSlot(value);
                setFormError("");
              }}
            />
          </div>

          {slot && (
            <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-700">
              Selecionado:{" "}
              <strong>
                {slot.group.location?.name} ·{" "}
                {WEEKDAY_LABELS[slot.weekday]}{" "}
                {formatShortDate(slot.date)} às{" "}
                {formatTime(slot.start_time)}
              </strong>
            </p>
          )}

          {formError && (
            <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
              {formError}
            </p>
          )}
        </div>

        <FormTextarea
          label="Observação interna"
          value={notes}
          onChange={setNotes}
          placeholder="Ex.: Responsável pediu nova tentativa na próxima semana..."
        />

        <FormTextarea
          label="Observação para professores"
          value={coachNotes}
          onChange={setCoachNotes}
          placeholder="Ex.: Goleiro. Já treinou em outra escola. Avaliar nível técnico."
          helper="Esta informação poderá aparecer na lista enviada aos professores."
        />

        <ModalActions
          saving={saving}
          onClose={onClose}
          submitLabel="Confirmar reagendamento"
        />
      </form>
    </ModalShell>
  );
}

/*
 * =========================================================
 * MODAL RETORNO
 * =========================================================
 */

function NoShowFollowUpModal({
  session,
  saving,
  onClose,
  onSave,
}) {
  const contact =
    session.contact || {};

    const isNoShow = session.status === "no_show";

  const [
    followUpDate,
    setFollowUpDate,
  ] = useState(
    contact.follow_up_date || ""
  );

  const [notes, setNotes] =
    useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!followUpDate) {
      alert(
        "Informe a data do próximo contato."
      );
      return;
    }

    onSave({
      followUpDate,
      notes,
    });
  }

  return (
    <ModalShell
      onClose={onClose}
      disableClose={saving}
    >
      <ModalHeader
        eyebrow="Programar retorno"
        title={contact.child_name}
        description="Defina quando essa família deverá ser contatada novamente."
        onClose={onClose}
        saving={saving}
      />

      <form
        onSubmit={handleSubmit}
        className="p-6"
      >
        {isNoShow ? (
  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
    <p className="text-xs font-bold uppercase tracking-wide text-red-600">
      Tentativa anterior
    </p>

    <p className="mt-2 font-semibold text-neutral-900">
      {formatShortDate(session.experimental_date)}
      {session.experimental_time
        ? ` às ${formatTime(session.experimental_time)}`
        : ""}
    </p>

    <p className="mt-1 text-sm text-red-700">
      Não compareceu
    </p>
  </div>
) : (
  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
    <p className="font-semibold text-blue-900">
      Remarcando experimental
    </p>

    <p className="mt-1 text-sm text-blue-700">
      A aula será movida para uma nova data.
    </p>
  </div>
)}

        <FormDate
          label="Data do próximo contato"
          value={followUpDate}
          min={getTodayISO()}
          onChange={setFollowUpDate}
        />

        <FormTextarea
          label="Observação"
          value={notes}
          onChange={setNotes}
          placeholder="Ex.: Chamei após a falta e ainda não respondeu. Tentar novamente em 2 dias."
        />

        <ModalActions
          saving={saving}
          onClose={onClose}
          submitLabel="Programar retorno"
        />
      </form>
    </ModalShell>
  );
}

/*
 * =========================================================
 * MODAL ENCERRAMENTO
 * =========================================================
 */

function CloseNoShowOpportunityModal({
  session,
  saving,
  onClose,
  onSave,
}) {
  const contact =
    session.contact || {};


  const [
    lostReason,
    setLostReason,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!lostReason) {
      alert(
        "Informe o motivo do encerramento."
      );
      return;
    }

    onSave({
      lostReason,
      notes,
    });
  }

  return (
    <ModalShell
      onClose={onClose}
      disableClose={saving}
    >
      <ModalHeader
        eyebrow="Encerrar oportunidade"
        title={contact.child_name}
        description="Use esta opção quando a oportunidade não seguirá no fluxo comercial."
        onClose={onClose}
        saving={saving}
      />

      <form
        onSubmit={handleSubmit}
        className="p-6"
      >
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">
            A experimental continuará
            como “Não compareceu”
          </p>

          <p className="mt-1 text-sm text-amber-800">
            Apenas a oportunidade
            comercial será encerrada.
          </p>
        </div>

        <LostReasonSelect
          value={lostReason}
          onChange={setLostReason}
          label="Motivo do encerramento"
        />

        <FormTextarea
          label="Observação"
          value={notes}
          onChange={setNotes}
          placeholder="Ex.: Fizemos novas tentativas, mas a família não respondeu."
        />

        <ModalActions
          saving={saving}
          onClose={onClose}
          submitLabel="Encerrar oportunidade"
        />
      </form>
    </ModalShell>
  );
}

/*
 * =========================================================
 * COMPONENTES AUXILIARES
 * =========================================================
 */

function ModalShell({
  children,
  onClose,
  disableClose,
}) {
  function handleBackdrop(event) {
    if (
      event.target ===
        event.currentTarget &&
      !disableClose
    ) {
      onClose();
    }
  }

  return (
    <div
      onMouseDown={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  eyebrow,
  title,
  description,
  onClose,
  saving,
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-bold text-neutral-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          {description}
        </p>
      </div>

      <CloseButton
        onClick={onClose}
        disabled={saving}
      />
    </div>
  );
}

function CloseButton({
  onClick,
  disabled,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
    >
      <X size={20} />
    </button>
  );
}

function ModalActions({
  saving,
  onClose,
  submitLabel,
}) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        disabled={saving}
        onClick={onClose}
        className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
      >
        Cancelar
      </button>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {saving
          ? "Salvando..."
          : submitLabel}
      </button>
    </div>
  );
}

function FormDate({
  label,
  value,
  min,
  onChange,
}) {
  return (
    <div className="mt-6">
      <label className="text-sm font-semibold text-neutral-900">
        {label}
      </label>

      <input
        type="date"
        value={value}
        min={min}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
      />
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  helper,
}) {
  return (
    <div className="mt-6">
      <label className="text-sm font-semibold text-neutral-900">
        {label}
        <span className="ml-1 font-normal text-neutral-400">
          (opcional)
        </span>
      </label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={4}
        placeholder={placeholder}
        className="mt-2 w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
      />

      {helper && (
        <p className="mt-2 text-xs text-neutral-400">
          {helper}
        </p>
      )}
    </div>
  );
}

function LostReasonSelect({
  value,
  onChange,
  label,
}) {
  return (
    <div className="mt-6">
      <label className="text-sm font-semibold text-neutral-900">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
      >
        <option value="">
          Selecione o motivo
        </option>

        {LOST_REASONS.map(
          (reason) => (
            <option
              key={reason.value}
              value={reason.value}
            >
              {reason.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function ResultOption({
  active,
  icon: Icon,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        items-center
        justify-center
        gap-2
        rounded-xl
        border
        px-3
        py-3
        text-sm
        font-semibold
        transition
        ${
          active
            ? "border-red-600 bg-red-50 text-red-700"
            : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
        }
      `}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}

function WeekDayCard({
  day,
  today,
  active,
  onClick,
}) {
  const isToday =
    day.date === today;

  const categories =
    Object.entries(day.categories);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[190px] rounded-2xl border p-4 text-left transition ${
        active
          ? "border-red-500 bg-red-50/60 shadow-sm"
          : isToday
          ? "border-red-200 hover:border-red-300 hover:shadow-sm"
          : "border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            className={`text-xs font-bold uppercase tracking-wide ${
              isToday
                ? "text-red-600"
                : "text-neutral-500"
            }`}
          >
            {isToday
              ? "Hoje"
              : getWeekdayShort(
                  day.date
                )}
          </p>

          <p className="mt-1 text-sm font-semibold text-neutral-700">
            {formatDayMonth(
              day.date
            )}
          </p>
        </div>

        <span
          className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-lg font-bold ${
            day.total
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-400"
          }`}
        >
          {day.total}
        </span>
      </div>

      <div className="mt-4 space-y-1.5">
        {!day.total && (
          <p className="text-xs text-neutral-400">
            Agenda livre
          </p>
        )}

        {day.pending > 0 && (
          <p className="text-xs font-medium text-amber-700">
            {day.pending} a confirmar
          </p>
        )}

        {day.confirmed > 0 && (
          <p className="text-xs font-medium text-blue-700">
            {day.confirmed} confirmada
            {day.confirmed > 1
              ? "s"
              : ""}
          </p>
        )}

        {day.attended > 0 && (
          <p className="text-xs font-medium text-green-700">
            {day.attended} compareceu
          </p>
        )}

        {day.noShow > 0 && (
          <p className="text-xs font-medium text-red-700">
            {day.noShow} não compareceu
          </p>
        )}
      </div>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-neutral-100 pt-3">
          {categories
            .slice(0, 3)
            .map(
              ([name, count]) => (
                <span
                  key={name}
                  className="rounded-lg bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-600"
                >
                  {name}: {count}
                </span>
              )
            )}

          {categories.length > 3 && (
            <span className="rounded-lg bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-500">
              +
              {categories.length -
                3}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutral-500 sm:text-sm">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-neutral-900 sm:text-3xl">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-neutral-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-red-50 p-2.5 text-red-600 sm:p-3">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function SessionStatusBadge({
  status,
}) {
  const data = {
    pending_confirmation: {
      label: "Aguardando confirmação",
      className:
        "bg-amber-50 text-amber-700",
    },

    confirmed: {
      label: "Confirmada",
      className:
        "bg-blue-50 text-blue-700",
    },

    attended: {
      label: "Compareceu",
      className:
        "bg-green-50 text-green-700",
    },

    no_show: {
      label: "Não compareceu",
      className:
        "bg-red-50 text-red-700",
    },

    cancelled: {
      label: "Cancelada",
      className:
        "bg-neutral-100 text-neutral-600",
    },
  };

  const current =
    data[status] || {
      label:
        status || "Sem status",
      className:
        "bg-neutral-100 text-neutral-600",
    };

  return (
    <span
      className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

function Info({
  label,
  value,
}) {
  if (!value) return null;

  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-neutral-900">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ filter }) {
  if (
    filter?.startsWith("day:")
  ) {
    const selectedDate =
      filter.replace("day:", "");

    return (
      <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-14 text-center">
        <CalendarDays
          size={32}
          className="mx-auto text-neutral-300"
        />

        <h3 className="mt-4 text-lg font-bold text-neutral-900">
          Nenhuma experimental neste dia
        </h3>

        <p className="mt-2 text-sm text-neutral-500">
          Não existem aulas experimentais
          em{" "}
          {formatShortDate(
            selectedDate
          )}
          .
        </p>
      </div>
    );
  }

  const messages = {
    today: {
      title:
        "Nenhuma experimental hoje",
      description:
        "Não existem aulas experimentais na agenda de hoje.",
    },

    week: {
      title:
        "Nenhuma experimental nesta semana",
      description:
        "Não existem aulas experimentais na semana selecionada.",
    },

    future: {
      title:
        "Nenhuma aula futura",
      description:
        "Não existem aulas experimentais futuras agendadas.",
    },

    history: {
      title:
        "Nenhum histórico encontrado",
      description:
        "Ainda não existem experimentais anteriores registradas.",
    },
  };

  const content =
    messages[filter] ||
    messages.today;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-14 text-center">
      <CalendarDays
        size={32}
        className="mx-auto text-neutral-300"
      />

      <h3 className="mt-4 text-lg font-bold text-neutral-900">
        {content.title}
      </h3>

      <p className="mt-2 text-sm text-neutral-500">
        {content.description}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * GERADOR DA MENSAGEM DOS PROFESSORES
 * =========================================================
 */

function createCoachWhatsAppText(
  date,
  sessions
) {
  if (!sessions.length) {
    return "";
  }

  const header =
    `🔴 *${getWeekdayLong(
      date
    ).toUpperCase()} (${formatShortDate(
      date
    )})*`;

  // Um bloco por local (cada professor recebe o do seu ginásio)
  const byLocation = sortByLocation(sessions).reduce(
    (acc, session) => {
      const name = getLocationName(session);

      (acc[name] ||= []).push(session);

      return acc;
    },
    {}
  );

  const sections = Object.entries(byLocation).map(
    ([locationName, locationSessions]) =>
      `📍 *${locationName}*\n\n${buildCoachBlocks(
        locationSessions
      ).join("\n\n---\n\n")}`
  );

  return `${header}\n\n${sections.join(
    "\n\n━━━━━━━━━━\n\n"
  )}`;
}

function buildCoachBlocks(sessions) {
  return sessions.map((session) => {
      const contact =
        session.contact || {};

      const lines = [
        `⚽ Atleta: ${
          contact.child_name ||
          "Não informado"
        }`,

        `🏆 Categoria: ${
          session.category?.name ||
          "Não informada"
        }`,

        `👤 Responsável: ${
          contact.responsible_name ||
          "Não informado"
        }`,
      ];

      const time =
        session.experimental_time ||
        session.schedule?.start_time;

      if (time) {
        lines.push(
          `🕒 Horário: ${formatTime(
            time
          )}`
        );
      }

      if (
        session.coach_notes?.trim()
      ) {
        lines.push(
          `📝 Observação: ${session.coach_notes.trim()}`
        );
      }

      return lines.join("\n");
    });
}

/*
 * =========================================================
 * HELPERS DE LOCAL
 * =========================================================
 */

// Local da experimental (via horário da turma); null em agendamentos antigos
function getSessionLocation(session) {
  return session?.schedule?.training_group?.location ?? null;
}

function getLocationName(session) {
  if (!session) return null;

  return getSessionLocation(session)?.name ?? "Sem local definido";
}

// Por local e, dentro do local, por horário
function sortByLocation(sessions) {
  return [...sessions].sort((a, b) => {
    const byLocation = getLocationName(a).localeCompare(
      getLocationName(b)
    );

    if (byLocation !== 0) return byLocation;

    const timeA =
      a.experimental_time ||
      a.schedule?.start_time ||
      "";

    const timeB =
      b.experimental_time ||
      b.schedule?.start_time ||
      "";

    return timeA.localeCompare(timeB);
  });
}

/*
 * =========================================================
 * HELPERS DE DATA
 * =========================================================
 */

function getTodayISO() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDaysISO(
  dateString,
  days
) {
  const date =
    new Date(
      `${dateString}T12:00:00`
    );

  date.setDate(
    date.getDate() + days
  );

  return dateToISO(date);
}

function getMondayISO(
  dateString
) {
  const date =
    new Date(
      `${dateString}T12:00:00`
    );

  const weekday =
    date.getDay();

  const difference =
    weekday === 0
      ? -6
      : 1 - weekday;

  date.setDate(
    date.getDate() +
      difference
  );

  return dateToISO(date);
}

function dateToISO(date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatShortDate(
  dateString
) {
  if (!dateString) return "";

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    new Date(
      `${dateString}T12:00:00`
    )
  );
}

function formatFullDate(
  dateString
) {
  if (!dateString) return "";

  const text =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ).format(
      new Date(
        `${dateString}T12:00:00`
      )
    );

  return capitalize(text);
}

function formatWeekRange(
  start,
  end
) {
  return `${formatShortDate(
    start
  )} — ${formatShortDate(end)}`;
}

function formatDayMonth(
  dateString
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
    }
  ).format(
    new Date(
      `${dateString}T12:00:00`
    )
  );
}

function getWeekdayShort(
  dateString
) {
  const value =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        weekday: "short",
      }
    ).format(
      new Date(
        `${dateString}T12:00:00`
      )
    );

  return value
    .replace(".", "")
    .toUpperCase();
}

function getWeekdayLong(
  dateString
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      weekday: "long",
    }
  ).format(
    new Date(
      `${dateString}T12:00:00`
    )
  );
}

function getDateRelativeLabel(
  date,
  today,
  tomorrow
) {
  if (date === today) {
    return "Hoje";
  }

  if (date === tomorrow) {
    return "Amanhã";
  }

  return getWeekdayLong(date);
}

/*
 * =========================================================
 * OUTROS HELPERS
 * =========================================================
 */

function formatTime(value) {
  if (!value) return "";

  return value.slice(0, 5);
}

function createWhatsAppUrl(
  phone
) {
  if (!phone) return null;

  let digits =
    String(phone).replace(
      /\D/g,
      ""
    );

  if (!digits) return null;

  if (
    digits.length === 10 ||
    digits.length === 11
  ) {
    digits = `55${digits}`;
  }

  return `https://wa.me/${digits}`;
}

function getLostReasonLabel(
  value
) {
  return (
    LOST_REASONS.find(
      (item) =>
        item.value === value
    )?.label || value
  );
}

function capitalize(value) {
  if (!value) return "";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function fallbackCopy(text) {
  const textarea =
    document.createElement(
      "textarea"
    );

  textarea.value = text;

  textarea.style.position =
    "fixed";

  textarea.style.opacity = "0";

  document.body.appendChild(
    textarea
  );

  textarea.focus();
  textarea.select();

  document.execCommand("copy");

  document.body.removeChild(
    textarea
  );
}
