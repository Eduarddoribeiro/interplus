import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import { Button, Panel, Tabs, inputClass } from "../ui";
import { toast } from "../components/common/Toaster";
import { isAwaitingResult } from "../../helpers/experimentalRules";
import { CONFIRM_DAYS } from "../../helpers/dashboardSummary";
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
import ExperimentalCard from "../components/experimentals/ExperimentalCard";
import CoachListModal from "../components/experimentals/CoachListModal";
import ExperimentalResultModal from "../components/experimentals/ExperimentalResultModal";
import RescheduleExperimentalModal from "../components/experimentals/RescheduleExperimentalModal";
import NoShowFollowUpModal from "../components/experimentals/NoShowFollowUpModal";
import CloseNoShowOpportunityModal from "../components/experimentals/CloseNoShowOpportunityModal";
import WeekDayCard from "../components/experimentals/WeekDayCard";
import EmptyState from "../components/experimentals/EmptyState";
import {
  getTodayISO,
  addDaysISO,
  getMondayISO,
  formatFullDate,
  formatDayMonth,
} from "../../helpers/experimentalDates";
import { getSessionLocation, getLocationName, sortByLocation } from "../../helpers/coachListText";

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
  // Aguardando confirmação nas próximas 48h (mesma regra da Visão geral)
  { value: "to_confirm", label: "A confirmar" },
  { value: "future", label: "Todos futuros" },
  { value: "history", label: "Histórico" },
  // Já passaram e ainda estão "aguardando" ou "confirmado"
  { value: "overdue", label: "Sem baixa" },
  // Compareceu e a família ainda não decidiu (sem matrícula/retorno/perda)
  { value: "no_result", label: "Sem resultado" },
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

  // O filtro fica na URL (?filtro=history): a Visão geral abre direto
  // nele e, ao voltar de um contato, a tela reabre no mesmo filtro
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState(() => {
    const filter = searchParams.get("filtro");

    return FILTERS.some((item) => item.value === filter)
      ? filter
      : "week";
  });

  useEffect(() => {
    setSearchParams(
      activeFilter === "week" ? {} : { filtro: activeFilter },
      { replace: true }
    );
  }, [activeFilter, setSearchParams]);
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

  // Falta que já foi remarcada: aponta para a aula nova da mesma criança
  const rescheduledTo = useMemo(() => {
    const result = new Map();
    const key = (item) => `${item.experimental_date}T${item.experimental_time || ""}${item.created_at || ""}`;

    experimentals.forEach((item) => {
      if (item.status !== "no_show" || !item.contact?.id) return;

      const next = experimentals
        .filter((other) => other.contact?.id === item.contact.id && key(other) > key(item))
        .sort((a, b) => key(a).localeCompare(key(b)))[0];

      if (next) result.set(item.id, next);
    });

    return result;
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
  const confirmUntil = addDaysISO(today, CONFIRM_DAYS);

  function isToConfirm(item) {
    return (
      item.status === "pending_confirmation" &&
      item.experimental_date >= today &&
      item.experimental_date <= confirmUntil
    );
  }

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

      // Contatos arquivados ficam fora (mesma conta da Visão geral e do menu).
      // Canceladas também: só existem por remarcação e ficam no histórico
      // do contato; na agenda pareciam a mesma criança marcada duas vezes.
      setExperimentals(
        (data || []).filter(
          (item) => !item.contact?.archived_at && item.status !== "cancelled",
        ),
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
        errorMessage(err, "Não foi possível encerrar o contato.")
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
      // Sem veio/faltou na semana não há o que medir
      attendanceBase: completed.length,
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
      to_confirm: count(isToConfirm),
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

          case "to_confirm":
            result =
              scopedExperimentals.filter(isToConfirm);
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
        // "delas": o número é desta semana; a aba "A confirmar" olha as próximas 48 horas
        summary={`${stats.week} nesta semana, ${stats.pending} delas a confirmar.${
          stats.attendanceBase ? ` Comparecimento da semana: ${stats.attendanceRate}%.` : ""
        }`}
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

      {/* Situação em abas; local numa lista à parte, para as abas não ficarem cortadas */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
                : ["no_result", "to_confirm"].includes(filter.value) && filterCounts[filter.value]
                  ? "attention"
                  : undefined,
          }))}
        />

        {locationOptions.length > 0 && (
          <label className="flex shrink-0 items-center gap-2 text-sm text-muted">
            Local
            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              className={`${inputClass} w-auto min-w-[12rem] py-2`}
            >
              {[{ id: "all", name: "Todos os locais" }, ...locationOptions].map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
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
                          rescheduledTo={rescheduledTo.get(item.id)}
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

// "Hoje, segunda-feira, 19 de outubro"
function dayHeading(date, today, tomorrow) {
  const full = formatFullDate(date);

  if (date === today) return `Hoje, ${full.charAt(0).toLowerCase()}${full.slice(1)}`;
  if (date === tomorrow) return `Amanhã, ${full.charAt(0).toLowerCase()}${full.slice(1)}`;

  return full;
}
