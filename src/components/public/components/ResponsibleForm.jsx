import { useState } from "react";

import { SCHOOL, SOURCE_OPTIONS } from "../../../constants/school";

const LABEL_CLASS = "mb-2 block text-sm font-semibold text-neutral-800";

function inputClass(hasError) {
  return `w-full rounded-xl border bg-white px-4 py-3 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:ring-2 ${
    hasError
      ? "border-red-500 focus:border-red-600 focus:ring-red-600/20"
      : "border-neutral-300 focus:border-red-600 focus:ring-red-600/10"
  }`;
}

function YesNo({ value, onChange, labelledBy }) {
  return (
    <div role="group" aria-labelledby={labelledBy} className="grid grid-cols-2 gap-3">
      {[
        { label: "Não", selected: !value, next: false },
        { label: "Sim", selected: value, next: true },
      ].map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={option.selected}
          onClick={() => onChange(option.next)}
          className={`rounded-xl border px-4 py-3 font-semibold transition focus-visible:ring-2 focus-visible:ring-red-600/30 ${
            option.selected
              ? "border-red-600 bg-red-50 text-red-700"
              : "border-neutral-300 text-neutral-800 hover:bg-neutral-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function FieldError({ id, message }) {
  if (!message) return null;

  return (
    <p id={id} className="mt-2 text-sm text-red-600">
      {message}
    </p>
  );
}

export default function ResponsibleForm({
  form,
  updateField,
  onBack,
  onNext,
}) {
  const [errors, setErrors] = useState({});

  function formatPhone(value) {
    const numbers = value.replace(/\D/g, "").slice(0, 11);

    if (numbers.length <= 2) {
      return numbers;
    }

    if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }

    return `(${numbers.slice(0, 2)}) ${numbers.slice(
      2,
      7
    )}-${numbers.slice(7)}`;
  }

  function validate() {
    const newErrors = {};

    if (!form.responsible_name.trim()) {
      newErrors.responsible_name =
        "Informe o nome do responsável.";
    }

    const phoneNumbers = form.phone.replace(/\D/g, "");

    if (!phoneNumbers) {
      newErrors.phone = "Informe o WhatsApp.";
    } else if (phoneNumbers.length !== 11) {
      newErrors.phone =
        "Confira o número: DDD + 9 dígitos, ex. (51) 99999-9999.";
    }

    if (!form.consent) {
      newErrors.consent =
        "Marque a autorização para podermos falar com você pelo WhatsApp.";
    }

    setErrors(newErrors);

    return newErrors;
  }

  /*
   * O botão fica sempre clicável: ao clicar, mostra no próprio
   * campo o que falta e leva o foco até o primeiro problema.
   */
  function handleNext() {
    const firstError = Object.keys(validate())[0];

    if (firstError) {
      document.getElementById(`responsible-${firstError}`)?.focus();
      return;
    }

    onNext();
  }

  function clearError(field) {
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  }

  function handleResponsibleName(value) {
    updateField("responsible_name", value);
    clearError("responsible_name");
  }

  function handlePhone(value) {
    updateField("phone", formatPhone(value));
    clearError("phone");
  }

  function handleConsent(value) {
    updateField("consent", value);
    clearError("consent");
  }

  function handleTrainedElsewhere(value) {
    updateField("trained_elsewhere", value);

    if (!value) {
      updateField("previous_club", "");
    }
  }

  return (
    <div className="space-y-6">

      {/* CABEÇALHO */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 outline-none sm:text-3xl">
          Dados do responsável
        </h2>

        <p className="mt-2 text-neutral-500">
          {form.interest_reason
            ? "Preencha os dados para entrarmos em contato assim que houver disponibilidade."
            : "Preencha os dados para confirmarmos a aula experimental pelo WhatsApp."}
        </p>

        <p className="mt-3 text-xs text-neutral-500">
          * Campos obrigatórios
        </p>
      </div>

      {/* DADOS DO RESPONSÁVEL */}
      <section className="space-y-6">

        <div className="grid gap-6 md:grid-cols-2">

          <div>
            <label htmlFor="responsible-responsible_name" className={LABEL_CLASS}>
              Nome do responsável *
            </label>

            <input
              id="responsible-responsible_name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.responsible_name}
              onChange={(e) =>
                handleResponsibleName(e.target.value)
              }
              aria-invalid={!!errors.responsible_name}
              aria-describedby={errors.responsible_name ? "responsible-responsible_name-error" : undefined}
              className={inputClass(errors.responsible_name)}
              placeholder="Nome completo"
            />

            <FieldError
              id="responsible-responsible_name-error"
              message={errors.responsible_name}
            />
          </div>

          <div>
            <label htmlFor="responsible-phone" className={LABEL_CLASS}>
              WhatsApp *
            </label>

            <input
              id="responsible-phone"
              name="tel"
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              value={form.phone}
              onChange={(e) =>
                handlePhone(e.target.value)
              }
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "responsible-phone-error" : undefined}
              className={inputClass(errors.phone)}
              placeholder="(51) 99999-9999"
            />

            <FieldError id="responsible-phone-error" message={errors.phone} />
          </div>

        </div>

        <div className="grid gap-6 md:grid-cols-2">

          <div>
            <label htmlFor="responsible-neighborhood" className={LABEL_CLASS}>
              Bairro
            </label>

            <input
              id="responsible-neighborhood"
              name="neighborhood"
              type="text"
              autoComplete="address-level3"
              value={form.neighborhood}
              onChange={(e) =>
                updateField(
                  "neighborhood",
                  e.target.value
                )
              }
              className={inputClass(false)}
              placeholder="Seu bairro"
            />
          </div>

          <div>
            <label htmlFor="responsible-source" className={LABEL_CLASS}>
              Como conheceu a escola?
            </label>

            <select
              id="responsible-source"
              name="source"
              value={form.source}
              onChange={(e) => updateField("source", e.target.value)}
              className={inputClass(false)}
            >
              <option value="">Selecione…</option>

              {SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Anti-robô: escondido de pessoas, robôs preenchem */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Site
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => updateField("website", e.target.value)}
            />
          </label>
        </div>

      </section>

      <div className="border-t border-neutral-200" />

      {form.interest_reason ? (

        /* PREFERÊNCIAS — LISTA DE INTERESSE */
        <section className="space-y-6">

          <h3 className="text-lg font-bold text-neutral-900">
            Preferências
          </h3>

          <p className="text-sm text-neutral-500">
            Essas informações nos ajudam a avisar você assim que a turma
            certa estiver disponível.
          </p>

          <div>
            <label htmlFor="responsible-preferred_shift" className={LABEL_CLASS}>
              Turno de preferência
            </label>

            <select
              id="responsible-preferred_shift"
              name="preferred_shift"
              value={form.preferred_shift}
              onChange={(e) =>
                updateField(
                  "preferred_shift",
                  e.target.value
                )
              }
              className={inputClass(false)}
            >
              <option value="morning">Manhã</option>
              <option value="afternoon">Tarde</option>
              <option value="evening">Noite</option>
              <option value="any">Indiferente</option>
            </select>
          </div>

          <div>
            <label htmlFor="responsible-observations" className={LABEL_CLASS}>
              Observações
            </label>

            <textarea
              id="responsible-observations"
              name="observations"
              rows={4}
              value={form.observations}
              onChange={(e) =>
                updateField(
                  "observations",
                  e.target.value
                )
              }
              className={`${inputClass(false)} min-h-[110px] resize-y`}
              placeholder="Alguma informação que possa nos ajudar?"
            />

            <p className="mt-2 text-xs text-neutral-500">
              Campo opcional.
            </p>
          </div>

        </section>

      ) : (

        <>

          {/* INFORMAÇÕES DO ATLETA */}

          <section className="space-y-6">

            <h3 className="text-lg font-bold text-neutral-900">
              Informações do atleta
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p id="responsible-trained_elsewhere-label" className={LABEL_CLASS}>
                  O atleta já treinou em outra escola de futebol?
                </p>

                <YesNo
                  labelledBy="responsible-trained_elsewhere-label"
                  value={form.trained_elsewhere}
                  onChange={handleTrainedElsewhere}
                />
              </div>
            </div>

            {form.trained_elsewhere && (
              <div>
                <label htmlFor="responsible-previous_club" className={LABEL_CLASS}>
                  Onde treinou anteriormente?
                </label>

                <input
                  id="responsible-previous_club"
                  name="previous_club"
                  type="text"
                  autoComplete="off"
                  value={form.previous_club}
                  onChange={(e) =>
                    updateField(
                      "previous_club",
                      e.target.value
                    )
                  }
                  className={inputClass(false)}
                  placeholder="Nome da escola de futebol ou clube"
                />
              </div>
            )}

            <div>
              <p id="responsible-goalkeeper-label" className={LABEL_CLASS}>
                Costuma jogar no gol?
              </p>

              <YesNo
                labelledBy="responsible-goalkeeper-label"
                value={form.preferred_position === "goalkeeper"}
                onChange={(isGoalkeeper) =>
                  updateField(
                    "preferred_position",
                    isGoalkeeper ? "goalkeeper" : ""
                  )
                }
              />
            </div>

          </section>

          <div className="border-t border-neutral-200" />

          {/* INFORMAÇÕES PARA O PROFESSOR */}

          <section className="space-y-6">

            <h3 className="text-lg font-bold text-neutral-900">
              Informações importantes para o professor
            </h3>

            <p className="text-sm text-neutral-500">
              Estas informações ajudam nossa equipe a oferecer um treino mais
              seguro e adequado ao atleta.
            </p>

            <div>
              <label htmlFor="responsible-coach_notes" className={LABEL_CLASS}>
                Há alguma informação importante que o professor deva saber?
              </label>

              <textarea
                id="responsible-coach_notes"
                name="coach_notes"
                rows={5}
                value={form.coach_notes}
                onChange={(e) =>
                  updateField(
                    "coach_notes",
                    e.target.value
                  )
                }
                className={`${inputClass(false)} min-h-[130px] resize-y`}
                placeholder="Ex.: asma, restrição médica, lesão recente, uso de medicamento, TDAH, TEA ou qualquer outra informação importante."
              />

              <p className="mt-2 text-xs text-neutral-500">
                Campo opcional.
              </p>
            </div>

          </section>

        </>

      )}

      {/* CONSENTIMENTO (LGPD) */}

      <div>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${
            errors.consent
              ? "border-red-300 bg-red-50"
              : "border-neutral-200 bg-neutral-50"
          }`}
        >
          <input
            id="responsible-consent"
            name="consent"
            type="checkbox"
            checked={form.consent}
            onChange={(e) => handleConsent(e.target.checked)}
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? "responsible-consent-error" : undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-red-600"
          />

          <span className="text-sm leading-relaxed text-neutral-700">
            Autorizo a {SCHOOL.name} a entrar em contato pelo WhatsApp e a usar
            estes dados somente para agendar e acompanhar a aula do atleta. *
          </span>
        </label>

        <FieldError id="responsible-consent-error" message={errors.consent} />
      </div>

      {/* NAVEGAÇÃO */}

      <div className="flex items-center justify-between gap-3 border-t border-neutral-200 pt-6">

        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-800 transition hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-red-600/30"
        >
          Voltar
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="rounded-xl bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600/40 focus-visible:ring-offset-2"
        >
          Continuar
        </button>

      </div>

    </div>
  );
}
