import { useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";

import { buttonClass, Dialog, inputClass } from "../../ui";

import TrialSlotPicker from "../experimentals/TrialSlotPicker";
import { WEEKDAY_LABELS } from "../../../constants/weekdays";
import { getInterestCategory } from "../../../helpers/waitingListRules";

// "2026-10-20" -> "20/10"
function formatDayMonth(iso) {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

/*
 * Agendar experimental direto da lista de interesse.
 * Mesmo seletor de turma/horário/vagas do restante do painel.
 */
export default function WaitingListScheduleModal({
  contact,
  saving,
  error,
  onClose,
  onSave,
}) {
  const category = getInterestCategory(contact);

  const [slot, setSlot] = useState(null);
  const [notes, setNotes] = useState("");

  return (
    <Dialog
      open
      onClose={onClose}
      title="Agendar experimental"
      description={`${contact.child_name || "Sem nome"}, ${category?.name ?? "sem categoria"}, prefere ${contact.location?.name ?? "qualquer local"}`}
      size="lg"
      busy={saving}
    >

        <div className="space-y-5">
          <TrialSlotPicker categoryId={category?.id} value={slot} onChange={setSlot} />

          {slot && (
            <p className="rounded-lg bg-canvas p-3 text-sm text-neutral-700">
              Selecionado:{" "}
              <strong>
                {slot.group.location?.name} · {WEEKDAY_LABELS[slot.weekday]}{" "}
                {formatDayMonth(slot.date)} às {slot.start_time.slice(0, 5)}
              </strong>
            </p>
          )}

          <label className="block">
            <span className="text-sm font-medium text-ink">Observação</span>

            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex.: Família confirmou pelo WhatsApp após aviso de vaga."
              className={`mt-1.5 resize-none ${inputClass}`}
            />
          </label>

          {error && (
            <p className="rounded-lg bg-alert-soft p-3 text-sm font-semibold text-alert-text">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={buttonClass("secondary")}
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={!slot || saving}
              onClick={() => onSave({ slot, notes })}
              className={buttonClass("primary")}
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CalendarDays size={16} />
              )}
              Confirmar agendamento
            </button>
          </div>
        </div>
    </Dialog>
  );
}
