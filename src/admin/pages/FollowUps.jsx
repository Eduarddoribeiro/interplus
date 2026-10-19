import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CircleCheckBig,
  PhoneCall,
  RefreshCw,
  UserRound,
} from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";

import FollowUpCard from "../components/followUps/FollowUpCard";
import FollowUpActionModal from "../components/followUps/ContactActionModal";
import { getTodayISO } from "../../helpers/contactPresentation";
import {
  FOLLOW_UP_FILTER,
  FOLLOW_UP_FILTER_OPTIONS,
} from "../../constants/followUpFilters";
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

  async function loadData() {
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

      if (!hasToday && hasOverdue) {
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          title="Retornos"
          description="Famílias que precisam de um novo contato. Registre o próximo passo de cada uma."
        />

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {notice && (
        <div className="rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white">
          {notice}
        </div>
      )}

      {/* INDICADORES */}

      <div className="grid grid-cols-3 gap-3 lg:gap-6">
        <StatCard
          title="Atrasados"
          value={stats.overdue}
          subtitle="Precisam de atenção"
          icon={AlertCircle}
          danger={stats.overdue > 0}
        />

        <StatCard
          title="Hoje"
          value={stats.today}
          subtitle="Contatos para hoje"
          icon={PhoneCall}
        />

        <StatCard
          title="Próximos"
          value={stats.upcoming}
          subtitle="Agendados"
          icon={CalendarClock}
        />
      </div>

      {waitingCount > 0 && (
        <Link
          to="/admin/waiting-list"
          className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm text-neutral-600 transition hover:bg-neutral-50"
        >
          <span>
            <strong className="text-neutral-900">{waitingCount}</strong>{" "}
            famíli{waitingCount === 1 ? "a" : "as"} na lista de interesse
          </span>

          <span className="flex items-center gap-1 font-semibold text-neutral-900">
            Abrir lista <ArrowRight size={15} />
          </span>
        </Link>
      )}

      {/* FILTROS */}

      <div className="flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-white p-3">
        {FOLLOW_UP_FILTER_OPTIONS.map((filter) => {
          const active = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* LOADING */}

      {loading && (
        <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-red-600" />

          <p className="mt-4 text-sm text-neutral-500">
            Carregando retornos...
          </p>
        </div>
      )}

      {/* ERRO */}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">{error}</p>

          <button
            type="button"
            onClick={loadData}
            className="mt-3 text-sm font-semibold text-red-700 underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* RETORNOS */}

      {!loading && !error && (
        filteredFollowUps.length === 0 ? (
          <EmptyState type={activeFilter} />
        ) : (
          <div className="space-y-4">
            {filteredFollowUps.map((item) => (
              <FollowUpCard
                key={item.id}
                item={item}
                today={today}
                onAction={openAction}
              />
            ))}
          </div>
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
 * CARD DE INDICADOR
 */

function StatCard({ title, value, subtitle, icon: Icon, danger = false }) {
  return (
    <div
      className={`
        rounded-2xl
        border
        bg-white
        p-4
        sm:p-6
        ${danger ? "border-red-200" : "border-neutral-200"}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutral-500 sm:text-sm">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-neutral-900 sm:text-3xl">
            {value}
          </p>

          <p className="mt-1 text-xs text-neutral-400">{subtitle}</p>
        </div>

        <div
          className={`
            rounded-xl
            p-2.5
            sm:p-3
            ${
              danger
                ? "bg-red-50 text-red-600"
                : "bg-neutral-100 text-neutral-600"
            }
          `}
        >
          <Icon size={20} />
        </div>
      </div>
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
      description: "Sua agenda de contatos está livre hoje.",
      icon: PhoneCall,
    },

    [FOLLOW_UP_FILTER.OVERDUE]: {
      title: "Nenhum retorno atrasado",
      description: "Todos os acompanhamentos estão em dia.",
      icon: CircleCheckBig,
    },

    [FOLLOW_UP_FILTER.UPCOMING]: {
      title: "Nenhum próximo retorno",
      description: "Não existem contatos agendados para os próximos dias.",
      icon: CalendarClock,
    },

    [FOLLOW_UP_FILTER.ALL]: {
      title: "Nenhum retorno pendente",
      description: "Não existem oportunidades aguardando acompanhamento.",
      icon: UserRound,
    },

  };

  const selected = content[type] || content[FOLLOW_UP_FILTER.ALL];

  const Icon = selected.icon;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-14 text-center">
      <Icon size={32} className="mx-auto text-neutral-300" />

      <h3 className="mt-4 text-lg font-bold text-neutral-900">
        {selected.title}
      </h3>

      <p className="mt-2 text-sm text-neutral-500">{selected.description}</p>
    </div>
  );
}

