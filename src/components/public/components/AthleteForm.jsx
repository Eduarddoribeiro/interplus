import { useEffect, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";

import { getCategoryByBirthDate } from "../../../services/categories";
import {
  getTrialOptions,
  groupTrialOptions,
} from "../../../services/publicRegistration";
import { WEEKDAYS } from "../../../constants/weekdays";
import { SCHOOL } from "../../../constants/school";

const WEEKDAY_SHORT = Object.fromEntries(
  WEEKDAYS.map((weekday) => [weekday.value, weekday.short]),
);

// "19:00:00" -> "19h", "18:30:00" -> "18h30"
function formatHour(time) {
  const [hour, minute] = time.split(":");
  return minute === "00" ? `${Number(hour)}h` : `${Number(hour)}h${minute}`;
}

// Hoje no formato do input de data (fuso local)
function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

function inputClass(hasError) {
  return `w-full rounded-xl border bg-white px-4 py-3 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:ring-2 ${
    hasError
      ? "border-red-500 focus:border-red-600 focus:ring-red-600/20"
      : "border-neutral-300 focus:border-red-600 focus:ring-red-600/10"
  }`;
}

export default function AthleteForm({
  form,
  updateField,
  onNext,
}) {
  // Prévia das turmas: o responsável já vê onde e quando, antes de seguir
  const [preview, setPreview] = useState({ loading: false, groups: null });

  // idle: data incompleta · loading: buscando · done: achou ou não · error: falhou
  const [lookup, setLookup] = useState(form.category ? "done" : "idle");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadCategory() {
      if (!form.birth_date) {
        updateField("category", null);
        setLookup("idle");
        return;
      }

      const year = Number(
        form.birth_date.split("-")[0]
      );

      const currentYear = new Date().getFullYear();

      // Evita consultar enquanto o ano ainda está incompleto
      if (
        !year ||
        year < 1900 ||
        year > currentYear
      ) {
        updateField("category", null);
        setLookup("idle");
        return;
      }

      try {
        setLookup("loading");

        const data = await getCategoryByBirthDate(
          form.birth_date
        );

        updateField("category", data);
        setLookup("done");
      } catch (err) {
        console.error(
          "Erro ao buscar categoria:",
          err
        );

        updateField("category", null);
        setLookup("error");
      }
    }

    loadCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.birth_date]);

  const category = form.category;

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!category?.id) {
        setPreview({ loading: false, groups: null });
        return;
      }

      setPreview({ loading: true, groups: null });

      try {
        const options = await getTrialOptions(category.id);
        if (!cancelled) setPreview({ loading: false, groups: groupTrialOptions(options) });
      } catch (err) {
        console.error("Erro ao buscar turmas:", err);
        if (!cancelled) setPreview({ loading: false, groups: null });
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [category?.id]);

  const hasGroups = preview.groups?.length > 0;

  // Data completa, mas nenhuma categoria cobre essa idade
  const noCategory = !!form.birth_date && lookup === "done" && !category;

  const whatsappUrl = SCHOOL.whatsapp
    ? `https://wa.me/${SCHOOL.whatsapp}?text=${encodeURIComponent(
        "Olá! Quero saber se há turma para a idade do meu filho.",
      )}`
    : null;

  /*
   * O botão fica clicável: ao clicar, mostra no próprio campo o
   * que falta, em vez de travar sem explicação.
   */
  function handleNext() {
    const newErrors = {};

    if (!form.child_name.trim()) {
      newErrors.child_name = "Informe o nome do atleta.";
    }

    if (!form.birth_date) {
      newErrors.birth_date = "Informe a data de nascimento.";
    } else if (form.birth_date > todayIso()) {
      newErrors.birth_date = "A data de nascimento não pode ser no futuro.";
    } else if (lookup === "error") {
      newErrors.birth_date =
        "Não conseguimos verificar a turma agora. Confira sua internet e tente de novo.";
    } else if (!category) {
      newErrors.birth_date = "Confira a data de nascimento.";
    }

    setErrors(newErrors);

    const firstError = Object.keys(newErrors)[0];

    if (firstError) {
      document.getElementById(`athlete-${firstError}`)?.focus();
      return;
    }

    onNext();
  }

  function handleField(field, value) {
    updateField(field, value);

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  return (
    <div className="space-y-6">

      {/* CABEÇALHO */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 outline-none sm:text-3xl">
          Quem vai treinar?
        </h2>

        <p className="mt-1 text-neutral-500">
          Pela data de nascimento mostramos a turma certa para a idade.
        </p>
      </div>

      {/* CAMPOS */}
      <div className="space-y-5">

        {/* NOME */}
        <div>
          <label
            htmlFor="athlete-child_name"
            className="mb-2 block text-sm font-semibold text-neutral-900"
          >
            Nome do atleta
          </label>

          <input
            id="athlete-child_name"
            name="child_name"
            type="text"
            autoComplete="off"
            value={form.child_name}
            onChange={(e) => handleField("child_name", e.target.value)}
            aria-invalid={!!errors.child_name}
            aria-describedby={errors.child_name ? "athlete-child_name-error" : undefined}
            className={inputClass(errors.child_name)}
            placeholder="Nome completo"
          />

          {errors.child_name && (
            <p id="athlete-child_name-error" className="mt-2 text-sm text-red-600">
              {errors.child_name}
            </p>
          )}
        </div>

        {/* NASCIMENTO */}
        <div>
          <label
            htmlFor="athlete-birth_date"
            className="mb-2 block text-sm font-semibold text-neutral-900"
          >
            Data de nascimento
          </label>

          <input
            id="athlete-birth_date"
            name="birth_date"
            type="date"
            min="1990-01-01"
            max={todayIso()}
            value={form.birth_date}
            onChange={(e) => handleField("birth_date", e.target.value)}
            aria-invalid={!!errors.birth_date}
            aria-describedby={errors.birth_date ? "athlete-birth_date-error" : undefined}
            className={inputClass(errors.birth_date)}
          />

          {errors.birth_date && (
            <p id="athlete-birth_date-error" className="mt-2 text-sm text-red-600">
              {errors.birth_date}
            </p>
          )}
        </div>

      </div>

      {/* IDADE SEM TURMA */}
      {noCategory && (
        <div
          role="status"
          className="rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-sm text-neutral-700"
        >
          <p className="font-semibold text-neutral-900">
            Não temos turma para essa idade.
          </p>

          <p className="mt-1">
            Confira se a data está certa. Se estiver, fale com a gente que
            avisamos quando abrir uma turma.
          </p>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex rounded-xl bg-green-600 px-4 py-2.5 font-semibold text-white transition hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-600/40 focus-visible:ring-offset-2"
            >
              Falar com a escola no WhatsApp
            </a>
          )}
        </div>
      )}

      {/* CATEGORIA + PRÉVIA DAS TURMAS */}
      <div aria-live="polite">
        {form.birth_date && category && (
          <div className="overflow-hidden rounded-2xl border border-red-100 bg-red-50/60">

            <div className="px-5 py-4">
              <p className="text-sm text-neutral-600">
                {form.child_name ? `${form.child_name.split(" ")[0]} é` : "Categoria"}
              </p>

              <p className="text-3xl font-bold text-red-600">
                {category.name}
              </p>
            </div>

            <div className="border-t border-red-100 bg-white/70 px-5 py-4 text-sm">
              {preview.loading && (
                <p className="text-neutral-500">Buscando turmas…</p>
              )}

              {!preview.loading && hasGroups && (
                <ul className="space-y-3">
                  {preview.groups.map((group) => (
                    <li key={group.id}>
                      <p className="flex items-center gap-1.5 font-semibold text-neutral-900">
                        <MapPin size={15} aria-hidden="true" className="text-red-600" />
                        {group.location?.name}
                        <span className="font-normal text-neutral-500">
                          · {group.modality?.name}
                        </span>
                      </p>

                      <p className="mt-0.5 flex items-center gap-1.5 text-neutral-600">
                        <CalendarDays size={15} aria-hidden="true" className="text-neutral-400" />
                        {group.schedules
                          .map((schedule) => `${WEEKDAY_SHORT[schedule.weekday]} ${formatHour(schedule.start_time)}`)
                          .join(" · ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {!preview.loading && preview.groups && !hasGroups && (
                <p className="text-neutral-600">
                  No momento não há turma com vaga para esta idade. No próximo
                  passo você entra na lista de interesse e avisamos quando abrir.
                </p>
              )}
            </div>

          </div>
        )}
      </div>

      {/* BOTÃO */}
      <div className="flex justify-end pt-1">

        <button
          type="button"
          // Sem categoria não há próximo passo: o aviso acima explica
          disabled={lookup === "loading" || noCategory}
          onClick={handleNext}
          className="w-full rounded-xl bg-red-600 px-8 py-3.5 font-semibold text-white transition hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {lookup === "loading"
            ? "Verificando idade…"
            : preview.groups && !hasGroups
              ? "Continuar"
              : "Ver horários"}
        </button>

      </div>

    </div>
  );
}
