import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, ClipboardCheck, FileUp, MessageCircle, Plus, Search, Shirt } from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import { Button, Count, Dialog, DialogActions, Panel, Tabs, inputClass, urgencyRail } from "../ui";
import { toast } from "../components/common/Toaster";
import { Field } from "../components/students/FieldsDialog";

import {
  createStudentEnrollment,
  currentEnrollment,
  getStudents,
  guardiansOf,
  studentTaskSummary,
} from "../../services/students";
import { getActiveCategories } from "../../services/categories";
import { missingTasksText } from "../../constants/studentTasks";
import { createWhatsAppUrl, getTodayISO } from "../../helpers/contactPresentation";
import { getAge } from "../../helpers/dateHelpers";
import { errorMessage } from "../../helpers/errorMessage";

const TABS = [
  { value: "atrasadas", label: "Atrasadas" },
  { value: "ativos", label: "Ativos" },
  { value: "sairam", label: "Saíram" },
];

// Mesmo tamanho de página de Contatos
const ITEMS_PER_PAGE = 20;

const fieldClass =
  "h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none placeholder:text-neutral-500 focus:border-ink";

const normalize = (text = "") =>
  String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/*
 * Alunos matriculados e o que falta depois da matrícula (contrato,
 * pagamentos, uniforme, Sogni). Quem chega pela matrícula de um
 * contato já aparece aqui com as pendências criadas.
 */
