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
import { WEEKDAY_LABELS } from "../../constants/weekdays";
import { supabase } from "../../lib/supabase";
import TrialSlotPicker from "../components/experimentals/TrialSlotPicker";
import { Button, Panel, buttonClass } from "../ui";
import { formatPhone } from "../../helpers/phoneHelpers";
import { getSourceLabel } from "../../constants/school";

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

// Cor só onde a situação pede algo (ou é um bom resultado)
const STATUS_TONE = {
  pending_confirmation: "text-attention-text",
  follow_up: "text-attention-text",
  no_show: "text-alert-text",
  lost: "text-alert-text",
  enrolled: "text-ok",
};

const ENTRY_CHANNEL_LABELS = {
  public_form: "Formulário do site",
  admin: "Cadastro no painel",
  whatsapp: "WhatsApp",
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
      return "bg-ok-soft text-ok border-ok/30";

    case "attended":
      return "bg-canvas text-ink border-line";

    case "confirmed":
      return "bg-canvas text-ink border-line";

    case "pending_confirmation":
      return "bg-attention-soft text-attention-text border-attention/40";

    case "follow_up":
      return "bg-attention-soft text-attention-text border-attention/40";

    case "waiting_list":
      return "bg-canvas text-ink border-line";

    case "no_show":
    case "lost":
      return "bg-alert-soft text-alert-text border-alert/30";

    case "cancelled":
      return "bg-neutral-100 text-neutral-600 border-line";

    default:
      return "bg-neutral-100 text-neutral-700 border-line";
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
        className={`w-full ${maxWidth} overflow-hidden rounded-xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-ink">
              {title}
            </h2>

            {description ? (
              <p className="mt-1 text-sm text-muted">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted transition hover:bg-neutral-100 hover:text-ink"
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
    <div className="min-w-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm font-medium">
        {value || "—"}
      </dd>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start gap-3 border-t border-line px-4 py-3 text-left transition-colors hover:bg-canvas"
      >
        <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-muted" />

        <span>
          <span className="block text-sm font-semibold">{title}</span>
          <span className="block text-sm text-muted">{description}</span>
        </span>
      </button>
    </li>
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
    slot: null,
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
            .select("id, name")
            .eq("active", true)
            .order("order_index", { ascending: true }),
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
      categoryId:
        contact?.category_id || contact?.interest_category_id || "",
      slot: null,
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

    if (!experimentalForm.slot) {
      setError("Escolha a turma, o horário e a data.");
      return;
    }

    await executeAction(
      () =>
        rescheduleExperimental(id, {
          categoryId: experimentalForm.categoryId,
          trainingGroupScheduleId:
            experimentalForm.slot.scheduleId,
          experimentalDate: experimentalForm.slot.date,
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

          <p className="mt-3 text-sm text-muted">
            Carregando ficha do contato...
          </p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="rounded-xl border border-alert/30 bg-alert-soft p-6">
        <h2 className="font-bold text-alert-text">
          Contato não encontrado
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error ||
            "Não foi possível localizar este contato."}
        </p>

        <button
          type="button"
          onClick={() => navigate("/admin/contacts")}
          className="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          Voltar para contatos
        </button>
      </div>
    );
  }

  /* =======================================================
   * RENDER
   * ======================================================= */

  const statusTone = STATUS_TONE[contact.status] ?? "text-ink";
  const lastSession = sessions[0];
  const sessionLocation = lastSession?.schedule?.training_group?.location?.name;

  return (
    <div className="space-y-5">
      {/* CABEÇALHO */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="quiet"
            onClick={() => navigate("/admin/contacts")}
            aria-label="Voltar para contatos"
            className="mt-1"
          >
            <ArrowLeft size={19} aria-hidden="true" />
          </Button>

          <div className="min-w-0">
            <h1 className="font-display text-[2.6rem] font-semibold leading-[0.9]">
              {contact.child_name || "Sem nome"}
            </h1>

            <p className="mt-1 text-sm">
              <span className={`font-semibold ${statusTone}`}>
                {STATUS_LABELS[contact.status] || contact.status || "Sem status"}
              </span>
              <span className="text-muted">
                {contact.category?.name && `, ${contact.category.name}`}
                {age !== null && `, ${age} ${age === 1 ? "ano" : "anos"}`}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("whatsapp")}
            >
              <MessageCircle size={17} aria-hidden="true" />
              WhatsApp
            </a>
          ) : null}

          <Button onClick={openEditModal}>
            <Edit3 size={17} aria-hidden="true" />
            Editar contato
          </Button>
        </div>
      </div>

      {/* MENSAGENS */}

      {success ? (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-ok-soft px-4 py-3 text-sm font-medium text-ok">
          <CheckCircle2 size={18} aria-hidden="true" />
          {success}
        </p>
      ) : null}

      {error && !modal ? (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-alert-soft px-4 py-3 text-sm font-medium text-alert-text">
          <XCircle size={18} aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {/* GRID PRINCIPAL */}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {/* CONTATO */}

          <Panel className="p-5">
            <h2 className="font-semibold">Contato</h2>

            <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Responsável" value={contact.responsible_name} />
              <Field label="Telefone" value={contact.phone ? formatPhone(contact.phone) : null} />
              {contact.email ? <Field label="E-mail" value={contact.email} /> : null}
              <Field
                label="Nascimento"
                value={
                  contact.birth_date
                    ? `${formatDate(contact.birth_date)}${age !== null ? ` (${age} anos)` : ""}`
                    : null
                }
              />
              <Field label="Bairro" value={contact.neighborhood} />
              <Field label="Como conheceu" value={contact.source ? getSourceLabel(contact.source) : null} />
              <Field
                label="Entrou por"
                value={
                  contact.entry_channel
                    ? ENTRY_CHANNEL_LABELS[contact.entry_channel] ?? contact.entry_channel
                    : null
                }
              />
              <Field
                label="Primeiro contato"
                value={contact.first_contact_at ? formatDateTime(contact.first_contact_at) : null}
              />
              <Field
                label="Já treinou em outra escola"
                value={
                  contact.trained_elsewhere
                    ? `Sim${contact.previous_club ? `: ${contact.previous_club}` : ""}`
                    : "Não"
                }
              />
            </dl>

            {contact.observations ? (
              <dl className="mt-4 border-t border-line pt-4">
                <Field label="Observações do cadastro" value={contact.observations} />
              </dl>
            ) : null}
          </Panel>

          {/* SITUAÇÃO */}

          <Panel className="p-5">
            <h2 className="font-semibold">Situação</h2>

            <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Status" value={STATUS_LABELS[contact.status] || contact.status} />

              {contact.follow_up_date ? (
                <Field label="Próximo retorno" value={formatDate(contact.follow_up_date)} />
              ) : null}

              {contact.enrolled_at ? (
                <Field label="Matrícula" value={formatDate(contact.enrolled_at)} />
              ) : null}

              <Field
                label="Última experimental"
                value={
                  contact.experimental_date
                    ? `${formatDate(contact.experimental_date)}${contact.experimental_time ? `, ${formatTime(contact.experimental_time)}` : ""}`
                    : null
                }
              />

              <Field
                label={contact.status === "waiting_list" ? "Local de preferência" : "Local"}
                value={contact.location?.name || sessionLocation}
              />

              {contact.experimental_result ? (
                <Field
                  label="Resultado da aula"
                  value={STATUS_LABELS[contact.experimental_result] || contact.experimental_result}
                />
              ) : null}

              {contact.status === "waiting_list" ? (
                <>
                  <Field
                    label="Motivo da lista"
                    value={getReasonLabel(WAITING_LIST_REASONS, contact.waiting_list_reason)}
                  />
                  <Field label="Entrou na lista" value={formatDateTime(contact.waiting_list_at)} />
                </>
              ) : null}

              {contact.status === "lost" ? (
                <Field
                  label="Motivo do encerramento"
                  value={getReasonLabel(LOST_REASONS, contact.lost_reason)}
                />
              ) : null}
            </dl>

            {contact.waiting_list_notes ? (
              <dl className="mt-4 border-t border-line pt-4">
                <Field label="Detalhes da lista de interesse" value={contact.waiting_list_notes} />
              </dl>
            ) : null}
          </Panel>

          {/* HISTÓRICO DE EXPERIMENTAIS */}

          <Panel>
            <div className="flex items-baseline justify-between gap-3 px-5 pb-2 pt-5">
              <h2 className="font-semibold">Experimentais</h2>
              <p className="text-sm text-muted">Correções não apagam o histórico.</p>
            </div>

            {sessions.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted">
                Nenhuma aula experimental registrada para este contato.
              </p>
            ) : (
              <ul>
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className="grid gap-x-4 gap-y-1 border-t border-line px-5 py-3 sm:grid-cols-[8.5rem_minmax(0,1fr)_9rem_auto] sm:items-start"
                  >
                    <p className="font-semibold tabular-nums">
                      {formatDate(session.experimental_date)}
                      <span className="block text-sm font-normal text-muted">
                        {formatTime(session.experimental_time)}
                      </span>
                    </p>

                    <div className="min-w-0 text-sm">
                      <p>
                        {session.category?.name || "Categoria não informada"}
                        {session.schedule?.training_group && (
                          <span className="text-muted">
                            , {session.schedule.training_group.location?.name ?? ""}
                          </span>
                        )}
                      </p>

                      {session.notes ? (
                        <p className="mt-1 whitespace-pre-wrap text-muted">{session.notes}</p>
                      ) : null}

                      {session.coach_feedback ? (
                        <p className="mt-1 whitespace-pre-wrap">
                          <span className="font-medium">Professor:</span> {session.coach_feedback}
                        </p>
                      ) : null}
                    </div>

                    <p className={`text-sm font-medium ${STATUS_TONE[session.status] ?? "text-ink"}`}>
                      {SESSION_STATUS_LABELS[session.status] || session.status}
                    </p>

                    <div className="flex gap-1 sm:justify-end">
                      <Button size="sm" variant="quiet" onClick={() => openCorrectionModal(session)}>
                        <RotateCcw size={15} aria-hidden="true" />
                        Corrigir
                      </Button>

                      <Button
                        size="sm"
                        variant="quiet"
                        onClick={() => openDeleteExperimentalModal(session)}
                        className="hover:!bg-alert-soft hover:!text-alert-text"
                      >
                        <XCircle size={15} aria-hidden="true" />
                        Excluir
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* OBSERVAÇÕES INTERNAS */}

          <Panel className="p-5">
            <h2 className="font-semibold">Observações internas</h2>

            <p className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed ${contact.internal_notes ? "" : "text-muted"}`}>
              {contact.internal_notes || "Nenhuma observação interna registrada."}
            </p>
          </Panel>

          <p className="text-sm text-muted">
            Criado em {formatDateTime(contact.created_at)}. Última atualização em{" "}
            {formatDateTime(contact.updated_at)}.
          </p>
        </div>

        {/* PRÓXIMA AÇÃO */}

        <aside>
          <Panel className="xl:sticky xl:top-6">
            <h2 className="px-4 pb-2 pt-4 font-semibold">Próxima ação</h2>

            <ul>
              <ActionButton
                icon={CalendarDays}
                title="Agendar experimental"
                description="As anteriores ficam no histórico."
                onClick={openExperimentalModal}
              />

              <ActionButton
                icon={Clock3}
                title="Programar retorno"
                description="Data para voltar a falar com a família."
                onClick={openFollowUpModal}
              />

              <ActionButton
                icon={ListPlus}
                title="Lista de interesse"
                description="Tem interesse, mas ainda não dá para avançar."
                onClick={openWaitingListModal}
              />

              <ActionButton
                icon={UserRoundCheck}
                title={contact.status === "enrolled" ? "Atualizar matrícula" : "Registrar matrícula"}
                description="Confirma que virou aluno."
                onClick={openEnrollmentModal}
              />
            </ul>

            {contact.status !== "lost" ? (
              <div className="border-t border-line px-4 py-3">
                <button
                  type="button"
                  onClick={openCloseModal}
                  className="inline-flex items-center gap-2 text-sm font-medium text-alert-text hover:underline"
                >
                  <XCircle size={16} aria-hidden="true" />
                  Encerrar oportunidade
                </button>
              </div>
            ) : null}

            <p className="flex items-start gap-2 border-t border-line px-4 py-3 text-sm text-muted">
              <ShieldCheck size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              Corrigir uma experimental antiga não muda um contato que já avançou para
              matrícula, retorno, lista ou encerramento.
            </p>
          </Panel>
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
            <p className="rounded-xl bg-alert-soft p-3 text-sm text-alert-text">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
            <p className="rounded-xl bg-alert-soft p-3 text-sm text-alert-text">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
            <p className="rounded-xl bg-alert-soft p-3 text-sm text-alert-text">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
        maxWidth="max-w-2xl"
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
              onChange={(event) =>
                setExperimentalForm((current) => ({
                  ...current,
                  categoryId: event.target.value,
                  slot: null,
                }))
              }
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

          <div>
            <p className="mb-2 block text-sm font-semibold text-neutral-700">
              Turma, horário e data *
            </p>

            <TrialSlotPicker
              categoryId={experimentalForm.categoryId}
              value={experimentalForm.slot}
              onChange={(slot) =>
                setExperimentalForm((current) => ({
                  ...current,
                  slot,
                }))
              }
            />

            {experimentalForm.slot && (
              <p className="mt-3 rounded-xl bg-canvas p-3 text-sm text-neutral-700">
                Selecionado:{" "}
                <strong>
                  {experimentalForm.slot.group.location?.name} ·{" "}
                  {WEEKDAY_LABELS[experimentalForm.slot.weekday]}{" "}
                  {formatDate(experimentalForm.slot.date)} às{" "}
                  {formatTime(experimentalForm.slot.start_time)}
                </strong>
              </p>
            )}
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
            <p className="rounded-xl bg-alert-soft p-3 text-sm text-alert-text">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
          <div className="rounded-xl border border-alert/30 bg-alert-soft p-4 text-sm text-alert-text">
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
            <p className="rounded-xl bg-alert-soft p-3 text-sm text-alert-text">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-inter-red px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
          <div className="rounded-xl border border-attention/40 bg-attention-soft p-4 text-sm leading-relaxed text-attention-text">
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
            <p className="rounded-xl bg-alert-soft p-3 text-sm text-alert-text">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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

    <div className="rounded-xl border border-alert/30 bg-alert-soft p-4 text-sm text-alert-text">
      Utilize esta função apenas quando a experimental foi criada por engano ou para testes.

      Esta ação não poderá ser desfeita.
    </div>

    {error ? (
      <p className="rounded-xl bg-alert-soft p-3 text-sm text-alert-text">
        {error}
      </p>
    ) : null}

    <div className="flex justify-end gap-2">

      <button
        type="button"
        onClick={closeModal}
        className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
      >
        Cancelar
      </button>

      <button
        type="button"
        onClick={handleDeleteExperimental}
        disabled={actionLoading}
        className="flex items-center gap-2 rounded-xl bg-inter-red px-4 py-2.5 text-sm font-semibold text-white"
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

          <label className="flex items-center gap-3 rounded-xl border border-line p-4">
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
            <p className="rounded-xl bg-alert-soft p-3 text-sm text-alert-text">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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