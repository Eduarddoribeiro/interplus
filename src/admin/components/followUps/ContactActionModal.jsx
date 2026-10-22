// src/admin/components/followUps/FollowUpActionModal.jsx

import { useState } from "react";

import {
  CircleCheckBig,
} from "lucide-react";

import { buttonClass, Dialog, inputClass } from "../../ui";

import {
  FOLLOW_UP_ACTION,
  isFollowUpClosingAction,
} from "../../../constants/followUpActions";

import {
  LOST_REASON_OPTIONS,
} from "../../../constants/lostReasons";

import {
  getTodayISO,
} from "../../../helpers/contactPresentation";

/* =========================================================
 * CONFIGURAÇÕES
 * =======================================================*/

const ACTION_CONFIG = {
  [FOLLOW_UP_ACTION.ENROLL]: {
    title: "Registrar matrícula",
    description:
      "Registre a matrícula deste contato.",
    button: "Confirmar matrícula",
    placeholder:
      "Ex.: Família confirmou a matrícula...",
  },

  [FOLLOW_UP_ACTION.RESCHEDULE]: {
    title: "Reagendar retorno",
    description:
      "Escolha quando este contato deve voltar para sua fila.",
    button: "Reagendar retorno",
    placeholder:
      "Ex.: Mãe pediu para chamar novamente após o dia 30...",
  },

  [FOLLOW_UP_ACTION.LOSE]: {
    title: "Encerrar oportunidade",
    description:
      "Registre por que este contato não converteu.",
    button: "Registrar não conversão",
    placeholder:
      "Ex.: Família informou que o horário não atende...",
  },

  [FOLLOW_UP_ACTION.CLOSE_WAITING_LIST]: {
    title: "Encerrar interesse",
    description:
      "Registre por que a família não deseja mais aguardar.",
    button: "Encerrar contato",
    placeholder:
      "Ex.: Família encontrou outra opção...",
  },
};

/* =========================================================
 * COMPONENTE
 * =======================================================*/

export default function FollowUpActionModal({
  contact,
  type,
  saving,
  // Erro vindo de quem salva (ex.: falha no banco)
  error = "",
  onClose,
  onSave,
}) {
  const [formError, setFormError] =
    useState("");

  const [followUpDate, setFollowUpDate] =
    useState("");

  const [lostReason, setLostReason] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const config =
    ACTION_CONFIG[type] ||
    ACTION_CONFIG[FOLLOW_UP_ACTION.LOSE];

  const isClosingAction =
    isFollowUpClosingAction(type);

  /* =======================================================
   * SUBMIT
   * =====================================================*/

  function handleSubmit(event) {
    event.preventDefault();

    if (
      type === FOLLOW_UP_ACTION.RESCHEDULE &&
      !followUpDate
    ) {
      setFormError("Informe a nova data do retorno.");

      return;
    }

    if (
      isClosingAction &&
      !lostReason
    ) {
      setFormError("Informe o motivo do encerramento.");

      return;
    }

    setFormError("");

    onSave({
      followUpDate,
      lostReason,
      notes,
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={config.title}
      description={contact.child_name}
      busy={saving}
    >

        {/* =================================================
         * FORM
         * =============================================== */}

        <form
          onSubmit={handleSubmit}
        >
          {/* MATRÍCULA */}

          {type === FOLLOW_UP_ACTION.ENROLL && (
            <div className="rounded-lg border border-ok/30 bg-ok-soft p-4">
              <div className="flex gap-3">
                <CircleCheckBig
                  size={20}
                  className="mt-0.5 shrink-0 text-ok"
                />

                <div>
                  <p className="font-semibold text-ok">
                    Confirmar matrícula
                  </p>

                  <p className="mt-1 text-sm text-ok">
                    O contato sairá da fila de
                    retornos e será registrado
                    como matriculado.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* REAGENDAMENTO */}

          {type ===
            FOLLOW_UP_ACTION.RESCHEDULE && (
            <div>
              <label className="text-sm font-medium text-ink">
                Nova data do retorno
              </label>

              <input
                type="date"
                min={getTodayISO()}
                value={followUpDate}
                onChange={(event) =>
                  setFollowUpDate(
                    event.target.value,
                  )
                }
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
          )}

          {/* ENCERRAMENTO */}

          {isClosingAction && (
            <div>
              <label className="text-sm font-medium text-ink">
                Motivo
              </label>

              <select
                value={lostReason}
                onChange={(event) =>
                  setLostReason(
                    event.target.value,
                  )
                }
                className={`mt-1.5 ${inputClass}`}
              >
                <option value="">
                  Selecione
                </option>

                {LOST_REASON_OPTIONS.map(
                  (reason) => (
                    <option
                      key={reason.value}
                      value={reason.value}
                    >
                      {reason.label}
                    </option>
                  ),
                )}
              </select>
            </div>
          )}

          {/* =================================================
           * OBSERVAÇÃO
           * =============================================== */}

          <div className="mt-6">
            <label className="text-sm font-medium text-ink">
              Observação

              <span className="ml-1 font-normal text-muted">
                (opcional)
              </span>
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              placeholder={config.placeholder}
              className={`mt-1.5 resize-none ${inputClass}`}
            />
          </div>

          {/* =================================================
           * AÇÕES
           * =============================================== */}

          {(formError || error) && (
            <p className="mt-6 rounded-lg bg-alert-soft p-3 text-sm font-semibold text-alert-text">
              {formError || error}
            </p>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className={buttonClass("secondary")}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className={buttonClass("primary")}
            >
              {saving
                ? "Salvando..."
                : config.button}
            </button>
          </div>
        </form>
    </Dialog>
  );
}
