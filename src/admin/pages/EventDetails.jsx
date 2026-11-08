import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Copy, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";

import { Button, Dialog, DialogActions, Panel, inputClass } from "../ui";
import { toast } from "../components/common/Toaster";
import FieldsDialog from "../components/students/FieldsDialog";

import {
  addParticipants,
  createEvent,
  deleteEvent,
  getEvent,
  setParticipantStatus,
  updateEvent,
} from "../../services/events";
import { currentEnrollment, getStudents } from "../../services/students";
import {
  EVENT_STATUS_LABEL,
  EVENT_STATUS_OPEN,
  EVENT_STATUS_OPTIONS,
  EVENT_STATUS_ORDER,
  EVENT_STATUS_PLAYING,
  EVENT_STATUS_TONE,
} from "../../constants/eventStatus";
import { errorMessage } from "../../helpers/errorMessage";

const formatDate = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR") : "");
const formatMoney = (value) =>
  value == null ? "" : Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const SORTS = [
  { value: "categoria", label: "categoria" },
  { value: "nome", label: "nome" },
  { value: "situacao", label: "situação" },
  { value: "numero", label: "número da camisa" },
];

const statusRank = (status) => {
  const index = EVENT_STATUS_ORDER.indexOf(status);
  return index === -1 ? EVENT_STATUS_ORDER.length : index;
};

const byName = (a, b) => a.student.name.localeCompare(b.student.name, "pt-BR");
const byCategory = (a, b) => a.category.localeCompare(b.category, "pt-BR", { numeric: true });

const EVENT_FIELDS = [
  { name: "name", label: "Nome *", required: true, wide: true },
  { name: "season", label: "Temporada *", type: "number", required: true },
  { name: "event_date", label: "Data", type: "date" },
  { name: "fee", label: "Taxa (R$)", type: "number" },
];

/*
 * Um evento e as rodadas: uma linha por aluno, uma coluna para a
 * inscrição e uma para cada rodada (como na planilha). Abre só na
 * rodada atual (a última com alguém marcado); "Todas as rodadas"
 * mostra o histórico. Filtros e ordem ficam na URL.
 */
