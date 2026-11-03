import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import { Button, Panel, Tabs, urgencyRail } from "../ui";

import { getFamilyForms } from "../../services/enrollmentForms";
import { currentEnrollment } from "../../services/students";
import { familyFormGroups } from "../../helpers/familyForms";
import { errorMessage } from "../../helpers/errorMessage";

const TABS = [
  { value: "conferir", label: "Para conferir", urgency: "attention" },
  { value: "vencido", label: "Link vencido", urgency: "attention" },
  { value: "aguardando", label: "Aguardando a família" },
  { value: "conferida", label: "Conferidas" },
];

const EMPTY = {
  conferir: "Nenhuma ficha para conferir.",
  vencido: "Nenhum link vencido.",
  aguardando: "Nenhum link aguardando a família.",
  conferida: "Nenhuma ficha conferida ainda.",
};

const formatDate = (iso) => new Date(iso).toLocaleDateString("pt-BR");
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// O que cada linha diz, conforme o grupo
function rowText(group, invite) {
  if (group === "conferir") return `preenchida em ${formatDate(invite.used_at)}`;
  if (group === "vencido") return `enviado em ${formatDate(invite.created_at)}, venceu em ${formatDate(invite.expires_at)}`;
  if (group === "aguardando") return `enviado em ${formatDate(invite.created_at)}, vale até ${formatDate(invite.expires_at)}`;
  return `preenchida em ${formatDate(invite.used_at)}, conferida em ${formatDate(invite.reviewed_at)}`;
}

/*
 * Fichas da família: os links de matrícula enviados, separados em
 * para conferir, vencidos, aguardando e conferidas. Cada linha abre
 * a ficha do aluno, onde se confere, marca ou envia de novo.
 */
export default function FamilyForms() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(() =>
    TABS.some((item) => item.value === searchParams.get("aba")) ? searchParams.get("aba") : "conferir",
  );

  useEffect(() => {
    setSearchParams(tab === "conferir" ? {} : { aba: tab }, { replace: true });
  }, [tab, setSearchParams]);

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
      setStudents(await getFamilyForms());
    } catch (err) {
      console.error("Erro ao carregar as fichas:", err);
      setError(errorMessage(err, "Não foi possível carregar as fichas."));
    } finally {
      setLoading(false);
    }
  }

  const groups = useMemo(() => familyFormGroups(students), [students]);

  // Conferidas: as mais recentes primeiro; o resto pela data que importa
  const rows = useMemo(() => {
    const sortKey = { conferir: "used_at", vencido: "expires_at", aguardando: "expires_at", conferida: "reviewed_at" }[tab];
    const list = [...groups[tab]].sort((a, b) => a.invite[sortKey].localeCompare(b.invite[sortKey]));
    return tab === "conferida" ? list.reverse() : list;
  }, [groups, tab]);

  return (
    <div className="space-y-5">
      <Link to="/admin/students" className="inline-flex items-center gap-1.5 rounded text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" />
        Alunos
      </Link>

      <SectionTitle
        title="Fichas da família"
        summary={
          loading
            ? ""
            : `${groups.conferir.length} para conferir, ${groups.vencido.length} com link vencido, ${groups.aguardando.length} aguardando a família.`
        }
      />

      <Tabs
        label="Situação das fichas"
        value={tab}
        onChange={setTab}
        items={TABS.map((item) => ({
          ...item,
          count: groups[item.value].length,
          urgency: groups[item.value].length ? item.urgency : undefined,
        }))}
      />

      {loading && students.length === 0 ? (
        <p role="status" className="py-12 text-center text-muted">
          Carregando fichas…
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
          <p className="font-semibold">{EMPTY[tab]}</p>
          {tab === "conferir" && (
            <p className="mt-1 text-sm text-muted">O link da ficha se envia pela ficha de cada aluno, em "Ficha pela família".</p>
          )}
        </Panel>
      ) : (
        <Panel as="ul" className="overflow-hidden">
          {rows.map(({ student, invite }) => (
            <li key={student.id} className={`border-t border-line first:border-t-0 ${urgencyRail(TABS.find((item) => item.value === tab).urgency)}`}>
              <Link to={`/admin/students/${student.id}`} className="group flex items-center gap-3 px-4 py-3 hover:bg-canvas">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{student.name}</span>
                  <span className="block text-sm text-muted">
                    {capitalize([currentEnrollment(student)?.categories?.name, rowText(tab, invite)].filter(Boolean).join(", "))}
                  </span>
                </span>
                <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-neutral-300 group-hover:text-ink" />
              </Link>
            </li>
          ))}
        </Panel>
      )}
    </div>
  );
}
