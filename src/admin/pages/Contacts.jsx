import { useEffect, useMemo, useRef, useState } from "react";
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
  RotateCcw,
  Search,
  UserCheck,
} from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import { Button, Count, Dialog, DialogActions, Panel, Tabs, urgencyRail } from "../ui";
import { toast } from "../components/common/Toaster";
import { formatPhone } from "../../helpers/phoneHelpers";

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

// 20 por página: menos de duas telas de rolagem no notebook
const ITEMS_PER_PAGE = 20;


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
  const listTopRef = useRef(null);

  const [selected, setSelected] = useState(() => new Set());
  const [bulk, setBulk] = useState(null); // { done, total, label }
  const [confirming, setConfirming] = useState(null); // { title, description, confirmLabel, run }

  useEffect(() => {
    loadContacts();
  }, [contactsVersion]);

  // Recarrega ao voltar para a aba do navegador (sem botão Atualizar)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") loadContacts();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

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

  const plural = (count) => `${count} contato${count === 1 ? "" : "s"}`;

  // Ações em lote que mexem no funil pedem confirmação com a quantidade
  function confirmBulk({ title, description, confirmLabel, run }) {
    setConfirming({ title, description, confirmLabel, run });
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

  /*
   * Possíveis duplicados: mesmo telefone E mesma criança (primeiro
   * nome igual, ou um dos dois sem nome, como os que entram pelo
   * WhatsApp). Irmãos com o mesmo responsável não são marcados.
   */
  const duplicateIds = useMemo(() => {
    const byPhone = new Map();

    contacts.forEach((contact) => {
      if (contact.archived_at) return;

      const phone = normalizePhone(contact.phone).slice(-11);
      if (phone.length < 10) return;

      if (!byPhone.has(phone)) byPhone.set(phone, []);
      byPhone.get(phone).push(contact);
    });

    const firstName = (contact) => normalizeText(contact.child_name).trim().split(/\s+/)[0] || "";
    const ids = new Set();

    byPhone.forEach((group) => {
      group.forEach((contact, index) => {
        group.slice(index + 1).forEach((other) => {
          const a = firstName(contact);
          const b = firstName(other);

          if (!a || !b || a === b) {
            ids.add(contact.id);
            ids.add(other.id);
          }
        });
      });
    });

    return ids;
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

  const firstItem = filtered.length ? (page - 1) * ITEMS_PER_PAGE + 1 : 0;
  const lastItem = Math.min(page * ITEMS_PER_PAGE, filtered.length);

  // Troca de página e leva a tela para o começo da lista
  function goToPage(next) {
    setPage(next);

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    listTopRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }

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

  async function runBulk(label, action, { undo } = {}) {
    const ids = [...selected];
    if (!ids.length) return;

    setBulk({ done: 0, total: ids.length, label });

    try {
      await action(ids, (done) => setBulk({ done, total: ids.length, label }));
      toast(`${label}: ${plural(ids.length)}.`, {
        type: "success",
        action: undo
          ? {
              label: "Desfazer",
              onClick: async () => {
                try {
                  await undo(ids);
                  toast("Desfeito.", { type: "success" });
                } catch (err) {
                  console.error("Erro ao desfazer:", err);
                  toast("Não foi possível desfazer. Os contatos estão na aba Arquivados.");
                } finally {
                  await loadContacts();
                }
              },
            }
          : undefined,
      });
    } catch (err) {
      console.error(`Erro em "${label}":`, err);
      toast(`Não foi possível concluir: ${label}. Confira a lista e tente de novo.`);
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

  // Arquivar é reversível: vira "Desfazer" no aviso, sem confirmação
  function archiveSelected(reason) {
    return runBulk(
      `Arquivado como "${ARCHIVE_REASON_LABEL[reason]}"`,
      (ids) => archiveContacts(ids, reason),
      { undo: (ids) => restoreContacts(ids) },
    );
  }

  function restoreSelected() {
    return runBulk("Restaurado", (ids) => restoreContacts(ids));
  }

  function closeSelectedNoResponse() {
    confirmBulk({
      title: `Encerrar ${plural(selected.size)}?`,
      description:
        "Cada um vai para Não convertido com o motivo \"família não respondeu\". Para voltar atrás depois, é preciso abrir contato por contato.",
      confirmLabel: `Encerrar ${plural(selected.size)}`,
      run: runCloseNoResponse,
    });
  }

  function runCloseNoResponse() {
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
    confirmBulk({
      title: `Mover ${plural(selected.size)} para a lista de interesse?`,
      description:
        "Saem do funil ativo e ficam na lista para avisar quando abrir vaga.",
      confirmLabel: `Mover ${plural(selected.size)}`,
      run: runMoveToWaitingList,
    });
  }

  function runMoveToWaitingList() {
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
      toast("Não foi possível marcar como lead.");
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
      toast(`Arquivado como "${ARCHIVE_REASON_LABEL[reason]}".`, {
        type: "success",
        action: {
          label: "Desfazer",
          onClick: async () => {
            try {
              await restoreContacts([contact.id]);
            } catch (err) {
              console.error("Erro ao desfazer:", err);
              toast("Não foi possível desfazer. O contato está na aba Arquivados.");
            } finally {
              await loadContacts();
            }
          },
        },
      });
    } catch (err) {
      console.error("Erro ao arquivar:", err);
      toast("Não foi possível arquivar.");
    }
  }

  /* =========================================================
   * RENDER
   * =======================================================*/

  const fieldClass =
    "h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none placeholder:text-neutral-500 focus:border-ink";

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Contatos"
        summary={`${tabCounts.active ?? 0} em andamento, ${tabCounts.enrolled ?? 0} matriculados.`}
        actions={
          openNewContact && (
            <Button variant="primary" onClick={openNewContact}>
              <Plus size={18} aria-hidden="true" />
              Novo contato
            </Button>
          )
        }
      />

      <Dialog
        open={!!confirming}
        onClose={() => setConfirming(null)}
        title={confirming?.title}
        size="sm"
        footer={
          <DialogActions>
            <Button onClick={() => setConfirming(null)}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={() => {
                const run = confirming.run;
                setConfirming(null);
                run();
              }}
            >
              {confirming?.confirmLabel}
            </Button>
          </DialogActions>
        }
      >
        <p className="text-sm">{confirming?.description}</p>
      </Dialog>

      {/* ABAS */}
      <Tabs
        label="Grupos de contatos"
        value={tab}
        onChange={setTab}
        items={TABS.filter(
          (item) => item.value !== "triage" || tabCounts.triage || tab === "triage",
        ).map((item) => ({
          ...item,
          count: tabCounts[item.value] ?? 0,
          urgency: item.value === "triage" && tabCounts.triage ? "attention" : undefined,
        }))}
      />

      {tab === "triage" && (
        <p className="max-w-3xl text-sm text-muted">
          Entraram sozinhos pelo WhatsApp ou foram cadastrados sem o nome do atleta.
          Decida se cada um é lead. Pais de alunos atuais vão para <strong className="text-ink">Já é aluno</strong> e
          não contam como matrícula. Dá para marcar vários e arquivar de uma vez.
        </p>
      )}

      {/* BUSCA + FILTROS */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Buscar contato</span>
          <Search
            size={17}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar atleta, responsável, nome no WhatsApp ou telefone"
            className={`${fieldClass} w-full pl-10`}
          />
        </label>

        <select
          aria-label="Categoria"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className={fieldClass}
        >
          <option value="all">Todas as categorias</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          aria-label="Origem"
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value)}
          className={fieldClass}
        >
          <option value="all">Todas as origens</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {sourceLabel(source)}
            </option>
          ))}
        </select>

        {tab === "active" && staleCount > 0 && (
          <Button
            aria-pressed={staleOnly}
            onClick={() => setStaleOnly((current) => !current)}
            className={staleOnly ? "!border-ink !bg-ink !text-white" : ""}
          >
            <Clock3 size={16} aria-hidden="true" />
            Parados há {STALE_DAYS}+ dias
            <Count value={staleCount} inverted={staleOnly} />
          </Button>
        )}
      </div>

      {/* BARRA DE LOTE */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-col gap-3 rounded-xl bg-ink p-3 text-white sm:flex-row sm:items-center">
          <p className="px-2 text-sm font-semibold" role="status">
            {bulk
              ? `${bulk.label}… ${bulk.done} de ${bulk.total}`
              : `${selected.size} selecionado${selected.size === 1 ? "" : "s"}`}
          </p>

          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {bulk ? (
              <Loader2 size={18} aria-hidden="true" className="animate-spin" />
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
      {loading && contacts.length === 0 ? (
        <p role="status" className="py-12 text-center text-muted">
          Carregando contatos…
        </p>
      ) : error ? (
        <Panel className="p-5">
          <p role="alert" className="font-medium text-alert-text">
            {error} Confira sua internet e tente de novo.
          </p>

          <Button className="mt-3" onClick={loadContacts}>
            Tentar de novo
          </Button>
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel className="px-6 py-10 text-center">
          <p className="font-semibold">
            {tab === "triage" ? "Triagem concluída." : "Nenhum contato encontrado."}
          </p>
          {tab !== "triage" && (search || categoryFilter !== "all" || sourceFilter !== "all") && (
            <p className="mt-1 text-sm text-muted">Tente limpar a busca ou os filtros.</p>
          )}
        </Panel>
      ) : (
        <>
        <div ref={listTopRef} className="flex scroll-mt-4 items-center justify-between gap-3">
          <p className="text-sm text-muted tabular-nums">
            {firstItem}–{lastItem} de {filtered.length} contato{filtered.length === 1 ? "" : "s"}
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="quiet"
                disabled={page === 1}
                onClick={() => goToPage(page - 1)}
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </Button>

              <span className="px-1 text-sm tabular-nums text-muted">
                {page} de {totalPages}
              </span>

              <Button
                size="sm"
                variant="quiet"
                disabled={page === totalPages}
                onClick={() => goToPage(page + 1)}
                aria-label="Próxima página"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>

        <Panel className="overflow-hidden">
          <div className="hidden grid-cols-[1.5rem_minmax(0,2.2fr)_minmax(0,1.3fr)_5rem_minmax(0,1fr)_8rem_auto] items-center gap-x-4 border-b border-line bg-canvas px-4 py-2 text-sm text-muted lg:grid">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleAllFiltered}
              className="h-4 w-4 accent-ink"
              aria-label={`Selecionar todos os ${filtered.length} contatos`}
            />
            <span>Atleta e responsável</span>
            <span>Situação</span>
            <span>Turma</span>
            <span>Local</span>
            <span>Último contato</span>
            <span className="sr-only">Ações</span>
          </div>

          <div className="flex items-center gap-3 border-b border-line bg-canvas px-4 py-2 text-sm text-muted lg:hidden">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleAllFiltered}
              className="h-4 w-4 accent-ink"
              aria-label={`Selecionar todos os ${filtered.length} contatos`}
            />
            Selecionar todos
          </div>

          {pageItems.map((contact) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              tab={tab}
              checked={selected.has(contact.id)}
              duplicate={duplicateIds.has(contact.id)}
              onToggle={() => toggle(contact.id)}
              onOpen={() => navigate(`/admin/contacts/${contact.id}`)}
              onPromote={() => handlePromote(contact)}
              onArchive={(reason) => handleArchiveOne(contact, reason)}
            />
          ))}
        </Panel>
        </>
      )}

      {/* PAGINAÇÃO */}
      {totalPages > 1 && (
        <nav aria-label="Páginas" className="flex items-center justify-between">
          <Button disabled={page === 1} onClick={() => goToPage(page - 1)}>
            <ChevronLeft size={16} aria-hidden="true" />
            Anterior
          </Button>

          <span className="text-sm text-muted">
            Página {page} de {totalPages}
          </span>

          <Button
            disabled={page === totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Próxima
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </nav>
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
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-sm font-medium hover:bg-white/20"
    >
      {Icon && <Icon size={15} aria-hidden="true" />}
      {children}
    </button>
  );
}

// Cor só onde a situação pede algo (ou é um bom resultado)
const STATUS_TONE = {
  pending_confirmation: "text-attention-text",
  follow_up: "text-attention-text",
  no_show: "text-alert-text",
  enrolled: "text-ok",
};

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

  const subtitle = isBlank(contact.child_name)
    ? isAuto
      ? "Nome no WhatsApp"
      : "Atleta sem nome"
    : contact.responsible_name || "Responsável não informado";

  return (
    <div
      className={`grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-line px-4 py-3 last:border-b-0 lg:grid-cols-[1.5rem_minmax(0,2.2fr)_minmax(0,1.3fr)_5rem_minmax(0,1fr)_8rem_auto] ${
        duplicate ? urgencyRail("attention") : urgencyRail()
      } ${checked ? "bg-canvas" : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 accent-ink"
        aria-label={`Selecionar ${title}`}
      />

      <button type="button" onClick={onOpen} className="min-w-0 text-left">
        <span className="block truncate font-semibold hover:underline">{title}</span>
        <span className="block truncate text-sm text-muted">
          {subtitle}, <span className="tabular-nums">{contact.phone ? formatPhone(contact.phone) : "sem telefone"}</span>
        </span>
        {duplicate && (
          <span className="block text-sm text-attention-text">Possível cadastro duplicado (mesmo telefone e nome)</span>
        )}
      </button>

      {/* Situação, turma e local: no celular viram uma linha abaixo do nome */}
      <div className="col-start-2 row-start-2 text-sm lg:col-start-auto lg:row-start-auto">
        <span className={`font-medium ${STATUS_TONE[contact.status] ?? "text-ink"}`}>
          {isAuto ? "WhatsApp (triagem)" : CONTACT_STATUS_LABEL[contact.status] ?? contact.status}
        </span>

        {contact.archived_at && (
          <span className="block text-muted">
            Arquivado: {ARCHIVE_REASON_LABEL[contact.archive_reason] ?? "sem motivo"}
          </span>
        )}

        <span className="text-muted lg:hidden">
          {contact.category?.name && `, ${contact.category.name}`}
          {contact.location?.name && `, ${contact.location.name}`}
        </span>
      </div>

      <span className="hidden text-sm lg:block">{contact.category?.name}</span>

      <span className="hidden truncate text-sm text-muted lg:block">
        {contact.location?.name}
      </span>

      <span
        className="hidden text-sm text-muted lg:block"
      >
        {formatDaysAgo(days)}
        {stale && <span className="block">parado</span>}
      </span>

      <div className="col-start-3 row-span-2 row-start-1 flex flex-wrap justify-end gap-2 lg:col-start-auto lg:row-span-1 lg:row-start-auto">
        {tab === "triage" && (
          <>
            <Button size="sm" variant="primary" onClick={onPromote}>
              <UserCheck size={15} aria-hidden="true" />
              É lead
            </Button>

            <Button size="sm" onClick={() => onArchive(ARCHIVE_REASON.CURRENT_STUDENT)}>
              Já é aluno
            </Button>

            <Button size="sm" onClick={() => onArchive(ARCHIVE_REASON.NOT_LEAD)}>
              Não é lead
            </Button>
          </>
        )}

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp de ${title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-whatsapp hover:border-whatsapp"
          >
            <MessageCircle size={17} aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
}
