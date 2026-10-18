import { useState } from "react";

import { SCHOOL, SOURCE_OPTIONS } from "../../../constants/school";

function YesNo({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Não", selected: !value, next: false },
        { label: "Sim", selected: value, next: true },
      ].map((option) => (
        <button
          key={option.label}
          type="button"
          onClick={() => onChange(option.next)}
          className={`rounded-xl border px-4 py-3 font-semibold transition ${
            option.selected
              ? "border-red-600 bg-red-50 text-red-700"
              : "border-neutral-300"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
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
        "Informe um WhatsApp válido com DDD.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (!validate()) return;

    onNext();
  }

  function handleResponsibleName(value) {
    updateField("responsible_name", value);

    if (errors.responsible_name) {
      setErrors((prev) => ({
        ...prev,
        responsible_name: undefined,
      }));
    }
  }

  function handlePhone(value) {
    updateField("phone", formatPhone(value));

    if (errors.phone) {
      setErrors((prev) => ({
        ...prev,
        phone: undefined,
      }));
    }
  }

  function handleTrainedElsewhere(value) {
    updateField("trained_elsewhere", value);

    if (!value) {
      updateField("previous_club", "");
    }
  }

 function handleSource(value) {
  updateField("source", value);
}

  const canContinue =
    form.responsible_name.trim().length > 0 &&
    form.phone.replace(/\D/g, "").length === 11 &&
    form.consent;

  return (
    <div className="space-y-6">

      {/* CABEÇALHO */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
          Dados do Responsável
        </h2>

        <p className="mt-2 text-neutral-500">
          {form.interest_reason
            ? "Preencha os dados para entrarmos em contato assim que houver disponibilidade."
            : "Preencha os dados para confirmarmos a aula experimental pelo WhatsApp."}
        </p>

        <p className="mt-3 text-xs text-neutral-400">
          * Campos obrigatórios
        </p>
      </div>

      {/* DADOS DO RESPONSÁVEL */}
      <section className="space-y-6">

        <h3 className="text-lg font-bold text-neutral-900">
          Dados do responsável
        </h3>

        <div className="grid gap-6 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              Nome do responsável *
            </label>

            <input
              type="text"
              autoComplete="name"
              value={form.responsible_name}
              onChange={(e) =>
                handleResponsibleName(e.target.value)
              }
              className={`w-full rounded-xl border bg-white px-4 py-3 outline-none transition ${
                errors.responsible_name
                  ? "border-red-500"
                  : "border-neutral-300 focus:border-red-600"
              }`}
              placeholder="Nome completo"
            />

            {errors.responsible_name && (
              <p className="mt-2 text-sm text-red-600">
                {errors.responsible_name}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              WhatsApp *
            </label>

            <input
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) =>
                handlePhone(e.target.value)
              }
              className={`w-full rounded-xl border bg-white px-4 py-3 outline-none transition ${
                errors.phone
                  ? "border-red-500"
                  : "border-neutral-300 focus:border-red-600"
              }`}
              placeholder="(51) 99999-9999"
            />

            {errors.phone && (
              <p className="mt-2 text-sm text-red-600">
                {errors.phone}
              </p>
            )}
          </div>

        </div>

        <div className="grid gap-6 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              Bairro
            </label>

            <input
              type="text"
              autoComplete="address-level3"
              value={form.neighborhood}
              onChange={(e) =>
                updateField(
                  "neighborhood",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-red-600"
              placeholder="Seu bairro"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              Como conheceu a escola?
            </label>

            <select
              value={form.source}
              onChange={(e) =>
                handleSource(e.target.value)
              }
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-red-600"
            >
              <option value="">Selecione...</option>

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

            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              Turno de preferência
            </label>

            <select
              value={form.preferred_shift}
              onChange={(e) =>
                updateField(
                  "preferred_shift",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-red-600"
            >
              <option value="morning">Manhã</option>
              <option value="afternoon">Tarde</option>
              <option value="evening">Noite</option>
              <option value="any">Indiferente</option>
            </select>

          </div>

          <div>

            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              Observações
            </label>

            <textarea
              rows={4}
              value={form.observations}
              onChange={(e) =>
                updateField(
                  "observations",
                  e.target.value
                )
              }
              className="min-h-[110px] w-full resize-y rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-red-600"
              placeholder="Alguma informação que possa nos ajudar? Campo opcional."
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

                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  O atleta já treinou em outra escola de futebol?
                </label>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      handleTrainedElsewhere(false)
                    }
                    className={`rounded-xl border px-4 py-3 font-semibold transition ${
                      !form.trained_elsewhere
                        ? "border-red-600 bg-red-50 text-red-700"
                        : "border-neutral-300"
                    }`}
                  >
                    Não
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleTrainedElsewhere(true)
                    }
                    className={`rounded-xl border px-4 py-3 font-semibold transition ${
                      form.trained_elsewhere
                        ? "border-red-600 bg-red-50 text-red-700"
                        : "border-neutral-300"
                    }`}
                  >
                    Sim
                  </button>

                </div>

              </div>

            </div>


            {form.trained_elsewhere && (
              <div>

                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  Onde treinou anteriormente?
                </label>

                <input
                  type="text"
                  value={form.previous_club}
                  onChange={(e) =>
                    updateField(
                      "previous_club",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-red-600"
                  placeholder="Nome da escola de futebol ou clube"
                />

              </div>
            )}

            <div>

              <label className="mb-2 block text-sm font-semibold text-neutral-800">
                Costuma jogar no gol?
              </label>

              <YesNo
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

              <label className="mb-2 block text-sm font-semibold text-neutral-800">
                Há alguma informação importante que o professor deva saber?
              </label>

              <textarea
                rows={5}
                value={form.coach_notes}
                onChange={(e) =>
                  updateField(
                    "coach_notes",
                    e.target.value
                  )
                }
                className="min-h-[130px] w-full resize-y rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-red-600"
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

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => updateField("consent", e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-red-600"
        />

        <span className="text-sm leading-relaxed text-neutral-700">
          Autorizo a {SCHOOL.name} a entrar em contato pelo WhatsApp e a usar
          estes dados somente para agendar e acompanhar a aula do atleta. *
        </span>
      </label>

      {/* NAVEGAÇÃO */}

      <div className="flex items-center justify-between border-t border-neutral-200 pt-6">

        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-800 transition hover:bg-neutral-100"
        >
          Voltar
        </button>

        <button
          type="button"
          disabled={!canContinue}
          onClick={handleNext}
          className="rounded-xl bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continuar
        </button>

      </div>

    </div>
  );
}