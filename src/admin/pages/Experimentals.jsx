import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  CircleCheckBig,
  MessageCircle,
  UserCheck,
  UserX,
  GraduationCap,
  PhoneCall,
  XCircle,
  CalendarPlus,
  CalendarClock,
  ArchiveX,
  ChevronDown,
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
import { Button, Dialog, DialogActions, Panel, Tabs, buttonClass, inputClass, urgencyRail, urgencyText } from "../ui";
import { toast } from "../components/common/Toaster";
import { getSessionMessages } from "../../helpers/whatsappMessages";
import { isAwaitingResult } from "../../helpers/experimentalRules";
import TrialSlotPicker from "../components/experimentals/TrialSlotPicker";
import {
  buildCoachLinkUrl,
  getOrCreateCoachLink,
} from "../../services/coachLinks";
import { WEEKDAY_LABELS } from "../../constants/weekdays";
import { getSourceLabel } from "../../constants/school";

import {
  getExperimentals,
  getExperimentalSession,
  updateContactStatus,
  updateExperimentalSessionStatus,
  updateExperimentalCoachNotes,
  saveExperimentalResult,
  rescheduleExperimental,
  scheduleFollowUp,
  closeNoShowOpportunity,
} from "../../services/contacts";
import { errorMessage } from "../../helpers/errorMessage";

/*
 * =========================================================
 * CONSTANTES
 * =========================================================
 */

// Texto do aviso depois de Confirmar / Veio / Faltou
const STATUS_DONE_LABEL = {
  confirmed: "aula confirmada",
  attended: "marcado como veio",
  no_show: "marcado como faltou",
  pending_confirmation: "voltou para aguardando confirmação",
};

