// src/admin/pages/WaitingList.jsx

import { useEffect, useMemo, useState } from "react";
import { Megaphone, Search, X } from "lucide-react";

import WaitingListFilters from "../components/waitingList/WaitingListFilters";
import SectionTitle from "../components/common/SectionTitle";
import { Button, Count, Panel } from "../ui";
import WaitingListDemandMatrix from "../components/waitingList/WaitingListDemandMatrix";
import WaitingListRow from "../components/waitingList/WaitingListRow";
import WaitingListCallQueue from "../components/waitingList/WaitingListCallQueue";
import WaitingListScheduleModal from "../components/waitingList/WaitingListScheduleModal";
import ContactActionModal from "../components/followUps/ContactActionModal";
import WaitingListQualificationModal from "../components/followUps/WaitingListQualificationModal";

import {
  addContactInternalNote,
  closeWaitingListContact,
  getFollowUpCenter,
  markWaitingListContacted,
  rescheduleExperimental,
  updateContact,
} from "../../services/contacts";
import { getActiveLocations } from "../../services/administration/locations";
import { getActiveCategories } from "../../services/categories";
import { getOpenTrialOptionsByCategory } from "../../services/administration/trialSlots";
import { filterWaitingList } from "../../helpers/waitingListFilters";
import { getInterestCategory } from "../../helpers/waitingListRules";
import { createWhatsAppUrl } from "../../helpers/contactPresentation";
import {
  BOARD_GROUPS,
  buildDemandMatrix,
  buildWaitingListMessage,
  getBoardGroupKey,
  getLocationKey,
  getWaitingDays,
} from "../../helpers/waitingListBoard";
import { INITIAL_WAITING_LIST_FILTERS } from "../../constants/waitingListFilters";
import { CONTACT_STATUS } from "../../constants/contactStatus";
import { FOLLOW_UP_ACTION } from "../../constants/followUpActions";
import { errorMessage } from "../../helpers/errorMessage";

// Quem foi chamado há menos que isso não entra na fila "chamar todas"
const RECENT_CALL_DAYS = 7;

/*
 * Lista de interesse organizada por oportunidade:
 * quadro de demanda (idade x local) + grupos que viram ação.
 */
