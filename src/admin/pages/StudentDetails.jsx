import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Edit3, Eye, EyeOff, Lock, MessageCircle, Plus } from "lucide-react";

import { Button, Dialog, DialogActions, Panel, inputClass } from "../ui";
import { toast } from "../components/common/Toaster";
import FieldsDialog, { Field } from "../components/students/FieldsDialog";
import EnrollmentFormPanel from "../components/students/EnrollmentFormPanel";

import {
  addGuardian,
  currentEnrollment,
  getStudent,
  getStudentHealth,
  guardiansOf,
  saveStudentHealth,
  setTaskStatus,
  updateEnrollment,
  updateGuardian,
  updateGuardianRelationship,
  updateStudent,
} from "../../services/students";
import { getStudentEvents, setParticipantStatus } from "../../services/events";
import { getActiveCategories } from "../../services/categories";
import { getActiveTrainingGroups } from "../../services/administration/trainingGroups";

import {
  STUDENT_TASKS,
  TASK_STATUS_LABEL,
} from "../../constants/studentTasks";
import { UNIFORM_SIZE_OPTIONS } from "../../constants/enrollmentForm";
import { EVENT_STATUS_OPTIONS, EVENT_STATUS_TONE } from "../../constants/eventStatus";
import { createWhatsAppUrl, getTodayISO } from "../../helpers/contactPresentation";
import { formatPhone } from "../../helpers/phoneHelpers";
import { getAge } from "../../helpers/dateHelpers";
import { errorMessage } from "../../helpers/errorMessage";
import { BRAND } from "../../constants/brand";

/* =========================================================
 * CAMPOS DE CADA BLOCO
 * =======================================================*/

const STUDENT_FIELDS = [
  { name: "name", label: "Nome *", required: true, wide: true },
  { name: "birth_date", label: "Nascimento", type: "date" },
  { name: "gender", label: "Sexo" },
  { name: "cpf", label: "CPF" },
  { name: "rg", label: "RG" },
  { name: "phone", label: "Celular do aluno", type: "tel" },
  { name: "school", label: "Escola" },
  { name: "school_type", label: "Instituição (pública ou privada)" },
  { name: "field_position", label: "Posição" },
  { name: "shirt_number", label: "Número da camisa", type: "number" },
  {
    name: "goalkeeper",
    label: "Goleiro",
    type: "select",
    options: [
      { value: "sim", label: "Sim (números 1, 12, 23…)" },
      { value: "nao", label: "Não" },
    ],
  },
  { name: "club_team", label: "Time do coração" },
  { name: "favorite_player", label: "Jogador preferido" },
  { name: "idol", label: "Ídolo" },
  { name: "how_found", label: "Como conheceu a escola" },
  { name: "sogni_id", label: `Código no ${BRAND.financeSystem}` },
  { name: "photo_url", label: "Foto (link)", wide: true },
  { name: "notes", label: "Observação interna", type: "textarea" },
];

const GUARDIAN_FIELDS = [
  { name: "name", label: "Nome *", required: true, wide: true },
  { name: "relationship", label: "Parentesco (mãe, pai, avó...)" },
  { name: "phone", label: "Telefone (WhatsApp)", type: "tel" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "gender", label: "Sexo" },
  { name: "cpf", label: "CPF" },
  { name: "rg", label: "RG" },
  { name: "profession", label: "Profissão" },
  { name: "zip_code", label: "CEP" },
  { name: "address", label: "Endereço (rua e número)", wide: true },
  { name: "complement", label: "Complemento" },
  { name: "neighborhood", label: "Bairro" },
  { name: "city", label: "Cidade" },
  { name: "state", label: "UF" },
];

const HEALTH_FIELDS = [
  { name: "blood_type", label: "Tipo sanguíneo" },
  { name: "health_plan", label: "Plano de saúde" },
  { name: "drug_allergies", label: "Alergia a medicamentos", type: "textarea" },
  { name: "medications", label: "Medicamentos em uso", type: "textarea" },
  { name: "diseases", label: "Doenças", type: "textarea" },
  { name: "injuries", label: "Fraturas ou lesões", type: "textarea" },
  { name: "surgeries", label: "Cirurgias", type: "textarea" },
  { name: "first_aid_medication", label: "Medicamento autorizado nos primeiros socorros", type: "textarea" },
  { name: "physical_activity", label: "Outras atividades físicas", type: "textarea" },
  { name: "medical_notes", label: "Indicações médicas", type: "textarea" },
];

