import { useEffect, useState } from "react";
import {
  CircleCheckBig,
  MessageCircle,
  UserCheck,
  UserX,
  XCircle,
  CalendarPlus,
  ChevronDown,
  Users,
  Pencil,
  Save,
  Check,
  MapPin,
} from "lucide-react";

import { Button, urgencyRail, urgencyText } from "../../ui";
import { toast } from "../common/Toaster";
import { getSessionMessages } from "../../../helpers/whatsappMessages";
import { isAwaitingResult } from "../../../helpers/experimentalRules";
import { getSourceLabel } from "../../../constants/school";
import { errorMessage } from "../../../helpers/errorMessage";
import { NoShowActions, AttendedActions } from "./ExperimentalCardActions";
import { formatTime } from "../../../helpers/experimentalDates";

export default function ExperimentalCard({
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-whatsapp touch:h-11 touch:w-11 hover:border-whatsapp"
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
            compartilhadas com os professores.
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
