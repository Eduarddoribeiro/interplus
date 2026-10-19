import { GraduationCap, MessageCircle, RotateCcw, XCircle } from "lucide-react";

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
 * Um retorno = uma linha: quem é, quando era o retorno, em que ponto
 * do ciclo está (tentativas e dias) e as ações.
 * Faixa vermelha = atrasado ou limite atingido; âmbar = para hoje.
 */
export default function FollowUpCard({ item, today, onAction }) {
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

  return (
    <article
      className={`grid gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-b-0 lg:grid-cols-[minmax(0,1.4fr)_13rem_minmax(0,1.2fr)_29rem] lg:items-center ${urgencyRail(urgency)}`}
    >
      {/* QUEM */}
      <div className="min-w-0">
        <h3 className="truncate font-semibold">{item.child_name || "Sem nome"}</h3>

        <p className="truncate text-sm text-muted">
          {item.responsible_name || "Responsável não informado"}
          {item.phone && (
            <>
              , <span className="tabular-nums">{formatPhone(item.phone)}</span>
            </>
          )}
        </p>
      </div>

      {/* TURMA */}
      <p className="text-sm">
        {item.category?.name ?? "Sem categoria"}
        {item.experimental_date && (
          <span className="block text-muted">
            Aula experimental: {formatContactDate(item.experimental_date)}
          </span>
        )}
      </p>

      {/* QUANDO + CICLO */}
      <p className="text-sm">
        <span className={`font-medium ${urgency ? urgencyText(urgency) : "text-ink"}`}>{when}</span>
        <span className="block text-muted">
          {state.limitReached
            ? `${state.attempts} de ${state.maxAttempts} tentativas feitas`
            : `${attempt}ª de ${state.maxAttempts} tentativas`}
        </span>
      </p>

      {/* AÇÕES */}
      <div className="flex flex-wrap gap-2 lg:justify-end">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`WhatsApp de ${item.responsible_name || item.child_name || "contato"}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-whatsapp hover:border-whatsapp"
          >
            <MessageCircle size={17} aria-hidden="true" />
          </a>
        )}

        <Button size="sm" onClick={() => onAction(item, FOLLOW_UP_ACTION.ENROLL)}>
          <GraduationCap size={16} aria-hidden="true" className="text-ok" />
          Matriculou
        </Button>

        {state.canReschedule && (
          <Button size="sm" onClick={() => onAction(item, FOLLOW_UP_ACTION.RESCHEDULE)}>
            <RotateCcw size={16} aria-hidden="true" />
            Reagendar
          </Button>
        )}

        <Button
          size="sm"
          variant={state.limitReached ? "secondary" : "quiet"}
          onClick={() => onAction(item, FOLLOW_UP_ACTION.LOSE)}
        >
          <XCircle size={16} aria-hidden="true" />
          {state.limitReached ? "Encerrar" : "Não converteu"}
        </Button>
      </div>

      {/* OBSERVAÇÃO */}
      {item.internal_notes && (
        <p className="truncate text-sm text-muted lg:col-span-4" title={item.internal_notes}>
          {item.internal_notes.replace(/\s+/g, " ").trim()}
        </p>
      )}
    </article>
  );
}