const formatDate = (iso) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR") : "");

function formatCpf(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 11 ? `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}` : value;
}

/* =========================================================
 * PÁGINA
 * =======================================================*/

export default function StudentDetails() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    load();

    function handleVisibility() {
      if (document.visibilityState === "visible") load();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [id]);

  async function load() {
    try {
      setError("");
      const [data, studentEvents] = await Promise.all([getStudent(id), getStudentEvents(id)]);
      setStudent(data);
      setEvents(studentEvents);
    } catch (err) {
      console.error("Erro ao carregar aluno:", err);
      setError(errorMessage(err, "Não foi possível carregar o aluno."));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <p role="status" className="py-12 text-center text-muted">
        Carregando aluno…
      </p>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-4">
        <BackToList />
        <Panel className="p-5">
          <p role="alert" className="font-medium text-alert-text">
            {error || "Aluno não encontrado."}
          </p>
          <Button className="mt-3" onClick={load}>
            Tentar de novo
          </Button>
        </Panel>
      </div>
    );
  }

  const enrollment = currentEnrollment(student);
  const guardians = guardiansOf(student);
  const age = getAge(student.birth_date);
  const left = student.status === "left";

  async function reactivate() {
    try {
      await updateStudent(student.id, { status: "active", left_at: null, left_reason: null });
      toast("Aluno reativado.", { type: "success" });
      load();
    } catch (err) {
      toast(errorMessage(err, "Não foi possível reativar."));
    }
  }

  return (
    <div className="space-y-6">
      <BackToList />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[2.6rem] font-semibold leading-[0.9]">{student.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {[
              student.shirt_number ? `camisa ${student.shirt_number}${student.goalkeeper ? " (goleiro)" : ""}` : null,
              enrollment?.categories?.name,
              age != null ? `${age} anos` : null,
              enrollment ? `matrícula ${enrollment.season} desde ${formatDate(enrollment.start_date)}` : "sem matrícula",
            ]
              .filter(Boolean)
              .join(", ")}
            .
            {left && (
              <span className="font-medium text-ink">
                {" "}
                Saiu{student.left_at ? ` em ${formatDate(student.left_at)}` : ""}
                {student.left_reason ? `: ${student.left_reason}` : ""}.
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {student.contact_id && (
            <Button to={`/admin/contacts/${student.contact_id}`} variant="quiet">
              Contato de origem
            </Button>
          )}
          {left ? (
            <Button onClick={reactivate}>Reativar aluno</Button>
          ) : (
            <Button onClick={() => setLeaving(true)}>Registrar saída</Button>
          )}
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          {enrollment && <TasksPanel enrollment={enrollment} onChange={load} disabled={left} />}
          {!left && <EnrollmentFormPanel student={student} guardian={guardians[0] ?? null} onChange={load} />}
          <EventsPanel studentId={student.id} events={events} onChange={load} />
          <HealthPanel studentId={student.id} />
        </div>

        <aside className="space-y-6">
          {enrollment && <EnrollmentPanel enrollment={enrollment} onEdit={() => setEditing("enrollment")} />}
          <GuardiansPanel
            guardians={guardians}
            onEdit={(guardian) => setEditing({ guardian })}
            onAdd={() => setEditing({ guardian: null })}
          />
          <StudentPanel student={student} onEdit={() => setEditing("student")} />
        </aside>
      </div>

      <FieldsDialog
        open={editing === "student"}
        onClose={() => setEditing(null)}
        title="Editar dados do aluno"
        description={student.name}
        fields={STUDENT_FIELDS}
        values={{ ...student, goalkeeper: student.goalkeeper ? "sim" : "nao" }}
        onSave={async (values) => {
          try {
            await updateStudent(student.id, { ...values, goalkeeper: values.goalkeeper === "sim" });
          } catch (err) {
            if (err?.code === "23505") throw new Error(`O número ${values.shirt_number} já é de outro aluno.`);
            throw err;
          }
          toast("Dados do aluno salvos.", { type: "success" });
          load();
        }}
      />

      <GuardianDialog
        editing={editing}
        onClose={() => setEditing(null)}
        studentId={student.id}
        nextPosition={guardians.length + 1}
        onSaved={load}
      />

      <EnrollmentDialog
        open={editing === "enrollment"}
        onClose={() => setEditing(null)}
        enrollment={enrollment}
        studentName={student.name}
        onSaved={load}
      />

      <LeaveDialog open={leaving} onClose={() => setLeaving(false)} student={student} onSaved={load} />
    </div>
  );
}

