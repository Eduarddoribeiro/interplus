import { useId } from "react";

import { LOST_REASON_OPTIONS } from "../../../constants/lostReasons";

/*
 * Motivo de encerramento em botões (um toque, sem abrir lista).
 * Seleção em tinta, com aria-pressed. Mesmas opções em todas as telas.
 */
export default function LostReasonPicker({ value, onChange, label = "Motivo", className = "" }) {
  const labelId = useId();

  return (
    <div className={className}>
      <p id={labelId} className="mb-1.5 text-sm font-medium text-ink">
        {label}
      </p>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {LOST_REASON_OPTIONS.map((reason) => {
          const selected = value === reason.value;

          return (
            <button
              key={reason.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(reason.value)}
              className={`min-h-9 rounded-lg px-3 py-1.5 text-left text-sm font-medium transition-colors touch:min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                selected ? "bg-ink text-white" : "border border-line bg-white text-ink hover:border-neutral-400"
              }`}
            >
              {reason.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
