import { useState } from "react";
import { CalendarDays, Loader2, X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-neutral-100 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
              Agendar experimental
            </p>

            <h2 className="mt-1 text-xl font-bold text-neutral-900">
              {contact.child_name || "Sem nome"}
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              {category?.name ?? "Sem categoria"} · prefere{" "}
              {contact.location?.name ?? "qualquer local"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <TrialSlotPicker categoryId={category?.id} value={slot} onChange={setSlot} />

          {slot && (
            <p className="rounded-xl bg-neutral-50 p-3 text-sm text-neutral-700">
              Selecionado:{" "}
              <strong>
                {slot.group.location?.name} · {WEEKDAY_LABELS[slot.weekday]}{" "}
                {formatDayMonth(slot.date)} às {slot.start_time.slice(0, 5)}
              </strong>
            </p>
          )}

          <label className="block">
            <span className="text-sm font-semibold text-neutral-800">Observação</span>

            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex.: Família confirmou pelo WhatsApp após aviso de vaga."
              className="mt-2 w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-red-500"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={!slot || saving}
              onClick={() => onSave({ slot, notes })}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
      </div>
    </div>
  );
}
