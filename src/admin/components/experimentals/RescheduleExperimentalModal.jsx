import { useState } from "react";

import { Dialog } from "../../ui";
import TrialSlotPicker from "./TrialSlotPicker";
import { WEEKDAY_LABELS } from "../../../constants/weekdays";
import { ModalActions, FormTextarea } from "./modalFields";
import { formatShortDate, formatTime } from "../../../helpers/experimentalDates";

export default function RescheduleExperimentalModal({
  session,
  saving,
  onClose,
  onSave,
}) {

  
  const contact =
    session.contact || {};

  // Turma + horário + data escolhidos no TrialSlotPicker
  const [slot, setSlot] =
    useState(null);

  const [formError, setFormError] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [
    coachNotes,
    setCoachNotes,
  ] = useState(
    session.coach_notes || ""
  );

  function handleSubmit(event) {
    event.preventDefault();

    if (!slot) {
      setFormError(
        "Escolha a turma, o horário e a nova data."
      );
      return;
    }

    onSave({
      slot,
      notes,
      coachNotes,
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      busy={saving}
      title="Reagendar experimental"
      description={
        session.status === "no_show"
          ? `${contact.child_name}. A falta continua registrada no histórico.`
          : `${contact.child_name}. A aula marcada passa para a nova data.`
      }
    >

      <form onSubmit={handleSubmit}>
        {/* Caixa neutra: é contexto, não erro */}
        <div className="rounded-lg border border-line bg-canvas p-4">
          <p className="text-sm font-medium text-muted">
            Tentativa anterior
          </p>

          <p className="mt-2 font-semibold text-ink">
            {formatShortDate(
              session.experimental_date
            )}
            {session.experimental_time
              ? ` às ${formatTime(
                  session.experimental_time
                )}`
              : ""}
          </p>

          <p className="mt-1 text-sm text-muted">
            {session.status === "no_show"
              ? "Não compareceu"
              : "Será substituída pela nova data"}
          </p>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-ink">
            Categoria
          </label>

          <div className="mt-2 rounded-lg border border-line bg-canvas px-4 py-3 text-sm font-semibold text-neutral-700">
            {session.category?.name ||
              "Categoria não informada"}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-ink">
            Nova turma, horário e data
          </p>

          <div className="mt-2">
            <TrialSlotPicker
              categoryId={session.category?.id}
              value={slot}
              onChange={(value) => {
                setSlot(value);
                setFormError("");
              }}
            />
          </div>

          {slot && (
            <p className="mt-3 rounded-lg bg-canvas p-3 text-sm text-neutral-700">
              Selecionado:{" "}
              <strong>
                {slot.group.location?.name},{" "}
                {WEEKDAY_LABELS[slot.weekday]}{" "}
                {formatShortDate(slot.date)} às{" "}
                {formatTime(slot.start_time)}
              </strong>
            </p>
          )}

          {formError && (
            <p className="mt-3 rounded-lg bg-alert-soft p-3 text-sm font-semibold text-alert-text">
              {formError}
            </p>
          )}
        </div>

        <FormTextarea
          label="Observação interna"
          value={notes}
          onChange={setNotes}
          placeholder="Ex.: Responsável pediu nova tentativa na próxima semana..."
        />

        <FormTextarea
          label="Observação para professores"
          value={coachNotes}
          onChange={setCoachNotes}
          placeholder="Ex.: Goleiro. Já treinou em outra escola. Avaliar nível técnico."
          helper="Esta informação poderá aparecer na lista enviada aos professores."
        />

        <ModalActions
          saving={saving}
          onClose={onClose}
          submitLabel="Confirmar reagendamento"
        />
      </form>
    </Dialog>
  );
}