const FILTERS = [
  { value: "week", label: "Semana" },
  { value: "today", label: "Hoje" },
  { value: "future", label: "Todos futuros" },
  { value: "history", label: "Histórico" },
  // Já passaram e ainda estão "aguardando" ou "confirmado"
  { value: "overdue", label: "Sem baixa" },
  // Compareceu e a família ainda não decidiu (sem matrícula/retorno/perda)
  { value: "no_result", label: "Sem resultado" },
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

  // A Visão geral pode abrir direto num filtro (?filtro=history)
  const [activeFilter, setActiveFilter] = useState(() => {
    const filter = new URLSearchParams(window.location.search).get("filtro");

    return FILTERS.some((item) => item.value === filter)
      ? filter
      : "week";
  });
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

  // Recarrega ao voltar para a aba do navegador (sem botão Atualizar)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") loadExperimentals();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
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

      // Contatos arquivados ficam fora (mesma conta da Visão geral e do menu)
      setExperimentals(
        (data || []).filter((item) => !item.contact?.archived_at),
      );
    } catch (err) {
      console.error(
        "Erro ao carregar experimentais:",
        err
      );

      setError(
        errorMessage(err, "Não foi possível carregar as aulas experimentais.")
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
    newStatus,
    { undo = true } = {}
  ) {
    const previous = experimentals.find(
      (item) => item.id === sessionId
    );

    try {
      setUpdatingId(sessionId);

      const updated =
        await updateExperimentalSessionStatus(
          sessionId,
          newStatus
        );

      replaceSession(updated);

      if (undo && previous && previous.status !== newStatus) {
        toast(
          `${previous.contact?.child_name || "Experimental"}: ${STATUS_DONE_LABEL[newStatus] ?? "atualizado"}.`,
          {
            type: "success",
            action: {
              label: "Desfazer",
              onClick: () => undoStatusChange(previous),
            },
          }
        );
      }
    } catch (err) {
      console.error(
        "ERRO AO ATUALIZAR EXPERIMENTAL:",
        err
      );

      toast(
        "Não foi possível atualizar a experimental. Tente de novo."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function replaceSession(updated) {
    setExperimentals((current) =>
      current.map((item) =>
        item.id === updated.id
          ? updated
          : item
      )
    );
  }

  /*
   * Volta a aula e o contato para como estavam antes do clique.
   * O status do contato só muda se a troca também o tinha mudado.
   */
  async function undoStatusChange(previous) {
    try {
      await updateExperimentalSessionStatus(
        previous.id,
        previous.status
      );

      let fresh = await getExperimentalSession(previous.id);
      const contactStatus = previous.contact?.status;

      // O serviço espelha o status da aula no contato; se o contato
      // estava diferente antes do clique, devolve o valor original.
      if (
        contactStatus &&
        fresh.contact?.status !== contactStatus &&
        fresh.contact?.status === fresh.status
      ) {
        await updateContactStatus(previous.contact_id, contactStatus);
        fresh = await getExperimentalSession(previous.id);
      }

      replaceSession(fresh);

      toast("Desfeito.", { type: "success" });
    } catch (err) {
      console.error("Erro ao desfazer:", err);
      toast(
        "Não foi possível desfazer. Abra o contato e use Corrigir na experimental."
      );
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

      toast(
        errorMessage(err, "Não foi possível salvar o resultado da experimental.")
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

      toast(
        errorMessage(err, "Não foi possível reagendar a experimental.")
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

      toast(
        errorMessage(err, "Não foi possível programar o retorno.")
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

      toast(
        errorMessage(err, "Não foi possível encerrar a oportunidade.")
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

  // Contadores das abas (mesmas regras dos filtros abaixo)
  const filterCounts = useMemo(() => {
    const count = (predicate) => scopedExperimentals.filter(predicate).length;

    return {
      week: count((item) => item.experimental_date >= weekStart && item.experimental_date <= weekEnd),
      today: count((item) => item.experimental_date === today),
      future: count((item) => item.experimental_date >= today),
      overdue: count(
        (item) =>
          item.experimental_date < today &&
          ["pending_confirmation", "confirmed"].includes(item.status),
      ),
      no_result: count(isAwaitingResult),
    };
  }, [scopedExperimentals, today, weekStart, weekEnd]);

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

          case "no_result":
            result =
              scopedExperimentals.filter(
                isAwaitingResult
              );
            break;

          case "overdue":
            result =
              scopedExperimentals.filter(
                (item) =>
                  item.experimental_date <
                    today &&
                  [
                    "pending_confirmation",
                    "confirmed",
                  ].includes(item.status)
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
        summary={`${stats.week} nesta semana, ${stats.pending} a confirmar. Comparecimento da semana: ${stats.attendanceRate}%.`}
        actions={
          <Button onClick={() => setCoachListOpen(true)}>
            <Users size={17} aria-hidden="true" />
            Lista dos professores
          </Button>
        }
      />

      {/* SEMANA */}

      <Panel className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">
            Semana de {formatDayMonth(weekStart)} a {formatDayMonth(weekEnd)}
          </h2>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="quiet"
              onClick={goToPreviousWeek}
              aria-label="Semana anterior"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </Button>

            <Button size="sm" variant="quiet" onClick={goToCurrentWeek}>
              Esta semana
            </Button>

            <Button
              size="sm"
              variant="quiet"
              onClick={goToNextWeek}
              aria-label="Próxima semana"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1">
          {weekSummary.map((day) => (
            <WeekDayCard
              key={day.date}
              day={day}
              today={today}
              active={
                activeFilter === `day:${day.date}` ||
                (activeFilter === "today" && day.date === today)
              }
              onClick={() => openDay(day.date)}
            />
          ))}
        </div>
      </Panel>

      {/* FILTROS */}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          label="Filtrar experimentais"
          value={activeFilter}
          onChange={setActiveFilter}
          items={FILTERS.map((filter) => ({
            ...filter,
            count: filterCounts[filter.value],
            urgency:
              filter.value === "overdue" && filterCounts.overdue
                ? "alert"
                : filter.value === "no_result" && filterCounts.no_result
                  ? "attention"
                  : undefined,
          }))}
        />

        {locationOptions.length > 0 && (
          <Tabs
            label="Filtrar por local"
            value={locationFilter}
            onChange={setLocationFilter}
            items={[{ id: "all", name: "Todos os locais" }, ...locationOptions].map(
              (location) => ({ value: location.id, label: location.name }),
            )}
          />
        )}
      </div>

      {/* LOADING */}

      {loading && experimentals.length === 0 && (
        <p role="status" className="py-12 text-center text-muted">
          Carregando experimentais…
        </p>
      )}

      {/* ERRO */}

      {!loading && error && (
        <Panel className="p-5">
          <p role="alert" className="font-medium text-alert-text">
            {error}
          </p>

          <Button className="mt-3" onClick={loadExperimentals}>
            Tentar de novo
          </Button>
        </Panel>
      )}

      {/* VAZIO */}

      {!(loading && experimentals.length === 0) &&
        !error &&
        filteredExperimentals.length ===
          0 && (
          <EmptyState
            filter={activeFilter}
          />
        )}

      {/* AGENDA */}

      {!error &&
        filteredExperimentals.length >
          0 && (
          <div className="space-y-6">
            {groupedDates.map((date) => {
              const items = groupedExperimentals[date];

              return (
                <section key={date} aria-label={formatFullDate(date)}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <h2 className="font-semibold">
                      {dayHeading(date, today, tomorrow)}
                    </h2>

                    <p className="text-sm text-muted">
                      {items.length} {items.length === 1 ? "aula" : "aulas"}
                    </p>
                  </div>

                  <Panel className="overflow-hidden">
                    {sortByLocation(items).map((item, index, sorted) => (
                      <div key={item.id}>
                        {getLocationName(item) !== getLocationName(sorted[index - 1]) && (
                          <p className={`bg-canvas px-4 py-1.5 text-sm text-muted ${index > 0 ? "border-t border-line" : ""}`}>
                            {getLocationName(item)}
                          </p>
                        )}

                        <ExperimentalCard
                          item={item}
                          today={today}
                          updating={updatingId === item.id}
                          onStatusChange={handleStatusChange}
                          onSaveCoachNotes={handleSaveCoachNotes}
                          onOpenResult={() => setResultSession(item)}
                          onReschedule={() => setRescheduleSession(item)}
                          onScheduleFollowUp={() => setFollowUpSession(item)}
                          onCloseOpportunity={() => setCloseOpportunitySession(item)}
                        />
                      </div>
                    ))}
                  </Panel>
                </section>
              );
            })}
          </div>
        )}

      {/* LISTA PROFESSORES */}

      {coachListOpen && (
        <CoachListModal
          experimentals={
            scopedExperimentals
          }
          locationId={
            /^\d+$/.test(locationFilter)
              ? Number(locationFilter)
              : null
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

  // Fechada por padrão; abre ao clicar na linha
  const [open, setOpen] = useState(false);

  const canRegisterAttendance =
    item.experimental_date <= today;

  const whatsappUrl =
    createWhatsAppUrl(contact.phone);

  const displayTime =
    item.experimental_time ||
    item.schedule?.start_time;

  const trainingGroup =
    item.schedule?.training_group;

  const messages =
    getSessionMessages(item);

  const commercialResult =
    contact.experimental_result;

  const urgency = sessionUrgency(item, today);
  const detailsId = `experimental-${item.id}`;

  return (
    <article className={`border-t border-line first:border-t-0 ${urgencyRail(urgency)}`}>
      {/* LINHA */}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={detailsId}
          className="grid min-w-0 flex-1 grid-cols-[3.25rem_1fr] items-center gap-x-3 text-left sm:grid-cols-[3.25rem_minmax(0,1fr)_4.5rem_11rem]"
        >
          <span className="font-semibold tabular-nums">
            {displayTime ? formatTime(displayTime) : "—"}
          </span>

          <span className="min-w-0">
            <span className="block truncate font-medium">
              {contact.child_name || "Aluno não informado"}
            </span>
            <span className="block truncate text-sm text-muted">
              {contact.responsible_name || "Responsável não informado"}
            </span>
          </span>

          <span className="hidden text-sm text-muted sm:block">
            {item.category?.name}
          </span>

          <span className={`col-start-2 text-sm sm:col-start-auto ${urgency ? urgencyText(urgency) : "text-muted"}`}>
            {sessionStatusText(item, today)}
          </span>
        </button>

        <div className="flex items-center gap-2">
          {isPending && (
            <Button
              size="sm"
              disabled={updating}
              onClick={() => onStatusChange(item.id, "confirmed")}
            >
              <CircleCheckBig size={16} aria-hidden="true" />
              {updating ? "Salvando…" : "Confirmar"}
            </Button>
          )}

          {isConfirmed && canRegisterAttendance && (
            <>
              <Button
                size="sm"
                disabled={updating}
                onClick={() => onStatusChange(item.id, "attended")}
              >
                <UserCheck size={16} aria-hidden="true" />
                Veio
              </Button>

              <Button
                size="sm"
                disabled={updating}
                onClick={() => onStatusChange(item.id, "no_show")}
              >
                <UserX size={16} aria-hidden="true" />
                Faltou
              </Button>
            </>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`WhatsApp de ${contact.responsible_name || contact.child_name || "contato"}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-whatsapp hover:border-whatsapp"
            >
              <MessageCircle size={17} aria-hidden="true" />
            </a>
          )}

          <Button
            size="sm"
            variant="quiet"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls={detailsId}
            aria-label={open ? "Fechar detalhes" : "Abrir detalhes"}
          >
            <ChevronDown
              size={18}
              aria-hidden="true"
              className={`transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* DETALHES */}

      {open && (
        <div id={detailsId} className="border-t border-line bg-canvas/60 px-4 pb-4 pt-3">
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <MapPin size={14} aria-hidden="true" />
            {trainingGroup
              ? `${trainingGroup.location?.name ?? "Sem local"}, ${trainingGroup.name}`
              : "Sem turma definida (agendamento antigo)"}
          </p>

          <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Responsável" value={contact.responsible_name} />
            <Info label="WhatsApp" value={formatPhone(contact.phone)} />
            <Info label="Origem" value={getSourceLabel(contact.source)} />
            <Info label="Bairro" value={contact.neighborhood} />
          </dl>

          <CoachNotesEditor
            sessionId={item.id}
            initialValue={item.coach_notes || ""}
            onSave={onSaveCoachNotes}
          />

          {/* AVALIAÇÃO DO PROFESSOR (interna) */}

          {item.coach_feedback && (
            <div className="mt-4 rounded-lg border border-line bg-white p-3">
              <p className="text-sm font-semibold">Avaliação do professor</p>

              <p className="mt-1 whitespace-pre-wrap text-sm">
                {item.coach_feedback}
              </p>
            </div>
          )}

          {/* MENSAGENS PRONTAS */}

          {messages.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">Mensagem pronta:</span>

              {messages.map((message) => (
                <a
                  key={message.key}
                  href={message.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium text-whatsapp hover:border-whatsapp"
                >
                  <MessageCircle size={15} aria-hidden="true" />
                  {message.label}
                </a>
              ))}
            </div>
          )}

          {/* AÇÕES */}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            {isReschedule && (
              <Button size="sm" onClick={onReschedule}>
                <CalendarPlus size={16} aria-hidden="true" />
                Remarcar
              </Button>
            )}

            {isConfirmed && !canRegisterAttendance && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <CircleCheckBig size={16} aria-hidden="true" />
                Aula confirmada. A presença fica disponível no dia da aula.
              </p>
            )}

            {isAttended && (
              <AttendedActions
                commercialResult={commercialResult}
                contact={contact}
                onOpenResult={onOpenResult}
              />
            )}

            {isNoShow && (
              <NoShowActions
                contact={contact}
                whatsappUrl={whatsappUrl}
                onReschedule={onReschedule}
                onScheduleFollowUp={onScheduleFollowUp}
                onCloseOpportunity={onCloseOpportunity}
              />
            )}

            {isCancelled && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <XCircle size={16} aria-hidden="true" />
                Experimental cancelada.
              </p>
            )}
          </div>
        </div>
      )}
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
      toast(
        errorMessage(err, "Não foi possível salvar a observação.")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 rounded-lg border border-line bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users
              size={17}
              className="text-ink"
            />

            <p className="text-sm font-bold text-ink">
              Observação para professores
            </p>
          </div>

          <p className="mt-1 text-xs text-muted">
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
            className="flex shrink-0 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:bg-white"
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
            <p className="mt-4 text-sm italic text-muted">
              Nenhuma observação para os
              professores.
            </p>
          )}

          {saved && (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-ok">
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
            className="w-full resize-none rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-neutral-200"
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
              className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-canvas disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
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
  locationId,
  onClose,
}) {
  const [selectedDate, setSelectedDate] =
    useState(initialDate);

  const [copied, setCopied] =
    useState(false);

  // Link para o professor marcar presença (sem login)
  const [linkUrl, setLinkUrl] =
    useState("");

  const [linkError, setLinkError] =
    useState("");

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

  useEffect(() => {
    let cancelled = false;

    setLinkUrl("");
    setLinkError("");

    if (!sessions.length) return undefined;

    getOrCreateCoachLink(selectedDate, locationId)
      .then((token) => {
        if (!cancelled) setLinkUrl(buildCoachLinkUrl(token));
      })
      .catch((err) => {
        console.error("Erro ao gerar link dos professores:", err);
        if (!cancelled) {
          setLinkError(
            "Não foi possível gerar o link de presença. Feche e abra a lista de novo."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, locationId, sessions.length]);

  const text = useMemo(() => {
    const list = createCoachWhatsAppText(
      selectedDate,
      sessions
    );

    return list && linkUrl
      ? `${list}\n\n✅ Marcar quem veio: ${linkUrl}`
      : list;
  }, [selectedDate, sessions, linkUrl]);

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
    <Dialog
      open
      onClose={onClose}
      title="Lista dos professores"
      description="Experimentais do dia, prontas para enviar no grupo do WhatsApp."
    >
      <div>
        <label className="text-sm font-medium text-ink">
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
          className={`mt-1.5 ${inputClass}`}
        />

        <div className="mt-5 flex items-center justify-between rounded-lg bg-canvas px-4 py-3">
          <span className="text-sm text-neutral-600">
            Experimentais na lista
          </span>

          <strong className="text-lg text-ink">
            {sessions.length}
          </strong>
        </div>

        {sessions.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-neutral-300 px-5 py-10 text-center">
            <Users
              size={30}
              className="mx-auto text-neutral-300"
            />

            <p className="mt-3 font-semibold text-neutral-700">
              Nenhuma experimental ativa
              neste dia.
            </p>

            <p className="mt-1 text-sm text-muted">
              A lista considera aulas
              aguardando confirmação ou
              confirmadas.
            </p>
          </div>
        ) : (
          <>
            {linkError && (
              <p className="mt-5 rounded-lg bg-alert-soft p-3 text-sm text-alert-text">
                {linkError}
              </p>
            )}

            {linkUrl && (
              <p className="mt-5 rounded-lg bg-ok-soft p-3 text-xs text-ok">
                O link no fim da mensagem abre a lista no celular do
                professor para marcar quem veio, sem login. Vale até
                o fim do dia seguinte.
              </p>
            )}

            <div className="mt-5">
              <p className="text-sm font-semibold text-ink">
                Prévia da mensagem
              </p>

              <div className="mt-2 max-h-[420px] overflow-y-auto rounded-lg border border-line bg-canvas p-5">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-ink">
                  {text}
                </pre>
              </div>
            </div>

            <button
              type="button"
              onClick={copyList}
              className={`mt-5 w-full ${buttonClass(copied ? "secondary" : "primary")}`}
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
    </Dialog>
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

        <div className="mt-4 rounded-lg border border-line bg-canvas p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <ArchiveX
              size={20}
              className="mt-0.5 shrink-0 text-muted"
            />

            <div>
              <p className="font-semibold text-ink">
                Oportunidade encerrada
              </p>

              <p className="mt-1 text-sm text-muted">
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

        <div className="mt-4 rounded-lg border border-line bg-white p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <CalendarClock
              size={20}
              className="mt-0.5 shrink-0 text-ink"
            />

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">
                Retorno programado
              </p>

              <p className="mt-1 text-sm text-ink">
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

      <div className="mt-4 rounded-lg border border-line bg-white p-4 sm:p-5">
        <p className="font-semibold text-ink">
          Não deixe essa oportunidade
          morrer.
        </p>

        <p className="mt-1 text-sm text-muted">
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
          className="flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-canvas"
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
        className="flex items-center justify-center gap-2 rounded-lg bg-inter-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-inter-red-dark"
      >
        <CalendarPlus size={17} />
        Reagendar experimental
      </button>

      <button
        type="button"
        onClick={onScheduleFollowUp}
        className="flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white"
      >
        <CalendarClock size={17} />
        {followUpExists
          ? "Alterar retorno"
          : "Programar retorno"}
      </button>

      <button
        type="button"
        onClick={onCloseOpportunity}
        className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-canvas"
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
      <div className="flex items-center gap-2 text-sm font-semibold text-ok">
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
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <PhoneCall size={17} />
          Compareceu. Retorno agendado.
        </div>

        {contact.follow_up_date && (
          <p className="text-sm text-muted">
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
      <div className="flex items-center gap-2 text-sm font-semibold text-ok">
        <UserCheck size={17} />
        Presença registrada.
      </div>

      <div className="mt-4 rounded-lg border border-line bg-canvas p-4 sm:p-5">
        <p className="font-semibold text-ink">
          Aguardando decisão da família
        </p>

        <p className="mt-1 text-sm text-muted">
          Quando houver uma definição,
          registre o resultado comercial.
        </p>

        <button
          type="button"
          onClick={onOpenResult}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
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
      toast(
        "Informe a data do retorno."
      );
      return;
    }

    if (
      result === "lost" &&
      !lostReason
    ) {
      toast(
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
    <Dialog
      open
      onClose={onClose}
      busy={saving}
      title="Resultado da experimental"
      description={contact.child_name}
    >
      <form onSubmit={handleSubmit}>
        <p className="text-sm font-semibold text-ink">
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
          <div className="mt-6 rounded-lg border border-ok/30 bg-ok-soft p-4">
            <p className="font-semibold text-ok">
              Matrícula realizada
            </p>

            <p className="mt-1 text-sm text-ok">
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
    </Dialog>
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
    <Dialog
      open
      onClose={onClose}
      busy={saving}
      title="Reagendar experimental"
      description={`${contact.child_name}. A ausência anterior continuará registrada no histórico.`}
    >

      <form onSubmit={handleSubmit}>
        <div className="rounded-lg border border-alert/30 bg-alert-soft p-4">
          <p className="text-sm font-medium text-muted">
            Tentativa anterior
          </p>

          <p className="mt-2 font-semibold text-ink">
            {formatShortDate(
              session.experimental_date
            )}
            {session.experimental_time
              ? ` às ${formatTime(
                  session.experimental_time
                )}`
              : ""}
          </p>

          <p className="mt-1 text-sm text-alert-text">
            {session.status === "no_show"
              ? "Não compareceu"
              : "Será substituída pela nova data"}
          </p>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-ink">
            Categoria
          </label>

          <div className="mt-2 rounded-lg border border-line bg-canvas px-4 py-3 text-sm font-semibold text-neutral-700">
            {session.category?.name ||
              "Categoria não informada"}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-ink">
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
            <p className="mt-3 rounded-lg bg-canvas p-3 text-sm text-neutral-700">
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
            <p className="mt-3 rounded-lg bg-alert-soft p-3 text-sm font-semibold text-alert-text">
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
    </Dialog>
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
      toast(
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
    <Dialog
      open
      onClose={onClose}
      busy={saving}
      title="Programar retorno"
      description={contact.child_name}
    >

      <form onSubmit={handleSubmit}>
        {isNoShow ? (
  <div className="rounded-lg border border-alert/30 bg-alert-soft p-4">
    <p className="text-sm font-medium text-muted">
      Tentativa anterior
    </p>

    <p className="mt-2 font-semibold text-ink">
      {formatShortDate(session.experimental_date)}
      {session.experimental_time
        ? ` às ${formatTime(session.experimental_time)}`
        : ""}
    </p>

    <p className="mt-1 text-sm text-alert-text">
      Não compareceu
    </p>
  </div>
) : (
  <div className="rounded-lg border border-line bg-canvas p-4">
    <p className="font-semibold text-ink">
      Remarcando experimental
    </p>

    <p className="mt-1 text-sm text-ink">
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
    </Dialog>
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
      toast(
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
    <Dialog
      open
      onClose={onClose}
      busy={saving}
      title="Encerrar oportunidade"
      description={contact.child_name}
    >

      <form onSubmit={handleSubmit}>
        <div className="rounded-lg border border-attention/40 bg-attention-soft p-4">
          <p className="font-semibold text-attention-text">
            A experimental continuará
            como “Não compareceu”
          </p>

          <p className="mt-1 text-sm text-attention-text">
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
    </Dialog>
  );
}

/*
 * =========================================================
 * COMPONENTES AUXILIARES
 * =========================================================
 */

function ModalActions({
  saving,
  onClose,
  submitLabel,
}) {
  return (
    <DialogActions className="mt-6">
      <Button disabled={saving} onClick={onClose}>
        Cancelar
      </Button>

      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? "Salvando…" : submitLabel}
      </Button>
    </DialogActions>
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
      <label className="text-sm font-medium text-ink">
        {label}
      </label>

      <input
        type="date"
        value={value}
        min={min}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`mt-1.5 ${inputClass}`}
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
      <label className="text-sm font-medium text-ink">
        {label}
        <span className="ml-1 font-normal text-muted">
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
        className={`mt-1.5 resize-none ${inputClass}`}
      />

      {helper && (
        <p className="mt-2 text-xs text-muted">
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
      <label className="text-sm font-medium text-ink">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`mt-1.5 ${inputClass}`}
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
        rounded-lg
        border
        px-3
        py-3
        text-sm
        font-semibold
        transition-colors
        ${
          active
            ? "border-ink bg-ink text-white"
            : "border-line bg-white text-ink hover:border-neutral-400"
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
  const isToday = day.date === today;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${getWeekdayLong(day.date)}, ${formatDayMonth(day.date)}: ${day.total} ${day.total === 1 ? "aula" : "aulas"}${day.pending ? `, ${day.pending} a confirmar` : ""}`}
      className={`flex flex-col items-center rounded-lg px-1 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${
        active ? "bg-ink text-white" : "hover:bg-canvas"
      }`}
    >
      <span className={`text-xs ${active ? "text-white/80" : isToday ? "font-semibold text-ink" : "text-muted"}`}>
        {isToday ? "Hoje" : getWeekdayShort(day.date)}
      </span>

      <span className="text-sm tabular-nums">{formatDayMonth(day.date)}</span>

      <span
        className={`mt-1 font-display text-2xl font-semibold leading-none tabular-nums ${
          active ? "text-white" : day.total ? "text-ink" : "font-normal text-muted"
        }`}
      >
        {day.total}
      </span>

      {day.pending > 0 && (
        <span className={`mt-1 h-1 w-6 rounded-full ${active ? "bg-white/70" : "bg-attention"}`} aria-hidden="true" />
      )}
    </button>
  );
}

// Urgência da linha: atrasada (vermelho) ou pedindo ação (âmbar)
function sessionUrgency(item, today) {
  const open = ["pending_confirmation", "confirmed"].includes(item.status);

  if (open && item.experimental_date < today) return "alert";
  if (item.status === "pending_confirmation") return "attention";
  if (isAwaitingResult(item)) return "attention";

  return undefined;
}

function sessionStatusText(item, today) {
  const open = ["pending_confirmation", "confirmed"].includes(item.status);

  if (open && item.experimental_date < today) return "Sem baixa de presença";
  if (isAwaitingResult(item)) return "Veio, falta o resultado";

  return (
    {
      pending_confirmation: "A confirmar",
      confirmed: "Confirmada",
      attended: "Compareceu",
      no_show: "Não compareceu",
      cancelled: "Cancelada",
    }[item.status] ?? (item.status || "Sem status")
  );
}

// "Hoje, segunda-feira, 19 de outubro"
function dayHeading(date, today, tomorrow) {
  const full = formatFullDate(date);

  if (date === today) return `Hoje, ${full.charAt(0).toLowerCase()}${full.slice(1)}`;
  if (date === tomorrow) return `Amanhã, ${full.charAt(0).toLowerCase()}${full.slice(1)}`;

  return full;
}

// "51986090538" -> "(51) 98609-0538"
function formatPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");

  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;

  return value;
}

function Info({
  label,
  value,
}) {
  if (!value) return null;

  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="break-words text-sm font-medium">{value}</dd>
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
      <div className="rounded-xl border border-line bg-white px-6 py-10 text-center">
        <h3 className="font-semibold">
          Nenhuma experimental neste dia
        </h3>

        <p className="mt-1 text-sm text-muted">
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

    no_result: {
      title:
        "Nenhum resultado pendente",
      description:
        "Todas as famílias que vieram na experimental já têm uma decisão registrada.",
    },

    overdue: {
      title:
        "Nenhuma presença pendente",
      description:
        "Todas as experimentais que já passaram têm 'compareceu' ou 'não compareceu'.",
    },
  };

  const content =
    messages[filter] ||
    messages.today;

  return (
    <div className="rounded-xl border border-line bg-white px-6 py-10 text-center">
      <h3 className="font-semibold">
        {content.title}
      </h3>

      <p className="mt-1 text-sm text-muted">
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

  const short = value.replace(".", "");

  return short.charAt(0).toUpperCase() + short.slice(1);
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
