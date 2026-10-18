import { useEffect, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";

import { getCategoryByBirthDate } from "../../../services/categories";
import {
  getTrialOptions,
  groupTrialOptions,
} from "../../../services/publicRegistration";
import { WEEKDAYS } from "../../../constants/weekdays";

const WEEKDAY_SHORT = Object.fromEntries(
  WEEKDAYS.map((weekday) => [weekday.value, weekday.short]),
);

// "19:00:00" -> "19h", "18:30:00" -> "18h30"
function formatHour(time) {
  const [hour, minute] = time.split(":");
  return minute === "00" ? `${Number(hour)}h` : `${Number(hour)}h${minute}`;
}

export default function AthleteForm({
  form,
  updateField,
  onNext,
}) {
  // Prévia das turmas: o responsável já vê onde e quando, antes de seguir
  const [preview, setPreview] = useState({ loading: false, groups: null });

  useEffect(() => {
    async function loadCategory() {
      if (!form.birth_date) {
        updateField("category", null);
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
        return;
      }

      try {
        const data = await getCategoryByBirthDate(
          form.birth_date
        );

        updateField("category", data);
      } catch (err) {
        console.error(
          "Erro ao buscar categoria:",
          err
        );

        updateField("category", null);
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

  return (
    <div className="space-y-6">

      {/* CABEÇALHO */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
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
          <label className="mb-2 block text-sm font-semibold text-neutral-900">
            Nome do atleta
          </label>

          <input
            type="text"
            autoComplete="off"
            value={form.child_name}
            onChange={(e) =>
              updateField("child_name", e.target.value)
            }
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-red-600 focus:ring-2 focus:ring-red-600/10"
            placeholder="Nome completo"
          />
        </div>

        {/* NASCIMENTO */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-900">
            Data de nascimento
          </label>

          <input
            type="date"
            value={form.birth_date}
            onChange={(e) =>
              updateField("birth_date", e.target.value)
            }
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/10"
          />
        </div>

      </div>

      {/* CATEGORIA + PRÉVIA DAS TURMAS */}
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
              <p className="text-neutral-500">Buscando turmas...</p>
            )}

            {!preview.loading && hasGroups && (
              <ul className="space-y-3">
                {preview.groups.map((group) => (
                  <li key={group.id}>
                    <p className="flex items-center gap-1.5 font-semibold text-neutral-900">
                      <MapPin size={15} className="text-red-600" />
                      {group.location?.name}
                      <span className="font-normal text-neutral-500">
                        · {group.modality?.name}
                      </span>
                    </p>

                    <p className="mt-0.5 flex items-center gap-1.5 text-neutral-600">
                      <CalendarDays size={15} className="text-neutral-400" />
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

      {/* BOTÃO */}
      <div className="flex justify-end pt-1">

        <button
          type="button"
          disabled={
            !form.child_name.trim() ||
            !form.birth_date ||
            !category
          }
          onClick={onNext}
          className="w-full rounded-xl bg-red-600 px-8 py-3.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {preview.groups && !hasGroups ? "Continuar" : "Ver horários"}
        </button>

      </div>

    </div>
  );
}
