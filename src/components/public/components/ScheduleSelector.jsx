import { useEffect, useState } from "react";

import { WEEKDAY_LABELS } from "../../../constants/weekdays";
 

import {
  getTrainingGroupsForPublic,
  getAvailableSchedules,
} from "../../../services/publicRegistration";

export default function ScheduleSelector({
  form,
  updateField,
  onBack,
  onNext,
  onInterestList,
}) {
  const modality = form.modality;
  const category = form.category;

  const formatTime = (time) => time?.slice(0, 5);

  const [loadingGroups, setLoadingGroups] = useState(true);
  const [allGroups, setAllGroups] = useState([]);

  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [schedules, setSchedules] = useState([]);

  /* =========================================================
   * 1. TURMAS (Modalidade + Categoria)
   * =======================================================*/
  useEffect(() => {
    async function loadGroups() {
      if (!modality?.id || !category?.id) {
        setAllGroups([]);
        setLoadingGroups(false);
        return;
      }

      try {
        setLoadingGroups(true);

        const data = await getTrainingGroupsForPublic(
          modality.id,
          category.id
        );

        setAllGroups(data);

        // Reseta seleções dependentes ao mudar modalidade/categoria
        updateField("unit", null);
        updateField("training_group", null);
        updateField("schedule", null);
      } catch (error) {
        console.error("Erro ao buscar turmas:", error);

        setAllGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    }

    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modality?.id, category?.id]);

  /* =========================================================
   * UNIDADES DISPONÍVEIS (derivadas das turmas encontradas)
   * =======================================================*/
  const units = [];
  const seenUnitIds = new Set();

  allGroups.forEach((group) => {
    if (group.unit && !seenUnitIds.has(group.unit.id)) {
      seenUnitIds.add(group.unit.id);
      units.push(group.unit);
    }
  });

  /* =========================================================
   * 2. UNIDADE — seleciona automaticamente quando só há uma
   * =======================================================*/
  useEffect(() => {
    if (loadingGroups) return;

    if (units.length === 1 && !form.unit) {
      updateField("unit", units[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingGroups, units.length]);

  const groupsForUnit = form.unit
    ? allGroups.filter((group) => group.unit?.id === form.unit.id)
    : [];

  /* =========================================================
   * 2.1 TURMA — seleciona automaticamente quando só há uma
   *      disponível para a unidade escolhida (mesmo padrão da
   *      etapa de Unidade).
   * =======================================================*/
  useEffect(() => {
    if (loadingGroups) return;
    if (!form.unit) return;

    if (groupsForUnit.length === 1 && !form.training_group) {
      updateField("training_group", groupsForUnit[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingGroups, form.unit?.id, groupsForUnit.length]);

  /* =========================================================
   * 3. HORÁRIOS DISPONÍVEIS DA TURMA SELECIONADA
   * =======================================================*/
  useEffect(() => {
    async function loadSchedules() {
      if (!form.training_group?.id) {
        setSchedules([]);
        return;
      }

      try {
        setLoadingSchedules(true);

        const data = await getAvailableSchedules(form.training_group.id);

        setSchedules(data);
      } catch (error) {
        console.error("Erro ao buscar horários:", error);

        setSchedules([]);
      } finally {
        setLoadingSchedules(false);
      }
    }

    loadSchedules();
  }, [form.training_group?.id]);

  function handleSelectUnit(unit) {
    updateField("unit", unit);
    updateField("training_group", null);
    updateField("schedule", null);
  }

  function handleSelectGroup(group) {
    updateField("training_group", group);
    updateField("schedule", null);
  }

   function handleSelectSchedule(schedule) {
    updateField("schedule", schedule);
    updateField("experimental_date", schedule.next_date ?? "");
    updateField("experimental_time", schedule.start_time);
  }

    function handleJoinInterestList(reason) {
    updateField("interest_reason", reason);
    onInterestList();
  }

  if (!modality || !category) {
    return (
      <div className="space-y-6">
        <p className="font-semibold text-red-600">
          Não foi possível identificar a modalidade e a categoria.
        </p>

        <button onClick={onBack} className="rounded-xl border px-6 py-3">
          Voltar
        </button>
      </div>
    );
  }

  if (loadingGroups) {
    return (
      <div className="py-20 text-center">Carregando turmas disponíveis...</div>
    );
  }

  const noGroupsAtAll = allGroups.length === 0;

  const showUnitPicker = !noGroupsAtAll && units.length > 1;

  const showGroupPicker =
    !noGroupsAtAll && !!form.unit && groupsForUnit.length > 1;

  const showNoGroupsForUnit =
    !noGroupsAtAll && !!form.unit && groupsForUnit.length === 0;

  const canShowSchedules = !noGroupsAtAll && !!form.training_group;
  const canContinue = !!form.schedule;

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-3xl font-bold text-neutral-900">
          Escolha a turma e o horário
        </h2>

        <p className="mt-2 text-neutral-500">
          Selecione a turma e o horário disponíveis para a aula experimental.
        </p>
      </div>

      {/* Modalidade / Categoria */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.20em] text-red-600">
          {modality.name}
        </span>

        <h3 className="mt-2 text-4xl font-bold text-neutral-900">
          {category.name}
        </h3>
      </div>

           {/* Sem turmas para a combinação — Cenário 1 */}
      {noGroupsAtAll && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
          <h3 className="text-xl font-bold text-neutral-900">
            Ainda não temos turma para esta categoria
          </h3>

          <p className="mt-3 text-neutral-600">
            No momento não há turmas de {modality.name} abertas para a
            categoria {category.name}. Deixe seus dados e avisaremos assim
            que uma nova turma for aberta.
          </p>

          <button
            type="button"
            onClick={() => handleJoinInterestList("future_class")}
            className="mt-5 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Entrar na lista de interesse
          </button>
        </div>
      )}

      {/* Unidade — exibida apenas quando houver mais de uma opção */}
      {showUnitPicker && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-neutral-900">Unidade</p>

          {units.map((unit) => {
            const selected = form.unit?.id === unit.id;

            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => handleSelectUnit(unit)}
                className={`w-full rounded-2xl border p-5 text-left transition-all ${
                  selected
                    ? "border-red-600 bg-red-50 shadow-sm"
                    : "border-neutral-200 bg-white hover:border-red-300 hover:shadow-sm"
                }`}
              >
                <p className="font-semibold text-neutral-900">{unit.name}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Turma — exibida apenas quando houver mais de uma opção */}
      {showNoGroupsForUnit && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-100 p-6">
          <p className="text-neutral-600">
            Nenhuma turma ativa encontrada para esta unidade.
          </p>
        </div>
      )}

      {showGroupPicker && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-neutral-900">Turma</p>

          {groupsForUnit.map((group) => {
            const selected = form.training_group?.id === group.id;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleSelectGroup(group)}
                className={`w-full rounded-2xl border p-5 text-left transition-all ${
                  selected
                    ? "border-red-600 bg-red-50 shadow-sm"
                    : "border-neutral-200 bg-white hover:border-red-300 hover:shadow-sm"
                }`}
              >
                <p className="font-semibold text-neutral-900">
                  {group.name}
                </p>

                {group.coach?.name && (
                  <p className="mt-1 text-sm text-neutral-500">
                    Professor(a): {group.coach.name}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Horário */}
      {canShowSchedules && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-neutral-900">Horário</p>

          {loadingSchedules ? (
            <div className="py-10 text-center text-neutral-500">
              Carregando horários...
            </div>
                    ) : schedules.length === 0 ? (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
              <h3 className="text-xl font-bold text-neutral-900">
                Todas as vagas estão preenchidas
              </h3>

              <p className="mt-3 text-neutral-600">
                A turma {form.training_group?.name} está com todos os
                horários de experimental lotados no momento. Deixe seus
                dados e avisaremos assim que surgir uma vaga.
              </p>

              <button
                type="button"
                onClick={() => handleJoinInterestList("no_vacancy")}
                className="mt-5 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
              >
                Entrar na lista de interesse
              </button>
            </div>
          ) : (
            schedules.map((schedule) => {
              const selected = form.schedule?.id === schedule.id;

              return (
                <button
                  key={schedule.id}
                  type="button"
                  onClick={() => handleSelectSchedule(schedule)}
                  className={`w-full rounded-2xl border p-5 text-left transition-all ${
                    selected
                      ? "border-red-600 bg-red-50 shadow-sm"
                      : "border-neutral-200 bg-white hover:border-red-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-neutral-900">
                      {WEEKDAY_LABELS[schedule.weekday]}
                    </p>

                    <p className="text-sm text-neutral-600">
                      {formatTime(schedule.start_time)} às{" "}
                      {formatTime(schedule.end_time)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
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
          disabled={!canContinue}
          onClick={onNext}
          className="rounded-xl bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}