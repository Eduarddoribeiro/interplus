import { useState } from "react";
import { GraduationCap, PhoneCall, XCircle } from "lucide-react";

import { Dialog } from "../../ui";
import { toast } from "../common/Toaster";
import { ModalActions, FormDate, FormTextarea, LostReasonSelect } from "./modalFields";
import { getTodayISO } from "../../../helpers/experimentalDates";

export default function ExperimentalResultModal({
  session,
  saving,
  onClose,
  onSave,
}) {
  const contact =
    session.contact || {};

  const [result, setResult] =
    useState("enrolled");

  const [
    followUpDate,
    setFollowUpDate,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  const [
    lostReason,
    setLostReason,
  ] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (
      result === "follow_up" &&
      !followUpDate
    ) {
      toast(
        "Informe a data do retorno."
      );
      return;
    }

    if (
      result === "lost" &&
      !lostReason
    ) {
      toast(
        "Informe o motivo do encerramento."
      );
      return;
    }

    onSave({
      result,
      followUpDate:
        result === "follow_up"
          ? followUpDate
          : null,
      notes,
      lostReason:
        result === "lost"
          ? lostReason
          : null,
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      busy={saving}
      title="Resultado da experimental"
      description={contact.child_name}
    >
      <form onSubmit={handleSubmit}>
        <p className="text-sm font-semibold text-ink">
          Qual foi o resultado?
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <ResultOption
            active={
              result === "enrolled"
            }
            icon={GraduationCap}
            label="Matriculou"
            onClick={() =>
              setResult("enrolled")
            }
          />

          <ResultOption
            active={
              result === "follow_up"
            }
            icon={PhoneCall}
            label="Retorno"
            onClick={() =>
              setResult("follow_up")
            }
          />

          <ResultOption
            active={
              result === "lost"
            }
            icon={XCircle}
            label="Encerrar"
            onClick={() =>
              setResult("lost")
            }
          />
        </div>

        {result === "enrolled" && (
          <div className="mt-6 rounded-lg border border-ok/30 bg-ok-soft p-4">
            <p className="font-semibold text-ok">
              Matrícula realizada
            </p>

            <p className="mt-1 text-sm text-ok">
              O contato será marcado como
              matriculado.
            </p>
          </div>
        )}

        {result === "follow_up" && (
          <FormDate
            label="Data do próximo contato"
            value={followUpDate}
            min={getTodayISO()}
            onChange={setFollowUpDate}
          />
        )}

        {result === "lost" && (
          <LostReasonSelect
            value={lostReason}
            onChange={setLostReason}
            label="Motivo do encerramento"
          />
        )}

        <FormTextarea
          label="Observação"
          value={notes}
          onChange={setNotes}
          placeholder="Adicione uma observação sobre a decisão da família..."
        />

        <ModalActions
          saving={saving}
          onClose={onClose}
          submitLabel={
            result === "enrolled"
              ? "Confirmar matrícula"
              : result === "follow_up"
              ? "Agendar retorno"
              : "Encerrar"
          }
        />
      </form>
    </Dialog>
  );
}

function ResultOption({
  active,
  icon: Icon,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        items-center
        justify-center
        gap-2
        rounded-lg
        border
        px-3
        py-3
        text-sm
        font-semibold
        transition-colors
        ${
          active
            ? "border-ink bg-ink text-white"
            : "border-line bg-white text-ink hover:border-neutral-400"
        }
      `}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}
