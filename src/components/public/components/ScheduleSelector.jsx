import { useEffect, useState } from "react";
import { CalendarDays, Clock, MapPin, Star } from "lucide-react";

import { WEEKDAY_LABELS } from "../../../constants/weekdays";

import {
  getTrialOptions,
  getCategoryLocations,
  groupTrialOptions,
} from "../../../services/publicRegistration";

const formatTime = (time) => time?.slice(0, 5);

function formatNextDate(iso) {
  if (!iso) return "";

  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
}

/*
 * Etapa 2 do formulário público.
 *
 * Mostra as turmas ABERTAS da categoria do atleta, cada uma com
 * modalidade, local, endereço e os horários com a próxima data.
 * Sem turma aberta (ou todos os horários lotados), oferece a lista
 * de interesse; a preferência de local só lista locais que têm
 * turma da categoria (com um local só, ele já vem marcado).
 */
export default function ScheduleSelector({
  form,
  updateField,
  onBack,
  onNext,
  onInterestList,
}) {
  const category = form.category;

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    async function load() {
      if (!category?.id) {
        setGroups([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError(false);

        const [options, locationsData] = await Promise.all([
          getTrialOptions(category.id),
          // A preferência de local é opcional: se falhar, segue sem ela
          getCategoryLocations(category.id).catch((error) => {
            console.error("Erro ao buscar locais:", error);
            return [];
          }),
        ]);

        setGroups(groupTrialOptions(options));
        setLocations(locationsData);

        // Um local só: já fica como preferência, sem perguntar.
        // Com vários, mantém a escolha anterior se ainda valer.
        const kept = locationsData.find(
          (location) => location.id === form.preferred_location?.id,
        );

        updateField(
          "preferred_location",
          locationsData.length === 1 ? locationsData[0] : kept ?? null,
        );
      } catch (error) {
        console.error("Erro ao buscar turmas:", error);
        setGroups([]);
        setLocations([]);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [category?.id]);

  function handleSelectSchedule(group, schedule) {
    updateField("schedule", schedule);
    updateField("training_group", { id: group.id, name: group.name });
    updateField("modality", group.modality);
    updateField("location", group.location);
    updateField("unit", group.unit);
    updateField("experimental_date", schedule.next_date ?? "");
    updateField("experimental_time", schedule.start_time);
    updateField("interest_reason", null);
  }

  function handleJoinInterestList(reason) {
    updateField("schedule", null);
    updateField("training_group", null);
    updateField("interest_reason", reason);
    onInterestList();
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <p className="font-semibold text-red-600">
          Não foi possível identificar a categoria do atleta.
        </p>

        <button onClick={onBack} className="rounded-xl border px-6 py-3">
          Voltar
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-neutral-500">
        Carregando turmas disponíveis...
      </div>
    );
  }

  const hasGroups = groups.length > 0;

  const hasFreeSchedule = groups.some((group) =>
    group.schedules.some((schedule) => schedule.spots_left !== 0),
  );

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-[0.20em] text-red-600">
          {category.name}
        </span>

        <h2 className="mt-2 text-3xl font-bold text-neutral-900">
          Escolha o horário da aula experimental
        </h2>

        <p className="mt-2 text-neutral-500">
          Estas são as turmas com vagas para a idade do atleta.
        </p>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-neutral-700">
          Não foi possível carregar as turmas agora. Tente novamente em
          alguns instantes.
        </div>
      )}

      {/* Turmas abertas */}
      {groups.map((group) => (
        <div
          key={group.id}
          className={`rounded-2xl border bg-white p-6 shadow-sm ${
            group.featured ? "border-red-200" : "border-neutral-200"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.20em] text-red-600">
                {group.modality?.name}
              </p>

              <h3 className="mt-1 text-xl font-bold text-neutral-900">
                {group.location?.name}
              </h3>

              <p className="mt-1 text-sm text-neutral-500">{group.name}</p>
            </div>

            {group.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                <Star size={14} />
                Novas turmas
              </span>
            )}
          </div>

          {group.location?.address && (
            <p className="mt-3 flex items-start gap-2 text-sm text-neutral-600">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${group.location.name}, ${group.location.address}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:underline"
              >
                {group.location.address}
              </a>
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {group.schedules.map((schedule) => {
              const selected = form.schedule?.schedule_id === schedule.schedule_id;
              const full = schedule.spots_left === 0;

              return (
                <button
                  key={schedule.schedule_id}
                  type="button"
                  disabled={full}
                  onClick={() => handleSelectSchedule(group, schedule)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    selected
                      ? "border-red-600 bg-red-50 shadow-sm"
                      : full
                        ? "cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-60"
                        : "border-neutral-200 bg-white hover:border-red-300 hover:shadow-sm"
                  }`}
                >
                  <p className="font-semibold text-neutral-900">
                    {WEEKDAY_LABELS[schedule.weekday]}
                  </p>

                  <p className="mt-1 flex items-center gap-2 text-sm text-neutral-600">
                    <Clock size={14} />
                    {formatTime(schedule.start_time)} às{" "}
                    {formatTime(schedule.end_time)}
                  </p>

                  <p className="mt-1 flex items-center gap-2 text-sm text-neutral-600">
                    <CalendarDays size={14} />
                    {full
                      ? "Sem vagas nesta data"
                      : `Próxima aula: ${formatNextDate(schedule.next_date)}`}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Sem turma aberta ou tudo lotado: lista de interesse */}
      {(!hasGroups || !hasFreeSchedule) && !loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
          <h3 className="text-xl font-bold text-neutral-900">
            {hasGroups
              ? "Todas as vagas de experimental estão preenchidas"
              : "No momento não temos turma com vaga para esta idade"}
          </h3>

          <p className="mt-3 text-neutral-600">
            Deixe seus dados na lista de interesse e avisaremos assim que
            surgir uma vaga para a categoria {category.name}.
          </p>

          {locations.length === 1 && (
            <p className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
              <MapPin size={16} className="shrink-0" />
              Turma {category.name}: {locations[0].name}
            </p>
          )}

          {locations.length > 1 && (
            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Local de preferência
              </label>

              <select
                value={form.preferred_location?.id ?? ""}
                onChange={(e) =>
                  updateField(
                    "preferred_location",
                    locations.find(
                      (location) => String(location.id) === e.target.value,
                    ) ?? null,
                  )
                }
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/10 sm:max-w-sm"
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

          <button
            type="button"
            onClick={() =>
              handleJoinInterestList(hasGroups ? "no_vacancy" : "future_class")
            }
            className="mt-5 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Entrar na lista de interesse
          </button>
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
          disabled={!form.schedule}
          onClick={onNext}
          className="rounded-xl bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
