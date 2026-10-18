import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, MapPin } from "lucide-react";

import { getTrialSlots } from "../../../services/administration/trialSlots";
import { WEEKDAY_LABELS } from "../../../constants/weekdays";
import { TRAINING_GROUP_STATUS_BY_VALUE } from "../../../constants/trainingGroupStatus";

const formatTime = (time) => time?.slice(0, 5);

// "2026-10-20" -> "20/10"
function formatDayMonth(iso) {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

/*
 * Escolha de turma + horário + data para experimental no painel.
 *
 * Mostra as turmas da categoria (abertas e fechadas) com local e
 * as próximas datas de cada horário, já com as vagas. É o mesmo
 * controle de vagas do formulário público, então o que a equipe
 * marca pelo WhatsApp ocupa a vaga do site.
 *
 * value: { scheduleId, date } | null
 * onChange(slot): slot traz scheduleId, date, horário, turma e local
 */
export default function TrialSlotPicker({ categoryId, value, onChange }) {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!categoryId) {
        setGroups([]);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getTrialSlots(categoryId);

        if (!cancelled) setGroups(data);
      } catch (err) {
        console.error("Erro ao carregar horários:", err);

        if (!cancelled) {
          setGroups([]);
          setError("Não foi possível carregar os horários.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  if (!categoryId) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
        Informe a categoria para ver os horários.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 size={17} className="animate-spin" />
        Carregando horários...
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
    );
  }

  if (!groups.length) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-800">
          Nenhuma turma ativa para esta categoria.
        </p>

        <p className="mt-1 text-xs text-amber-700">
          Considere colocar o contato na lista de interesse.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const closed = group.status !== "open";

        return (
          <div
            key={group.id}
            className={`rounded-2xl border bg-white p-4 ${
              closed ? "border-amber-200" : "border-neutral-200"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 font-bold text-neutral-900">
                  <MapPin size={15} className="text-red-600" />
                  {group.location?.name ?? "Sem local"}
                </p>

                <p className="mt-0.5 text-xs text-neutral-500">
                  {group.name}
                  {group.modality?.name ? ` · ${group.modality.name}` : ""}
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  TRAINING_GROUP_STATUS_BY_VALUE[group.status]?.badge ??
                  "bg-neutral-100 text-neutral-600"
                }`}
              >
                {TRAINING_GROUP_STATUS_BY_VALUE[group.status]?.label ?? group.status}
              </span>
            </div>

            {closed && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                <AlertTriangle size={13} />
                Turma fechada: marque só se combinado com o professor.
              </p>
            )}

            <div className="mt-3 space-y-3">
              {group.schedules.map((schedule) => (
                <div key={schedule.id}>
                  <p className="text-sm font-semibold text-neutral-700">
                    {WEEKDAY_LABELS[schedule.weekday]} ·{" "}
                    {formatTime(schedule.start_time)} às {formatTime(schedule.end_time)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {schedule.dates.map((slot) => {
                      const full = slot.spotsLeft === 0;
                      const selected =
                        value?.scheduleId === schedule.id && value?.date === slot.date;

                      return (
                        <button
                          key={slot.date}
                          type="button"
                          disabled={full}
                          onClick={() =>
                            onChange({
                              scheduleId: schedule.id,
                              date: slot.date,
                              weekday: schedule.weekday,
                              start_time: schedule.start_time,
                              end_time: schedule.end_time,
                              group,
                            })
                          }
                          className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                            selected
                              ? "border-red-600 bg-red-50 text-red-700"
                              : full
                                ? "cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400"
                                : "border-neutral-200 hover:border-red-300"
                          }`}
                        >
                          <span className="block font-semibold">
                            {formatDayMonth(slot.date)}
                          </span>

                          <span className="block text-[11px]">
                            {full
                              ? "Lotado"
                              : slot.spotsLeft === null
                                ? `${slot.taken} marcado${slot.taken === 1 ? "" : "s"}`
                                : `${slot.spotsLeft} vaga${slot.spotsLeft === 1 ? "" : "s"}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
