import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";

import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  UserCheck,
} from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";

import {
  addToWaitingList,
  archiveContacts,
  closeOpportunity,
  getContacts,
  promoteToLead,
  restoreContacts,
} from "../../services/contacts";

import { CONTACT_STATUS_LABEL } from "../../constants/contactStatus";
import {
  STALE_DAYS,
  WHATSAPP_AUTO_STATUS,
  getContactTab as getTab,
  getDaysSince,
  getLastActivity,
  isBlank,
  isStale,
} from "../../helpers/contactTabs";
import { ARCHIVE_REASON, ARCHIVE_REASON_LABEL } from "../../constants/archiveReasons";
import { LOST_REASON } from "../../constants/lostReasons";
import { getSourceLabel as sourceLabel } from "../../constants/school";
import { createWhatsAppUrl, normalizePhone } from "../../helpers/contactPresentation";

const ITEMS_PER_PAGE = 30;

const STATUS_BADGE = {
  new: "bg-neutral-100 text-neutral-500",
  new_contact: "bg-neutral-100 text-neutral-700",
  pending_confirmation: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  attended: "bg-green-50 text-green-700",
  no_show: "bg-red-50 text-red-700",
  follow_up: "bg-orange-50 text-orange-700",
  waiting_list: "bg-purple-50 text-purple-700",
  enrolled: "bg-emerald-50 text-emerald-700",
  lost: "bg-neutral-100 text-neutral-600",
  cancelled: "bg-neutral-100 text-neutral-600",
};

/* =========================================================
 * REGRAS
 * =======================================================*/

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function formatDaysAgo(days) {
  if (days === null) return "—";
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";

  return `há ${days} dias`;
}

const TABS = [
  { value: "active", label: "Em andamento" },
  { value: "triage", label: "Triagem" },
  { value: "waiting", label: "Lista de interesse" },
  { value: "enrolled", label: "Matriculados" },
  { value: "closed", label: "Encerrados" },
  { value: "archived", label: "Arquivados" },
  { value: "all", label: "Todos" },
];

/* =========================================================
 * PÁGINA
 * =======================================================*/

