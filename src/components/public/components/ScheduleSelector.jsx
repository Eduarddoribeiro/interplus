import { useEffect, useMemo, useState } from "react";
import {
  generateAvailableDates,
  WEEKDAY_LABEL,
} from "../../../utils/generateAvailableDates";

import { getAvailableSessions } from "../../../services/schedule";

export default function ScheduleSelector({
  form,
  updateField,
  onBack,
  onNext,
}) {
  const category = form.category;
  const formatTime = (time) => time?.slice(0, 5);

  const isWaitingList = category?.trial_status === "waiting_list";

  const isClosed = category?.trial_status === "closed";

  const [selectedDate, setSelectedDate] = useState(form.experimental_date);

  const [availableSessions, setAvailableSessions] = useState([]);

  const [loading, setLoading] = useState(true);

  const generatedSessions = useMemo(() => {
    return generateAvailableDates(category?.weekday);
  }, [category]);

  useEffect(() => {
    async function loadSessions() {
      if (!category) return;

      if (isWaitingList || isClosed) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const contacts = await getAvailableSessions(category);

        const occupation = {};

        contacts.forEach((item) => {
          if (!item.experimental_date) return;

          occupation[item.experimental_date] = Number(item.booked) || 0;
        });

        const filtered = generatedSessions.filter((session) => {
          const booked = occupation[session.iso] || 0;

          return booked < category.experimental_limit;
        });

        setAvailableSessions(filtered);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [category, generatedSessions, isWaitingList, isClosed]);

  function handleSelect(session) {
    setSelectedDate(session.iso);

    updateField("experimental_date", session.iso);

    updateField("experimental_time", category.start_time);
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <p className="font-semibold text-red-600">
          Não foi possível identificar a categoria.
        </p>

        <button onClick={onBack} className="rounded-xl border px-6 py-3">
          Voltar
        </button>
      </div>
    );
  }

  if (loading && !isWaitingList && !isClosed) {
    return (
      <div className="py-20 text-center">Carregando datas disponíveis...</div>
    );
  }
  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-3xl font-bold text-neutral-900">
          {isWaitingList
            ? "Turma em formação"
            : "Escolha a data da aula experimental"}
        </h2>

        <p className="mt-2 text-neutral-500">
          {isWaitingList
            ? "Cadastre seu interesse e nossa equipe avisará quando a nova turma iniciar."
            : "Selecione uma das próximas datas disponíveis para esta categoria."}
        </p>
      </div>

      {/* Categoria */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.20em] text-red-600">
          Categoria
        </span>

        <h3 className="mt-2 text-4xl font-bold text-neutral-900">
          {category.name}
        </h3>

        <div className="mt-6 flex items-center gap-3 text-neutral-600">
          <span className="font-medium">{WEEKDAY_LABEL[category.weekday]}</span>

          <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />

          <span>
            {formatTime(category.start_time)} às {formatTime(category.end_time)}
          </span>
        </div>

        {!isWaitingList && !isClosed && (
          <p className="mt-5 text-sm text-neutral-500">
            Escolha abaixo uma das datas disponíveis para realizar a aula
            experimental.
          </p>
        )}
      </div>

      {/* Waiting List */}
      {isWaitingList ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="text-xl font-bold text-neutral-900">
            Nova turma em formação
          </h3>

          <p className="mt-4 text-neutral-700">
            Estamos organizando uma nova turma para esta categoria.
          </p>

          <p className="mt-3 text-neutral-700">
            Cadastre seu interesse e nossa equipe entrará em contato assim que
            houver disponibilidade para a primeira aula experimental.
          </p>

          <div className="mt-5 rounded-xl border border-amber-200 bg-white p-4">
            <p className="font-medium text-neutral-800">
              Seu interesse ficará registrado.
            </p>

            <p className="mt-2 text-sm text-neutral-500">
              Você será um dos primeiros avisados quando a turma abrir.
            </p>
          </div>
        </div>
      ) : isClosed ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-100 p-6">
          <h3 className="text-xl font-bold text-neutral-900">
            Categoria indisponível
          </h3>

          <p className="mt-3 text-neutral-600">
            No momento esta categoria não está recebendo novos alunos.
          </p>
        </div>
      ) : availableSessions.length === 0 ? (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
          <h3 className="text-xl font-bold text-neutral-900">
            Todas as vagas foram preenchidas
          </h3>

          <p className="mt-3 text-neutral-600">
            No momento não há datas disponíveis para esta categoria.
          </p>

          <p className="mt-2 text-neutral-500">
            Novas vagas serão disponibilizadas em breve.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {availableSessions.map((session) => {
            const selected = selectedDate === session.iso;

            const date = new Date(`${session.iso}T00:00:00`);

            const day = date.toLocaleDateString("pt-BR", {
              day: "2-digit",
            });

            const month = date
              .toLocaleDateString("pt-BR", {
                month: "short",
              })
              .replace(".", "")
              .toUpperCase();

            const weekday = date.toLocaleDateString("pt-BR", {
              weekday: "long",
            });

            const formattedWeekday =
              weekday.charAt(0).toUpperCase() + weekday.slice(1);

            return (
              <button
                key={session.id}
                type="button"
                onClick={() => handleSelect(session)}
                className={`w-full rounded-2xl border p-5 transition-all ${
                  selected
                    ? "border-red-600 bg-red-50 shadow-sm"
                    : "border-neutral-200 bg-white hover:border-red-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 text-center">
                    <p className="text-3xl font-bold text-neutral-900">{day}</p>

                    <p className="text-xs font-semibold uppercase tracking-[0.20em] text-neutral-500">
                      {month}
                    </p>
                  </div>

                  <div className="h-12 w-px bg-neutral-200" />

                  <div className="flex-1 text-left">
                    <p className="font-semibold text-neutral-900">
                      {formattedWeekday}
                    </p>

                    <p className="mt-1 text-sm text-neutral-500">
                      {formatTime(category.start_time)} às{" "}
                      {formatTime(category.end_time)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-neutral-300 px-6 py-3 font-semibold"
        >
          Voltar
        </button>

        <button
          type="button"
          disabled={
            (!selectedDate && !isWaitingList) ||
            (!isWaitingList && availableSessions.length === 0)
          }
          onClick={onNext}
          className="rounded-xl bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isWaitingList ? "Registrar Interesse" : "Continuar"}
        </button>
      </div>
    </div>
  );
}
