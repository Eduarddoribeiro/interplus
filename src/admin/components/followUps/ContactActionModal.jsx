// src/admin/components/followUps/FollowUpActionModal.jsx

import { useState } from "react";

import {
  CircleCheckBig,
  X,
} from "lucide-react";

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
    eyebrow: "Conversão",
    description:
      "Registre a matrícula deste contato.",
    button: "Confirmar matrícula",
    placeholder:
      "Ex.: Família confirmou a matrícula...",
  },

  [FOLLOW_UP_ACTION.RESCHEDULE]: {
    eyebrow: "Novo retorno",
    description:
      "Escolha quando este contato deve voltar para sua fila.",
    button: "Reagendar retorno",
    placeholder:
      "Ex.: Mãe pediu para chamar novamente após o dia 30...",
  },

  [FOLLOW_UP_ACTION.LOSE]: {
    eyebrow: "Encerrar oportunidade",
    description:
      "Registre por que este contato não converteu.",
    button: "Registrar não conversão",
    placeholder:
      "Ex.: Família informou que o horário não atende...",
  },

  [FOLLOW_UP_ACTION.CLOSE_WAITING_LIST]: {
    eyebrow: "Encerrar interesse",
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
  onClose,
  onSave,
}) {
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
      alert(
        "Informe a nova data do retorno.",
      );

      return;
    }

    if (
      isClosingAction &&
      !lostReason
    ) {
      alert(
        "Informe o motivo do encerramento.",
      );

      return;
    }

    onSave({
      followUpDate,
      lostReason,
      notes,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* =================================================
         * HEADER
         * =============================================== */}

        <div className="flex items-start justify-between border-b border-neutral-100 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
              {config.eyebrow}
            </p>

            <h2 className="mt-2 text-2xl font-bold text-neutral-900">
              {contact.child_name}
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              {config.description}
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================================
         * FORM
         * =============================================== */}

        <form
          onSubmit={handleSubmit}
          className="p-6"
        >
          {/* MATRÍCULA */}

          {type === FOLLOW_UP_ACTION.ENROLL && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <div className="flex gap-3">
                <CircleCheckBig
                  size={20}
                  className="mt-0.5 shrink-0 text-green-700"
                />

                <div>
                  <p className="font-semibold text-green-900">
                    Confirmar matrícula
                  </p>

                  <p className="mt-1 text-sm text-green-700">
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
              <label className="text-sm font-semibold text-neutral-900">
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
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  px-4
                  py-3
                  outline-none
                  focus:border-red-500
                  focus:ring-2
                  focus:ring-red-100
                "
              />
            </div>
          )}

          {/* ENCERRAMENTO */}

          {isClosingAction && (
            <div>
              <label className="text-sm font-semibold text-neutral-900">
                Motivo
              </label>

              <select
                value={lostReason}
                onChange={(event) =>
                  setLostReason(
                    event.target.value,
                  )
                }
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-4
                  py-3
                  outline-none
                  focus:border-red-500
                  focus:ring-2
                  focus:ring-red-100
                "
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
            <label className="text-sm font-semibold text-neutral-900">
              Observação

              <span className="ml-1 font-normal text-neutral-400">
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
              className="
                mt-2
                w-full
                resize-none
                rounded-xl
                border
                border-neutral-200
                px-4
                py-3
                outline-none
                focus:border-red-500
                focus:ring-2
                focus:ring-red-100
              "
            />
          </div>

          {/* =================================================
           * AÇÕES
           * =============================================== */}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {saving
                ? "Salvando..."
                : config.button}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}