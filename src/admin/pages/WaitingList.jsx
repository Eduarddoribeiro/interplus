// src/admin/pages/WaitingList.jsx

import { useEffect, useMemo, useState } from "react";
import { Megaphone, RefreshCw, Search, X } from "lucide-react";

import WaitingListFilters from "../components/waitingList/WaitingListFilters";
import WaitingListHeader from "../components/waitingList/WaitingListHeader";
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

    return `${row?.name ?? ""} · ${column?.name ?? ""}`;
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
      setActionError(error?.message || "Não foi possível agendar a experimental.");
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
      showNotice(error?.message || "Não foi possível salvar a qualificação.");
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
      showNotice(error?.message || "Não foi possível encerrar o contato.");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
   * RENDER
   * =======================================================*/

  return (
    <div className="space-y-6">
      <WaitingListHeader total={items.length} />

      {notice && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-900 px-5 py-3 text-sm font-semibold text-white">
          {notice}
        </div>
      )}

      {loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">{loadError}</p>

          <button
            type="button"
            onClick={loadData}
            className="mt-2 text-sm font-semibold text-red-700 underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && nowCount > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-green-900">
            {nowCount} famíli{nowCount === 1 ? "a pode" : "as podem"} ser chamada
            {nowCount === 1 ? "" : "s"} agora: já existe turma aberta com vaga para elas.
          </p>
        </div>
      )}

      <WaitingListDemandMatrix matrix={matrix} selected={cell} onSelect={setCell} />

      {/* BUSCA + FILTROS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por atleta, responsável ou telefone"
            className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-red-500"
          />
        </label>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      <WaitingListFilters
        categories={categories}
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters({ ...INITIAL_WAITING_LIST_FILTERS })}
      />

      {/* CÉLULA SELECIONADA */}
      {cell && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-800">
            <strong>{cellLabel}</strong> · {filteredItems.length} famíli
            {filteredItems.length === 1 ? "a" : "as"}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!callQueue.length}
              onClick={() => setQueueContacts(callQueue)}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Megaphone size={16} />
              Chamar todas ({callQueue.length})
            </button>

            <button
              type="button"
              onClick={() => setCell(null)}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-700"
            >
              <X size={16} />
              Limpar
            </button>
          </div>
        </div>
      )}

      {/* GRUPOS */}
      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center text-neutral-500">
          Carregando lista de interesse...
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center text-neutral-500">
          Nenhum contato encontrado.
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2
                    className={`text-lg font-bold ${
                      group.key === "now" ? "text-green-800" : "text-neutral-900"
                    }`}
                  >
                    {group.title}{" "}
                    <span className="text-neutral-400">({group.items.length})</span>
                  </h2>

                  <p className="text-sm text-neutral-500">{group.description}</p>
                </div>
              </div>

              <div
                className={`overflow-hidden rounded-2xl border bg-white ${
                  group.key === "now" ? "border-green-200" : "border-neutral-200"
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
