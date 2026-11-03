import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import { Button, Panel } from "../ui";

import { currentEnrollment, getStudents, updateStudent } from "../../services/students";
import { isGoalkeeperNumber, nextShirtNumber, shirtConflict } from "../../helpers/shirtNumbers";
import { errorMessage } from "../../helpers/errorMessage";

const fieldClass =
  "h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none placeholder:text-neutral-500 focus:border-ink";

const normalize = (text = "") =>
  String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/*
 * Números de camisa de todos os alunos ativos numa tela só, para
 * digitar em sequência. Salva ao sair do campo (ou Enter).
 */
export default function ShirtNumbers() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [sort, setSort] = useState("nome");

  useEffect(() => {
    load();

    function handleVisibility() {
      if (document.visibilityState === "visible") load();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  async function load() {
    try {
      setError("");
      setStudents(await getStudents());
    } catch (err) {
      console.error("Erro ao carregar alunos:", err);
      setError(errorMessage(err, "Não foi possível carregar os alunos."));
    } finally {
      setLoading(false);
    }
  }

  // Salva e já atualiza a lista, sem recarregar tudo
  async function save(student, values) {
    await updateStudent(student.id, values);
    setStudents((current) => current.map((item) => (item.id === student.id ? { ...item, ...values } : item)));
  }

  const active = useMemo(
    () =>
      students
        .filter((student) => student.status === "active")
        .map((student) => ({ student, categoryName: currentEnrollment(student)?.categories?.name ?? "" })),
    [students],
  );

  const categories = useMemo(
    () => [...new Set(active.map((row) => row.categoryName).filter(Boolean))].sort(),
    [active],
  );

  const rows = useMemo(() => {
    const term = normalize(search.trim());

    return active
      .filter((row) => category === "all" || row.categoryName === category)
      .filter((row) => !onlyMissing || !row.student.shirt_number)
      .filter((row) => !term || normalize(row.student.name).includes(term) || String(row.student.shirt_number ?? "") === term)
      .sort((a, b) =>
        sort === "numero"
          ? (a.student.shirt_number ?? Infinity) - (b.student.shirt_number ?? Infinity) ||
            a.student.name.localeCompare(b.student.name, "pt-BR")
          : a.student.name.localeCompare(b.student.name, "pt-BR"),
      );
  }, [active, category, onlyMissing, search, sort]);

  const missing = active.filter((row) => !row.student.shirt_number).length;

  return (
    <div className="space-y-5">
      <Link to="/admin/students" className="inline-flex items-center gap-1.5 rounded text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" />
        Alunos
      </Link>

      <SectionTitle
        title="Números de camisa"
        summary={
          loading
            ? ""
            : `${missing ? `${missing} de ${active.length} ativos sem número.` : "Todos os ativos têm número."} Próximo de linha: ${nextShirtNumber(students, false)}. Próximo de goleiro: ${nextShirtNumber(students, true)}.`
        }
      />

      <p className="max-w-2xl text-sm text-muted">
        Linha recebe o próximo número em ordem. Goleiro usa 1, 12, 23, 34… (de 11 em 11). Um número não se repete, nem
        com quem já saiu da escola.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative flex-1 sm:min-w-[16rem]">
          <span className="sr-only">Buscar aluno ou número</span>
          <Search size={17} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar aluno ou número"
            className={`${fieldClass} w-full pl-10`}
          />
        </label>

        <select aria-label="Categoria" value={category} onChange={(event) => setCategory(event.target.value)} className={fieldClass}>
          <option value="all">Todas as categorias</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select aria-label="Ordenar" value={sort} onChange={(event) => setSort(event.target.value)} className={fieldClass}>
          <option value="nome">Ordenar por nome</option>
          <option value="numero">Ordenar por número</option>
        </select>

        <label className="inline-flex h-10 items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyMissing} onChange={(event) => setOnlyMissing(event.target.checked)} className="h-4 w-4 accent-ink" />
          Só sem número
        </label>
      </div>

      {loading && students.length === 0 ? (
        <p role="status" className="py-12 text-center text-muted">
          Carregando alunos…
        </p>
      ) : error ? (
        <Panel className="p-5">
          <p role="alert" className="font-medium text-alert-text">
            {error}
          </p>
          <Button className="mt-3" onClick={load}>
            Tentar de novo
          </Button>
        </Panel>
      ) : rows.length === 0 ? (
        <Panel className="px-6 py-10 text-center">
          <p className="font-semibold">{onlyMissing && !search ? "Todos têm número." : "Nenhum aluno encontrado."}</p>
        </Panel>
      ) : (
        <Panel as="ul" className="overflow-hidden">
          {rows.map((row) => (
            <ShirtRow key={row.student.id} row={row} students={students} onSave={save} />
          ))}
        </Panel>
      )}
    </div>
  );
}

function ShirtRow({ row, students, onSave }) {
  const { student, categoryName } = row;
  const [value, setValue] = useState(student.shirt_number ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => setValue(student.shirt_number ?? ""), [student.shirt_number]);

  async function saveNumber(raw) {
    const number = raw === "" ? null : Number(raw);
    setNotice("");
    if (number === (student.shirt_number ?? null)) return setMessage("");

    if (number != null && (!Number.isInteger(number) || number < 1 || number > 999)) {
      return setMessage("Use um número de 1 a 999.");
    }

    const conflict = number != null ? shirtConflict(students, number, student.id) : "";
    if (conflict) return setMessage(conflict);

    try {
      setSaving(true);
      await onSave(student, { shirt_number: number });
      setMessage("");
      setNotice(number != null && isGoalkeeperNumber(number) !== student.goalkeeper ? mismatch(student.goalkeeper) : "");
    } catch (err) {
      console.error("Erro ao salvar número:", err);
      setMessage(err?.code === "23505" ? "Esse número já é de outro aluno." : errorMessage(err, "Não foi possível salvar."));
    } finally {
      setSaving(false);
    }
  }

  async function toggleGoalkeeper() {
    try {
      setSaving(true);
      await onSave(student, { goalkeeper: !student.goalkeeper });
      setMessage("");
      setNotice("");
    } catch (err) {
      setMessage(errorMessage(err, "Não foi possível salvar."));
    } finally {
      setSaving(false);
    }
  }

  const inputId = `camisa-${student.id}`;

  return (
    <li className="border-t border-line px-4 py-3 first:border-t-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-48">
          <Link to={`/admin/students/${student.id}`} className="block truncate font-semibold hover:underline">
            {student.name}
          </Link>
          <span className="block text-sm text-muted">{categoryName || "Sem categoria"}</span>
        </div>

        <Button
          size="sm"
          onClick={toggleGoalkeeper}
          disabled={saving}
          aria-pressed={student.goalkeeper}
          className={student.goalkeeper ? "!border-ink !bg-ink !text-white" : ""}
        >
          Goleiro
        </Button>

        <div className="flex items-center gap-2">
          <label htmlFor={inputId} className="text-sm text-muted">
            Nº
          </label>
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={3}
            value={value}
            disabled={saving}
            onChange={(event) => setValue(event.target.value.replace(/\D/g, ""))}
            onBlur={(event) => saveNumber(event.target.value.trim())}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            aria-describedby={message ? `${inputId}-msg` : undefined}
            className={`${fieldClass} w-20 tabular-nums`}
          />
          {!student.shirt_number && (
            <Button size="sm" variant="quiet" disabled={saving} onClick={() => saveNumber(String(nextShirtNumber(students, student.goalkeeper)))}>
              Dar o {nextShirtNumber(students, student.goalkeeper)}
            </Button>
          )}
        </div>
      </div>

      {message && (
        <p id={`${inputId}-msg`} role="alert" className="mt-1.5 text-sm text-alert-text">
          {message}
        </p>
      )}
      {notice && !message && <p className="mt-1.5 text-sm text-muted">{notice}</p>}
    </li>
  );
}

function mismatch(goalkeeper) {
  return goalkeeper
    ? "Salvo. Esse não é um número de goleiro (1, 12, 23…)."
    : "Salvo. Esse é um número de goleiro (1, 12, 23…), e o aluno não está marcado como goleiro.";
}
