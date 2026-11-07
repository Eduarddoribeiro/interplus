import { useState } from "react";

import { Dialog } from "../../ui";
import { toast } from "../common/Toaster";
import { ModalActions, FormTextarea, LostReasonSelect } from "./modalFields";

export default function CloseNoShowOpportunityModal({
  session,
  saving,
  onClose,
  onSave,
}) {
  const contact =
    session.contact || {};


  const [
    lostReason,
    setLostReason,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!lostReason) {
      toast(
        "Informe o motivo do encerramento."
      );
      return;
    }

    onSave({
      lostReason,
      notes,
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      busy={saving}
      title="Encerrar"
      description={contact.child_name}
    >

      <form onSubmit={handleSubmit}>
        <div className="rounded-lg border border-attention/40 bg-attention-soft p-4">
          <p className="font-semibold text-attention-text">
            A experimental continuará
            como “Não compareceu”
          </p>

          <p className="mt-1 text-sm text-attention-text">
            Só o acompanhamento da família
            será encerrado.
          </p>
        </div>

        <LostReasonSelect
          value={lostReason}
          onChange={setLostReason}
          label="Motivo do encerramento"
        />

        <FormTextarea
          label="Observação"
          value={notes}
          onChange={setNotes}
          placeholder="Ex.: Fizemos novas tentativas, mas a família não respondeu."
        />

        <ModalActions
          saving={saving}
          onClose={onClose}
          submitLabel="Encerrar"
        />
      </form>
    </Dialog>
  );
}
