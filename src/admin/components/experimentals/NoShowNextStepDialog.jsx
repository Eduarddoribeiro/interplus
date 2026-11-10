import { ArchiveX, CalendarClock, CalendarPlus } from "lucide-react";

import { Button, Dialog } from "../../ui";

/*
 * Logo depois do "Faltou": a coordenação já escolhe o próximo passo,
 * em vez de a falta ficar esperando no card. "Decidir depois" deixa
 * como antes (as ações continuam no card da falta).
 */
export default function NoShowNextStepDialog({
  session,
  onReschedule,
  onScheduleFollowUp,
  onCloseOpportunity,
  onClose,
}) {
  const name = session.contact?.child_name || "A criança";

  const options = [
    {
      label: "Reagendar experimental",
      hint: "A família já quer outra data.",
      icon: CalendarPlus,
      onClick: onReschedule,
    },
    {
      label: "Programar retorno",
      hint: "Falar com a família em outro dia.",
      icon: CalendarClock,
      onClick: onScheduleFollowUp,
    },
    {
      label: "Encerrar",
      hint: "A família não vai seguir.",
      icon: ArchiveX,
      onClick: onCloseOpportunity,
    },
  ];

  return (
    <Dialog
      open
      onClose={onClose}
      title="Qual o próximo passo?"
      description={`${name} faltou à experimental.`}
    >
      <div className="grid gap-2">
        {options.map(({ label, hint, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="flex items-start gap-3 rounded-lg border border-line bg-white p-4 text-left transition-colors hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-ink" />
            <span>
              <span className="block font-semibold text-ink">{label}</span>
              <span className="block text-sm text-muted">{hint}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="quiet" onClick={onClose}>
          Decidir depois
        </Button>
      </div>
    </Dialog>
  );
}
