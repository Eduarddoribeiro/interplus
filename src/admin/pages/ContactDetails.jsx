import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  History,
  ListPlus,
  Loader2,
  MessageCircle,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
  X,
  XCircle,
} from "lucide-react";

import {
  addToWaitingList,
  closeOpportunity,
  deleteExperimentalSession,
  enrollContact,
  getContactById,
  getContactExperimentalSessions,
  rescheduleExperimental,
  scheduleFollowUp,
  updateContact,
  updateExperimentalSessionStatus,
} from "../../services/contacts";

import { WAITING_LIST_REASONS } from "../../constants/waitingListReasons";
import { supabase } from "../../lib/supabase";

/* =========================================================
 * CONSTANTES
 * ========================================================= */

const STATUS_LABELS = {
  new: "Novo contato",
  pending_confirmation: "Aguardando confirmação",
  confirmed: "Experimental confirmada",
  attended: "Compareceu",
  no_show: "Não compareceu",
  cancelled: "Cancelada",
  follow_up: "Em retorno",
  waiting_list: "Lista de interesse",
  enrolled: "Matriculado",
  lost: "Encerrado",
};

const SESSION_STATUS_LABELS = {
  pending_confirmation: "Aguardando confirmação",
  confirmed: "Confirmada",
  attended: "Compareceu",
  no_show: "Não compareceu",
  cancelled: "Cancelada",
};

 

const LOST_REASONS = [
  { value: "schedule", label: "Horário incompatível" },
  { value: "location", label: "Localização/distância" },
  { value: "financial", label: "Questão financeira" },
  { value: "no_interest", label: "Sem interesse no momento" },
  { value: "other_school", label: "Optou por outra escola" },
  { value: "no_response", label: "Sem retorno do responsável" },
  { value: "age_category", label: "Categoria/idade incompatível" },
  { value: "other", label: "Outro motivo" },
];

/* =========================================================
 * HELPERS
 * ========================================================= */

function formatDate(value) {
  if (!value) return "—";

  const datePart = String(value).slice(0, 10);
  const [year, month, day] = datePart.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "—";

  return String(value).slice(0, 5);
}

function calculateAge(birthDate) {
  if (!birthDate) return null;

  const [year, month, day] = String(birthDate)
    .slice(0, 10)
    .split("-")
    .map(Number);

  if (!year || !month || !day) return null;

  const today = new Date();
  let age = today.getFullYear() - year;

  const monthDiff = today.getMonth() + 1 - month;

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < day)
  ) {
    age -= 1;
  }

  return age;
}

function todayInputValue() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 10);
}

function normalizePhone(phone) {
  if (!phone) return "";

  let digits = String(phone).replace(/\D/g, "");

  if (!digits) return "";

  if (!digits.startsWith("55")) {
    digits = `55${digits}`;
  }

  return digits;
}

function getStatusClass(status) {
  switch (status) {
    case "enrolled":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "attended":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "confirmed":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case "pending_confirmation":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "follow_up":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "waiting_list":
      return "bg-violet-50 text-violet-700 border-violet-200";

    case "no_show":
    case "lost":
      return "bg-red-50 text-red-700 border-red-200";

    case "cancelled":
      return "bg-neutral-100 text-neutral-600 border-neutral-200";

    default:
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
  }
}

function getReasonLabel(options, value) {
  if (!value) return "—";

  return (
    options.find((item) => item.value === value)?.label ||
    value
  );
}

/* =========================================================
 * COMPONENTES AUXILIARES
 * ========================================================= */

function Modal({
  open,
  title,
  description,
  children,
  onClose,
  maxWidth = "max-w-lg",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`w-full ${maxWidth} overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              {title}
            </h2>

            {description ? (
              <p className="mt-1 text-sm text-neutral-500">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-neutral-800">
        {value || "—"}
      </p>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  title,
  description,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
        danger
          ? "border-red-200 bg-red-50 hover:bg-red-100"
          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
      }`}
    >
      <div
        className={`rounded-lg p-2 ${
          danger
            ? "bg-red-100 text-red-700"
            : "bg-neutral-100 text-neutral-700"
        }`}
      >
        <Icon size={18} />
      </div>

      <div>
        <p
          className={`text-sm font-bold ${
            danger ? "text-red-800" : "text-neutral-900"
          }`}
        >
          {title}
        </p>

        <p
          className={`mt-1 text-xs leading-relaxed ${
            danger ? "text-red-600" : "text-neutral-500"
          }`}
        >
          {description}
        </p>
      </div>
    </button>
  );
}

