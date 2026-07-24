import { useState } from "react";

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

  const canContinue =
    form.responsible_name.trim().length > 0 &&
    form.phone.replace(/\D/g, "").length === 11;

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-3xl font-bold text-neutral-900">
          Dados do Responsável
        </h2>

        <p className="mt-2 text-neutral-500">
          Preencha os dados do responsável para confirmarmos a aula
          experimental pelo WhatsApp.
        </p>

        <p className="mt-3 text-xs text-neutral-400">
          * Campos obrigatórios
        </p>
      </div>

      {/* Nome + WhatsApp */}
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
                ? "border-red-500 focus:border-red-600"
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
            inputMode="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) =>
              handlePhone(e.target.value)
            }
            className={`w-full rounded-xl border bg-white px-4 py-3 outline-none transition ${
              errors.phone
                ? "border-red-500 focus:border-red-600"
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

      {/* E-mail + Bairro */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-800">
            E-mail
          </label>

          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) =>
              updateField("email", e.target.value)
            }
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-red-600"
            placeholder="email@exemplo.com"
          />
        </div>

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
      </div>

      {/* Origem + Histórico */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-800">
            Como conheceu a escola?
          </label>

          <select
            value={form.source}
            onChange={(e) =>
              updateField("source", e.target.value)
            }
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-red-600"
          >
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="Google">Google</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Indicação">Indicação</option>
            <option value="Evento">Evento</option>
            <option value="Passou em frente">
              Passou em frente
            </option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-800">
            O atleta já treinou em outra escola?
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
                  : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400"
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
                  : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400"
              }`}
            >
              Sim
            </button>
          </div>
        </div>
      </div>

      {/* Clube anterior */}
      {form.trained_elsewhere && (
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-800">
            Qual escola ou clube?
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
            placeholder="Nome da escola ou clube"
          />
        </div>
      )}

      {/* Observações */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-800">
          Observações
        </label>

        <textarea
          rows={3}
          value={form.observations}
          onChange={(e) =>
            updateField(
              "observations",
              e.target.value
            )
          }
          className="min-h-[100px] w-full resize-y rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-red-600"
          placeholder="Alguma informação importante?"
        />
      </div>

      {/* Navegação */}
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