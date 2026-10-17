import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import SectionTitle from "../../../components/common/SectionTitle";

import { getTrainingGroup } from "../../../../services/administration/trainingGroups";
import {
  getSchedulesByTrainingGroup,
  createSchedule,
  updateSchedule,
  toggleSchedule,
  deleteSchedule,
} from "../../../../services/administration/trainingGroupSchedules";

import { WEEKDAY_LABELS } from "../../../../constants/weekdays";

import CrudTable from "../components/CrudTable";
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
};

export default function TrainingGroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);

  const [schedules, setSchedules] = useState([]);

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

      const [groupData, schedulesData] = await Promise.all([
        getTrainingGroup(id),
        getSchedulesByTrainingGroup(id),
      ]);

      setGroup(groupData);
      setSchedules(schedulesData);
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

      if (editing) {
        await updateSchedule(editing.id, payload);
      } else {
        await createSchedule(payload);
      }

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
    return <p>Carregando...</p>;
  }

  return (
    <div className="space-y-8">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle
          title={group.name}
          subtitle="Gerencie os dados e horários desta turma."
        />

        <button
          onClick={() =>
            navigate(`/admin/administration/training-groups/${group.id}/edit`)
          }
          className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 font-medium hover:bg-neutral-50"
        >
          <Pencil size={18} />
          Editar turma
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 rounded-2xl border border-neutral-200 bg-white p-6 md:grid-cols-3">

        <Info label="Categoria" value={group.category?.name} />
        <Info label="Modalidade" value={group.modality?.name} />
        <Info label="Professor" value={group.coach?.name} />
        <Info label="Local" value={group.location?.name} />
        <Info label="Unidade" value={group.unit?.name} />

        <div>
          <p className="text-sm text-neutral-500">Situação</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TrainingGroupStatusBadge status={group.status} />
            {group.featured && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                Destaque
              </span>
            )}
          </div>
        </div>

      </div>

      <div className="flex items-center justify-between">

        <h2 className="text-xl font-semibold">
          Horários
        </h2>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700"
        >
          <Plus size={18} />
          Novo Horário
        </button>

      </div>

      <CrudTable
        columns={[
          "Dia",
          "Hora inicial",
          "Hora final",
          "Limite de experimentais",
          "Permite experimental",
          "Status",
          "Ações",
        ]}
        emptyMessage={
          loading
            ? "Carregando..."
            : "Nenhum horário cadastrado."
        }
      >
        {schedules.map((schedule) => (
          <tr
            key={schedule.id}
            className="border-b border-neutral-100 last:border-0"
          >
            <td className="px-6 py-4">
              {WEEKDAY_LABELS[schedule.weekday]}
            </td>

            <td className="px-6 py-4">
              {schedule.start_time}
            </td>

            <td className="px-6 py-4">
              {schedule.end_time}
            </td>

            <td className="px-6 py-4">
              {schedule.experimental_limit}
            </td>

            <td className="px-6 py-4">
              {schedule.allow_trial ? "Sim" : "Não"}
            </td>

            <td className="px-6 py-4">
              <StatusBadge active={schedule.active} />
            </td>

            <td className="px-6 py-4">
              <div className="flex justify-end gap-2">

                <button
                  onClick={() => handleEdit(schedule)}
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-100"
                >
                  <Pencil size={16} />
                  Editar
                </button>

                <button
                  onClick={() => handleToggle(schedule)}
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-100"
                >
                  <Power size={16} />
                  {schedule.active ? "Desativar" : "Reativar"}
                </button>

                <button
                  onClick={() => setScheduleToDelete(schedule)}
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>

              </div>
            </td>

          </tr>
        ))}
      </CrudTable>

      <ScheduleModal
        open={open}
        editing={editing}
        form={form}
        onChange={handleChange}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!scheduleToDelete}
        title="Excluir horário"
        description="Tem certeza que deseja excluir este horário? Essa ação não pode ser desfeita."
        onCancel={() => setScheduleToDelete(null)}
        onConfirm={handleDelete}
      />

    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="font-semibold">{value ?? "-"}</p>
    </div>
  );
}