/* =========================================================
 * PÁGINA
 * ========================================================= */

export default function ContactDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contact, setContact] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modal, setModal] = useState(null);

  const [enrollmentForm, setEnrollmentForm] = useState({
    enrolledAt: todayInputValue(),
    notes: "",
  });

  const [followUpForm, setFollowUpForm] = useState({
    followUpDate: "",
    notes: "",
  });

const [waitingForm, setWaitingForm] = useState({
  reason: "waiting_schedule",
  notes: "",

  categoryId: "",
  preferredShift: "",
  preferredDays: [],
});

  const [experimentalForm, setExperimentalForm] = useState({
    categoryId: "",
    experimentalDate: "",
    experimentalTime: "",
    notes: "",
  });

  const [closeForm, setCloseForm] = useState({
    lostReason: "schedule",
    notes: "",
  });

  const [correctionForm, setCorrectionForm] = useState({
    sessionId: "",
    currentStatus: "",
    status: "",
    reason: "",
  });

  const [deleteSessionId, setDeleteSessionId] = useState(null);

  const [editForm, setEditForm] = useState({
    child_name: "",
    birth_date: "",
    responsible_name: "",
    phone: "",
    email: "",
    neighborhood: "",
    source: "",
    entry_channel: "",
    trained_elsewhere: false,
    previous_club: "",
    category_id: "",
    observations: "",
    internal_notes: "",
    first_contact_at: "",
  });

  const age = useMemo(
    () => calculateAge(contact?.birth_date),
    [contact?.birth_date]
  );

  const whatsappUrl = useMemo(() => {
    const phone = normalizePhone(contact?.phone);

    if (!phone) return null;

    return `https://wa.me/${phone}`;
  }, [contact?.phone]);

  /* =======================================================
   * CARREGAMENTO
   * ======================================================= */

  async function loadData(showMainLoader = false) {
    try {
      if (showMainLoader) {
        setLoading(true);
      }

      setError("");

      const [contactData, sessionsData, categoriesResult] =
        await Promise.all([
          getContactById(id),
          getContactExperimentalSessions(id),
          supabase
            .from("categories")
            .select(`
              id,
              name,
              weekday,
              start_time,
              end_time,
              trial_status,
              experimental_limit
            `)
            .order("name", { ascending: true }),
        ]);

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      setContact(contactData);
      setSessions(sessionsData || []);
      setCategories(categoriesResult.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          "Não foi possível carregar a ficha do contato."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(true);
  }, [id]);

  /* =======================================================
   * MODAIS
   * ======================================================= */

  function closeModal() {
    if (actionLoading) return;

    setModal(null);
    setError("");
  }

  function openEnrollmentModal() {
    setEnrollmentForm({
      enrolledAt: todayInputValue(),
      notes: "",
    });

    setModal("enrollment");
  }

  function openFollowUpModal() {
    setFollowUpForm({
      followUpDate: contact?.follow_up_date
        ? String(contact.follow_up_date).slice(0, 10)
        : "",
      notes: "",
    });

    setModal("follow_up");
  }

  function openWaitingListModal() {
    setWaitingForm({
  reason:
    contact?.waiting_list_reason ||
    "waiting_schedule",

  notes:
    contact?.waiting_list_notes || "",

  categoryId:
    contact?.category_id || "",

  preferredShift:
    contact?.preferred_shift || "",

  preferredDays:
    contact?.preferred_days || [],
});
    setModal("waiting_list");
  }

  function openExperimentalModal() {
    setExperimentalForm({
      categoryId: contact?.category_id || "",
      experimentalDate: "",
      experimentalTime:
        contact?.category?.start_time?.slice(0, 5) || "",
      notes: "",
    });

    setModal("experimental");
  }

  function openCloseModal() {
    setCloseForm({
      lostReason: contact?.lost_reason || "schedule",
      notes: "",
    });

    setModal("close");
  }

  function openEditModal() {
    setEditForm({
      child_name: contact?.child_name || "",
      birth_date: contact?.birth_date
        ? String(contact.birth_date).slice(0, 10)
        : "",
      responsible_name: contact?.responsible_name || "",
      phone: contact?.phone || "",
      email: contact?.email || "",
      neighborhood: contact?.neighborhood || "",
      source: contact?.source || "",
      entry_channel: contact?.entry_channel || "",
      trained_elsewhere: Boolean(contact?.trained_elsewhere),
      previous_club: contact?.previous_club || "",
      category_id: contact?.category_id || "",
      observations: contact?.observations || "",
      internal_notes: contact?.internal_notes || "",
      first_contact_at: contact?.first_contact_at
        ? String(contact.first_contact_at).slice(0, 16)
        : "",
    });

    setModal("edit");
  }

  function openCorrectionModal(session) {
    setCorrectionForm({
      sessionId: session.id,
      currentStatus: session.status,
      status: session.status,
      reason: "",
    });

    setModal("correction");
  }

  function openDeleteExperimentalModal(session) {
  setDeleteSessionId(session.id);
  setModal("delete_experimental");
}
  /* =======================================================
   * EXECUTOR DE AÇÕES
   * ======================================================= */

  async function executeAction(action, successMessage) {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await action();

      setModal(null);
      setSuccess(successMessage);

      await loadData(false);

      window.setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Não foi possível concluir a operação."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =======================================================
   * MATRÍCULA
   * ======================================================= */

  async function handleEnrollment(event) {
    event.preventDefault();

    if (!enrollmentForm.enrolledAt) {
      setError("Informe a data da matrícula.");
      return;
    }

    await executeAction(
      () =>
        enrollContact(id, {
          enrolledAt: enrollmentForm.enrolledAt,
          notes: enrollmentForm.notes,
        }),
      "Matrícula registrada com sucesso."
    );
  }

  /* =======================================================
   * RETORNO
   * ======================================================= */

  async function handleFollowUp(event) {
    event.preventDefault();

    if (!followUpForm.followUpDate) {
      setError("Informe a data do próximo contato.");
      return;
    }

    await executeAction(
      () =>
        scheduleFollowUp(
          id,
          followUpForm.followUpDate,
          followUpForm.notes
        ),
      "Retorno programado com sucesso."
    );
  }

  /* =======================================================
   * LISTA DE INTERESSE
   * ======================================================= */

  async function handleWaitingList(event) {
    event.preventDefault();

    if (!waitingForm.reason) {
      setError("Informe o motivo da lista de interesse.");
      return;
    }

    await executeAction(
      () =>
        addToWaitingList(id,{
    reason: waitingForm.reason,

    notes: waitingForm.notes,

    categoryId: waitingForm.categoryId,

    preferredShift:
        waitingForm.preferredShift,

    preferredDays:
        waitingForm.preferredDays,
}),
      "Contato adicionado à lista de interesse."
    );
  }

  /* =======================================================
   * EXPERIMENTAL
   * ======================================================= */

  async function handleExperimental(event) {
    event.preventDefault();

    if (!experimentalForm.categoryId) {
      setError("Selecione uma categoria.");
      return;
    }

    if (!experimentalForm.experimentalDate) {
      setError("Informe a data da experimental.");
      return;
    }

    await executeAction(
      () =>
        rescheduleExperimental(id, {
          categoryId: experimentalForm.categoryId,
          experimentalDate:
            experimentalForm.experimentalDate,
          experimentalTime:
            experimentalForm.experimentalTime || null,
          notes: experimentalForm.notes,
        }),
      "Experimental agendada com sucesso."
    );
  }

  /* =======================================================
   * ENCERRAMENTO
   * ======================================================= */

  async function handleCloseOpportunity(event) {
    event.preventDefault();

    if (!closeForm.lostReason) {
      setError("Informe o motivo do encerramento.");
      return;
    }

    await executeAction(
      () =>
        closeOpportunity(id, {
          lostReason: closeForm.lostReason,
          notes: closeForm.notes,
        }),
      "Oportunidade encerrada."
    );
  }

  /* =======================================================
   * CORREÇÃO DA EXPERIMENTAL
   * ======================================================= */

  async function handleCorrection(event) {
    event.preventDefault();

    if (!correctionForm.status) {
      setError("Selecione o status correto.");
      return;
    }

    if (
      correctionForm.status !== correctionForm.currentStatus &&
      !correctionForm.reason.trim()
    ) {
      setError(
        "Informe o motivo da correção para manter o histórico administrativo."
      );
      return;
    }

    await executeAction(
      () =>
        updateExperimentalSessionStatus(
          correctionForm.sessionId,
          correctionForm.status,
          correctionForm.reason
        ),
      "Registro da experimental corrigido com sucesso."
    );
  }

  async function handleDeleteExperimental() {
  await executeAction(
    () => deleteExperimentalSession(deleteSessionId),
    "Experimental excluída com sucesso."
  );

  setDeleteSessionId(null);
}

  /* =======================================================
   * EDIÇÃO
   * ======================================================= */

  async function handleEdit(event) {
    event.preventDefault();

    if (!editForm.child_name.trim()) {
      setError("Informe o nome do aluno.");
      return;
    }

    await executeAction(
      () =>
        updateContact(id, {
          ...editForm,
          child_name: editForm.child_name.trim(),
          responsible_name:
            editForm.responsible_name.trim(),
          phone: editForm.phone.trim(),
          email: editForm.email.trim(),
          neighborhood: editForm.neighborhood.trim(),
          source: editForm.source.trim(),
          entry_channel: editForm.entry_channel.trim(),
          previous_club: editForm.previous_club.trim(),
          observations: editForm.observations,
          internal_notes: editForm.internal_notes,
          category_id: editForm.category_id || null,
          birth_date: editForm.birth_date || null,
          first_contact_at:
            editForm.first_contact_at || null,
        }),
      "Dados do contato atualizados."
    );
  }

  /* =======================================================
   * LOADING / ERRO INICIAL
   * ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-neutral-700"
          />

          <p className="mt-3 text-sm text-neutral-500">
            Carregando ficha do contato...
          </p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-bold text-red-800">
          Contato não encontrado
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error ||
            "Não foi possível localizar este contato."}
        </p>

        <button
          type="button"
          onClick={() => navigate("/admin/contacts")}
          className="mt-4 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Voltar para contatos
        </button>
      </div>
    );
  }

  /* =======================================================
   * RENDER
   * ======================================================= */

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/contacts")}
            className="mt-1 rounded-xl border border-neutral-200 bg-white p-2.5 text-neutral-600 transition hover:bg-neutral-50"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-neutral-900">
                {contact.child_name}
              </h1>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                  contact.status
                )}`}
              >
                {STATUS_LABELS[contact.status] ||
                  contact.status ||
                  "Sem status"}
              </span>
            </div>

            <p className="mt-1 text-sm text-neutral-500">
              Ficha completa do contato e histórico comercial.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
            >
              <MessageCircle size={17} />
              WhatsApp
            </a>
          ) : null}

          <button
            type="button"
            onClick={openEditModal}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
          >
            <Edit3 size={17} />
            Editar contato
          </button>
        </div>
      </div>

      {/* MENSAGENS */}

      {success ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 size={18} />
          {success}
        </div>
      ) : null}

      {error && !modal ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          <XCircle size={18} />
          {error}
        </div>
      ) : null}

      {/* GRID PRINCIPAL */}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* DADOS DO ALUNO */}

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <UserRound
                size={20}
                className="text-neutral-500"
              />

              <h2 className="font-bold text-neutral-900">
                Dados do aluno
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Aluno"
                value={contact.child_name}
              />

              <Field
                label="Nascimento"
                value={formatDate(contact.birth_date)}
              />

              <Field
                label="Idade atual"
                value={
                  age !== null
                    ? `${age} ${age === 1 ? "ano" : "anos"}`
                    : "—"
                }
              />

             <Field label="Categoria">
    <select
        value={waitingForm.categoryId}
        onChange={(e)=>
            setWaitingForm(current=>({
                ...current,
                categoryId:e.target.value,
            }))
        }
    >

        <option value="">
            Não definida
        </option>

        {categories.map(category=>(
            <option
                key={category.id}
                value={category.id}
            >
                {category.name}
            </option>
        ))}

    </select>
</Field>
<Field label="Turno preferido">

<select
    value={waitingForm.preferredShift}
    onChange={(e)=>
        setWaitingForm(current=>({
            ...current,
            preferredShift:e.target.value,
        }))
    }
>

<option value="">
Não informado
</option>

{PREFERRED_SHIFT_OPTIONS.map(shift=>(
<option
key={shift.value}
value={shift.value}
>

{shift.label}

</option>
))}

</select>

</Field>
<DaySelector
    value={waitingForm.preferredDays}
    onChange={(days)=>
        setWaitingForm(current=>({
            ...current,
            preferredDays:days,
        }))
    }
/>
              <Field
                label="Responsável"
                value={contact.responsible_name}
              />

              <Field
                label="Telefone"
                value={contact.phone}
              />

              <Field
                label="E-mail"
                value={contact.email}
              />

              <Field
                label="Bairro"
                value={contact.neighborhood}
              />

              <Field
                label="Origem"
                value={contact.source}
              />
            </div>
          </section>

          {/* CONTEXTO DO LEAD */}

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-bold text-neutral-900">
              Contexto do lead
            </h2>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Primeiro contato"
                value={formatDateTime(
                  contact.first_contact_at
                )}
              />

              <Field
                label="Canal de entrada"
                value={contact.entry_channel}
              />

              <Field
                label="Já treinou em outra escola?"
                value={
                  contact.trained_elsewhere ? "Sim" : "Não"
                }
              />

              <Field
                label="Escola / clube anterior"
                value={contact.previous_club}
              />

              <Field
                label="Criado no sistema"
                value={formatDateTime(contact.created_at)}
              />

              <Field
                label="Última atualização"
                value={formatDateTime(contact.updated_at)}
              />
            </div>

            {contact.observations ? (
              <div className="mt-6 border-t border-neutral-100 pt-5">
                <Field
                  label="Observações"
                  value={contact.observations}
                />
              </div>
            ) : null}
          </section>

          {/* SITUAÇÃO COMERCIAL */}

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-bold text-neutral-900">
              Situação comercial
            </h2>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Status atual"
                value={
                  STATUS_LABELS[contact.status] ||
                  contact.status
                }
              />

              <Field
                label="Próximo retorno"
                value={formatDate(contact.follow_up_date)}
              />

              <Field
                label="Data da matrícula"
                value={formatDate(contact.enrolled_at)}
              />

              <Field
                label="Última experimental"
                value={formatDate(
                  contact.experimental_date
                )}
              />

              <Field
                label="Horário"
                value={formatTime(
                  contact.experimental_time
                )}
              />

              <Field
                label="Resultado comercial"
                value={
                  STATUS_LABELS[
                    contact.experimental_result
                  ] || contact.experimental_result
                }
              />

              {contact.status === "waiting_list" ? (
                <>
                  <Field
                    label="Motivo da lista"
                    value={getReasonLabel(
                      WAITING_LIST_REASONS,
                      contact.waiting_list_reason
                    )}
                  />

                  <Field
                    label="Entrada na lista"
                    value={formatDateTime(
                      contact.waiting_list_at
                    )}
                  />
                </>
              ) : null}

              {contact.status === "lost" ? (
                <Field
                  label="Motivo do encerramento"
                  value={getReasonLabel(
                    LOST_REASONS,
                    contact.lost_reason
                  )}
                />
              ) : null}
            </div>

            {contact.waiting_list_notes ? (
              <div className="mt-6 border-t border-neutral-100 pt-5">
                <Field
                  label="Detalhes da lista de interesse"
                  value={contact.waiting_list_notes}
                />
              </div>
            ) : null}
          </section>

          {/* HISTÓRICO DE EXPERIMENTAIS */}

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <History
                size={20}
                className="text-neutral-500"
              />

              <div>
                <h2 className="font-bold text-neutral-900">
                  Histórico de experimentais
                </h2>

                <p className="mt-1 text-xs text-neutral-500">
                  Cada agendamento permanece registrado.
                  Correções não apagam o histórico.
                </p>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="rounded-xl bg-neutral-50 p-5 text-sm text-neutral-500">
                Nenhuma aula experimental registrada para
                este contato.
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-neutral-900">
                          {formatDate(
                            session.experimental_date
                          )}
                        </p>

                        <span className="text-sm text-neutral-400">
                          •
                        </span>

                        <p className="text-sm font-medium text-neutral-700">
                          {formatTime(
                            session.experimental_time
                          )}
                        </p>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusClass(
                            session.status
                          )}`}
                        >
                          {SESSION_STATUS_LABELS[
                            session.status
                          ] || session.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-neutral-500">
                        {session.category?.name ||
                          "Categoria não informada"}
                      </p>

                      {session.notes ? (
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-neutral-500">
                          {session.notes}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
  <button
    type="button"
    onClick={() => openCorrectionModal(session)}
    className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold hover:bg-neutral-50"
  >
    <RotateCcw size={15}/>
    Corrigir registro
  </button>

  <button
    type="button"
    onClick={() => openDeleteExperimentalModal(session)}
    className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
  >
    <XCircle size={15}/>
    Excluir
  </button>
</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* OBSERVAÇÕES INTERNAS */}

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-bold text-neutral-900">
              Observações internas
            </h2>

            <div className="min-h-[90px] whitespace-pre-wrap rounded-xl bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700">
              {contact.internal_notes ||
                "Nenhuma observação interna registrada."}
            </div>
          </section>
        </div>

        {/* PAINEL DE AÇÕES */}

        <aside className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Gestão do lead
              </p>

              <h2 className="mt-1 text-lg font-bold text-neutral-900">
                Próxima ação
              </h2>

              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                Use estas ações para movimentar o contato
                pelo funil sem apagar o histórico.
              </p>
            </div>

            <div className="space-y-3">
              <ActionButton
                icon={CalendarDays}
                title="Agendar / reagendar experimental"
                description="Cria uma nova experimental e mantém as anteriores no histórico."
                onClick={openExperimentalModal}
              />

              <ActionButton
                icon={Clock3}
                title="Programar retorno"
                description="Define uma data para voltar a falar com a família."
                onClick={openFollowUpModal}
              />

              <ActionButton
                icon={ListPlus}
                title="Lista de interesse"
                description="Use quando existe interesse real, mas ainda não é possível avançar."
                onClick={openWaitingListModal}
              />

              <ActionButton
                icon={UserRoundCheck}
                title={
                  contact.status === "enrolled"
                    ? "Atualizar matrícula"
                    : "Registrar matrícula"
                }
                description="Confirma a conversão do contato em aluno matriculado."
                onClick={openEnrollmentModal}
              />

              {contact.status !== "lost" ? (
                <ActionButton
                  icon={XCircle}
                  title="Encerrar oportunidade"
                  description="Use somente quando o lead não seguirá no processo."
                  onClick={openCloseModal}
                  danger
                />
              ) : null}
            </div>

            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-neutral-500"
                />

                <p className="text-xs leading-relaxed text-neutral-500">
                  Corrigir uma experimental antiga não
                  altera automaticamente um contato que já
                  avançou para matrícula, retorno, lista de
                  interesse ou encerramento.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ===================================================
          MODAL: MATRÍCULA
      =================================================== */}

      <Modal
        open={modal === "enrollment"}
        title="Registrar matrícula"
        description={`Confirmar a entrada de ${contact.child_name} como aluno matriculado.`}
        onClose={closeModal}
      >
        <form
          onSubmit={handleEnrollment}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Data da matrícula *
            </label>

            <input
              type="date"
              value={enrollmentForm.enrolledAt}
              onChange={(event) =>
                setEnrollmentForm((current) => ({
                  ...current,
                  enrolledAt: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Observação interna
            </label>

            <textarea
              rows={4}
              value={enrollmentForm.notes}
              onChange={(event) =>
                setEnrollmentForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Ex.: Matrícula confirmada após conversa com a mãe."
              className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <UserRoundCheck size={16} />
              )}

              Confirmar matrícula
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================
          MODAL: RETORNO
      =================================================== */}

      <Modal
        open={modal === "follow_up"}
        title="Programar retorno"
        description="Defina quando a família deve voltar para a fila de atendimento."
        onClose={closeModal}
      >
        <form
          onSubmit={handleFollowUp}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Data do próximo contato *
            </label>

            <input
              type="date"
              value={followUpForm.followUpDate}
              onChange={(event) =>
                setFollowUpForm((current) => ({
                  ...current,
                  followUpDate: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Observação interna
            </label>

            <textarea
              rows={4}
              value={followUpForm.notes}
              onChange={(event) =>
                setFollowUpForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Ex.: Retornar após conversar com o pai sobre os horários."
              className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Clock3 size={16} />
              )}

              Programar retorno
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================
          MODAL: LISTA DE INTERESSE
      =================================================== */}

      <Modal
        open={modal === "waiting_list"}
        title="Adicionar à lista de interesse"
        description="Use quando existe interesse real, mas ainda há um impedimento para avançar."
        onClose={closeModal}
      >
        <form
          onSubmit={handleWaitingList}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Motivo *
            </label>

            <select
              value={waitingForm.reason}
              onChange={(event) =>
                setWaitingForm((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            >
              {WAITING_LIST_REASONS.map((reason) => (
                <option
                  key={reason.value}
                  value={reason.value}
                >
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Detalhes
            </label>

            <textarea
              rows={4}
              value={waitingForm.notes}
              onChange={(event) =>
                setWaitingForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Ex.: Família precisa de turma às 19h. Avisar caso seja aberta."
              className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <ListPlus size={16} />
              )}

              Adicionar à lista
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================
          MODAL: EXPERIMENTAL
      =================================================== */}

      <Modal
        open={modal === "experimental"}
        title="Agendar / reagendar experimental"
        description="Uma nova sessão será criada. Experimentais anteriores permanecerão no histórico."
        onClose={closeModal}
      >
        <form
          onSubmit={handleExperimental}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Categoria *
            </label>

            <select
              value={experimentalForm.categoryId}
              onChange={(event) => {
                const categoryId = event.target.value;

                const selectedCategory =
                  categories.find(
                    (category) =>
                      String(category.id) ===
                      String(categoryId)
                  );

                setExperimentalForm((current) => ({
                  ...current,
                  categoryId,
                  experimentalTime:
                    selectedCategory?.start_time?.slice(
                      0,
                      5
                    ) ||
                    current.experimentalTime ||
                    "",
                }));
              }}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            >
              <option value="">
                Selecione a categoria
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Data *
              </label>

              <input
                type="date"
                value={
                  experimentalForm.experimentalDate
                }
                onChange={(event) =>
                  setExperimentalForm((current) => ({
                    ...current,
                    experimentalDate:
                      event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Horário
              </label>

              <input
                type="time"
                value={
                  experimentalForm.experimentalTime
                }
                onChange={(event) =>
                  setExperimentalForm((current) => ({
                    ...current,
                    experimentalTime:
                      event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Observação
            </label>

            <textarea
              rows={4}
              value={experimentalForm.notes}
              onChange={(event) =>
                setExperimentalForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Ex.: Reagendada porque o aluno estava na casa do pai."
              className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <CalendarDays size={16} />
              )}

              Confirmar agendamento
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================
          MODAL: ENCERRAR
      =================================================== */}

      <Modal
        open={modal === "close"}
        title="Encerrar oportunidade"
        description="O contato deixará de aparecer como oportunidade ativa. O histórico será preservado."
        onClose={closeModal}
      >
        <form
          onSubmit={handleCloseOpportunity}
          className="space-y-5"
        >
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Esta ação deve ser usada quando a família não
            seguirá no processo neste momento.
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Motivo *
            </label>

            <select
              value={closeForm.lostReason}
              onChange={(event) =>
                setCloseForm((current) => ({
                  ...current,
                  lostReason: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            >
              {LOST_REASONS.map((reason) => (
                <option
                  key={reason.value}
                  value={reason.value}
                >
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Observação interna
            </label>

            <textarea
              rows={4}
              value={closeForm.notes}
              onChange={(event) =>
                setCloseForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Ex.: Família informou que a distância até a Arena inviabilizou a continuidade."
              className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <XCircle size={16} />
              )}

              Encerrar oportunidade
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================
          MODAL: CORRIGIR EXPERIMENTAL
      =================================================== */}

      <Modal
        open={modal === "correction"}
        title="Corrigir registro da experimental"
        description="Use somente para corrigir um registro lançado incorretamente."
        onClose={closeModal}
      >
        <form
          onSubmit={handleCorrection}
          className="space-y-5"
        >
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
            Esta função corrige o histórico da aula. Se o
            aluno já avançou para matrícula, retorno, lista
            de interesse ou encerramento, essa situação
            comercial será preservada.
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Status correto *
            </label>

            <select
              value={correctionForm.status}
              onChange={(event) =>
                setCorrectionForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            >
              {Object.entries(
                SESSION_STATUS_LABELS
              ).map(([value, label]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Motivo da correção
              {correctionForm.status !==
              correctionForm.currentStatus
                ? " *"
                : ""}
            </label>

            <textarea
              rows={4}
              value={correctionForm.reason}
              onChange={(event) =>
                setCorrectionForm((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
              placeholder="Ex.: Presença foi lançada como ausência por engano."
              className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <RotateCcw size={16} />
              )}

              Salvar correção
            </button>
          </div>
        </form>
      </Modal>

      <Modal
  open={modal === "delete_experimental"}
  title="Excluir experimental"
  description="Esta ação remove definitivamente esta aula experimental."
  onClose={closeModal}
>
  <div className="space-y-5">

    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      Utilize esta função apenas quando a experimental foi criada por engano ou para testes.

      Esta ação não poderá ser desfeita.
    </div>

    {error ? (
      <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
        {error}
      </p>
    ) : null}

    <div className="flex justify-end gap-2">

      <button
        type="button"
        onClick={closeModal}
        className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold"
      >
        Cancelar
      </button>

      <button
        type="button"
        onClick={handleDeleteExperimental}
        disabled={actionLoading}
        className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"
      >
        {actionLoading ? (
          <Loader2 size={16} className="animate-spin"/>
        ) : (
          <XCircle size={16}/>
        )}

        Excluir experimental
      </button>

    </div>

  </div>
</Modal>

      {/* ===================================================
          MODAL: EDITAR CONTATO
      =================================================== */}

      <Modal
        open={modal === "edit"}
        title="Editar contato"
        description="Corrija informações cadastrais sem alterar manualmente a jornada comercial."
        onClose={closeModal}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleEdit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Nome do aluno *
              </label>

              <input
                value={editForm.child_name}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    child_name: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Data de nascimento
              </label>

              <input
                type="date"
                value={editForm.birth_date}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    birth_date: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Responsável
              </label>

              <input
                value={editForm.responsible_name}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    responsible_name:
                      event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Telefone
              </label>

              <input
                value={editForm.phone}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                E-mail
              </label>

              <input
                type="email"
                value={editForm.email}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Bairro
              </label>

              <input
                value={editForm.neighborhood}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    neighborhood:
                      event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Origem
              </label>

              <input
                value={editForm.source}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    source: event.target.value,
                  }))
                }
                placeholder="Ex.: Instagram"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Canal de entrada
              </label>

              <input
                value={editForm.entry_channel}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    entry_channel:
                      event.target.value,
                  }))
                }
                placeholder="Ex.: WhatsApp"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Categoria
              </label>

              <select
                value={editForm.category_id}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    category_id:
                      event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
              >
                <option value="">
                  Sem categoria
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Primeiro contato
              </label>

              <input
                type="datetime-local"
                value={editForm.first_contact_at}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    first_contact_at:
                      event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4">
            <input
              type="checkbox"
              checked={editForm.trained_elsewhere}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  trained_elsewhere:
                    event.target.checked,
                }))
              }
              className="h-4 w-4"
            />

            <span className="text-sm font-medium text-neutral-700">
              Já treinou em outra escola/clube
            </span>
          </label>

          {editForm.trained_elsewhere ? (
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Escola / clube anterior
              </label>

              <input
                value={editForm.previous_club}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    previous_club:
                      event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
              />
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Observações
            </label>

            <textarea
              rows={3}
              value={editForm.observations}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  observations: event.target.value,
                }))
              }
              className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Observações internas
            </label>

            <textarea
              rows={5}
              value={editForm.internal_notes}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  internal_notes:
                    event.target.value,
                }))
              }
              className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save size={16} />
              )}

              Salvar alterações
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}