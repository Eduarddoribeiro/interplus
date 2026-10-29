// src/admin/components/followUps/WaitingListQualificationModal.jsx

import { useMemo, useState } from "react";

import { toast } from "../common/Toaster";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { buttonClass, Dialog, inputClass } from "../../ui";

import {
  INTEREST_QUALIFICATION,
  INTEREST_QUALIFICATION_LABELS,
} from "../../../constants/interestQualification";

import {
  PREFERRED_SHIFT,
  PREFERRED_SHIFT_LABELS,
} from "../../../constants/preferredShift";

/* =========================================================
 * COMPONENTE
 * =======================================================*/

export default function WaitingListQualificationModal({
  contact,
  categories = [],
  // Quando informado, permite editar o local de preferência
  locations = null,
  saving = false,
  onClose,
  onSave,
}) {
  const [locationId, setLocationId] = useState(
    contact.location_id ? String(contact.location_id) : "",
  );

  const initialCategoryId =
    contact.interest_category_id ||
    contact.interest_category?.id ||
    contact.category_id ||
    contact.category?.id ||
    "";

  const [categoryId, setCategoryId] = useState(
    initialCategoryId ? String(initialCategoryId) : "",
  );

  const [preferredShift, setPreferredShift] = useState(
    contact.preferred_shift || "",
  );

  const [qualificationStatus, setQualificationStatus] = useState(
    contact.qualification_status || INTEREST_QUALIFICATION.INCOMPLETE,
  );

  const [birthDate, setBirthDate] = useState(contact.birth_date || "");

  const [childName, setChildName] = useState(contact.child_name || "");

  const [responsibleName, setResponsibleName] = useState(
    contact.responsible_name || "",
  );

  const [notes, setNotes] = useState("");

  /* =======================================================
   * VALIDAÇÃO VISUAL
   * =====================================================*/

  const missingFields = useMemo(() => {
    const missing = [];

    if (!childName.trim()) {
      missing.push("nome da criança");
    }

    if (!responsibleName.trim()) {
      missing.push("responsável");
    }

    if (!categoryId) {
      missing.push("categoria de interesse");
    }

    if (!preferredShift) {
      missing.push("turno preferido");
    }

    if (!birthDate) {
      missing.push("data de nascimento");
    }

    return missing;
  }, [childName, responsibleName, categoryId, preferredShift, birthDate]);

  const canMarkComplete = missingFields.length === 0;

  /* =======================================================
   * SUBMIT
   * =====================================================*/

  function handleSubmit(event) {
    event.preventDefault();

    if (
      qualificationStatus === INTEREST_QUALIFICATION.COMPLETE &&
      !canMarkComplete
    ) {
      toast(
        `Para marcar como qualificado, complete: ${missingFields.join(", ")}.`,
      );

      return;
    }

onSave({
  ...(locations ? { location_id: locationId || null } : {}),

  child_name: childName.trim() || null,

  responsible_name:
    responsibleName.trim() || null,

  interest_category_id:
    categoryId || null,

  preferred_shift:
    preferredShift || null,

  qualification_status:
    qualificationStatus,

  birth_date:
    birthDate || null,

  notes: notes.trim(),
});
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Qualificação da família"
      description={contact.child_name || "Contato sem nome"}
      size="lg"
      busy={saving}
    >

        {/* =================================================
         * FORM
         * =============================================== */}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            {/* CATEGORIA */}

            <div>
              <label
                htmlFor="qualification-category"
                className="text-sm font-medium text-ink"
              >
                Categoria de interesse
              </label>

              <select
                id="qualification-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className={`mt-1.5 ${inputClass}`}
              >
                <option value="">Selecione</option>

                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="qualification-child-name"
                  className="text-sm font-medium text-ink"
                >
                  Nome da criança
                </label>

                <input
                  id="qualification-child-name"
                  type="text"
                  value={childName}
                  onChange={(event) => setChildName(event.target.value)}
                  placeholder="Ex.: Anthony"
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>

              <div>
                <label
                  htmlFor="qualification-responsible-name"
                  className="text-sm font-medium text-ink"
                >
                  Responsável
                </label>

                <input
                  id="qualification-responsible-name"
                  type="text"
                  value={responsibleName}
                  onChange={(event) => setResponsibleName(event.target.value)}
                  placeholder="Ex.: Fernanda"
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
            </div>
            {/* LOCAL */}

            {locations && (
              <div>
                <label
                  htmlFor="qualification-location"
                  className="text-sm font-medium text-ink"
                >
                  Local de preferência
                </label>

                <select
                  id="qualification-location"
                  value={locationId}
                  onChange={(event) => setLocationId(event.target.value)}
                  className={`mt-1.5 ${inputClass}`}
                >
                  <option value="">Qualquer local</option>

                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* TURNO */}

            <div>
              <label
                htmlFor="qualification-shift"
                className="text-sm font-medium text-ink"
              >
                Turno preferido
              </label>

              <select
                id="qualification-shift"
                value={preferredShift}
                onChange={(event) => setPreferredShift(event.target.value)}
                className={`mt-1.5 ${inputClass}`}
              >
                <option value="">Não informado</option>

                {Object.values(PREFERRED_SHIFT).map((shift) => (
                  <option key={shift} value={shift}>
                    {PREFERRED_SHIFT_LABELS[shift] || shift}
                  </option>
                ))}
              </select>
            </div>

            {/* NASCIMENTO */}

            <div>
              <label
                htmlFor="qualification-birth-date"
                className="text-sm font-medium text-ink"
              >
                Data de nascimento
              </label>

              <input
                id="qualification-birth-date"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>

            {/* QUALIFICAÇÃO */}

            <div>
              <label
                htmlFor="qualification-status"
                className="text-sm font-medium text-ink"
              >
                Status da qualificação
              </label>

              <select
                id="qualification-status"
                value={qualificationStatus}
                onChange={(event) => setQualificationStatus(event.target.value)}
                className={`mt-1.5 ${inputClass}`}
              >
                {Object.values(INTEREST_QUALIFICATION).map((status) => (
                  <option key={status} value={status}>
                    {INTEREST_QUALIFICATION_LABELS[status] || status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =================================================
           * SITUAÇÃO DO CADASTRO
           * =============================================== */}

          <div className="mt-6">
            {canMarkComplete ? (
              <div className="rounded-lg border border-ok/30 bg-ok-soft p-4">
                <div className="flex gap-3">
                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-ok"
                  />

                  <div>
                    <p className="text-sm font-semibold text-ok">
                      Dados essenciais preenchidos
                    </p>

                    <p className="mt-1 text-sm leading-6 text-ok">
                      Este contato possui categoria, turno e data de nascimento.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-attention/40 bg-attention-soft p-4">
                <div className="flex gap-3">
                  <AlertTriangle
                    size={19}
                    className="mt-0.5 shrink-0 text-attention-text"
                  />

                  <div>
                    <p className="text-sm font-semibold text-attention-text">
                      Cadastro ainda incompleto
                    </p>

                    <p className="mt-1 text-sm leading-6 text-attention-text">
                      Falta completar: {missingFields.join(", ")}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =================================================
           * OBSERVAÇÃO
           * =============================================== */}

          <div className="mt-6">
            <label
              htmlFor="qualification-notes"
              className="text-sm font-medium text-ink"
            >
              Observação interna
              <span className="ml-1 font-normal text-muted">
                (opcional)
              </span>
            </label>

            <textarea
              id="qualification-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Ex.: Família demonstrou interesse na nova turma da manhã..."
              className={`mt-1.5 resize-none ${inputClass}`}
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
              className={buttonClass("secondary")}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className={buttonClass("primary")}
            >
              {saving ? "Salvando..." : "Salvar qualificação"}
            </button>
          </div>
        </form>
    </Dialog>
  );
}
