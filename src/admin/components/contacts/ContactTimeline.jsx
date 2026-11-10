import { useMemo, useState } from "react";

import { Button, Panel } from "../../ui";
import { buildContactTimeline } from "../../../helpers/contactTimeline";
import { formatShortDate, getTodayISO } from "../../../helpers/experimentalDates";

const VISIBLE = 6;

const DOT = {
  ok: "bg-ok",
  alert: "bg-alert",
};

/*
 * História da família de uma olhada: primeiro contato, aulas, faltas,
 * retornos, observações e matrícula. Próximos passos ficam em cima.
 */
export default function ContactTimeline({ contact, sessions }) {
  const [showAll, setShowAll] = useState(false);

  const events = useMemo(
    () => buildContactTimeline(contact, sessions, getTodayISO()),
    [contact, sessions],
  );

  if (events.length === 0) return null;

  const visible = showAll ? events : events.slice(0, VISIBLE);

  return (
    <Panel className="p-5">
      <h2 className="font-semibold">Linha do tempo</h2>

      <ol className="mt-4">
        {visible.map((event, index) => (
          <li key={event.key} className="relative grid grid-cols-[5.5rem_1rem_minmax(0,1fr)] gap-x-2 pb-4 last:pb-0">
            <p className={`text-sm tabular-nums ${event.upcoming ? "font-semibold text-ink" : "text-muted"}`}>
              {event.upcoming ? "Próximo" : formatShortDate(String(event.at).slice(0, 10))}
            </p>

            <span aria-hidden="true" className="relative flex justify-center">
              {index < visible.length - 1 && <span className="absolute top-3 h-[calc(100%+0.25rem)] w-px bg-line" />}
              <span
                className={`relative mt-1.5 h-2 w-2 rounded-full ${
                  event.upcoming ? "bg-ink" : DOT[event.tone] ?? (event.note ? "bg-neutral-300" : "bg-muted")
                }`}
              />
            </span>

            <div className="min-w-0 text-sm">
              <p className={event.note ? "whitespace-pre-wrap text-muted" : "font-medium text-ink"}>{event.title}</p>
              {event.detail && <p className="text-muted">{event.detail}</p>}
            </div>
          </li>
        ))}
      </ol>

      {events.length > VISIBLE && (
        <Button size="sm" variant="quiet" className="mt-3" onClick={() => setShowAll((current) => !current)}>
          {showAll ? "Mostrar menos" : `Ver tudo (${events.length})`}
        </Button>
      )}
    </Panel>
  );
}
