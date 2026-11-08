import { useState } from "react";

import { Dialog } from "../../ui";
import { toast } from "../common/Toaster";
import { ModalActions, FormDate, FormTextarea } from "./modalFields";
import { getTodayISO, formatShortDate, formatTime } from "../../../helpers/experimentalDates";

export default function NoShowFollowUpModal({
  session,
  saving,
  onClose,
  onSave,
}) {
  const contact =
    session.contact || {};

    const isNoShow = session.status === "no_show";

  const [
    followUpDate,
    setFollowUpDate,
  ] = useState(
    contact.follow_up_date || ""
  );

  const [notes, setNotes] =
    useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!followUpDate) {
      toast(
        "Informe a data do próximo contato."
      );
      return;
    }

    onSave({
      followUpDate,
      notes,
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      busy={saving}
      title="Programar retorno"
      description={contact.child_name}
    >

      <form onSubmit={handleSubmit}>
        {isNoShow ? (
  <div className="rounded-lg border border-alert/30 bg-alert-soft p-4">
    <p className="text-sm font-medium text-muted">
      Tentativa anterior
    </p>

    <p className="mt-2 font-semibold text-ink">
      {formatShortDate(session.experimental_date)}
      {session.experimental_time
        ? ` às ${formatTime(session.experimental_time)}`
        : ""}
    </p>

    <p className="mt-1 text-sm text-alert-text">
      Não compareceu
    </p>
  </div>
) : (
  <div className="rounded-lg border border-line bg-canvas p-4">
    <p className="font-semibold text-ink">
      Remarcando experimental
    </p>

    <p className="mt-1 text-sm text-ink">
      A aula será movida para uma nova data.
    </p>
  </div>
)}

        <FormDate
          label="Data do próximo contato"
          value={followUpDate}
          min={getTodayISO()}
          onChange={setFollowUpDate}
        />

        <FormTextarea
          label="Observação"
          value={notes}
          onChange={setNotes}
          placeholder="Ex.: Chamei após a falta e ainda não respondeu. Tentar novamente em 2 dias."
        />

        <ModalActions
          saving={saving}
          onClose={onClose}
          submitLabel="Programar retorno"
        />
      </form>
    </Dialog>
  );
}