function BackToList() {
  return (
    <Link to="/admin/students" className="inline-flex items-center gap-1.5 rounded text-sm text-muted hover:text-ink">
      <ArrowLeft size={16} aria-hidden="true" />
      Alunos
    </Link>
  );
}

function PanelHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      {/* Teko fica só no título da página; títulos de painel em Inter, como no resto do painel */}
      <h2 className="text-lg font-semibold">{title}</h2>
      {action}
    </div>
  );
}

function EditButton({ onClick, label }) {
  return (
    <Button size="sm" variant="quiet" onClick={onClick} aria-label={label}>
      <Edit3 size={15} aria-hidden="true" />
      Editar
    </Button>
  );
}

// Lista de rótulo e valor; esconde o que está vazio
function Facts({ items }) {
  const filled = items.filter(([, value]) => value != null && value !== "");

  if (!filled.length) return <p className="px-4 py-3 text-sm text-muted">Nada preenchido.</p>;

  return (
    <dl className="divide-y divide-line">
      {filled.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 px-4 py-2.5 text-sm">
          <dt className="text-muted">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* =========================================================
 * PENDÊNCIAS
 * =======================================================*/

function TasksPanel({ enrollment, onChange, disabled }) {
  const today = getTodayISO();
  const byKind = Object.fromEntries((enrollment.enrollment_tasks ?? []).map((task) => [task.kind, task]));
  const tasks = STUDENT_TASKS.map((definition) => ({ ...definition, task: byKind[definition.kind] })).filter(
    (item) => item.task,
  );
  const groups = [...new Set(tasks.map((item) => item.group))];
  const open = tasks.filter((item) => item.task.status === "pending").length;

  async function change(task, status, label) {
    const previous = task.status;

    try {
      await setTaskStatus(task.id, status);
      onChange();
      toast(`${label}: ${TASK_STATUS_LABEL[status].toLowerCase()}.`, {
        type: "success",
        action: {
          label: "Desfazer",
          onClick: async () => {
            await setTaskStatus(task.id, previous);
            onChange();
          },
        },
      });
    } catch (err) {
      toast(errorMessage(err, "Não foi possível salvar a pendência."));
    }
  }

  return (
    <Panel>
      <PanelHeader
        title="Pendências da matrícula"
        action={<span className="text-sm text-muted tabular-nums">{open ? `${open} em aberto` : "Tudo feito"}</span>}
      />

      {groups.map((group) => (
        <section key={group} aria-label={group} className="border-t border-line first:border-t-0">
          <h3 className="px-4 pt-3 text-sm font-semibold text-muted">{group}</h3>
          <ul>
            {tasks
              .filter((item) => item.group === group)
              .map(({ kind, label, task }) => {
                const done = task.status === "done";
                const exempt = task.status === "exempt";
                const late = task.status === "pending" && task.due_date && task.due_date < today;

                return (
                  <li key={kind} className="flex items-center gap-3 px-4 py-2">
                    <button
                      type="button"
                      disabled={disabled}
                      aria-pressed={done}
                      onClick={() => change(task, done ? "pending" : "done", label)}
                      className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 text-left disabled:cursor-not-allowed ${exempt ? "text-muted" : ""}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border touch:h-7 touch:w-7 ${
                          done ? "border-ok bg-ok text-white" : "border-neutral-300 bg-white"
                        }`}
                      >
                        {done && <Check size={15} strokeWidth={3} />}
                      </span>
                      <span className={`min-w-0 ${exempt ? "line-through decoration-neutral-300" : ""}`}>{label}</span>
                    </button>

                    <span
                      className={`shrink-0 text-right text-sm tabular-nums ${late ? "font-medium text-alert-text" : "text-muted"}`}
                    >
                      {done
                        ? `Feito${task.done_at ? ` em ${formatDate(task.done_at)}` : ""}`
                        : exempt
                          ? "Não se aplica"
                          : late
                            ? `Atrasada desde ${formatDate(task.due_date)}`
                            : task.due_date
                              ? `Até ${formatDate(task.due_date)}`
                              : "Pendente"}
                    </span>

                    {!done && !disabled && (
                      <Button
                        size="sm"
                        variant="quiet"
                        onClick={() => change(task, exempt ? "pending" : "exempt", label)}
                        className="hidden sm:inline-flex"
                      >
                        {exempt ? "Voltar a pendente" : "Não se aplica"}
                      </Button>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}

      <p className="border-t border-line px-4 py-3 text-sm text-muted">
        Mensalidade, vencimento e cadastro oficial ficam no {BRAND.financeSystem}. Aqui só se marca o que já foi feito.
      </p>
    </Panel>
  );
}

/* =========================================================
 * MATRÍCULA
 * =======================================================*/

function EnrollmentPanel({ enrollment, onEdit }) {
  return (
    <Panel>
      <PanelHeader title={`Matrícula ${enrollment.season}`} action={<EditButton onClick={onEdit} label="Editar matrícula" />} />
      <Facts
        items={[
          ["Categoria", enrollment.categories?.name],
          ["Turma", enrollment.training_groups?.name],
          ["Início", formatDate(enrollment.start_date)],
          ["Uniforme", enrollment.uniform_size],
          ["Vencimento", enrollment.due_day ? `Dia ${enrollment.due_day}` : null],
          ["Observação", enrollment.notes],
        ]}
      />
    </Panel>
  );
}

function EnrollmentDialog({ open, onClose, enrollment, studentName, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([getActiveCategories(), getActiveTrainingGroups()])
      .then(([categoryList, groupList]) => {
        setCategories(categoryList);
        setGroups(groupList);
      })
      .catch((err) => console.error("Erro ao carregar categorias e turmas:", err));
  }, [open]);

  const fields = useMemo(
    () => [
      { name: "category_id", label: "Categoria", type: "select", options: categories.map((item) => ({ value: item.id, label: item.name })) },
      {
        name: "training_group_id",
        label: "Turma",
        type: "select",
        options: groups.map((item) => ({
          value: item.id,
          label: item.location?.name ? `${item.name}, ${item.location.name}` : item.name,
        })),
      },
      { name: "start_date", label: "Início *", type: "date", required: true },
      {
        name: "uniform_size",
        label: "Tamanho do uniforme",
        type: "select",
        // Tamanho antigo, fora da tabela atual (ex.: "Tamanho 14"), continua na lista para não sumir
        options:
          enrollment?.uniform_size && !UNIFORM_SIZE_OPTIONS.some((option) => option.value === enrollment.uniform_size)
            ? [...UNIFORM_SIZE_OPTIONS, { value: enrollment.uniform_size, label: enrollment.uniform_size }]
            : UNIFORM_SIZE_OPTIONS,
      },
      { name: "due_day", label: "Dia de vencimento", type: "number" },
      { name: "notes", label: "Observação", type: "textarea" },
    ],
    [categories, groups, enrollment?.uniform_size],
  );

  if (!enrollment) return null;

  return (
    <FieldsDialog
      open={open}
      onClose={onClose}
      title="Editar matrícula"
      description={`${studentName}, temporada ${enrollment.season}`}
      fields={fields}
      values={enrollment}
      onSave={async (values) => {
        if (values.due_day != null && (values.due_day < 1 || values.due_day > 31)) {
          throw new Error("O dia de vencimento vai de 1 a 31.");
        }
        await updateEnrollment(enrollment.id, {
          ...values,
          category_id: values.category_id ? Number(values.category_id) : null,
          training_group_id: values.training_group_id ? Number(values.training_group_id) : null,
        });
        toast("Matrícula salva.", { type: "success" });
        onSaved();
      }}
    />
  );
}

/* =========================================================
 * RESPONSÁVEIS
 * =======================================================*/

function GuardiansPanel({ guardians, onEdit, onAdd }) {
  return (
    <Panel>
      <PanelHeader
        title="Responsáveis"
        action={
          guardians.length < 2 && (
            <Button size="sm" variant="quiet" onClick={onAdd}>
              <Plus size={15} aria-hidden="true" />
              Adicionar
            </Button>
          )
        }
      />

      {guardians.length === 0 && <p className="px-4 py-3 text-sm text-muted">Nenhum responsável cadastrado.</p>}

      {guardians.map((guardian) => {
        const whatsappUrl = guardian.phone ? createWhatsAppUrl(guardian.phone) : null;
        const address = [guardian.address, guardian.complement, guardian.neighborhood, guardian.city, guardian.state]
          .filter(Boolean)
          .join(", ");

        return (
          <section key={guardian.id} className="border-t border-line first:border-t-0">
            <div className="flex items-start justify-between gap-2 px-4 pt-3">
              <div className="min-w-0">
                <p className="font-semibold">{guardian.name}</p>
                <p className="text-sm text-muted">
                  {[guardian.position === 1 ? "Principal" : "Segundo responsável", guardian.relationship]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp de ${guardian.name}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-whatsapp touch:h-11 touch:w-11 hover:border-whatsapp"
                  >
                    <MessageCircle size={17} aria-hidden="true" />
                  </a>
                )}
                <EditButton onClick={() => onEdit(guardian)} label={`Editar ${guardian.name}`} />
              </div>
            </div>

            <Facts
              items={[
                ["Telefone", guardian.phone ? formatPhone(guardian.phone) : null],
                ["E-mail", guardian.email],
                ["CPF", guardian.cpf ? formatCpf(guardian.cpf) : null],
                ["RG", guardian.rg],
                ["Profissão", guardian.profession],
                ["CEP", guardian.zip_code],
                ["Endereço", address],
              ]}
            />
          </section>
        );
      })}
    </Panel>
  );
}

function GuardianDialog({ editing, onClose, studentId, nextPosition, onSaved }) {
  const open = Boolean(editing && typeof editing === "object" && "guardian" in editing);
  const guardian = open ? editing.guardian : null;

  return (
    <FieldsDialog
      open={open}
      onClose={onClose}
      title={guardian ? "Editar responsável" : "Adicionar responsável"}
      description={guardian?.name}
      fields={GUARDIAN_FIELDS}
      values={guardian ?? {}}
      onSave={async ({ relationship, ...values }) => {
        if (guardian) {
          await updateGuardian(guardian.id, values);
          // Parentesco fica na ligação com o aluno (pode ser mãe de um e avó de outro)
          if (relationship !== (guardian.relationship ?? null)) {
            await updateGuardianRelationship(studentId, guardian.id, relationship);
          }
        } else {
          await addGuardian(studentId, values, nextPosition, relationship);
        }
        toast("Responsável salvo.", { type: "success" });
        onSaved();
      }}
    />
  );
}

/* =========================================================
 * DADOS DO ALUNO
 * =======================================================*/

function StudentPanel({ student, onEdit }) {
  return (
    <Panel>
      <PanelHeader title="Dados do aluno" action={<EditButton onClick={onEdit} label="Editar dados do aluno" />} />
      <Facts
        items={[
          ["Nascimento", formatDate(student.birth_date)],
          ["Sexo", student.gender],
          ["CPF", student.cpf ? formatCpf(student.cpf) : null],
          ["RG", student.rg],
          ["Celular", student.phone ? formatPhone(student.phone) : null],
          ["Escola", [student.school, student.school_type].filter(Boolean).join(", ")],
          ["Posição", student.field_position],
          [
            "Camisa",
            student.shirt_number ? (
              `${student.shirt_number}${student.goalkeeper ? ", goleiro" : ""}`
            ) : student.status === "active" ? (
              <Link to="/admin/students/camisas" className="underline underline-offset-4">
                Sem número. Dar número
              </Link>
            ) : null,
          ],
          ["Time", student.club_team],
          ["Jogador preferido", student.favorite_player],
          ["Ídolo", student.idol],
          ["Como conheceu", student.how_found],
          [`Código no ${BRAND.financeSystem}`, student.sogni_id],
          [
            "Foto",
            student.photo_url ? (
              <a href={student.photo_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                Abrir foto
              </a>
            ) : null,
          ],
          ["Observação", student.notes],
        ]}
      />
    </Panel>
  );
}

/* =========================================================
 * SAÚDE: só aparece quando alguém abre, e fecha ao sair
 * =======================================================*/

function HealthPanel({ studentId }) {
  const [visible, setVisible] = useState(false);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setVisible(false);
    setHealth(null);
  }, [studentId]);

  async function show() {
    try {
      setLoading(true);
      setHealth((await getStudentHealth(studentId)) ?? {});
      setVisible(true);
    } catch (err) {
      toast(errorMessage(err, "Não foi possível abrir os dados de saúde."));
    } finally {
      setLoading(false);
    }
  }

  function hide() {
    setVisible(false);
    setHealth(null);
  }

  return (
    <Panel>
      <PanelHeader
        title="Saúde"
        action={
          visible ? (
            <div className="flex gap-1">
              <EditButton onClick={() => setEditing(true)} label="Editar dados de saúde" />
              <Button size="sm" variant="quiet" onClick={hide}>
                <EyeOff size={15} aria-hidden="true" />
                Esconder
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={show} disabled={loading}>
              <Eye size={15} aria-hidden="true" />
              {loading ? "Abrindo…" : "Mostrar"}
            </Button>
          )
        }
      />

      {visible ? (
        <Facts items={HEALTH_FIELDS.map((field) => [field.label, health?.[field.name]])} />
      ) : (
        <p className="flex items-start gap-2 px-4 py-3 text-sm text-muted">
          <Lock size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          Dado sensível. Abra só quando precisar, como num atendimento ou numa viagem.
        </p>
      )}

      <FieldsDialog
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar dados de saúde"
        fields={HEALTH_FIELDS}
        values={health ?? {}}
        onSave={async (values) => {
          await saveStudentHealth(studentId, values);
          setHealth(values);
          toast("Dados de saúde salvos.", { type: "success" });
        }}
      />
    </Panel>
  );
}

/* =========================================================
 * EVENTOS (Taça, rodadas, passeios)
 * =======================================================*/

function EventsPanel({ studentId, events, onChange }) {
  // Campeonato primeiro, rodadas logo abaixo, na ordem
  const sorted = [...events]
    .filter((item) => item.events)
    .sort(
      (a, b) =>
        b.events.season - a.events.season ||
        (a.events.parent_id ?? a.events.id).localeCompare(b.events.parent_id ?? b.events.id) ||
        Number(Boolean(a.events.parent_id)) - Number(Boolean(b.events.parent_id)) ||
        a.events.position - b.events.position,
    );

  async function change(eventId, status) {
    try {
      await setParticipantStatus(eventId, studentId, status);
      onChange();
    } catch (err) {
      toast(errorMessage(err, "Não foi possível salvar."));
    }
  }

  return (
    <Panel>
      <PanelHeader title="Eventos" action={<Button size="sm" variant="quiet" to="/admin/events">Ver eventos</Button>} />

      {sorted.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted">Não participa de nenhum evento.</p>
      ) : (
        <ul className="divide-y divide-line">
          {sorted.map(({ event_id: eventId, status, events: event }) => (
            <li key={eventId} className={`flex items-center gap-3 px-4 py-2 ${event.parent_id ? "pl-8" : ""}`}>
              <Link
                to={`/admin/events/${event.parent_id ?? event.id}`}
                className={`min-w-0 flex-1 truncate text-sm hover:underline ${event.parent_id ? "" : "font-semibold"}`}
              >
                {event.parent_id ? event.name : `${event.name}${event.name.includes(String(event.season)) ? "" : ` ${event.season}`}`}
              </Link>
              <select
                aria-label={`Situação em ${event.name}`}
                value={status}
                onChange={(changeEvent) => change(eventId, changeEvent.target.value)}
                className={`h-9 rounded-lg border border-line bg-white px-2 text-sm touch:h-11 ${EVENT_STATUS_TONE[status] ?? ""}`}
              >
                {EVENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* =========================================================
 * SAÍDA
 * =======================================================*/

function LeaveDialog({ open, onClose, student, onSaved }) {
  const [date, setDate] = useState(getTodayISO());
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(getTodayISO());
    setReason("");
    setError("");
  }, [open]);

  async function handleSave() {
    try {
      setSaving(true);
      await updateStudent(student.id, { status: "left", left_at: date || getTodayISO(), left_reason: reason.trim() || null });
      toast(`Saída registrada. Lembre de cancelar também no ${BRAND.financeSystem}.`, { type: "success" });
      onClose();
      onSaved();
    } catch (err) {
      setError(errorMessage(err, "Não foi possível registrar a saída."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={saving}
      size="sm"
      title="Registrar saída"
      description={`${student.name} deixa de aparecer nos ativos e nas pendências.`}
      footer={
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando…" : "Registrar saída"}
          </Button>
        </DialogActions>
      }
    >
      <div className="space-y-4">
        <Field label="Data da saída">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} />
        </Field>
        <Field label="Motivo">
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ex.: mudou de cidade"
            className={inputClass}
          />
        </Field>
        {error && (
          <p role="alert" className="rounded-lg bg-alert-soft p-3 text-sm text-alert-text">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