export default function Contacts() {
  const navigate = useNavigate();
  const { openNewContact, contactsVersion } = useOutletContext() ?? {};

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() =>
    TABS.some((item) => item.value === searchParams.get("aba"))
      ? searchParams.get("aba")
      : "active",
  );
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [staleOnly, setStaleOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(() => new Set());
  const [bulk, setBulk] = useState(null); // { done, total, label }
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadContacts();
  }, [contactsVersion]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [tab, search, categoryFilter, sourceFilter, staleOnly]);

  async function loadContacts() {
    try {
      setLoading(true);
      setError("");

      setContacts(await getContacts());
    } catch (err) {
      console.error("Erro ao carregar contatos:", err);
      setError("Não foi possível carregar os contatos.");
    } finally {
      setLoading(false);
    }
  }

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 6000);
  }

  /* =========================================================
   * DERIVADOS
   * =======================================================*/

  const tabCounts = useMemo(() => {
    const counts = { all: 0 };

    contacts.forEach((contact) => {
      const key = getTab(contact);
      counts[key] = (counts[key] ?? 0) + 1;
      if (key !== "archived") counts.all += 1;
    });

    return counts;
  }, [contacts]);

  // Telefones repetidos entre contatos não arquivados
  const duplicatePhones = useMemo(() => {
    const counts = new Map();

    contacts.forEach((contact) => {
      if (contact.archived_at) return;

      const phone = normalizePhone(contact.phone).slice(-11);
      if (phone.length < 10) return;

      counts.set(phone, (counts.get(phone) ?? 0) + 1);
    });

    return new Set([...counts].filter(([, count]) => count > 1).map(([phone]) => phone));
  }, [contacts]);

  const categories = useMemo(
    () =>
      [...new Set(contacts.map((contact) => contact.category?.name).filter(Boolean))].sort(),
    [contacts],
  );

  const sources = useMemo(
    () => [...new Set(contacts.map((contact) => contact.source).filter(Boolean))].sort(),
    [contacts],
  );

  const staleCount = useMemo(() => contacts.filter(isStale).length, [contacts]);

  const filtered = useMemo(() => {
    const term = normalizeText(search.trim());

    return contacts
      .filter((contact) => {
        const contactTab = getTab(contact);

        if (tab === "all" ? contactTab === "archived" : contactTab !== tab) return false;
        if (staleOnly && tab === "active" && !isStale(contact)) return false;
        if (categoryFilter !== "all" && contact.category?.name !== categoryFilter) return false;
        if (sourceFilter !== "all" && contact.source !== sourceFilter) return false;

        if (!term) return true;

        return normalizeText(
          [
            contact.child_name,
            contact.responsible_name,
            contact.whatsapp_push_name,
            contact.phone,
            contact.category?.name,
          ].join(" "),
        ).includes(term);
      })
      .sort(
        (a, b) =>
          new Date(getLastActivity(b) || 0).getTime() -
          new Date(getLastActivity(a) || 0).getTime(),
      );
  }, [contacts, tab, staleOnly, categoryFilter, sourceFilter, search]);

  const totalPages = Math.max(Math.ceil(filtered.length / ITEMS_PER_PAGE), 1);
  const pageItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((contact) => selected.has(contact.id));

  /* =========================================================
   * SELEÇÃO
   * =======================================================*/

  function toggle(id) {
    setSelected((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((c) => c.id)));
  }

  /* =========================================================
   * AÇÕES EM LOTE
   * =======================================================*/

  async function runBulk(label, action) {
    const ids = [...selected];
    if (!ids.length) return;

    setBulk({ done: 0, total: ids.length, label });

    try {
      await action(ids, (done) => setBulk({ done, total: ids.length, label }));
      showNotice(`${label}: ${ids.length} contato${ids.length === 1 ? "" : "s"}.`);
    } catch (err) {
      console.error(`Erro em "${label}":`, err);
      showNotice(err?.message || `Não foi possível concluir: ${label}.`);
    } finally {
      setBulk(null);
      setSelected(new Set());
      await loadContacts();
    }
  }

  // Ações que mudam o funil de um contato por vez (cada uma tem regras próprias)
  async function oneByOne(ids, onProgress, fn) {
    for (let index = 0; index < ids.length; index += 1) {
      await fn(ids[index]);
      onProgress(index + 1);
    }
  }

  function archiveSelected(reason) {
    return runBulk(`Arquivado como "${ARCHIVE_REASON_LABEL[reason]}"`, (ids) =>
      archiveContacts(ids, reason),
    );
  }

  function restoreSelected() {
    return runBulk("Restaurado", (ids) => restoreContacts(ids));
  }

  function closeSelectedNoResponse() {
    return runBulk('Encerrado como "família não respondeu"', (ids, onProgress) =>
      oneByOne(ids, onProgress, (id) =>
        closeOpportunity(id, {
          lostReason: LOST_REASON.NO_RESPONSE,
          notes: `Encerrado em lote: sem atividade há ${STALE_DAYS}+ dias.`,
        }),
      ),
    );
  }

  function moveSelectedToWaitingList() {
    return runBulk("Movido para a lista de interesse", (ids, onProgress) =>
      oneByOne(ids, onProgress, (id) =>
        addToWaitingList(id, {
          reason: "future_interest",
          notes: "Movido em lote: lead parado, manter para avisar quando abrir vaga.",
        }),
      ),
    );
  }

  async function handlePromote(contact) {
    try {
      await promoteToLead(contact.id);
      navigate(`/admin/contacts/${contact.id}`);
    } catch (err) {
      console.error("Erro ao marcar como lead:", err);
      showNotice("Não foi possível marcar como lead.");
    }
  }

  async function handleArchiveOne(contact, reason) {
    try {
      await archiveContacts([contact.id], reason);
      setContacts((current) =>
        current.map((item) =>
          item.id === contact.id
            ? { ...item, archived_at: new Date().toISOString(), archive_reason: reason }
            : item,
        ),
      );
    } catch (err) {
      console.error("Erro ao arquivar:", err);
      showNotice("Não foi possível arquivar.");
    }
  }

  /* =========================================================
   * RENDER
   * =======================================================*/

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle
          title="Contatos"
          description="Oportunidades da escola. Pais de alunos e contatos que não são leads ficam arquivados."
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadContacts}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>

          {openNewContact && (
            <button
              type="button"
              onClick={openNewContact}
              className="flex items-center gap-2 rounded-xl bg-inter-red px-5 py-3 text-sm font-semibold text-white hover:bg-[#a80e24]"
            >
              <Plus size={18} />
              Novo contato
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white">
          {notice}
        </div>
      )}

      {/* ABAS */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-white p-2">
        {TABS.map((item) => {
          const count = tabCounts[item.value] ?? 0;
          const active = tab === item.value;

          if (item.value === "triage" && !count && !active) return null;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? item.value === "triage"
                    ? "bg-amber-500 text-white"
                    : "bg-neutral-900 text-white"
                  : item.value === "triage"
                    ? "text-amber-700 hover:bg-amber-50"
                    : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {item.label}
              <span
                className={`rounded-md px-1.5 text-xs ${
                  active ? "bg-white/20" : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "triage" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Contatos que entraram sozinhos pelo WhatsApp ou foram cadastrados sem o nome do
          atleta. Decida se cada um é lead; pais de alunos atuais vão para{" "}
          <strong>Já é aluno</strong> (não contam como matrícula). Dá para marcar vários e
          arquivar de uma vez.
        </div>
      )}

      {/* BUSCA + FILTROS */}
      <div className="flex flex-col gap-3 lg:flex-row">
        <label className="relative flex-1">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar atleta, responsável, nome no WhatsApp ou telefone"
            className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-inter-red"
          />
        </label>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
        >
          <option value="all">Todas as categorias</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
        >
          <option value="all">Todas as origens</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {sourceLabel(source)}
            </option>
          ))}
        </select>
      </div>

      {tab === "active" && staleCount > 0 && (
        <button
          type="button"
          onClick={() => setStaleOnly((current) => !current)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${
            staleOnly
              ? "border-orange-500 bg-orange-500 text-white"
              : "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100"
          }`}
        >
          <Clock3 size={16} />
          Parados há {STALE_DAYS}+ dias ({staleCount})
        </button>
      )}

      {/* BARRA DE LOTE */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-col gap-3 rounded-2xl border border-neutral-900 bg-neutral-900 p-3 text-white sm:flex-row sm:items-center">
          <p className="px-2 text-sm font-semibold">
            {bulk
              ? `${bulk.label}… ${bulk.done}/${bulk.total}`
              : `${selected.size} selecionado${selected.size === 1 ? "" : "s"}`}
          </p>

          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {bulk ? (
              <Loader2 size={18} className="animate-spin" />
            ) : tab === "archived" ? (
              <BulkButton onClick={restoreSelected} icon={RotateCcw}>
                Restaurar
              </BulkButton>
            ) : (
              <>
                {tab === "active" && (
                  <>
                    <BulkButton onClick={closeSelectedNoResponse}>
                      Encerrar: família não respondeu
                    </BulkButton>

                    <BulkButton onClick={moveSelectedToWaitingList}>
                      Mover para lista de interesse
                    </BulkButton>
                  </>
                )}

                <BulkButton
                  onClick={() => archiveSelected(ARCHIVE_REASON.CURRENT_STUDENT)}
                  icon={Archive}
                >
                  Já é aluno
                </BulkButton>

                <BulkButton
                  onClick={() => archiveSelected(ARCHIVE_REASON.NOT_LEAD)}
                  icon={Archive}
                >
                  Não é lead
                </BulkButton>

                <BulkButton
                  onClick={() => archiveSelected(ARCHIVE_REASON.DUPLICATE)}
                  icon={Copy}
                >
                  Duplicado
                </BulkButton>
              </>
            )}
          </div>
        </div>
      )}

      {/* LISTA */}
      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center text-neutral-500">
          Carregando contatos...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={loadContacts}
            className="mt-2 text-sm font-semibold text-red-700 underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center text-neutral-500">
          {tab === "triage" ? "Triagem concluída 🎉" : "Nenhum contato encontrado."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-neutral-500">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleAllFiltered}
              className="h-4 w-4 accent-red-600"
              aria-label="Selecionar todos"
            />
            <span>
              {allFilteredSelected
                ? `Todos os ${filtered.length} selecionados`
                : `${filtered.length} contato${filtered.length === 1 ? "" : "s"} · selecionar todos`}
            </span>
          </div>

          {pageItems.map((contact) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              tab={tab}
              checked={selected.has(contact.id)}
              duplicate={duplicatePhones.has(normalizePhone(contact.phone).slice(-11))}
              onToggle={() => toggle(contact.id)}
              onOpen={() => navigate(`/admin/contacts/${contact.id}`)}
              onPromote={() => handlePromote(contact)}
              onArchive={(reason) => handleArchiveOne(contact, reason)}
            />
          ))}
        </div>
      )}

      {/* PAGINAÇÃO */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
            className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          <span className="text-sm text-neutral-500">
            Página {page} de {totalPages}
          </span>

          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            Próxima
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
 * COMPONENTES
 * =======================================================*/

function BulkButton({ onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20"
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

function ContactRow({
  contact,
  tab,
  checked,
  duplicate,
  onToggle,
  onOpen,
  onPromote,
  onArchive,
}) {
  const whatsappUrl = createWhatsAppUrl(contact.phone);
  const days = getDaysSince(getLastActivity(contact));
  const stale = isStale(contact);
  const isAuto = contact.status === WHATSAPP_AUTO_STATUS;

  const title = isBlank(contact.child_name)
    ? contact.whatsapp_push_name || contact.responsible_name || "Sem nome"
    : contact.child_name;

  return (
    <div
      className={`flex flex-col gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0 lg:flex-row lg:items-center ${
        checked ? "bg-red-50/40" : ""
      }`}
    >
      <div className="flex min-w-0 items-start gap-3 lg:w-72">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-1 h-4 w-4 shrink-0 accent-red-600"
          aria-label={`Selecionar ${title}`}
        />

        <button type="button" onClick={onOpen} className="min-w-0 text-left">
          <p className="truncate font-semibold text-neutral-900 hover:underline">
            {title}
          </p>

          <p className="truncate text-xs text-neutral-500">
            {isBlank(contact.child_name)
              ? `${isAuto ? "Nome no WhatsApp" : "Atleta sem nome"} · ${contact.phone || "sem telefone"}`
              : `${contact.responsible_name || "Responsável não informado"} · ${contact.phone || "sem telefone"}`}
          </p>
        </button>
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-1.5 text-xs">
        <span
          className={`rounded-md px-2 py-1 font-semibold ${
            STATUS_BADGE[contact.status] ?? "bg-neutral-100 text-neutral-600"
          }`}
        >
          {isAuto ? "WhatsApp (triagem)" : CONTACT_STATUS_LABEL[contact.status] ?? contact.status}
        </span>

        {contact.category?.name && (
          <span className="rounded-md bg-red-50 px-2 py-1 font-semibold text-red-700">
            {contact.category.name}
          </span>
        )}

        {contact.location?.name && (
          <span className="rounded-md bg-neutral-100 px-2 py-1 font-medium text-neutral-700">
            {contact.location.name}
          </span>
        )}

        {contact.source && !isAuto && (
          <span className="px-1 text-neutral-500">{sourceLabel(contact.source)}</span>
        )}

        {duplicate && (
          <span className="rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-800">
            Telefone repetido
          </span>
        )}

        {contact.archived_at && (
          <span className="rounded-md bg-neutral-200 px-2 py-1 font-semibold text-neutral-700">
            Arquivado: {ARCHIVE_REASON_LABEL[contact.archive_reason] ?? "—"}
          </span>
        )}
      </div>

      <p
        className={`text-xs lg:w-32 lg:text-right ${
          stale ? "font-semibold text-orange-700" : "text-neutral-500"
        }`}
      >
        {formatDaysAgo(days)}
      </p>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        {tab === "triage" && (
          <>
            <button
              type="button"
              onClick={onPromote}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
            >
              <UserCheck size={14} />
              É lead
            </button>

            <button
              type="button"
              onClick={() => onArchive(ARCHIVE_REASON.CURRENT_STUDENT)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Já é aluno
            </button>

            <button
              type="button"
              onClick={() => onArchive(ARCHIVE_REASON.NOT_LEAD)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Não é lead
            </button>
          </>
        )}

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir WhatsApp"
            className="flex items-center rounded-lg border border-green-200 bg-green-50 px-2.5 py-2 text-green-800 hover:bg-green-100"
          >
            <MessageCircle size={15} />
          </a>
        )}
      </div>
    </div>
  );
}
