import { useEffect } from "react";
import { getCategoryByBirthDate } from "../../../services/categories";

const weekdayLabel = {
  Monday: "Segunda-feira",
  Tuesday: "Terça-feira",
  Wednesday: "Quarta-feira",
  Thursday: "Quinta-feira",
  Friday: "Sexta-feira",
  Saturday: "Sábado",
  Sunday: "Domingo",
};

export default function AthleteForm({
  form,
  updateField,
  onNext,
}) {
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
  }, [form.birth_date]);

  const category = form.category;

  const formatTime = (time) => time?.slice(0, 5);


  return (
    <div className="space-y-8">

      {/* CABEÇALHO */}
      <div>
        <h2 className="text-3xl font-bold text-neutral-900">
          Dados do Atleta
        </h2>

        <p className="mt-2 text-neutral-500">
          Informe os dados do atleta para encontrarmos automaticamente a
          categoria correta.
        </p>
      </div>

      {/* CAMPOS */}
      <div className="space-y-6">

        {/* NOME */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-900">
            Nome do atleta
          </label>

          <input
            type="text"
            value={form.child_name}
            onChange={(e) =>
              updateField("child_name", e.target.value)
            }
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-red-600 focus:ring-2 focus:ring-red-600/10"
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
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/10"
          />
        </div>

      </div>

      {/* ESTADO INICIAL */}
      {!form.birth_date && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-4">
          <p className="text-sm leading-relaxed text-neutral-500">
            A categoria será identificada automaticamente após informar a
            data de nascimento.
          </p>
        </div>
      )}

      {/* CATEGORIA ENCONTRADA */}
      {form.birth_date && category && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">

          {/* Categoria */}
          <div className="px-5 py-5 sm:px-6">

            <span className="text-xs font-bold uppercase tracking-[0.20em] text-red-600">
              Categoria
            </span>

            <h3 className="mt-2 text-3xl font-bold text-neutral-900 sm:text-4xl">
              {category.name}
            </h3>

            <p className="mt-2 text-sm text-neutral-500">
              Categoria definida automaticamente conforme a idade do atleta.
            </p>

          </div>

          {/* TREINO */}
          <div className="border-t border-neutral-200 px-5 sm:px-6">

            <div className="flex items-center justify-between gap-5 py-4">

              <p className="text-sm text-neutral-500">
                Dia do treino
              </p>

              <p className="text-right text-sm font-semibold text-neutral-900 sm:text-base">
                {weekdayLabel[category.weekday] ?? category.weekday}
              </p>

            </div>

            <div className="flex items-center justify-between gap-5 border-t border-neutral-100 py-4">

              <p className="text-sm text-neutral-500">
                Horário
              </p>

              <p className="text-right text-sm font-semibold text-neutral-900 sm:text-base">
                {formatTime(category.start_time)} às{" "}
                {formatTime(category.end_time)}
              </p>

            </div>

          </div>

          {/* PRÓXIMO PASSO */}
          <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-4 sm:px-6">

            <p className="text-sm leading-relaxed text-neutral-600">
              No próximo passo você poderá escolher uma das datas disponíveis
              para realizar a aula experimental.
            </p>

          </div>

        </div>
      )}

      {/* BOTÃO */}
      <div className="flex justify-end pt-2">

        <button
          type="button"
          disabled={
            !form.child_name ||
            !form.birth_date ||
            !category
          }
          onClick={onNext}
          className="w-full rounded-xl bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Continuar
        </button>

      </div>

    </div>
  );
}