export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [round, setRound] = useState(searchParams.get("rodada") ?? "");
  const [search, setSearch] = useState(searchParams.get("busca") ?? "");
  const [category, setCategory] = useState(searchParams.get("categoria") ?? "all");
  const [situation, setSituation] = useState(searchParams.get("situacao") ?? "all");
  const [sort, setSort] = useState(
    SORTS.some((item) => item.value === searchParams.get("ordem")) ? searchParams.get("ordem") : "categoria",
  );
  const [showLeft, setShowLeft] = useState(searchParams.get("saiu") === "1");
  // No celular os filtros ficam recolhidos atrás de um botão
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const params = {};
    if (round) params.rodada = round;
    if (search) params.busca = search;
    if (category !== "all") params.categoria = category;
    if (situation !== "all") params.situacao = situation;
    if (sort !== "categoria") params.ordem = sort;
    if (showLeft) params.saiu = "1";
    setSearchParams(params, { replace: true });
  }, [round, search, category, situation, sort, showLeft, setSearchParams]);

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
      setData(await getEvent(id));
    } catch (err) {
      console.error("Erro ao carregar evento:", err);
      setError(errorMessage(err, "Não foi possível carregar o evento."));
    } finally {
      setLoading(false);
    }
  }

  // Rodada atual: a última em que alguém já tem situação
  const currentRound = useMemo(() => {
    if (!data?.rounds.length) return null;
    const marked = new Set(data.participants.map((participant) => participant.event_id));
    return [...data.rounds].reverse().find((item) => marked.has(item.id)) ?? data.rounds[0];
  }, [data]);

  const showAll = round === "todas";

  // Coluna que os filtros de situação, a ordem e a lista copiada usam
  const focus = useMemo(() => {
    if (!data) return null;
    if (!currentRound) return data.event;
    if (showAll) return currentRound;
    return data.rounds.find((item) => String(item.id) === round) ?? currentRound;
  }, [data, round, showAll, currentRound]);

  const columns = useMemo(() => {
    if (!data) return [];
    if (showAll || focus.id === data.event.id) return [data.event, ...data.rounds];
    return [data.event, focus];
  }, [data, showAll, focus]);

  const allRows = useMemo(() => {
    if (!data) return [];

    const byStudent = new Map();

    data.participants.forEach((participant) => {
      if (!participant.students) return;
      const row = byStudent.get(participant.student_id) ?? { student: participant.students, statuses: {} };
      row.statuses[participant.event_id] = participant.status;
      byStudent.set(participant.student_id, row);
    });

    return [...byStudent.values()].map((row) => ({
      ...row,
      category: currentEnrollment(row.student)?.categories?.name ?? "",
    }));
  }, [data]);

  // Quem saiu da escola fica escondido e nunca entra em "vão jogar"
  const activeRows = useMemo(() => allRows.filter((row) => row.student.status !== "left"), [allRows]);
  const leftCount = allRows.length - activeRows.length;
  const baseRows = showLeft ? allRows : activeRows;

  const categories = useMemo(
    () =>
      [...new Set(baseRows.map((row) => row.category).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "pt-BR", { numeric: true }),
      ),
    [baseRows],
  );

  const rows = useMemo(() => {
    if (!focus) return [];
    const term = search.trim().toLowerCase();
    const statusOf = (row) => row.statuses[focus.id] ?? "";

    const filtered = baseRows.filter((row) => {
      if (term && !row.student.name.toLowerCase().includes(term) && String(row.student.shirt_number ?? "") !== term) return false;
      if (category !== "all" && row.category !== category) return false;
      const status = statusOf(row);
      if (situation === "playing") return EVENT_STATUS_PLAYING.has(status);
      if (situation === "none") return !status;
      return situation === "all" || status === situation;
    });

    const compare = {
      categoria: (a, b) => byCategory(a, b) || byName(a, b),
      nome: byName,
      numero: (a, b) => (a.student.shirt_number ?? Infinity) - (b.student.shirt_number ?? Infinity) || byName(a, b),
      situacao: (a, b) => statusRank(statusOf(a)) - statusRank(statusOf(b)) || byCategory(a, b) || byName(a, b),
    }[sort];

    return filtered.sort(compare);
  }, [baseRows, focus, search, category, situation, sort]);

  if (loading) {
    return (
      <p role="status" className="py-12 text-center text-muted">
        Carregando evento…
      </p>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <BackToEvents />
        <Panel className="p-5">
          <p role="alert" className="font-medium text-alert-text">
            {error || "Evento não encontrado."}
          </p>
        </Panel>
      </div>
    );
  }

  const { event, rounds } = data;
  const shownIds = new Set(baseRows.map((row) => row.student.id));
  const open = data.participants.filter(
    (participant) => shownIds.has(participant.student_id) && EVENT_STATUS_OPEN.has(participant.status),
  ).length;
  const focusName = focus.id === event.id ? "Inscrição" : focus.name;
  const playing = activeRows.filter((row) => EVENT_STATUS_PLAYING.has(row.statuses[focus.id]));
  const filtering = search || category !== "all" || situation !== "all";

  // Quem joga, por categoria, em texto pronto para colar no WhatsApp
  async function copyList() {
    const groups = new Map();
    [...playing]
      .sort((a, b) => byCategory(a, b) || byName(a, b))
      .forEach((row) => {
        const key = row.category || "Sem categoria";
        const { name, shirt_number: number } = row.student;
        groups.set(key, [...(groups.get(key) ?? []), number ? `${number} ${name}` : name]);
      });

    const lines = [`${event.name}, ${focusName}: ${playing.length} aluno${playing.length === 1 ? "" : "s"}`];
    groups.forEach((names, group) => {
      lines.push("", `${group} (${names.length})`, ...names.map((item) => `- ${item}`));
    });

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast(`Lista copiada com ${playing.length} aluno${playing.length === 1 ? "" : "s"}. É só colar no WhatsApp.`, {
        type: "success",
      });
    } catch {
      toast("Não foi possível copiar a lista.");
    }
  }

  async function change(eventId, studentId, status, studentName) {
    try {
      await setParticipantStatus(eventId, studentId, status || null);
      await load();
      if (!status) toast(`${studentName} saiu desta coluna.`, { type: "success" });
    } catch (err) {
      toast(errorMessage(err, "Não foi possível salvar."));
    }
  }

  async function addRound() {
    try {
      const position = rounds.length + 1;
      await createEvent({ name: `Rodada ${position}`, season: event.season, parent_id: event.id, position });
      toast(`Rodada ${position} criada.`, { type: "success" });
      load();
    } catch (err) {
      toast(errorMessage(err, "Não foi possível criar a rodada."));
    }
  }

  return (
    <div className="space-y-5">
      <BackToEvents />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[2.6rem] font-semibold leading-[0.9]">{event.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {[
              `Temporada ${event.season}`,
              event.event_date ? formatDate(event.event_date) : null,
              event.fee != null ? `taxa ${formatMoney(event.fee)}` : null,
              `${activeRows.length} aluno${activeRows.length === 1 ? "" : "s"}`,
            ]
              .filter(Boolean)
              .join(", ")}
            .{" "}
            {open > 0 && <span className="font-medium text-attention-text">{open} para cobrar ou devolver.</span>}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="quiet" onClick={() => setDialog("edit")}>
            <Pencil size={16} aria-hidden="true" />
            Editar
          </Button>
          <Button onClick={addRound}>
            <Plus size={16} aria-hidden="true" />
            Rodada
          </Button>
          <Button variant="primary" onClick={() => setDialog("add")}>
            <Plus size={18} aria-hidden="true" />
            Adicionar alunos
          </Button>
        </div>
      </header>

      {allRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 lg:flex-row">
            <div className="flex gap-2">
            <label className="relative flex-1 lg:w-64 lg:flex-none">
              <span className="sr-only">Buscar aluno</span>
              <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={search}
                onChange={(changeEvent) => setSearch(changeEvent.target.value)}
                placeholder="Buscar aluno"
                className={`${inputClass} pl-9`}
              />
            </label>

              <Button
                className="shrink-0 sm:hidden"
                aria-expanded={filtersOpen}
                aria-controls="filtros-evento"
                onClick={() => setFiltersOpen((value) => !value)}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                Filtros
              </Button>
            </div>

            <div
              id="filtros-evento"
              className={`${filtersOpen ? "grid" : "hidden"} grid-cols-1 gap-2 sm:grid sm:grid-cols-4 lg:flex`}
            >
              {rounds.length > 0 && (
                <select
                  aria-label="Rodada"
                  value={showAll ? "todas" : String(focus.id)}
                  onChange={(changeEvent) =>
                    setRound(changeEvent.target.value === String(currentRound.id) ? "" : changeEvent.target.value)
                  }
                  className={`${inputClass} lg:w-48`}
                >
                  {rounds.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.id === currentRound.id ? `${item.name} (atual)` : item.name}
                    </option>
                  ))}
                  <option value="todas">Todas as rodadas</option>
                </select>
              )}

              <select
                aria-label="Categoria"
                value={category}
                onChange={(changeEvent) => setCategory(changeEvent.target.value)}
                className={`${inputClass} lg:w-48`}
              >
                <option value="all">Todas as categorias</option>
                {categories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                aria-label={`Situação na ${focusName}`}
                value={situation}
                onChange={(changeEvent) => setSituation(changeEvent.target.value)}
                className={`${inputClass} lg:w-48`}
              >
                <option value="all">Qualquer situação</option>
                <option value="playing">Vão jogar</option>
                {EVENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="none">Sem situação</option>
              </select>

              <select
                aria-label="Ordenar por"
                value={sort}
                onChange={(changeEvent) => setSort(changeEvent.target.value)}
                className={`${inputClass} lg:w-48`}
              >
                {SORTS.map((item) => (
                  <option key={item.value} value={item.value}>
                    Ordem por {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm tabular-nums text-muted">
              {focusName}: {playing.length} vão jogar.
              {filtering ? ` Mostrando ${rows.length} de ${baseRows.length}.` : ""}
              {situation !== "all" ? ` A situação filtrada é a da ${focusName}.` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {leftCount > 0 && (
                <Button size="sm" variant="quiet" aria-pressed={showLeft} onClick={() => setShowLeft((value) => !value)}>
                  {showLeft
                    ? "Esconder quem saiu da escola"
                    : `Mostrar quem saiu da escola (${leftCount})`}
                </Button>
              )}
              <Button size="sm" onClick={copyList} disabled={playing.length === 0}>
                <Copy size={15} aria-hidden="true" />
                Copiar lista da {focus.id === event.id ? "inscrição" : focusName}
              </Button>
            </div>
          </div>
        </div>
      )}

      {allRows.length === 0 ? (
        <Panel className="px-6 py-10 text-center">
          <p className="font-semibold">Ninguém neste evento ainda.</p>
          <p className="mt-1 text-sm text-muted">Use “Adicionar alunos” para escolher por categoria.</p>
        </Panel>
      ) : rows.length === 0 ? (
        <Panel className="px-6 py-10 text-center">
          <p className="font-semibold">Nenhum aluno com esses filtros.</p>
          <Button
            size="sm"
            variant="quiet"
            className="mt-3"
            onClick={() => {
              setSearch("");
              setCategory("all");
              setSituation("all");
            }}
          >
            Limpar filtros
          </Button>
        </Panel>
      ) : (
        <>
        {/* Celular: um cartão por aluno, com a situação de cada coluna em linha própria */}
        <Panel as="ul" className="overflow-hidden sm:hidden">
          {rows.map(({ student, statuses, category }) => (
            <li key={student.id} className="border-t border-line px-4 py-3 first:border-t-0">
              <Link to={`/admin/students/${student.id}`} className="font-medium hover:underline">
                {student.shirt_number && (
                  <span className="mr-1.5 tabular-nums text-muted">
                    <span className="sr-only">camisa </span>
                    {student.shirt_number}
                  </span>
                )}
                {student.name}
              </Link>
              {(category || student.status === "left") && (
                <span className="block text-sm text-muted">
                  {[category, student.status === "left" ? "saiu da escola" : null].filter(Boolean).join(", ")}
                </span>
              )}

              <div className="mt-2 space-y-2">
                {columns.map((column) => {
                  const status = statuses[column.id] ?? "";
                  const columnName = column.id === event.id ? "Inscrição" : column.name;
                  return (
                    <label key={column.id} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 text-muted">{columnName}</span>
                      <select
                        aria-label={`${student.name}, ${columnName.toLowerCase()}`}
                        value={status}
                        onChange={(changeEvent) => change(column.id, student.id, changeEvent.target.value, student.name)}
                        className={`h-11 min-w-0 flex-1 rounded-lg border border-line bg-white px-2 ${
                          status ? EVENT_STATUS_TONE[status] ?? "" : "text-neutral-400"
                        }`}
                      >
                        <option value="">—</option>
                        {EVENT_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
            </li>
          ))}
        </Panel>

        <Panel className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-max text-sm">
            <thead className="bg-canvas text-left text-muted">
              <tr>
                <th scope="col" className="sticky left-0 bg-canvas px-4 py-2 font-medium">
                  Aluno
                </th>
                {columns.map((column) => (
                  <th key={column.id} scope="col" className="px-2 py-2 font-medium">
                    {column.id === event.id ? "Inscrição" : column.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ student, statuses, category }) => (
                <tr key={student.id} className="border-t border-line">
                  <th scope="row" className="sticky left-0 bg-white px-4 py-2 text-left font-normal">
                    <Link to={`/admin/students/${student.id}`} className="font-medium hover:underline">
                      {student.shirt_number && (
                        <span className="mr-1.5 tabular-nums text-muted">
                          <span className="sr-only">camisa </span>
                          {student.shirt_number}
                        </span>
                      )}
                      {student.name}
                    </Link>
                    {(category || student.status === "left") && (
                      <span className="block text-muted">
                        {[category, student.status === "left" ? "saiu da escola" : null].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </th>
                  {columns.map((column) => {
                    const status = statuses[column.id] ?? "";
                    return (
                      <td key={column.id} className="px-2 py-2">
                        <select
                          aria-label={`${student.name}, ${column.id === event.id ? "inscrição" : column.name}`}
                          value={status}
                          onChange={(changeEvent) => change(column.id, student.id, changeEvent.target.value, student.name)}
                          className={`h-9 rounded-lg border border-line bg-white px-2 touch:h-11 ${
                            status ? EVENT_STATUS_TONE[status] ?? "" : "text-neutral-400"
                          }`}
                        >
                          <option value="">—</option>
                          {EVENT_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        </>
      )}

      <p className="text-sm text-muted">
        “—” tira o aluno daquela coluna. {EVENT_STATUS_LABEL.refund} = pagou e não jogou, a escola devolve.
      </p>

      <div>
        <Button variant="quiet" size="sm" onClick={() => setDialog("delete")}>
          <Trash2 size={15} aria-hidden="true" />
          Excluir evento
        </Button>
      </div>

      <FieldsDialog
        open={dialog === "edit"}
        onClose={() => setDialog(null)}
        title="Editar evento"
        fields={EVENT_FIELDS}
        values={event}
        onSave={async (values) => {
          await updateEvent(event.id, values);
          toast("Evento salvo.", { type: "success" });
          load();
        }}
      />

      <AddParticipantsDialog
        open={dialog === "add"}
        onClose={() => setDialog(null)}
        event={event}
        existing={new Set(allRows.map((row) => row.student.id))}
        onSaved={load}
      />

      <Dialog
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        size="sm"
        title="Excluir evento"
        description={event.name}
        footer={
          <DialogActions>
            <Button onClick={() => setDialog(null)}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  await deleteEvent(event.id);
                  toast("Evento excluído.", { type: "success" });
                  navigate("/admin/events");
                } catch (err) {
                  toast(errorMessage(err, "Não foi possível excluir."));
                }
              }}
            >
              Excluir evento
            </Button>
          </DialogActions>
        }
      >
        <p className="text-sm">
          Apaga o evento{rounds.length ? `, as ${rounds.length} rodadas` : ""} e a situação de {allRows.length} aluno
          {allRows.length === 1 ? "" : "s"}. Não dá para desfazer.
        </p>
      </Dialog>
    </div>
  );
}

function BackToEvents() {
  return (
    <Link to="/admin/events" className="inline-flex items-center gap-1.5 rounded text-sm text-muted hover:text-ink">
      <ArrowLeft size={16} aria-hidden="true" />
      Eventos
    </Link>
  );
}

function AddParticipantsDialog({ open, onClose, event, existing, onSaved }) {
  const [students, setStudents] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setSearch("");
    getStudents()
      .then((list) => setStudents(list.filter((student) => student.status === "active")))
      .catch((err) => toast(errorMessage(err, "Não foi possível carregar os alunos.")));
  }, [open]);

  const options = useMemo(
    () =>
      students
        .filter((student) => !existing.has(student.id))
        .map((student) => ({ student, category: currentEnrollment(student)?.categories?.name ?? "" })),
    [students, existing],
  );

  const categories = [...new Set(options.map((option) => option.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { numeric: true }),
  );

  const term = search.trim().toLowerCase();
  const visible = options.filter(
    (option) =>
      (category === "all" || option.category === category) &&
      (!term || option.student.name.toLowerCase().includes(term)),
  );

  function toggle(id) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    try {
      setSaving(true);
      await addParticipants(event.id, [...selected]);
      toast(`${selected.size} aluno${selected.size === 1 ? "" : "s"} adicionado${selected.size === 1 ? "" : "s"}.`, {
        type: "success",
      });
      onClose();
      onSaved();
    } catch (err) {
      toast(errorMessage(err, "Não foi possível adicionar."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={saving}
      title="Adicionar alunos"
      description={`Entram em ${event.name} como confirmados. A situação de cada um muda na tabela.`}
      footer={
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || selected.size === 0}>
            {saving ? "Adicionando…" : `Adicionar ${selected.size || ""}`.trim()}
          </Button>
        </DialogActions>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Buscar aluno</span>
            <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(changeEvent) => setSearch(changeEvent.target.value)}
              placeholder="Buscar aluno"
              className={`${inputClass} pl-9`}
            />
          </label>
          <select
            aria-label="Categoria"
            value={category}
            onChange={(changeEvent) => setCategory(changeEvent.target.value)}
            className={`${inputClass} sm:w-48`}
          >
            <option value="all">Todas as categorias</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {visible.length > 0 && (
          <Button
            size="sm"
            variant="quiet"
            onClick={() =>
              setSelected((current) => {
                const next = new Set(current);
                const allIn = visible.every((option) => next.has(option.student.id));
                visible.forEach((option) => (allIn ? next.delete(option.student.id) : next.add(option.student.id)));
                return next;
              })
            }
          >
            Marcar ou desmarcar os {visible.length} da lista
          </Button>
        )}

        <ul className="max-h-80 divide-y divide-line overflow-y-auto rounded-lg border border-line">
          {visible.length === 0 && <li className="px-3 py-4 text-sm text-muted">Nenhum aluno para adicionar.</li>}
          {visible.map(({ student, category: name }) => (
            <li key={student.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-canvas">
                <input
                  type="checkbox"
                  checked={selected.has(student.id)}
                  onChange={() => toggle(student.id)}
                  className="h-4 w-4 accent-ink"
                />
                <span className="min-w-0 flex-1 truncate">{student.name}</span>
                <span className="shrink-0 text-sm text-muted">{name}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}
