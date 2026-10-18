// src/admin/components/followUps/WaitingListQualificationModal.jsx

import { useMemo, useState } from "react";

import { toast } from "../common/Toaster";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* =================================================
         * HEADER
         * =============================================== */}

        <div className="flex items-start justify-between border-b border-neutral-100 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-600">
              Qualificação comercial
            </p>

            <h2 className="mt-2 text-2xl font-bold text-neutral-900">
              {contact.child_name || "Contato sem nome"}
            </h2>

            <p className="mt-1 text-sm leading-6 text-neutral-500">
              Complete as informações que ajudam a identificar oportunidades na
              lista de interesse.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================================
         * FORM
         * =============================================== */}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {/* CATEGORIA */}

            <div>
              <label
                htmlFor="qualification-category"
                className="text-sm font-semibold text-neutral-900"
              >
                Categoria de interesse
              </label>

              <select
                id="qualification-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-purple-500
                  focus:ring-2
                  focus:ring-purple-100
                "
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
                  className="text-sm font-semibold text-neutral-900"
                >
                  Nome da criança
                </label>

                <input
                  id="qualification-child-name"
                  type="text"
                  value={childName}
                  onChange={(event) => setChildName(event.target.value)}
                  placeholder="Ex.: Anthony"
                  className="
        mt-2
        w-full
        rounded-xl
        border
        border-neutral-200
        px-4
        py-3
        text-sm
        outline-none
        focus:border-purple-500
        focus:ring-2
        focus:ring-purple-100
      "
                />
              </div>

              <div>
                <label
                  htmlFor="qualification-responsible-name"
                  className="text-sm font-semibold text-neutral-900"
                >
                  Responsável
                </label>

                <input
                  id="qualification-responsible-name"
                  type="text"
                  value={responsibleName}
                  onChange={(event) => setResponsibleName(event.target.value)}
                  placeholder="Ex.: Fernanda"
                  className="
        mt-2
        w-full
        rounded-xl
        border
        border-neutral-200
        px-4
        py-3
        text-sm
        outline-none
        focus:border-purple-500
        focus:ring-2
        focus:ring-purple-100
      "
                />
              </div>
            </div>
            {/* LOCAL */}

            {locations && (
              <div>
                <label
                  htmlFor="qualification-location"
                  className="text-sm font-semibold text-neutral-900"
                >
                  Local de preferência
                </label>

                <select
                  id="qualification-location"
                  value={locationId}
                  onChange={(event) => setLocationId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
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
                className="text-sm font-semibold text-neutral-900"
              >
                Turno preferido
              </label>

              <select
                id="qualification-shift"
                value={preferredShift}
                onChange={(event) => setPreferredShift(event.target.value)}
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-purple-500
                  focus:ring-2
                  focus:ring-purple-100
                "
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
                className="text-sm font-semibold text-neutral-900"
              >
                Data de nascimento
              </label>

              <input
                id="qualification-birth-date"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-purple-500
                  focus:ring-2
                  focus:ring-purple-100
                "
              />
            </div>

            {/* QUALIFICAÇÃO */}

            <div>
              <label
                htmlFor="qualification-status"
                className="text-sm font-semibold text-neutral-900"
              >
                Status da qualificação
              </label>

              <select
                id="qualification-status"
                value={qualificationStatus}
                onChange={(event) => setQualificationStatus(event.target.value)}
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-purple-500
                  focus:ring-2
                  focus:ring-purple-100
                "
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
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="flex gap-3">
                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-green-700"
                  />

                  <div>
                    <p className="text-sm font-semibold text-green-900">
                      Dados essenciais preenchidos
                    </p>

                    <p className="mt-1 text-sm leading-6 text-green-700">
                      Este contato possui categoria, turno e data de nascimento.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle
                    size={19}
                    className="mt-0.5 shrink-0 text-amber-700"
                  />

                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Cadastro ainda incompleto
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-800">
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
              className="text-sm font-semibold text-neutral-900"
            >
              Observação interna
              <span className="ml-1 font-normal text-neutral-400">
                (opcional)
              </span>
            </label>

            <textarea
              id="qualification-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Ex.: Família demonstrou interesse na nova turma da manhã..."
              className="
                mt-2
                w-full
                resize-none
                rounded-xl
                border
                border-neutral-200
                px-4
                py-3
                text-sm
                outline-none
                focus:border-purple-500
                focus:ring-2
                focus:ring-purple-100
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
              className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar qualificação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
