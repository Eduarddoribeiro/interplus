import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import SectionTitle from "../components/common/SectionTitle";
import { Button, Panel, inputClass, urgencyRail } from "../ui";

import { getContacts } from "../../services/contacts";
import { errorMessage } from "../../helpers/errorMessage";
import { getDaysSince, getLastActivity, isTriage } from "../../helpers/contactTabs";
import { buildJourney, RECENT_DAYS } from "../../helpers/journey";

/*
 * Jornada das famílias: cada coluna é uma etapa e cada cartão uma
 * família. Só mostra; para mudar de etapa, o cartão abre o contato,
 * onde ficam as ações de sempre (mudar etapa mexe em aulas e retornos,
 * por isso não há arrastar).
 */
export default function Journey() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await getContacts();
      setContacts((data || []).filter((contact) => !contact.archived_at && !isTriage(contact)));
    } catch (err) {
      console.error("Erro ao carregar a jornada:", err);
      setError(errorMessage(err, "Não foi possível carregar as famílias."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Recarrega ao voltar para a aba (sem botão Atualizar)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") load();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const categories = useMemo(
    () =>
      [...new Set(contacts.map((contact) => contact.category?.name).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "pt-BR", { numeric: true }),
      ),
    [contacts],
  );

  const columns = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");

    const visible = contacts.filter((contact) => {
      if (category !== "all" && contact.category?.name !== category) return false;
      if (!term) return true;

      return [contact.child_name, contact.responsible_name]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(term));
    });

    return buildJourney(visible);
  }, [contacts, search, category]);

  const inProgress = columns.filter((column) => !column.recentOnly).reduce((sum, column) => sum + column.items.length, 0);

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Jornada das famílias"
        summary={loading ? "Carregando…" : `${inProgress} famílias em andamento, do primeiro contato à matrícula.`}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sm:w-72">
          <span className="sr-only">Buscar família</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar criança ou responsável"
            className={inputClass}
          />
        </label>

        {categories.length > 1 && (
          <label className="sm:w-48">
            <span className="sr-only">Categoria</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}>
              <option value="all">Todas as categorias</option>
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error && (
        <Panel className="p-5">
          <p role="alert" className="font-medium text-alert-text">
            {error} Confira sua internet e tente de novo.
          </p>
          <Button className="mt-3" onClick={load}>
            Tentar de novo
          </Button>
        </Panel>
      )}

      {!error && (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <ol className="flex snap-x snap-mandatory gap-3 sm:snap-none">
            {columns.map((column) => (
              <JourneyColumn key={column.key} column={column} loading={loading} />
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function JourneyColumn({ column, loading }) {
  const titleId = `jornada-${column.key}`;

  return (
    <li
      aria-labelledby={titleId}
      className="flex w-[82vw] max-w-[18rem] shrink-0 snap-start flex-col rounded-xl border border-line bg-canvas sm:w-64"
    >
      <div className="border-b border-line px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id={titleId} className="font-semibold text-ink">
            {column.label}
          </h2>
          <span className="text-sm tabular-nums text-muted">{loading ? "" : column.items.length}</span>
        </div>
        <p className="text-xs text-muted">{column.hint}</p>
      </div>

      <ul className="flex max-h-[65vh] flex-col gap-2 overflow-y-auto p-2">
        {!loading && column.items.length === 0 && (
          <li className="px-1 py-3 text-sm text-muted">Ninguém nesta etapa.</li>
        )}

        {column.items.map((item) => (
          <JourneyCard key={item.contact.id} item={item} />
        ))}
      </ul>

      {column.recentOnly && (
        <p className="border-t border-line px-3 py-2 text-xs text-muted">
          Só os últimos {RECENT_DAYS} dias.{" "}
          <Link to={column.moreTo} className="underline hover:text-ink">
            Ver todos
          </Link>
        </p>
      )}
    </li>
  );
}

function JourneyCard({ item }) {
  const { contact, waiting } = item;
  const days = getDaysSince(getLastActivity(contact));

  return (
    <li>
      <Link
        to={`/admin/contacts/${contact.id}`}
        className={`block rounded-lg border border-line bg-white px-3 py-2.5 transition-colors hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${urgencyRail(waiting ? "attention" : undefined)}`}
      >
        <span className="block truncate font-semibold text-ink">{contact.child_name || "Sem nome"}</span>
        <span className="block truncate text-sm text-muted">
          {[contact.category?.name, contact.responsible_name].filter(Boolean).join(", ")}
        </span>
        {item.detail && <span className="mt-1 block text-sm text-ink">{item.detail}</span>}
        {days !== null && (
          <span className={`mt-1 block text-xs ${waiting ? "font-medium text-attention-text" : "text-muted"}`}>
            {waiting ? `${waiting}, ` : ""}
            {days === 0 ? "mudou hoje" : `sem mudança há ${days} ${days === 1 ? "dia" : "dias"}`}
          </span>
        )}
      </Link>
    </li>
  );
}
