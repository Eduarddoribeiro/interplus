import { useEffect, useState } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";

import SectionTitle from "../../../components/common/SectionTitle";

import {
  getTrainingGroup,
  getTrainingGroupCategoryNames,
} from "../../../../services/administration/trainingGroups";
import { getActiveCoaches } from "../../../../services/administration/coaches";
import {
  getSchedulesByTrainingGroup,
  createSchedule,
  updateSchedule,
  toggleSchedule,
  deleteSchedule,
  setScheduleCoaches,
} from "../../../../services/administration/trainingGroupSchedules";

import { WEEKDAY_LABELS } from "../../../../constants/weekdays";

import CrudTable from "../components/CrudTable";
import { BackLink } from "../components/CrudPage";
import { Button, Panel } from "../../../ui";
import StatusBadge from "../components/StatusBadge";
import TrainingGroupStatusBadge from "../components/TrainingGroupStatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";

import ScheduleModal from "../schedules/ScheduleModal";

const EMPTY_FORM = {
  weekday: "",
  start_time: "",
  end_time: "",
  allow_trial: true,
  experimental_limit: 0,
  coach_ids: [],
};

function getScheduleCoaches(schedule) {
  return (schedule.coaches ?? []).map((item) => item.coach).filter(Boolean);
}

export default function TrainingGroupDetails() {
  const { id } = useParams();

  const [group, setGroup] = useState(null);

  const [schedules, setSchedules] = useState([]);

  const [coaches, setCoaches] = useState([]);

  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);

  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);

      const [groupData, schedulesData, coachesData] = await Promise.all([
        getTrainingGroup(id),
        getSchedulesByTrainingGroup(id),
        getActiveCoaches(),
      ]);

      setGroup(groupData);
      setSchedules(schedulesData);
      setCoaches(coachesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((old) => ({
      ...old,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function handleCreate() {
    setEditing(null);

    setForm(EMPTY_FORM);

    setOpen(true);
  }

  function handleEdit(schedule) {
    setEditing(schedule);

    setForm({
      weekday: schedule.weekday,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      allow_trial: schedule.allow_trial,
      experimental_limit: schedule.experimental_limit,
      coach_ids: getScheduleCoaches(schedule).map((coach) => coach.id),
    });

    setOpen(true);
  }

  async function handleSave() {
    try {
      const payload = {
        training_group_id: id,
        weekday: Number(form.weekday),
        start_time: form.start_time,
        end_time: form.end_time,
        allow_trial: form.allow_trial,
        experimental_limit: Number(form.experimental_limit) || 0,
      };

      const saved = editing
        ? await updateSchedule(editing.id, payload)
        : await createSchedule(payload);

      await setScheduleCoaches(saved.id, form.coach_ids);

      setOpen(false);

      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggle(schedule) {
    try {
      await toggleSchedule(schedule.id, !schedule.active);

      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete() {
    try {
      await deleteSchedule(scheduleToDelete.id);

      setScheduleToDelete(null);

      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  if (!group) {
    return <p className="text-sm text-muted">Carregando turma…</p>;
  }

  return (
    <div className="space-y-5">
      <BackLink to="/admin/administration/training-groups" label="Turmas" />

      <SectionTitle
        title={group.name}
        actions={
          <>
            <Button to={`/admin/administration/training-groups/${group.id}/edit`}>
              <Pencil size={17} aria-hidden="true" />
              Editar turma
            </Button>

            <Button variant="primary" onClick={handleCreate}>
              <Plus size={18} aria-hidden="true" />
              Novo horário
            </Button>
          </>
        }
      />

      <Panel className="p-5">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-5">
          <Info label="Categorias" value={getTrainingGroupCategoryNames(group)} />
          <Info label="Modalidade" value={group.modality?.name} />
          <Info label="Local" value={group.location?.name} />
          <Info label="Unidade" value={group.unit?.name} />

          <div>
            <dt className="text-sm text-muted">Situação</dt>
            <dd className="mt-0.5 text-sm">
              <TrainingGroupStatusBadge status={group.status} />
              {group.featured && <span className="text-muted">, destaque</span>}
            </dd>
          </div>
        </dl>
      </Panel>

      <h2 className="pt-2 font-semibold">Horários</h2>

      <CrudTable
        columns={["Dia", "Horário", "Professores", "Experimentais", "Situação", ""]}
        emptyMessage={loading ? "Carregando horários…" : "Nenhum horário cadastrado."}
      >
        {schedules.length
          ? schedules.map((schedule) => (
              <tr key={schedule.id} className="border-t border-line">
                <td className="whitespace-nowrap px-4 py-3 font-medium">
                  {WEEKDAY_LABELS[schedule.weekday]}
                </td>

                <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                  {schedule.start_time?.slice(0, 5)} às {schedule.end_time?.slice(0, 5)}
                </td>

                <td className="px-4 py-3">
                  {getScheduleCoaches(schedule)
                    .map((coach) => coach.name)
                    .join(", ") || "—"}
                </td>

                <td className="whitespace-nowrap px-4 py-3">
                  {schedule.allow_trial ? (
                    <span className="tabular-nums">Até {schedule.experimental_limit} por aula</span>
                  ) : (
                    <span className="text-muted">Não aceita</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge active={schedule.active} />
                </td>

                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="quiet" onClick={() => handleEdit(schedule)}>
                      <Pencil size={15} aria-hidden="true" />
                      Editar
                    </Button>

                    <Button size="sm" variant="quiet" onClick={() => handleToggle(schedule)}>
                      <Power size={15} aria-hidden="true" />
                      {schedule.active ? "Desativar" : "Reativar"}
                    </Button>

                    <Button
                      size="sm"
                      variant="quiet"
                      onClick={() => setScheduleToDelete(schedule)}
                      className="hover:!bg-alert-soft hover:!text-alert-text"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      Excluir
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          : null}
      </CrudTable>

      <ScheduleModal
        open={open}
        editing={editing}
        form={form}
        coaches={coaches}
        onChange={handleChange}
        onToggleCoach={(coachId) =>
          setForm((old) => ({
            ...old,
            coach_ids: old.coach_ids.includes(coachId)
              ? old.coach_ids.filter((item) => item !== coachId)
              : [...old.coach_ids, coachId],
          }))
        }
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!scheduleToDelete}
        title="Excluir horário"
        description="O horário sai da turma e não aparece mais no formulário. Não dá para desfazer."
        onCancel={() => setScheduleToDelete(null)}
        onConfirm={handleDelete}
      />

    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}
