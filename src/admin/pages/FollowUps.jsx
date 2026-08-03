import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  CircleCheckBig,
  Clock3,
  GraduationCap,
  ListPlus,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  RotateCcw,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import {
  WAITING_REASON_CARD_LABELS,
} from "../../constants/waitingListReasons";

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

const LOST_REASONS = [
  {
    value: "price",
    label: "Valor",
  },
  {
    value: "schedule",
    label: "Horário",
  },
  {
    value: "distance",
    label: "Distância",
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
    value: "no_vacancy",
    label: "Sem vaga disponível",
  },
  {
    value: "other",
    label: "Outro",
  },
];
 

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [waitingList, setWaitingList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] =
    useState("today");

  const [actionContact, setActionContact] =
    useState(null);

  const [actionType, setActionType] =
    useState(null);

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
      console.error(
        "Erro ao carregar retornos:",
        err
      );

      setError(
        "Não foi possível carregar os retornos."
      );
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
          payload.notes
        );
      }

      if (actionType === "enroll") {
        updated = await enrollFromFollowUp(
          actionContact.id,
          payload.notes
        );
      }

      if (actionType === "lose") {
        updated = await loseFromFollowUp(
          actionContact.id,
          payload.lostReason,
          payload.notes
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
          current.map((item) =>
            item.id === updated.id
              ? updated
              : item
          )
        );
      } else {
        setFollowUps((current) =>
          current.filter(
            (item) =>
              item.id !== actionContact.id
          )
        );
      }

      closeActionForce();
    } catch (err) {
      console.error(
        "Erro ao atualizar retorno:",
        err
      );

      alert(
        err?.message ||
          "Não foi possível atualizar o retorno."
      );
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

      await closeWaitingListContact(
        actionContact.id,
        {
          lostReason: payload.lostReason,
          notes: payload.notes,
        }
      );

      setWaitingList((current) =>
        current.filter(
          (item) =>
            item.id !== actionContact.id
        )
      );

      closeActionForce();
    } catch (err) {
      console.error(
        "Erro ao encerrar lista de interesse:",
        err
      );

      alert(
        err?.message ||
          "Não foi possível encerrar o contato."
      );
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
      (item) =>
        item.follow_up_date &&
        item.follow_up_date < today
    ).length;

    const todayCount = followUps.filter(
      (item) =>
        item.follow_up_date === today
    ).length;

    const upcoming = followUps.filter(
      (item) =>
        item.follow_up_date &&
        item.follow_up_date > today
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
      result = result.filter(
        (item) =>
          item.follow_up_date === today
      );
    }

    if (activeFilter === "overdue") {
      result = result.filter(
        (item) =>
          item.follow_up_date &&
          item.follow_up_date < today
      );
    }

    if (activeFilter === "upcoming") {
      result = result.filter(
        (item) =>
          item.follow_up_date &&
          item.follow_up_date > today
      );
    }

    return result.sort((a, b) =>
      (a.follow_up_date || "").localeCompare(
        b.follow_up_date || ""
      )
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
          <RefreshCw
            size={17}
            className={
              loading ? "animate-spin" : ""
            }
          />

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
          const active =
            activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() =>
                setActiveFilter(filter.value)
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
          <p className="font-semibold text-red-700">
            {error}
          </p>

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

      {!loading &&
        !error &&
        activeFilter !== "waiting_list" && (
          <>
            {filteredFollowUps.length === 0 ? (
              <EmptyState
                type={activeFilter}
              />
            ) : (
              <div className="space-y-4">
                {filteredFollowUps.map(
                  (item) => (
                    <FollowUpCard
                      key={item.id}
                      item={item}
                      today={today}
                      onAction={openAction}
                    />
                  )
                )}
              </div>
            )}
          </>
        )}

      {/* LISTA DE INTERESSE */}

      {!loading &&
        !error &&
        activeFilter === "waiting_list" && (
          <>
            {waitingList.length === 0 ? (
              <EmptyState
                type="waiting_list"
              />
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
        <ActionModal
          contact={actionContact}
          type={actionType}
          saving={saving}
          onClose={closeAction}
          onSave={
            actionType ===
            "close_waiting_list"
              ? handleCloseWaitingList
              : handleFollowUpAction
          }
        />
      )}
    </div>
  );
}

/*
 * CARD DE RETORNO
 */

function FollowUpCard({
  item,
  today,
  onAction,
}) {
  const whatsappUrl =
    createWhatsAppUrl(item.phone);

  const isOverdue =
    item.follow_up_date < today;

  const isToday =
    item.follow_up_date === today;

  const daysLate = isOverdue
    ? daysBetween(
        item.follow_up_date,
        today
      )
    : 0;

  return (
    <article
      className={`
        overflow-hidden
        rounded-2xl
        border
        bg-white
        transition
        hover:shadow-md
        ${
          isOverdue
            ? "border-red-200"
            : "border-neutral-200"
        }
      `}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {item.category?.name && (
                <span className="text-sm font-semibold text-red-600">
                  {item.category.name}
                </span>
              )}

              {item.experimental_date && (
                <>
                  <span className="text-neutral-300">
                    •
                  </span>

                  <span className="text-sm text-neutral-500">
                    Experimental em{" "}
                    {formatDate(
                      item.experimental_date
                    )}
                  </span>
                </>
              )}
            </div>

            <h3 className="mt-2 text-xl font-bold text-neutral-900">
              {item.child_name}
            </h3>
          </div>

          <FollowUpBadge
            isOverdue={isOverdue}
            isToday={isToday}
            daysLate={daysLate}
            date={item.follow_up_date}
          />
        </div>

        <div className="mt-6 grid gap-5 border-t border-neutral-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Info
            label="Responsável"
            value={item.responsible_name}
          />

          <Info
            label="WhatsApp"
            value={item.phone}
          />

          <Info
            label="Retorno"
            value={formatDate(
              item.follow_up_date
            )}
          />

          <Info
            label="Origem"
            value={item.source}
          />
        </div>

        {item.internal_notes && (
          <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Observação
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
              {item.internal_notes}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:flex-wrap">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-neutral-200
                px-4
                py-3
                text-sm
                font-semibold
                text-neutral-700
                transition
                hover:bg-neutral-50
              "
            >
              <MessageCircle size={17} />
              WhatsApp
            </a>
          )}

          <button
            type="button"
            onClick={() =>
              onAction(item, "enroll")
            }
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-green-600
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-green-700
            "
          >
            <GraduationCap size={17} />
            Matriculou
          </button>

          <button
            type="button"
            onClick={() =>
              onAction(
                item,
                "reschedule"
              )
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
            <RotateCcw size={17} />
            Reagendar retorno
          </button>

          <button
            type="button"
            onClick={() =>
              onAction(item, "lose")
            }
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-neutral-200
              px-4
              py-3
              text-sm
              font-semibold
              text-neutral-700
              transition
              hover:bg-neutral-50
            "
          >
            <XCircle size={17} />
            Não converteu
          </button>
        </div>
      </div>
    </article>
  );
}

/*
 * CARD DA LISTA DE INTERESSE
 */

function WaitingListCard({
  item,
  onAction,
}) {
  const whatsappUrl =
    createWhatsAppUrl(item.phone);

  const reason =
  WAITING_REASON_CARD_LABELS[item.waiting_list_reason] ||
  "Lista de interesse";

  return (
    <article className="rounded-2xl border border-amber-200 bg-white p-5 transition hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {item.category?.name && (
            <p className="text-sm font-semibold text-red-600">
              {item.category.name}
            </p>
          )}

          <h3 className="mt-2 text-xl font-bold text-neutral-900">
            {item.child_name}
          </h3>
        </div>

        <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
          Lista de interesse
        </span>
      </div>

      <div className="mt-6 grid gap-5 border-t border-neutral-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
        <Info
          label="Responsável"
          value={item.responsible_name}
        />

        <Info
          label="WhatsApp"
          value={item.phone}
        />

        <Info
          label="Aguardando"
          value={reason}
        />

        <Info
          label="Desde"
          value={
            item.waiting_list_at
              ? formatDateTime(
                  item.waiting_list_at
                )
              : null
          }
        />
      </div>

      {item.waiting_list_notes && (
        <div className="mt-5 rounded-2xl bg-amber-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Interesse
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
            {item.waiting_list_notes}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:flex-wrap">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-neutral-200
              px-4
              py-3
              text-sm
              font-semibold
              text-neutral-700
              transition
              hover:bg-neutral-50
            "
          >
            <MessageCircle size={17} />
            WhatsApp
          </a>
        )}

        <button
          type="button"
          onClick={() =>
            alert(
              "Na próxima etapa vamos conectar este botão à agenda de experimentais."
            )
          }
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-red-600
            px-4
            py-3
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-red-700
          "
        >
          <CalendarDays size={17} />
          Agendar experimental
        </button>

        <button
          type="button"
          onClick={() =>
            onAction(
              item,
              "close_waiting_list"
            )
          }
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-neutral-200
            px-4
            py-3
            text-sm
            font-semibold
            text-neutral-700
            transition
            hover:bg-neutral-50
          "
        >
          <XCircle size={17} />
          Encerrar
        </button>
      </div>
    </article>
  );
}