export default function WaitingList() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [availability, setAvailability] = useState({});

  const [filters, setFilters] = useState(INITIAL_WAITING_LIST_FILTERS);
  const [search, setSearch] = useState("");
  const [cell, setCell] = useState(null);

  const [actionContact, setActionContact] = useState(null);
  const [qualificationContact, setQualificationContact] = useState(null);
  const [scheduleContact, setScheduleContact] = useState(null);
  // Cópia fixa da fila: quem é marcado como chamado sai da lista filtrada
  const [queueContacts, setQueueContacts] = useState(null);

  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  /* =========================================================
   * CARREGAMENTO
   * =======================================================*/

  useEffect(() => {
    loadData();
  }, []);

  // Recarrega ao voltar para a aba do navegador (sem botão Atualizar)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") loadData();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setLoadError("");

      const [center, locationsData, categoriesData] = await Promise.all([
        getFollowUpCenter(),
        getActiveLocations(),
        getActiveCategories(),
      ]);

      const waitingList = center.waitingList || [];

      setItems(waitingList);
      setLocations(locationsData);
      setAllCategories(categoriesData);

      const categoryIds = waitingList.map((item) => getInterestCategory(item)?.id);

      setAvailability(await getOpenTrialOptionsByCategory(categoryIds));
    } catch (error) {
      console.error("Erro ao carregar lista de interesse:", error);
      setLoadError("Não foi possível carregar a lista de interesse.");
    } finally {
      setLoading(false);
    }
  }

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 5000);
  }

  /* =========================================================
   * CATEGORIAS (para filtros e qualificação)
   * =======================================================*/

  const categories = useMemo(() => {
    const map = new Map();

    items.forEach((item) => {
      const category = getInterestCategory(item);

      if (category?.id) map.set(String(category.id), category);
    });

    return [...map.values()].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", "pt-BR"),
    );
  }, [items]);

  /* =========================================================
   * QUADRO + FILTROS
   * =======================================================*/

  const matrix = useMemo(
    () => buildDemandMatrix(items, locations, availability),
    [items, locations, availability],
  );

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    const digits = term.replace(/\D/g, "");

    return filterWaitingList(items, filters).filter((item) => {
      if (cell) {
        const categoryKey = getInterestCategory(item)?.id
          ? String(getInterestCategory(item).id)
          : "none";

        if (categoryKey !== cell.rowKey || getLocationKey(item) !== cell.columnKey) {
          return false;
        }
      }

      if (!term) return true;

      return (
        item.child_name?.toLowerCase().includes(term) ||
        item.responsible_name?.toLowerCase().includes(term) ||
        (digits.length >= 4 && item.phone?.replace(/\D/g, "").includes(digits))
      );
    });
  }, [items, filters, search, cell]);

  // Grupos por oportunidade; dentro de cada um, quem espera há mais tempo primeiro
  const groups = useMemo(
    () =>
      BOARD_GROUPS.map((group) => ({
        ...group,
        items: filteredItems
          .filter((item) => getBoardGroupKey(item, availability) === group.key)
          .sort((a, b) => (getWaitingDays(b) ?? 0) - (getWaitingDays(a) ?? 0)),
      })).filter((group) => group.items.length > 0),
    [filteredItems, availability],
  );

  const nowCount = useMemo(
    () => items.filter((item) => getBoardGroupKey(item, availability) === "now").length,
    [items, availability],
  );

  const cellLabel = useMemo(() => {
    if (!cell) return "";

    const row = matrix.rows.find((item) => item.key === cell.rowKey);
    const column = matrix.columns.find((item) => item.key === cell.columnKey);

    return `${row?.name ?? ""}, ${column?.name ?? ""}`;
  }, [cell, matrix]);

  const callQueue = useMemo(
    () =>
      filteredItems.filter((item) => {
        if (!item.phone) return false;
        if (!item.waiting_list_contacted_at) return true;

        const days = (Date.now() - new Date(item.waiting_list_contacted_at)) / 86400000;

        return days >= RECENT_CALL_DAYS;
      }),
    [filteredItems],
  );

  /* =========================================================
   * AÇÕES
   * =======================================================*/

  function replaceItem(updatedContact) {
    setItems((current) => {
      if (updatedContact.status !== CONTACT_STATUS.WAITING_LIST) {
        return current.filter((item) => item.id !== updatedContact.id);
      }

      return current.map((item) =>
        item.id === updatedContact.id ? updatedContact : item,
      );
    });
  }

  function buildWhatsAppUrl(contact) {
    const url = createWhatsAppUrl(contact.phone);

    return url
      ? `${url}?text=${encodeURIComponent(buildWaitingListMessage(contact, availability))}`
      : null;
  }

  async function markContacted(contact) {
    const updated = await markWaitingListContacted(contact.id);
    replaceItem(updated);
  }

  async function handleWhatsApp(contact) {
    const url = buildWhatsAppUrl(contact);

    if (url) window.open(url, "_blank", "noopener,noreferrer");

    try {
      await markContacted(contact);
    } catch (error) {
      console.error("Erro ao marcar como chamado:", error);
      showNotice("Abriu o WhatsApp, mas não foi possível marcar como chamado.");
    }
  }

  async function handleSchedule({ slot, notes }) {
    const category = getInterestCategory(scheduleContact);

    try {
      setSaving(true);
      setActionError("");

      const { contact } = await rescheduleExperimental(scheduleContact.id, {
        categoryId: category.id,
        trainingGroupScheduleId: slot.scheduleId,
        experimentalDate: slot.date,
        notes: notes || "Agendada a partir da lista de interesse.",
      });

      replaceItem(contact);
      setScheduleContact(null);
      showNotice("Experimental agendada. O contato saiu da lista de interesse.");

      // As vagas mudaram
      setAvailability(
        await getOpenTrialOptionsByCategory(
          items.map((item) => getInterestCategory(item)?.id),
        ),
      );
    } catch (error) {
      console.error("Erro ao agendar experimental:", error);
      setActionError(errorMessage(error, "Não foi possível agendar a experimental."));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveQualification(payload) {
    if (!qualificationContact) return;

    try {
      setSaving(true);

      const { notes, ...contactUpdates } = payload;

      let updatedContact = await updateContact(qualificationContact.id, contactUpdates);

      if (notes?.trim()) {
        updatedContact = await addContactInternalNote(
          qualificationContact.id,
          `Qualificação da lista de interesse: ${notes.trim()}`,
        );
      }

      replaceItem(updatedContact);
      setQualificationContact(null);
    } catch (error) {
      console.error("Erro ao salvar qualificação:", error);
      showNotice(errorMessage(error, "Não foi possível salvar a qualificação."));
    } finally {
      setSaving(false);
    }
  }

  async function handleCloseWaitingList(payload) {
    if (!actionContact) return;

    try {
      setSaving(true);

      const updatedContact = await closeWaitingListContact(actionContact.id, {
        lostReason: payload.lostReason,
        notes: payload.notes,
      });

      replaceItem(updatedContact);
      setActionContact(null);
    } catch (error) {
      console.error("Erro ao encerrar lista de interesse:", error);
      showNotice(errorMessage(error, "Não foi possível encerrar o contato."));
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
   * RENDER
   * =======================================================*/

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Lista de interesse"
        summary={
          `${items.length} famílias aguardando vaga, nova turma ou oportunidade.` +
          (nowCount
            ? ` ${nowCount} ${nowCount === 1 ? "pode" : "podem"} agendar agora, porque já há turma com vaga.`
            : "")
        }
      />

      {notice && (
        <p role="status" className="rounded-lg bg-ink px-4 py-3 text-sm font-medium text-white">
          {notice}
        </p>
      )}

      {loadError && (
        <Panel className="p-5">
          <p role="alert" className="font-medium text-alert-text">
            {loadError}
          </p>

          <Button className="mt-3" onClick={loadData}>
            Tentar de novo
          </Button>
        </Panel>
      )}

      <WaitingListDemandMatrix matrix={matrix} selected={cell} onSelect={setCell} />

      {/* BUSCA + FILTROS */}
      <label className="relative block">
        <span className="sr-only">Buscar na lista de interesse</span>
        <Search
          size={17}
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por atleta, responsável ou telefone"
          className="h-10 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm outline-none placeholder:text-neutral-500 focus:border-ink"
        />
      </label>

      <WaitingListFilters
        categories={categories}
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters({ ...INITIAL_WAITING_LIST_FILTERS })}
      />

      {/* CÉLULA SELECIONADA */}
      {cell && (
        <Panel className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="px-1 text-sm">
            <strong>{cellLabel}</strong>: {filteredItems.length} famíli
            {filteredItems.length === 1 ? "a" : "as"}
          </p>

          <div className="flex gap-2">
            <Button
              variant="whatsapp"
              disabled={!callQueue.length}
              onClick={() => setQueueContacts(callQueue)}
            >
              <Megaphone size={16} aria-hidden="true" />
              Chamar todas ({callQueue.length})
            </Button>

            <Button variant="quiet" onClick={() => setCell(null)}>
              <X size={16} aria-hidden="true" />
              Limpar
            </Button>
          </div>
        </Panel>
      )}

      {/* GRUPOS */}
      {loading && items.length === 0 ? (
        <p role="status" className="py-12 text-center text-muted">
          Carregando lista de interesse…
        </p>
      ) : groups.length === 0 ? (
        <Panel className="px-6 py-10 text-center">
          <p className="font-semibold">Nenhum contato encontrado.</p>
          <p className="mt-1 text-sm text-muted">Tente limpar a busca ou os filtros.</p>
        </Panel>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-2">
                <h2 className="flex items-center gap-2 font-semibold">
                  {group.title}
                  <Count value={group.items.length} />
                </h2>

                <p className="text-sm text-muted">{group.description}</p>
              </div>

              <div
                className={`overflow-hidden rounded-xl border bg-white ${
                  group.key === "now" ? "border-ok/40" : "border-line"
                }`}
              >
                {group.items.map((item) => (
                  <WaitingListRow
                    key={item.id}
                    contact={item}
                    canSchedule={group.key === "now" || group.key === "waiting"}
                    onWhatsApp={handleWhatsApp}
                    onSchedule={(contact) => {
                      setActionError("");
                      setScheduleContact(contact);
                    }}
                    onQualify={setQualificationContact}
                    onClose={setActionContact}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {queueContacts && (
        <WaitingListCallQueue
          title={cellLabel}
          contacts={queueContacts}
          buildMessage={(contact) => buildWaitingListMessage(contact, availability)}
          buildUrl={buildWhatsAppUrl}
          onCalled={markContacted}
          onClose={() => setQueueContacts(null)}
        />
      )}

      {scheduleContact && (
        <WaitingListScheduleModal
          contact={scheduleContact}
          saving={saving}
          error={actionError}
          onClose={() => !saving && setScheduleContact(null)}
          onSave={handleSchedule}
        />
      )}

      {actionContact && (
        <ContactActionModal
          contact={actionContact}
          type={FOLLOW_UP_ACTION.CLOSE_WAITING_LIST}
          saving={saving}
          onClose={() => !saving && setActionContact(null)}
          onSave={handleCloseWaitingList}
        />
      )}

      {qualificationContact && (
        <WaitingListQualificationModal
          contact={qualificationContact}
          categories={allCategories}
          locations={locations}
          saving={saving}
          onClose={() => setQualificationContact(null)}
          onSave={handleSaveQualification}
        />
      )}
    </div>
  );
}
