import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileUp } from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import { Button, Panel, urgencyRail } from "../ui";
import { toast } from "../components/common/Toaster";

import { decodeFile, findContact, findStudent, readSpreadsheet } from "../../helpers/studentImport";
import { createStudentEnrollment, getStudents, guardiansOf } from "../../services/students";
import { findOrCreateEvent } from "../../services/events";
import { enrollContact, getContacts } from "../../services/contacts";
import { getCategories } from "../../services/categories";
import { CONTACT_STATUS_LABEL } from "../../constants/contactStatus";
import { errorMessage } from "../../helpers/errorMessage";
import { BRAND } from "../../constants/brand";

// O que fazer com cada linha
const ACTION = {
  NEW: "new",
  LINK: "link",
  SKIP: "skip",
};

const TACA = "Taça Gaúcha";
const EXPERIENCE = "Experiência Colorada";
const CUP = "Copa Colorado";

/*
 * Importa a planilha de matrículas (CSV exportado do Google
 * Planilhas). Tudo é lido no navegador; nada sai daqui até
 * "Importar". Quem já passou pelo CRM como contato aparece antes,
 * para decidir se liga ao contato.
 */
export default function StudentImport() {
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [records, setRecords] = useState([]);
  const [ignored, setIgnored] = useState([]);
  const [actions, setActions] = useState({});
  const [season, setSeason] = useState(new Date().getFullYear());
  const [inSogni, setInSogni] = useState(true);
  const [withHealth, setWithHealth] = useState(true);
  const [withEvents, setWithEvents] = useState(true);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setReading(true);
      setResult(null);

      const [text, categories, contacts, students] = await Promise.all([
        file.arrayBuffer().then(decodeFile),
        getCategories(),
        getContacts(),
        getStudents(),
      ]);

      const studentRefs = students.map((student) => ({
        ...student,
        guardianPhones: guardiansOf(student).map((guardian) => guardian.phone),
      }));

      const read = readSpreadsheet(text, { categories });

      if (!read.records.length) {
        toast("Não achei linhas nesse arquivo. Confira se é o CSV da planilha de matrículas.");
        return;
      }

      if (!read.records.some((record) => record.student.name)) {
        toast("Não achei a coluna “Nome do Aluno”. Confira se é a planilha de matrículas.");
        return;
      }

      const usedContacts = new Set();
      const enriched = read.records.map((record) => {
        const student = findStudent(record, studentRefs);
        const contact = student ? null : findContact(record, contacts);
        const duplicateContact = contact && usedContacts.has(contact.id);
        if (contact) usedContacts.add(contact.id);

        return { ...record, matchStudent: student, matchContact: duplicateContact ? null : contact };
      });

      setRecords(enriched);
      setIgnored(read.ignored);
      setFileName(file.name);
      setActions(
        Object.fromEntries(
          enriched.map((record) => [
            record.line,
            !record.student.name || record.matchStudent ? ACTION.SKIP : record.matchContact ? ACTION.LINK : ACTION.NEW,
          ]),
        ),
      );
    } catch (err) {
      console.error("Erro ao ler a planilha:", err);
      toast(errorMessage(err, "Não foi possível ler o arquivo."));
    } finally {
      setReading(false);
    }
  }

  const groups = useMemo(
    () => ({
      contact: records.filter((record) => record.matchContact),
      student: records.filter((record) => record.matchStudent),
      issues: records.filter((record) => record.issues.length),
      fresh: records.filter((record) => !record.matchContact && !record.matchStudent),
    }),
    [records],
  );

  const toImport = records.filter((record) => actions[record.line] !== ACTION.SKIP);

  async function prepareEvents() {
    if (!withEvents) return {};

    const needs = {
      taca: toImport.some((record) => record.taca),
      experience: toImport.some((record) => record.events.experience),
      cup: toImport.some((record) => record.events.cup),
    };

    const events = { rounds: {} };

    if (needs.taca) {
      events.taca = await findOrCreateEvent({ name: TACA, season });
      const maxRound = Math.max(0, ...toImport.flatMap((record) => Object.keys(record.taca?.rounds ?? {}).map(Number)));
      for (let round = 1; round <= maxRound; round += 1) {
        events.rounds[round] = await findOrCreateEvent({
          name: `Rodada ${round}`,
          season,
          parent_id: events.taca.id,
          position: round,
        });
      }
    }

    if (needs.experience) events.experience = await findOrCreateEvent({ name: EXPERIENCE, season });
    if (needs.cup) events.cup = await findOrCreateEvent({ name: CUP, season });

    return events;
  }

  function eventsFor(record, events) {
    if (!withEvents) return [];

    const list = [];

    if (record.taca && events.taca) {
      list.push({ event_id: events.taca.id, status: record.taca.entry });
      Object.entries(record.taca.rounds).forEach(([round, status]) => {
        if (events.rounds[round]) list.push({ event_id: events.rounds[round].id, status });
      });
    }

    if (record.events.experience && events.experience) {
      list.push({ event_id: events.experience.id, status: record.events.experience });
    }

    if (record.events.cup && events.cup) list.push({ event_id: events.cup.id, status: record.events.cup });

    return list;
  }

  async function handleImport() {
    const failures = [];
    let imported = 0;

    try {
      setProgress({ done: 0, total: toImport.length });
      const events = await prepareEvents();

      for (const record of toImport) {
        const link = actions[record.line] === ACTION.LINK ? record.matchContact : null;

        try {
          await createStudentEnrollment({
            contact_id: link?.id ?? null,
            student: record.student,
            guardians: record.guardians,
            enrollment: { ...record.enrollment, season },
            tasks: { ...record.tasks, sogni: inSogni ? "done" : "pending" },
            health: withHealth ? record.health : {},
            events: eventsFor(record, events),
          });

          // O contato ligado passa a constar como matriculado
          if (link && link.status !== "enrolled") {
            await enrollContact(link.id, {
              enrolledAt: record.enrollment.start_date,
              notes: "Matrícula importada da planilha.",
            });
          }

          imported += 1;
        } catch (err) {
          console.error(`Erro na linha ${record.line}:`, err);
          failures.push({ line: record.line, name: record.student.name, message: errorMessage(err, "Erro ao gravar.") });
        }

        setProgress((current) => ({ ...current, done: current.done + 1 }));
      }
    } catch (err) {
      console.error("Erro ao preparar os eventos:", err);
      failures.push({ line: "-", name: "Eventos", message: errorMessage(err, "Não foi possível criar os eventos.") });
    } finally {
      setProgress(null);
      setResult({ imported, failures });
      setRecords([]);
    }
  }

  return (
    <div className="space-y-5">
      <Link to="/admin/students" className="inline-flex items-center gap-1.5 rounded text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" />
        Alunos
      </Link>

      <SectionTitle
        title="Importar planilha de matrículas"
        summary="Os alunos que já estão matriculados entram com responsáveis, pendências, saúde e eventos."
      />

      {result && (
        <Panel className="space-y-3 p-5">
          <p role="status" className="font-semibold">
            {result.imported} aluno{result.imported === 1 ? "" : "s"} importado{result.imported === 1 ? "" : "s"}.
            {result.failures.length > 0 && ` ${result.failures.length} com erro.`}
          </p>
          {result.failures.length > 0 && (
            <ul className="space-y-1 text-sm text-alert-text">
              {result.failures.map((failure) => (
                <li key={`${failure.line}-${failure.name}`}>
                  Linha {failure.line}, {failure.name}: {failure.message}
                </li>
              ))}
            </ul>
          )}
          <Button to="/admin/students" variant="primary">
            Ver alunos
          </Button>
        </Panel>
      )}

      {records.length === 0 && !result && (
        <Panel className="space-y-4 p-5">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>
              No Google Planilhas, abra a planilha de matrículas e use{" "}
              <strong>Arquivo, Fazer download, Valores separados por vírgula (.csv)</strong>.
            </li>
            <li>Escolha o arquivo abaixo. Nada é gravado antes de você conferir e clicar em Importar.</li>
            <li>Depois de importar, apague o CSV do computador: ele tem CPF e dados de saúde.</li>
          </ol>

          <label className={`inline-flex cursor-pointer ${reading ? "pointer-events-none opacity-50" : ""}`}>
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="sr-only" />
            <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-inter-red px-4 text-sm font-semibold text-white hover:bg-inter-red-dark touch:h-11">
              <FileUp size={18} aria-hidden="true" />
              {reading ? "Lendo…" : "Escolher arquivo CSV"}
            </span>
          </label>
        </Panel>
      )}

      {records.length > 0 && (
        <>
          <Panel className="space-y-4 p-5">
            <p className="text-sm">
              <strong>{fileName}</strong>: {records.length} linhas. {groups.fresh.length} novos,{" "}
              {groups.contact.length} já passaram pelo CRM como contato, {groups.student.length} já importados.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                Temporada
                <input
                  type="number"
                  value={season}
                  onChange={(event) => setSeason(Number(event.target.value))}
                  className="h-9 w-24 rounded-lg border border-line px-2"
                />
              </label>
              <Check checked={inSogni} onChange={setInSogni}>
                Todos já estão cadastrados no {BRAND.financeSystem}
              </Check>
              <Check checked={withHealth} onChange={setWithHealth}>
                Importar os dados de saúde
              </Check>
              <Check checked={withEvents} onChange={setWithEvents}>
                Criar {TACA} {season} (inscrição e rodadas), {EXPERIENCE} e {CUP}
              </Check>
            </div>

            <ul className="space-y-1 text-sm text-muted">
              <li>Colunas de pagamento com “—” ou vazias entram como “Não se aplica”. Contrato vazio entra como pendente.</li>
              <li>Quem está com “Ativo: Não” entra como aluno que saiu.</li>
              {ignored.length > 0 && <li>Colunas que não entram: {ignored.join(", ")}.</li>}
            </ul>
          </Panel>

          {groups.contact.length > 0 && (
            <section aria-labelledby="ja-contatos" className="space-y-2">
              <h2 id="ja-contatos" className="font-display text-2xl font-semibold">
                Já passaram pelo CRM ({groups.contact.length})
              </h2>
              <p className="text-sm text-muted">
                Mesmo telefone e primeiro nome, ou mesmo nome e nascimento. Ligar ao contato mantém o histórico da
                experimental e marca o contato como matriculado.
              </p>
              <Panel as="ul" className="overflow-hidden">
                {groups.contact.map((record) => (
                  <MatchRow
                    key={record.line}
                    record={record}
                    action={actions[record.line]}
                    onAction={(value) => setActions((current) => ({ ...current, [record.line]: value }))}
                    options={[
                      [ACTION.LINK, "Ligar ao contato"],
                      [ACTION.NEW, "Importar sem ligar"],
                      [ACTION.SKIP, "Não importar"],
                    ]}
                  >
                    Contato{" "}
                    <Link
                      to={`/admin/contacts/${record.matchContact.id}`}
                      target="_blank"
                      className="underline underline-offset-4 hover:text-ink"
                    >
                      {record.matchContact.child_name}
                    </Link>
                    , {CONTACT_STATUS_LABEL[record.matchContact.status] ?? record.matchContact.status}
                  </MatchRow>
                ))}
              </Panel>
            </section>
          )}

          {groups.student.length > 0 && (
            <section aria-labelledby="ja-alunos" className="space-y-2">
              <h2 id="ja-alunos" className="font-display text-2xl font-semibold">
                Já importados ({groups.student.length})
              </h2>
              <Panel as="ul" className="overflow-hidden">
                {groups.student.map((record) => (
                  <MatchRow
                    key={record.line}
                    record={record}
                    action={actions[record.line]}
                    onAction={(value) => setActions((current) => ({ ...current, [record.line]: value }))}
                    options={[
                      [ACTION.SKIP, "Não importar"],
                      [ACTION.NEW, "Importar de novo"],
                    ]}
                  >
                    Já é o aluno{" "}
                    <Link
                      to={`/admin/students/${record.matchStudent.id}`}
                      target="_blank"
                      className="underline underline-offset-4 hover:text-ink"
                    >
                      {record.matchStudent.name}
                    </Link>
                  </MatchRow>
                ))}
              </Panel>
            </section>
          )}

          {groups.issues.length > 0 && (
            <section aria-labelledby="avisos" className="space-y-2">
              <h2 id="avisos" className="font-display text-2xl font-semibold">
                Avisos ({groups.issues.length})
              </h2>
              <Panel as="ul" className="divide-y divide-line text-sm">
                {groups.issues.map((record) => (
                  <li key={record.line} className="px-4 py-2">
                    Linha {record.line}, {record.student.name || "sem nome"}: {record.issues.join("; ")}
                  </li>
                ))}
              </Panel>
            </section>
          )}

          <details className="rounded-xl border border-line bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              Ver os {groups.fresh.length} alunos novos
            </summary>
            <ul className="divide-y divide-line border-t border-line text-sm">
              {groups.fresh.map((record) => (
                <li key={record.line} className="flex justify-between gap-3 px-4 py-2">
                  <span>
                    {record.student.name || "Sem nome"}
                    {!record.active && <span className="text-muted"> (saiu)</span>}
                  </span>
                  <span className="text-muted">{record.category}</span>
                </li>
              ))}
            </ul>
          </details>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={handleImport} disabled={Boolean(progress) || toImport.length === 0}>
              {progress
                ? `Importando ${progress.done} de ${progress.total}…`
                : `Importar ${toImport.length} aluno${toImport.length === 1 ? "" : "s"}`}
            </Button>
            <Button variant="quiet" onClick={() => setRecords([])} disabled={Boolean(progress)}>
              Escolher outro arquivo
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Check({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-ink" />
      {children}
    </label>
  );
}

function MatchRow({ record, action, onAction, options, children }) {
  return (
    <li
      className={`flex flex-col gap-2 border-t border-line px-4 py-3 first:border-t-0 sm:flex-row sm:items-center ${urgencyRail(
        action === ACTION.SKIP ? null : "attention",
      )}`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {record.student.name} <span className="font-normal text-muted">(linha {record.line})</span>
        </p>
        <p className="text-sm text-muted">{children}</p>
      </div>
      <select
        aria-label={`O que fazer com ${record.student.name}`}
        value={action}
        onChange={(event) => onAction(event.target.value)}
        className="h-9 rounded-lg border border-line bg-white px-2 text-sm touch:h-11"
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </li>
  );
}
