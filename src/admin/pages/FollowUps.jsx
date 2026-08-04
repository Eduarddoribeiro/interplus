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
import WaitingListQualificationModal from "../components/followUps/WaitingListQualificationModal";
import { getTodayISO } from "../../helpers/contactPresentation";
import {
  FOLLOW_UP_FILTER,
  FOLLOW_UP_FILTER_OPTIONS,
} from "../../constants/followUpFilters";
import { FOLLOW_UP_ACTION } from "../../constants/followUpActions";

import { CONTACT_STATUS } from "../../constants/contactStatus";
import { INITIAL_WAITING_LIST_FILTERS } from "../../constants/waitingListFilters";
import WaitingListFilters from "../components/waitingList/WaitingListFilters";
import {
  getFollowUpCenter,
  scheduleFollowUp,
  enrollFromFollowUp,
  loseFromFollowUp,
  closeWaitingListContact,
  updateContact,
  addContactInternalNote,
} from "../../services/contacts";
import { filterWaitingList } from "../../helpers/waitingListFilters";

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [waitingList, setWaitingList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState(FOLLOW_UP_FILTER.TODAY);

  const [waitingListFilters, setWaitingListFilters] = useState(
    INITIAL_WAITING_LIST_FILTERS,
  );

  const [actionContact, setActionContact] = useState(null);

  const [actionType, setActionType] = useState(null);

  const [saving, setSaving] = useState(false);

  const [
  qualificationContact,
  setQualificationContact,
] = useState(null);

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
    if (type === FOLLOW_UP_ACTION.QUALIFY) {
      setQualificationContact(contact);
      return;
    }
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
       * Se continuou sendo retorno,
       * atualizamos o card.
       *
       * Se matriculou/perdeu,
       * removemos da fila.
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
  async function handleSaveQualification(payload) {
    if (!qualificationContact) {
      return;
    }

    try {
      setSaving(true);

      const { notes, ...contactUpdates } = payload;

      await updateContact(qualificationContact.id, contactUpdates);

      if (notes?.trim()) {
        await addContactInternalNote(
          qualificationContact.id,
          `Qualificação da lista de interesse: ${notes.trim()}`,
        );
      }

      setQualificationContact(null);

      await loadData();
    } catch (err) {
      console.error("Erro ao salvar qualificação:", err);

      alert(err?.message || "Não foi possível salvar a qualificação.");
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
    if (activeFilter === FOLLOW_UP_FILTER.WAITING_LIST) {
      return [];
    }

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

  const filteredWaitingList = useMemo(() => {
    return filterWaitingList(waitingList, waitingListFilters);
  }, [waitingList, waitingListFilters]);

  const waitingListCategories = useMemo(() => {
    const map = new Map();

    waitingList.forEach((item) => {
      const category = item.interest_category || item.category;

      if (!category?.id) {
        return;
      }

      map.set(String(category.id), category);
    });

    return Array.from(map.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", "pt-BR"),
    );
  }, [waitingList]);

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
        {FOLLOW_UP_FILTER_OPTIONS.map((filter) => {
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

      {!loading && !error && activeFilter !== FOLLOW_UP_FILTER.WAITING_LIST && (
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
      {/* LISTA DE INTERESSE */}

      {!loading && !error && activeFilter === FOLLOW_UP_FILTER.WAITING_LIST && (
        <div className="space-y-4">
          <WaitingListFilters
            categories={waitingListCategories}
            filters={waitingListFilters}
            onChange={setWaitingListFilters}
            onClear={() =>
              setWaitingListFilters({
                ...INITIAL_WAITING_LIST_FILTERS,
              })
            }
          />

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-neutral-500">
              {filteredWaitingList.length === waitingList.length
                ? `${waitingList.length} ${
                    waitingList.length === 1 ? "família" : "famílias"
                  } na lista`
                : `${filteredWaitingList.length} de ${waitingList.length} famílias`}
            </p>
          </div>

          {filteredWaitingList.length === 0 ? (
            waitingList.length === 0 ? (
              <EmptyState type={FOLLOW_UP_FILTER.WAITING_LIST} />
            ) : (
              <WaitingListFilteredEmptyState
                onClear={() =>
                  setWaitingListFilters({
                    ...INITIAL_WAITING_LIST_FILTERS,
                  })
                }
              />
            )
          ) : (
            <div className="space-y-4">
              {filteredWaitingList.map((item) => (
                <WaitingListCard
                  key={item.id}
                  item={item}
                  onAction={openAction}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL */}

      {actionContact && (
        <FollowUpActionModal
          contact={actionContact}
          type={actionType}
          saving={saving}
          onClose={closeAction}
          onSave={
            actionType === FOLLOW_UP_ACTION.CLOSE_WAITING_LIST
              ? handleCloseWaitingList
              : handleFollowUpAction
          }
        />
      )}

      {qualificationContact && (
        <WaitingListQualificationModal
          contact={qualificationContact}
          categories={waitingListCategories}
          saving={saving}
          onClose={() => setQualificationContact(null)}
          onSave={handleSaveQualification}
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

    [FOLLOW_UP_FILTER.WAITING_LIST]: {
      title: "Lista de interesse vazia",
      description: "Nenhuma família está aguardando vaga ou abertura de turma.",
      icon: ListPlus,
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

function WaitingListFilteredEmptyState({ onClear }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-14 text-center">
      <UserRound size={32} className="mx-auto text-neutral-300" />

      <h3 className="mt-4 text-lg font-bold text-neutral-900">
        Nenhuma família encontrada
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
        Nenhum contato da lista de interesse corresponde aos filtros
        selecionados.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-5 text-sm font-semibold text-red-600 transition hover:text-red-700"
      >
        Limpar filtros
      </button>
    </div>
  );
}
