import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ChevronRight } from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import { Button, Panel, Tabs } from "../ui";

import FollowUpCard from "../components/followUps/FollowUpCard";
import FollowUpActionModal from "../components/followUps/ContactActionModal";
import { getTodayISO } from "../../helpers/contactPresentation";
import { FOLLOW_UP_FILTER } from "../../constants/followUpFilters";
import { FOLLOW_UP_ACTION } from "../../constants/followUpActions";

import { CONTACT_STATUS } from "../../constants/contactStatus";
import {
  getFollowUpCenter,
  scheduleFollowUp,
  enrollFromFollowUp,
  loseFromFollowUp,
} from "../../services/contacts";

/*
 * Retornos: famílias que precisam de novo contato.
 * A lista de interesse tem tela própria (/admin/waiting-list).
 */
export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [waitingCount, setWaitingCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [activeFilter, setActiveFilter] = useState(FOLLOW_UP_FILTER.TODAY);

  const [actionContact, setActionContact] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const today = getTodayISO();

  useEffect(() => {
    loadData();
  }, []);

  // Recarrega ao voltar para a aba do navegador (sem botão Atualizar)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") loadData({ keepFilter: true });
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  async function loadData({ keepFilter = false } = {}) {
    try {
      setLoading(true);
      setError("");

      const data = await getFollowUpCenter();
      const list = data.followUps || [];

      setFollowUps(list);
      setWaitingCount((data.waitingList || []).length);

      // Sem retorno hoje mas com atrasados: abre direto nos atrasados
      const hasToday = list.some((item) => item.follow_up_date === today);
      const hasOverdue = list.some(
        (item) => item.follow_up_date && item.follow_up_date < today,
      );

      if (!keepFilter && !hasToday && hasOverdue) {
        setActiveFilter(FOLLOW_UP_FILTER.OVERDUE);
      }
    } catch (err) {
      console.error("Erro ao carregar retornos:", err);

      setError("Não foi possível carregar os retornos.");
    } finally {
      setLoading(false);
    }
  }

  function openAction(contact, type) {
    setActionError("");
    setActionContact(contact);
    setActionType(type);
  }

  function closeAction() {
    if (saving) return;

    setActionContact(null);
    setActionType(null);
  }

  /*
   * Salva ações realizadas
   * sobre um retorno.
   */
  async function handleFollowUpAction(payload) {
    if (!actionContact) return;

    try {
      setSaving(true);
      setActionError("");

      let updated;

      if (actionType === FOLLOW_UP_ACTION.RESCHEDULE) {
        updated = await scheduleFollowUp(
          actionContact.id,
          payload.followUpDate,
          payload.notes,
        );
      }

      if (actionType === FOLLOW_UP_ACTION.ENROLL) {
        updated = await enrollFromFollowUp(actionContact.id, payload.notes);
      }

      if (actionType === FOLLOW_UP_ACTION.LOSE) {
        updated = await loseFromFollowUp(
          actionContact.id,
          payload.lostReason,
          payload.notes,
        );
      }

      /*
       * Se continuou sendo retorno, atualizamos o card.
       * Se matriculou/perdeu, removemos da fila.
       */
      if (updated?.status === CONTACT_STATUS.FOLLOW_UP) {
        setFollowUps((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      } else {
        setFollowUps((current) =>
          current.filter((item) => item.id !== actionContact.id),
        );
      }

      setNotice("Retorno atualizado.");
      window.setTimeout(() => setNotice(""), 4000);

      setActionContact(null);
      setActionType(null);
    } catch (err) {
      console.error("Erro ao atualizar retorno:", err);

      setActionError(err?.message || "Não foi possível atualizar o retorno.");
    } finally {
      setSaving(false);
    }
  }

  /*
   * INDICADORES
   */

  const stats = useMemo(() => {
    const overdue = followUps.filter(
      (item) => item.follow_up_date && item.follow_up_date < today,
    ).length;

    const todayCount = followUps.filter(
      (item) => item.follow_up_date === today,
    ).length;

    const upcoming = followUps.filter(
      (item) => item.follow_up_date && item.follow_up_date > today,
    ).length;

    return {
      overdue,
      today: todayCount,
      upcoming,
    };
  }, [followUps, today]);

  /*
   * FILTRO DA FILA
   */

  const filteredFollowUps = useMemo(() => {
    let result = [...followUps];

    if (activeFilter === FOLLOW_UP_FILTER.TODAY) {
      result = result.filter((item) => item.follow_up_date === today);
    }

    if (activeFilter === FOLLOW_UP_FILTER.OVERDUE) {
      result = result.filter(
        (item) => item.follow_up_date && item.follow_up_date < today,
      );
    }

    if (activeFilter === FOLLOW_UP_FILTER.UPCOMING) {
      result = result.filter(
        (item) => item.follow_up_date && item.follow_up_date > today,
      );
    }

    return result.sort((a, b) =>
      (a.follow_up_date || "").localeCompare(b.follow_up_date || ""),
    );
  }, [followUps, activeFilter, today]);

  const tabs = [
    {
      value: FOLLOW_UP_FILTER.OVERDUE,
      label: "Atrasados",
      count: stats.overdue,
      urgency: stats.overdue ? "alert" : undefined,
    },
    {
      value: FOLLOW_UP_FILTER.TODAY,
      label: "Hoje",
      count: stats.today,
      urgency: stats.today ? "attention" : undefined,
    },
    { value: FOLLOW_UP_FILTER.UPCOMING, label: "Próximos", count: stats.upcoming },
    { value: FOLLOW_UP_FILTER.ALL, label: "Todos", count: followUps.length },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Retornos"
        summary={`${stats.overdue} atrasados, ${stats.today} para hoje, ${stats.upcoming} agendados.`}
      />

      {notice && (
        <p role="status" className="rounded-lg bg-ink px-4 py-3 text-sm font-medium text-white">
          {notice}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs label="Filtrar retornos" value={activeFilter} onChange={setActiveFilter} items={tabs} />

        {waitingCount > 0 && (
          <Link
            to="/admin/waiting-list"
            className="inline-flex h-9 items-center gap-1 text-sm text-muted hover:text-ink"
          >
            {waitingCount} famíli{waitingCount === 1 ? "a" : "as"} na lista de interesse
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>

      {/* LOADING */}

      {loading && followUps.length === 0 && (
        <p role="status" className="py-12 text-center text-muted">
          Carregando retornos…
        </p>
      )}

      {/* ERRO */}

      {!loading && error && (
        <Panel className="p-5">
          <p role="alert" className="font-medium text-alert-text">
            {error} Confira sua internet e tente de novo.
          </p>

          <Button className="mt-3" onClick={() => loadData()}>
            Tentar de novo
          </Button>
        </Panel>
      )}

      {/* RETORNOS */}

      {!(loading && followUps.length === 0) && !error && (
        filteredFollowUps.length === 0 ? (
          <EmptyState type={activeFilter} />
        ) : (
          <Panel>
            {filteredFollowUps.map((item) => (
              <FollowUpCard
                key={item.id}
                item={item}
                today={today}
                onAction={openAction}
              />
            ))}
          </Panel>
        )
      )}

      {/* MODAL */}

      {actionContact && (
        <FollowUpActionModal
          contact={actionContact}
          type={actionType}
          saving={saving}
          error={actionError}
          onClose={closeAction}
          onSave={handleFollowUpAction}
        />
      )}
    </div>
  );
}

/*
 * ESTADO VAZIO
 */

function EmptyState({ type }) {
  const content = {
    [FOLLOW_UP_FILTER.TODAY]: {
      title: "Nenhum retorno para hoje",
      description: "Confira os atrasados e os próximos nas outras abas.",
    },

    [FOLLOW_UP_FILTER.OVERDUE]: {
      title: "Nenhum retorno atrasado",
      description: "Todos os acompanhamentos estão em dia.",
    },

    [FOLLOW_UP_FILTER.UPCOMING]: {
      title: "Nenhum próximo retorno",
      description: "Não há contatos agendados para os próximos dias.",
    },

    [FOLLOW_UP_FILTER.ALL]: {
      title: "Nenhum retorno pendente",
      description: "Não há famílias aguardando acompanhamento.",
    },
  };

  const selected = content[type] || content[FOLLOW_UP_FILTER.ALL];

  return (
    <Panel className="px-6 py-10 text-center">
      <p className="font-semibold">{selected.title}</p>
      <p className="mt-1 text-sm text-muted">{selected.description}</p>
    </Panel>
  );
}
