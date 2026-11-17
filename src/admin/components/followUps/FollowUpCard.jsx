import { useEffect, useRef, useState } from "react";
import { CalendarPlus, ChevronDown, GraduationCap, MessageCircle, RotateCcw, XCircle } from "lucide-react";

import { Button, urgencyRail, urgencyText } from "../../ui";

import {
  createWhatsAppUrl,
  daysBetweenDates,
  formatContactDate,
} from "../../../helpers/contactPresentation";
import { formatPhone } from "../../../helpers/phoneHelpers";
import { getFollowUpState } from "../../../helpers/followUpRules";

import { FOLLOW_UP_ACTION } from "../../../constants/followUpActions";

/*
 * Um retorno = uma linha com o essencial para ligar: quem é, a turma
 * e há quanto tempo está atrasado. Data da experimental, tentativas e
 * observação abrem ao clicar no nome. As ações ficam em "Registrar".
 * Faixa vermelha = atrasado ou limite atingido; âmbar = para hoje.
 */
export default function FollowUpCard({ item, today, onAction, onQuickReschedule }) {
  const [open, setOpen] = useState(false);

  const whatsappUrl = createWhatsAppUrl(item.phone);
  const state = getFollowUpState(item);

  const isOverdue = Boolean(item.follow_up_date) && item.follow_up_date < today;
  const isToday = item.follow_up_date === today;
  const daysLate = isOverdue ? daysBetweenDates(item.follow_up_date, today) : 0;

  const urgency = state.limitReached || isOverdue ? "alert" : isToday ? "attention" : undefined;

  const when = state.limitReached
    ? "Limite atingido: decidir"
    : isOverdue
      ? `Atrasado há ${daysLate} ${daysLate === 1 ? "dia" : "dias"}`
      : isToday
        ? "Para hoje"
        : `Retorno em ${formatContactDate(item.follow_up_date)}`;

  const attempt = Math.min(state.attempts + 1, state.maxAttempts);
  const name = item.child_name || "Sem nome";
  const detailsId = `follow-up-${item.id}`;

  return (
    <article className={`border-b border-line last:border-b-0 ${urgencyRail(urgency)}`}>
      <div className="grid grid-cols-1 items-center gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1.6fr)_6rem_minmax(0,1fr)_auto]">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={detailsId}
          className="flex min-w-0 items-start gap-2 text-left"
        >
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`mt-1 shrink-0 text-muted transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />

          <span className="min-w-0">
            <span className="block break-words font-semibold sm:truncate">{name}</span>
            <span className="block break-words text-sm text-muted sm:truncate">
              {item.responsible_name || "Responsável não informado"}
              {item.phone && (
                <>
                  , <span className="tabular-nums">{formatPhone(item.phone)}</span>
                </>
              )}
            </span>
          </span>
        </button>

        <span className="hidden text-sm lg:block">{item.category?.name}</span>

        <p className="pl-6 text-sm sm:col-start-1 lg:col-start-auto lg:pl-0">
          <span className={`font-medium ${urgency ? urgencyText(urgency) : "text-ink"}`}>{when}</span>
          {!state.limitReached && attempt > 1 && (
            <span className="text-muted">, {attempt}ª de {state.maxAttempts} tentativas</span>
          )}
          <span className="text-muted lg:hidden">{item.category?.name && `, ${item.category.name}`}</span>
        </p>

        <div className="flex items-center gap-2 pl-6 pt-1 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:pl-0 sm:pt-0 lg:col-start-auto lg:row-span-1 lg:row-start-auto">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`WhatsApp de ${item.responsible_name || name}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-whatsapp touch:h-11 touch:w-11 hover:border-whatsapp"
            >
              <MessageCircle size={17} aria-hidden="true" />
            </a>
          )}

          <ActionMenu
            canReschedule={state.canReschedule}
            limitReached={state.limitReached}
            hadExperimental={Boolean(item.experimental_date)}
            onAction={(type) => onAction(item, type)}
            onQuickReschedule={onQuickReschedule ? (days) => onQuickReschedule(item, days) : undefined}
          />
        </div>
      </div>

      {/* DETALHES */}
      {open && (
        <dl id={detailsId} className="grid gap-3 border-t border-line bg-canvas/60 px-4 py-3 pl-10 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Aula experimental</dt>
            <dd>{item.experimental_date ? formatContactDate(item.experimental_date) : "Não fez"}</dd>
          </div>

          <div>
            <dt className="text-muted">Tentativas</dt>
            <dd>
              {state.attempts} de {state.maxAttempts}
            </dd>
          </div>

          <div>
            <dt className="text-muted">Data do retorno</dt>
            <dd>{formatContactDate(item.follow_up_date)}</dd>
          </div>

          {item.internal_notes && (
            <div className="sm:col-span-3">
              <dt className="text-muted">Observação</dt>
              <dd className="whitespace-pre-wrap">{item.internal_notes}</dd>
            </div>
          )}
        </dl>
      )}
    </article>
  );
}

/*
 * "Registrar": as 3 saídas de um retorno num botão só.
 */
// Atalhos de "tentar de novo": a próxima tentativa sem abrir janela
const QUICK_RESCHEDULE = [
  { days: 2, label: "Em 2 dias" },
  { days: 3, label: "Em 3 dias" },
  { days: 7, label: "Em 1 semana" },
];

function ActionMenu({ canReschedule, limitReached, hadExperimental, onAction, onQuickReschedule }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handleClick(event) {
      if (!ref.current?.contains(event.target)) setOpen(false);
    }

    function handleKey(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function choose(type) {
    setOpen(false);
    onAction(type);
  }

  const options = [
    {
      type: FOLLOW_UP_ACTION.SCHEDULE_EXPERIMENTAL,
      label: hadExperimental ? "Reagendar experimental" : "Agendar experimental",
      icon: CalendarPlus,
    },
    { type: FOLLOW_UP_ACTION.ENROLL, label: "Matriculou", icon: GraduationCap },
    canReschedule && {
      type: FOLLOW_UP_ACTION.RESCHEDULE,
      label: onQuickReschedule ? "Retorno em outra data" : "Reagendar retorno",
      icon: RotateCcw,
    },
    {
      type: FOLLOW_UP_ACTION.LOSE,
      label: "Encerrar",
      icon: XCircle,
    },
  ].filter(Boolean);

  return (
    <div ref={ref} className="relative">
      <Button size="sm" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        Registrar
        <ChevronDown size={16} aria-hidden="true" />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-lg"
        >
          {canReschedule && onQuickReschedule && (
            <div className="border-b border-line pb-1">
              <p className="px-3 pb-1 pt-1.5 text-xs font-medium text-muted">Tentar de novo</p>
              {QUICK_RESCHEDULE.map(({ days, label }) => (
                <button
                  key={days}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onQuickReschedule(days);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none"
                >
                  <RotateCcw size={16} aria-hidden="true" className="text-muted" />
                  {label}
                </button>
              ))}
            </div>
          )}

          {options.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              role="menuitem"
              onClick={() => choose(type)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none"
            >
              <Icon size={16} aria-hidden="true" className="text-muted" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