export default function Students() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const [tab, setTab] = useState(() =>
    TABS.some((item) => item.value === searchParams.get("aba")) ? searchParams.get("aba") : "ativos",
  );
  const [search, setSearch] = useState(searchParams.get("busca") ?? "");
  const [category, setCategory] = useState(searchParams.get("categoria") ?? "all");
  const [page, setPage] = useState(() => Math.max(Number(searchParams.get("pagina")) || 1, 1));
  const listTopRef = useRef(null);
  const firstFilterRun = useRef(true);

  // Mudou aba, busca ou categoria: volta para a primeira página
  useEffect(() => {
    if (firstFilterRun.current) {
      firstFilterRun.current = false;
      return;
    }
    setPage(1);
  }, [tab, search, category]);

  useEffect(() => {
    const params = {};
    if (tab !== "ativos") params.aba = tab;
    if (search) params.busca = search;
    if (category !== "all") params.categoria = category;
    if (page > 1) params.pagina = String(page);
    setSearchParams(params, { replace: true });
  }, [tab, search, category, page, setSearchParams]);

  useEffect(() => {
    loadStudents();

    function handleVisibility() {
      if (document.visibilityState === "visible") loadStudents();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  async function loadStudents() {
    try {
      setLoading(true);
      setError("");
      setStudents(await getStudents());
    } catch (err) {
      console.error("Erro ao carregar alunos:", err);
      setError(errorMessage(err, "Não foi possível carregar os alunos."));
    } finally {
      setLoading(false);
    }
  }

  const today = getTodayISO();

  // Fichas preenchidas pela família esperando conferência (contador do menu)
  const formsToReview = useOutletContext()?.pending?.formsToReview ?? 0;

  const rows = useMemo(
    () =>
      students.map((student) => {
        const enrollment = currentEnrollment(student);
        const { open, overdue } = studentTaskSummary(student, today);

        return {
          student,
          enrollment,
          guardian: guardiansOf(student)[0] ?? null,
          categoryName: enrollment?.categories?.name ?? "",
          open,
          overdue,
        };
      }),
    [students, today],
  );

  const counts = useMemo(
    () => ({
      ativos: rows.filter((row) => row.student.status === "active").length,
      sairam: rows.filter((row) => row.student.status === "left").length,
      atrasadas: rows.filter((row) => row.student.status === "active" && row.overdue.length).length,
    }),
    [rows],
  );

  const categories = useMemo(
    () => [...new Set(rows.map((row) => row.categoryName).filter(Boolean))].sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    const digits = search.replace(/\D/g, "");

    return rows
      .filter((row) => {
        if (tab === "sairam") return row.student.status === "left";
        if (row.student.status !== "active") return false;
        return tab === "atrasadas" ? row.overdue.length > 0 : true;
      })
      .filter((row) => category === "all" || row.categoryName === category)
      .filter((row) => {
        if (!term) return true;
        const guardians = guardiansOf(row.student);
        const text = normalize([row.student.name, ...guardians.map((guardian) => guardian.name)].join(" "));
        if (digits && String(row.student.shirt_number ?? "") === search.trim()) return true;
        const phones = guardians.map((guardian) => (guardian.phone ?? "").replace(/\D/g, ""));
        return text.includes(term) || (digits.length >= 4 && phones.some((phone) => phone.includes(digits)));
      })
      .sort((a, b) =>
        tab === "atrasadas"
          ? b.overdue.length - a.overdue.length || b.open.length - a.open.length || a.student.name.localeCompare(b.student.name, "pt-BR")
          : a.student.name.localeCompare(b.student.name, "pt-BR"),
      );
  }, [rows, tab, category, search]);

  const totalPages = Math.max(Math.ceil(filtered.length / ITEMS_PER_PAGE), 1);
  useEffect(() => {
    if (!loading && page > totalPages) setPage(totalPages);
  }, [loading, page, totalPages]);
  const pageItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Troca de página e leva a tela para o começo da lista
  function goToPage(next) {
    setPage(next);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    listTopRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Alunos"
        summary={`${counts.ativos} ativos, ${counts.atrasadas} com pendência atrasada.`}
        actions={
          <>
            {/* No celular os nomes encurtam para as três caberem numa linha */}
            <Button to="/admin/students/fichas" size="sm" className="sm:h-10 sm:px-4">
              <ClipboardCheck size={18} aria-hidden="true" />
              <span className="sm:hidden">Fichas</span>
              <span className="hidden sm:inline">Fichas da família</span>
              {formsToReview > 0 && (
                <>
                  <Count value={formsToReview} urgency="attention" />
                  <span className="sr-only"> para conferir</span>
                </>
              )}
            </Button>
            <Button to="/admin/students/camisas" size="sm" className="sm:h-10 sm:px-4">
              <Shirt size={18} aria-hidden="true" />
              <span className="sm:hidden">Camisas</span>
              <span className="hidden sm:inline">Números de camisa</span>
            </Button>
            <Button to="/admin/students/import" size="sm" className="sm:h-10 sm:px-4">
              <FileUp size={18} aria-hidden="true" />
              <span className="sm:hidden">Importar</span>
              <span className="hidden sm:inline">Importar planilha</span>
            </Button>
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus size={18} aria-hidden="true" />
              Novo aluno
            </Button>
          </>
        }
      />

      <Tabs
        label="Grupos de alunos"
        value={tab}
        onChange={setTab}
        items={TABS.map((item) => ({
          ...item,
          count: counts[item.value],
          urgency: item.value === "atrasadas" && counts.atrasadas ? "alert" : undefined,
        }))}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Buscar aluno</span>
          <Search size={17} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar aluno, responsável ou telefone"
            className={`${fieldClass} w-full pl-10`}
          />
        </label>

        <select
          aria-label="Categoria"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className={fieldClass}
        >
          <option value="all">Todas as categorias</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {loading && students.length === 0 ? (
        <p role="status" className="py-12 text-center text-muted">
          Carregando alunos…
        </p>
      ) : error ? (
        <Panel className="p-5">
          <p role="alert" className="font-medium text-alert-text">
            {error} Confira sua internet e tente de novo.
          </p>
          <Button className="mt-3" onClick={loadStudents}>
            Tentar de novo
          </Button>
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel className="px-6 py-10 text-center">
          <p className="font-semibold">
            {students.length === 0
              ? "Nenhum aluno ainda."
              : tab === "atrasadas" && !search && category === "all"
                ? "Nenhuma pendência atrasada."
                : "Nenhum aluno encontrado."}
          </p>
          {students.length === 0 && (
            <p className="mt-1 text-sm text-muted">
              Importe a planilha de matrículas ou registre a matrícula de um contato.
            </p>
          )}
        </Panel>
      ) : (
        <>
          <div ref={listTopRef} className="flex scroll-mt-4 items-center justify-between gap-3 text-sm text-muted">
            <span className="tabular-nums">
              {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
            </span>
          </div>

          <Panel as="ul" className="overflow-hidden">
            {pageItems.map((row) => (
              <StudentRow key={row.student.id} row={row} emphasizeLate={tab === "atrasadas"} />
            ))}
          </Panel>

          {totalPages > 1 && (
            <nav aria-label="Páginas" className="flex items-center justify-between">
              <Button disabled={page === 1} onClick={() => goToPage(page - 1)}>
                <ChevronLeft size={16} aria-hidden="true" />
                Anterior
              </Button>

              <span className="text-sm text-muted">
                Página {page} de {totalPages}
              </span>

              <Button disabled={page === totalPages} onClick={() => goToPage(page + 1)}>
                Próxima
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </nav>
          )}
        </>
      )}

      <NewStudentDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

// O que falta, não o nome do passo: "Falta contrato e uniforme"
function pendingText({ open, overdue }) {
  if (overdue.length) return `Atrasado: falta ${missingTasksText(overdue)}`;
  if (open.length) return `Falta ${missingTasksText(open)}, no prazo`;
  return "Matrícula em dia";
}

// Vermelho só na aba Atrasadas, onde a lista é o que fazer hoje;
// em Ativos o atraso aparece em texto, sem faixa
function StudentRow({ row, emphasizeLate }) {
  const { student, guardian, categoryName, overdue } = row;
  const age = getAge(student.birth_date);
  const whatsappUrl = guardian?.phone ? createWhatsAppUrl(guardian.phone) : null;
  const left = student.status === "left";
  const late = !left && overdue.length > 0;

  return (
    <li className={`flex items-center gap-3 border-t border-line first:border-t-0 ${urgencyRail(late && emphasizeLate ? "alert" : null)}`}>
      <Link
        to={`/admin/students/${student.id}`}
        className="grid min-w-0 flex-1 gap-x-4 gap-y-0.5 px-4 py-3 hover:bg-canvas lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.6fr)]"
      >
        <span className="min-w-0">
          <span className="block truncate font-semibold">{student.name}</span>
          <span className="block text-sm text-muted">
            {[
              student.shirt_number ? `camisa ${student.shirt_number}` : null,
              categoryName,
              age != null ? `${age} anos` : null,
            ]
              .filter(Boolean)
              .join(", ") || "Sem categoria"}
          </span>
        </span>

        <span className="min-w-0 truncate text-sm text-muted lg:self-center">
          {guardian ? guardian.name : "Sem responsável"}
        </span>

        <span
          className={`text-sm lg:self-center ${late ? (emphasizeLate ? "font-medium text-alert-text" : "text-ink") : "text-muted"}`}
        >
          {left ? "Saiu" : pendingText(row)}
        </span>
      </Link>

      <div className="flex shrink-0 items-center gap-1 pr-3">
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
        <ChevronRight size={18} aria-hidden="true" className="hidden text-neutral-300 sm:block" />
      </div>
    </li>
  );
}

const EMPTY_FORM = {
  name: "",
  birthDate: "",
  categoryId: "",
  guardianName: "",
  guardianPhone: "",
  startDate: getTodayISO(),
};

// Aluno que não passou pelo funil (ex.: matrícula direta na secretaria)
function NewStudentDialog({ open, onClose }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY_FORM, startDate: getTodayISO() });
    setError("");
    getActiveCategories()
      .then(setCategories)
      .catch((err) => console.error("Erro ao carregar categorias:", err));
  }, [open]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.guardianName.trim() || !form.guardianPhone.trim()) {
      setError("Preencha o nome do aluno, o responsável e o telefone.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const id = await createStudentEnrollment({
        student: { name: form.name.trim(), birth_date: form.birthDate || null },
        guardians: [{ name: form.guardianName.trim(), phone: form.guardianPhone.trim() }],
        enrollment: {
          start_date: form.startDate || getTodayISO(),
          category_id: form.categoryId ? Number(form.categoryId) : null,
        },
      });

      toast("Aluno cadastrado. Complete a ficha e as pendências.", { type: "success" });
      onClose();
      navigate(`/admin/students/${id}`);
    } catch (err) {
      console.error("Erro ao cadastrar aluno:", err);
      setError(errorMessage(err, "Não foi possível cadastrar o aluno."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={saving}
      title="Cadastrar aluno"
      description="Para quem se matriculou sem passar pelos contatos. O resto da ficha fica na página do aluno."
      footer={
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="new-student" disabled={saving}>
            {saving ? "Salvando…" : "Cadastrar aluno"}
          </Button>
        </DialogActions>
      }
    >
      <form id="new-student" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do aluno *" className="sm:col-span-2">
          <input value={form.name} onChange={update("name")} className={inputClass} autoComplete="off" data-autofocus />
        </Field>

        <Field label="Nascimento">
          <input type="date" value={form.birthDate} onChange={update("birthDate")} className={inputClass} />
        </Field>

        <Field label="Categoria">
          <select value={form.categoryId} onChange={update("categoryId")} className={inputClass}>
            <option value="">Escolher</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Responsável *">
          <input value={form.guardianName} onChange={update("guardianName")} className={inputClass} autoComplete="off" />
        </Field>

        <Field label="Telefone (WhatsApp) *">
          <input
            type="tel"
            inputMode="tel"
            value={form.guardianPhone}
            onChange={update("guardianPhone")}
            className={inputClass}
            autoComplete="off"
          />
        </Field>

        <Field label="Início da matrícula">
          <input type="date" value={form.startDate} onChange={update("startDate")} className={inputClass} />
        </Field>

        {error && (
          <p role="alert" className="rounded-lg bg-alert-soft p-3 text-sm text-alert-text sm:col-span-2">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