/*
 * MODAL DE AÇÃO
 */

function ActionModal({
  contact,
  type,
  saving,
  onClose,
  onSave,
}) {
  const [followUpDate, setFollowUpDate] =
    useState("");

  const [lostReason, setLostReason] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const config = getModalConfig(type);

  function handleSubmit(event) {
    event.preventDefault();

    if (
      type === "reschedule" &&
      !followUpDate
    ) {
      alert(
        "Informe a nova data do retorno."
      );
      return;
    }

    if (
      (type === "lose" ||
        type ===
          "close_waiting_list") &&
      !lostReason
    ) {
      alert(
        "Informe o motivo do encerramento."
      );
      return;
    }

    onSave({
      followUpDate,
      lostReason,
      notes,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-neutral-100 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
              {config.eyebrow}
            </p>

            <h2 className="mt-2 text-2xl font-bold text-neutral-900">
              {contact.child_name}
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              {config.description}
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6"
        >
          {type === "enroll" && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <div className="flex gap-3">
                <CircleCheckBig
                  size={20}
                  className="mt-0.5 shrink-0 text-green-700"
                />

                <div>
                  <p className="font-semibold text-green-900">
                    Confirmar matrícula
                  </p>

                  <p className="mt-1 text-sm text-green-700">
                    O contato sairá da fila de retornos e será registrado como matriculado.
                  </p>
                </div>
              </div>
            </div>
          )}

          {type === "reschedule" && (
            <div>
              <label className="text-sm font-semibold text-neutral-900">
                Nova data do retorno
              </label>

              <input
                type="date"
                min={getTodayISO()}
                value={followUpDate}
                onChange={(event) =>
                  setFollowUpDate(
                    event.target.value
                  )
                }
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  px-4
                  py-3
                  outline-none
                  focus:border-red-500
                  focus:ring-2
                  focus:ring-red-100
                "
              />
            </div>
          )}

          {(type === "lose" ||
            type ===
              "close_waiting_list") && (
            <div>
              <label className="text-sm font-semibold text-neutral-900">
                Motivo
              </label>

              <select
                value={lostReason}
                onChange={(event) =>
                  setLostReason(
                    event.target.value
                  )
                }
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-4
                  py-3
                  outline-none
                  focus:border-red-500
                  focus:ring-2
                  focus:ring-red-100
                "
              >
                <option value="">
                  Selecione
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
          )}

          <div className="mt-6">
            <label className="text-sm font-semibold text-neutral-900">
              Observação

              <span className="ml-1 font-normal text-neutral-400">
                (opcional)
              </span>
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              placeholder={config.placeholder}
              className="
                mt-2
                w-full
                resize-none
                rounded-xl
                border
                border-neutral-200
                px-4
                py-3
                outline-none
                focus:border-red-500
                focus:ring-2
                focus:ring-red-100
              "
            />
          </div>

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
                : config.button}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getModalConfig(type) {
  const configs = {
    enroll: {
      eyebrow: "Conversão",
      description:
        "Registre a matrícula deste contato.",
      button: "Confirmar matrícula",
      placeholder:
        "Ex.: Família confirmou a matrícula...",
    },

    reschedule: {
      eyebrow: "Novo retorno",
      description:
        "Escolha quando este contato deve voltar para sua fila.",
      button: "Reagendar retorno",
      placeholder:
        "Ex.: Mãe pediu para chamar novamente após o dia 30...",
    },

    lose: {
      eyebrow: "Encerrar oportunidade",
      description:
        "Registre por que este contato não converteu.",
      button: "Registrar não conversão",
      placeholder:
        "Ex.: Família informou que o horário não atende...",
    },

    close_waiting_list: {
      eyebrow: "Encerrar interesse",
      description:
        "Registre por que a família não deseja mais aguardar.",
      button: "Encerrar contato",
      placeholder:
        "Ex.: Família encontrou outra opção...",
    },
  };

  return configs[type] || configs.lose;
}

/*
 * BADGE DO RETORNO
 */

function FollowUpBadge({
  isOverdue,
  isToday,
  daysLate,
  date,
}) {
  if (isOverdue) {
    return (
      <span className="w-fit rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
        {daysLate === 1
          ? "Atrasado 1 dia"
          : `Atrasado ${daysLate} dias`}
      </span>
    );
  }

  if (isToday) {
    return (
      <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
        Retorno hoje
      </span>
    );
  }

  return (
    <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
      {formatDate(date)}
    </span>
  );
}

/*
 * CARD DE INDICADOR
 */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  danger = false,
}) {
  return (
    <div
      className={`
        rounded-2xl
        border
        bg-white
        p-4
        sm:p-6
        ${
          danger
            ? "border-red-200"
            : "border-neutral-200"
        }
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

          <p className="mt-1 text-xs text-neutral-400">
            {subtitle}
          </p>
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

function Info({ label, value }) {
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

/*
 * ESTADO VAZIO
 */

function EmptyState({ type }) {
  const content = {
    today: {
      title: "Nenhum retorno para hoje",
      description:
        "Sua agenda de contatos está livre hoje.",
      icon: PhoneCall,
    },

    overdue: {
      title: "Nenhum retorno atrasado",
      description:
        "Todos os acompanhamentos estão em dia.",
      icon: CircleCheckBig,
    },

    upcoming: {
      title: "Nenhum próximo retorno",
      description:
        "Não existem contatos agendados para os próximos dias.",
      icon: CalendarClock,
    },

    all: {
      title: "Nenhum retorno pendente",
      description:
        "Não existem oportunidades aguardando acompanhamento.",
      icon: UserRound,
    },

    waiting_list: {
      title: "Lista de interesse vazia",
      description:
        "Nenhuma família está aguardando vaga ou abertura de turma.",
      icon: ListPlus,
    },
  };

  const selected =
    content[type] || content.all;

  const Icon = selected.icon;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-14 text-center">
      <Icon
        size={32}
        className="mx-auto text-neutral-300"
      />

      <h3 className="mt-4 text-lg font-bold text-neutral-900">
        {selected.title}
      </h3>

      <p className="mt-2 text-sm text-neutral-500">
        {selected.description}
      </p>
    </div>
  );
}

/*
 * HELPERS
 */

function getTodayISO() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(
    `${dateString}T00:00:00`
  );

  return date.toLocaleDateString(
    "pt-BR"
  );
}

function formatDateTime(dateString) {
  if (!dateString) return "-";

  return new Date(
    dateString
  ).toLocaleDateString("pt-BR");
}

function daysBetween(from, to) {
  const start = new Date(
    `${from}T12:00:00`
  );

  const end = new Date(
    `${to}T12:00:00`
  );

  const difference =
    end.getTime() - start.getTime();

  return Math.floor(
    difference /
      (1000 * 60 * 60 * 24)
  );
}

function createWhatsAppUrl(phone) {
  if (!phone) return null;

  const numbers =
    phone.replace(/\D/g, "");

  if (!numbers) return null;

  const internationalPhone =
    numbers.startsWith("55")
      ? numbers
      : `55${numbers}`;

  return `https://wa.me/${internationalPhone}`;
}