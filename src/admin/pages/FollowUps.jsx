import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CalendarClock,
  CircleCheckBig,
  ListPlus,
  PhoneCall,
  RefreshCw,
  UserRound,
} from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";

import FollowUpCard from "../components/followUps/FollowUpCard";
import WaitingListCard from "../components/followUps/WaitingListCard";
import FollowUpActionModal from "../components/followUps/FollowUpActionModal";
import { getTodayISO } from "../../helpers/contactPresentation";

import {
  getFollowUpCenter,
  scheduleFollowUp,
  enrollFromFollowUp,
  loseFromFollowUp,
  closeWaitingListContact,
} from "../../services/contacts";

const FILTERS = [
  {
    value: "today",
    label: "Hoje",
  },
  {
    value: "overdue",
    label: "Atrasados",
  },
  {
    value: "upcoming",
    label: "Próximos",
  },
  {
    value: "all",
    label: "Todos",
  },
  {
    value: "waiting_list",
    label: "Lista de interesse",
  },
];

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [waitingList, setWaitingList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState("today");

  const [actionContact, setActionContact] = useState(null);

  const [actionType, setActionType] = useState(null);

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

      setFollowUps(data.followUps || []);
      setWaitingList(data.waitingList || []);
    } catch (err) {
      console.error("Erro ao carregar retornos:", err);

      setError("Não foi possível carregar os retornos.");
    } finally {
      setLoading(false);
    }
  }

  function openAction(contact, type) {
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

      let updated;

      if (actionType === "reschedule") {
        updated = await scheduleFollowUp(
          actionContact.id,
          payload.followUpDate,
          payload.notes,
        );
      }

      if (actionType === "enroll") {
        updated = await enrollFromFollowUp(actionContact.id, payload.notes);
      }

      if (actionType === "lose") {
        updated = await loseFromFollowUp(
          actionContact.id,
          payload.lostReason,
          payload.notes,
        );
      }

      /*
       * Se continuou sendo retorno,
       * atualizamos o card.
       *
       * Se matriculou/perdeu,
       * removemos da fila.
       */
      if (updated?.status === "follow_up") {
        setFollowUps((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      } else {
        setFollowUps((current) =>
          current.filter((item) => item.id !== actionContact.id),
        );
      }

      closeActionForce();
    } catch (err) {
      console.error("Erro ao atualizar retorno:", err);

      alert(err?.message || "Não foi possível atualizar o retorno.");
    } finally {
      setSaving(false);
    }
  }

  /*
   * Encerra alguém que estava
   * na lista de interesse.
   */
  async function handleCloseWaitingList(payload) {
    if (!actionContact) return;

    try {
      setSaving(true);

      await closeWaitingListContact(actionContact.id, {
        lostReason: payload.lostReason,
        notes: payload.notes,
      });

      setWaitingList((current) =>
        current.filter((item) => item.id !== actionContact.id),
      );

      closeActionForce();
    } catch (err) {
      console.error("Erro ao encerrar lista de interesse:", err);

      alert(err?.message || "Não foi possível encerrar o contato.");
    } finally {
      setSaving(false);
    }
  }

  function closeActionForce() {
    setActionContact(null);
    setActionType(null);
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
      waiting: waitingList.length,
    };
  }, [followUps, waitingList, today]);

  /*
   * FILTRO DA FILA
   */

  const filteredFollowUps = useMemo(() => {
    if (activeFilter === "waiting_list") {
      return [];
    }

    let result = [...followUps];

    if (activeFilter === "today") {
      result = result.filter((item) => item.follow_up_date === today);
    }

    if (activeFilter === "overdue") {
      result = result.filter(
        (item) => item.follow_up_date && item.follow_up_date < today,
      );
    }

    if (activeFilter === "upcoming") {
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
      {/* TÍTULO */}

      <SectionTitle
        title="Retornos"
        description="Acompanhe oportunidades que precisam de novo contato e famílias aguardando vaga ou turma."
      />

      {/* INDICADORES */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
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

        <StatCard
          title="Lista de interesse"
          value={stats.waiting}
          subtitle="Aguardando oportunidade"
          icon={ListPlus}
        />
      </div>

      {/* CABEÇALHO */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">
            Central de oportunidades
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Veja quem precisa ser contatado e registre o próximo passo.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
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
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* FILTROS */}

      <div
        className="
          flex
          flex-wrap
          gap-2
          rounded-2xl
          border
          border-neutral-200
          bg-white
          p-3
        "
      >
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
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

      {!loading && !error && activeFilter !== "waiting_list" && (
        <>
          {filteredFollowUps.length === 0 ? (
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
          )}
        </>
      )}

      {/* LISTA DE INTERESSE */}

      {!loading && !error && activeFilter === "waiting_list" && (
        <>
          {waitingList.length === 0 ? (
            <EmptyState type="waiting_list" />
          ) : (
            <div className="space-y-4">
              {waitingList.map((item) => (
                <WaitingListCard
                  key={item.id}
                  item={item}
                  onAction={openAction}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL */}

      {actionContact && (
        <FollowUpActionModal
          contact={actionContact}
          type={actionType}
          saving={saving}
          onClose={closeAction}
          onSave={
            actionType === "close_waiting_list"
              ? handleCloseWaitingList
              : handleFollowUpAction
          }
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
    today: {
      title: "Nenhum retorno para hoje",
      description: "Sua agenda de contatos está livre hoje.",
      icon: PhoneCall,
    },

    overdue: {
      title: "Nenhum retorno atrasado",
      description: "Todos os acompanhamentos estão em dia.",
      icon: CircleCheckBig,
    },

    upcoming: {
      title: "Nenhum próximo retorno",
      description: "Não existem contatos agendados para os próximos dias.",
      icon: CalendarClock,
    },

    all: {
      title: "Nenhum retorno pendente",
      description: "Não existem oportunidades aguardando acompanhamento.",
      icon: UserRound,
    },

    waiting_list: {
      title: "Lista de interesse vazia",
      description: "Nenhuma família está aguardando vaga ou abertura de turma.",
      icon: ListPlus,
    },
  };

  const selected = content[type] || content.all;

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

 