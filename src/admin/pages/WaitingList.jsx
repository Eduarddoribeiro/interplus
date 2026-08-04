// src/admin/pages/WaitingList.jsx

import { useEffect, useMemo, useState } from "react";

import WaitingListFilters from "../components/waitingList/WaitingListFilters";
import WaitingListHeader from "../components/waitingList/WaitingListHeader";
import WaitingListDashboard from "../components/waitingList/WaitingListDashboard";
import WaitingListSection from "../components/waitingList/WaitingListSection";
import ContactActionModal from "../components/followUps/ContactActionModal";
import WaitingListQualificationModal from "../components/followUps/WaitingListQualificationModal";

import {
  addContactInternalNote,
  closeWaitingListContact,
  getFollowUpCenter,
  updateContact,
} from "../../services/contacts";
import { getWaitingListPriority } from "../../helpers/waitingListPriority";
import { filterWaitingList } from "../../helpers/waitingListFilters";
import { getInterestCategory } from "../../helpers/waitingListRules";
import { INITIAL_WAITING_LIST_FILTERS } from "../../constants/waitingListFilters";
import { CONTACT_STATUS } from "../../constants/contactStatus";
import { FOLLOW_UP_ACTION } from "../../constants/followUpActions";

export default function WaitingList() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const [filters, setFilters] = useState(
    INITIAL_WAITING_LIST_FILTERS,
  );

  const [actionContact, setActionContact] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [qualificationContact, setQualificationContact] = useState(null);
  const [saving, setSaving] = useState(false);

  /* =========================================================
   * CARREGAMENTO
   * =======================================================*/

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const data = await getFollowUpCenter();

      setItems(data.waitingList || []);
    } catch (error) {
      console.error(
        "Erro ao carregar lista de interesse:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
   * CATEGORIAS DISPONÍVEIS
   * =======================================================*/

  const categories = useMemo(() => {
    const map = new Map();

    items.forEach((item) => {
      const category = getInterestCategory(item);

      if (!category?.id) return;

      map.set(String(category.id), category);
    });

    return Array.from(map.values()).sort((a, b) =>
      (a.name || "").localeCompare(
        b.name || "",
        "pt-BR",
      ),
    );
  }, [items]);

  /* =========================================================
   * FILTROS
   * =======================================================*/

  const filteredItems = useMemo(
    () => filterWaitingList(items, filters),
    [items, filters],
  );

  /* =========================================================
   * AGRUPAMENTO COMERCIAL
   * =======================================================*/

  const groupedItems = useMemo(() => {
    const groups = new Map();

    filteredItems.forEach((item) => {
      const group = getWaitingListPriority(item);

      if (!groups.has(group.key)) {
        groups.set(group.key, {
          ...group,
          items: [],
        });
      }

      groups.get(group.key).items.push(item);
    });

    return Array.from(groups.values()).sort(
      (a, b) => a.order - b.order,
    );
  }, [filteredItems]);

  /* =========================================================
   * AÇÕES
   * =======================================================*/

  function handleAction(contact, action) {
    if (action === FOLLOW_UP_ACTION.QUALIFY) {
      setQualificationContact(contact);
      return;
    }

    if (action === FOLLOW_UP_ACTION.CLOSE_WAITING_LIST) {
      setActionContact(contact);
      setActionType(action);
      return;
    }

    if (action === FOLLOW_UP_ACTION.SCHEDULE_EXPERIMENTAL) {
      alert(
        "O agendamento pela lista de interesse ainda não possui um formulário reutilizável nesta tela.",
      );
    }
  }

  function closeAction() {
    if (saving) return;

    setActionContact(null);
    setActionType(null);
  }

  function updateWaitingListItem(updatedContact) {
    setItems((current) => {
      if (updatedContact.status !== CONTACT_STATUS.WAITING_LIST) {
        return current.filter((item) => item.id !== updatedContact.id);
      }

      return current.map((item) =>
        item.id === updatedContact.id ? updatedContact : item,
      );
    });
  }

  async function handleSaveQualification(payload) {
    if (!qualificationContact) return;

    try {
      setSaving(true);

      const { notes, ...contactUpdates } = payload;

      let updatedContact = await updateContact(
        qualificationContact.id,
        contactUpdates,
      );

      if (notes?.trim()) {
        updatedContact = await addContactInternalNote(
          qualificationContact.id,
          `Qualificação da lista de interesse: ${notes.trim()}`,
        );
      }

      updateWaitingListItem(updatedContact);
      setQualificationContact(null);
    } catch (error) {
      console.error("Erro ao salvar qualificação:", error);

      alert(
        error?.message || "Não foi possível salvar a qualificação.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCloseWaitingList(payload) {
    if (!actionContact) return;

    try {
      setSaving(true);

      const updatedContact = await closeWaitingListContact(
        actionContact.id,
        {
          lostReason: payload.lostReason,
          notes: payload.notes,
        },
      );

      updateWaitingListItem(updatedContact);
      setActionContact(null);
      setActionType(null);
    } catch (error) {
      console.error("Erro ao encerrar lista de interesse:", error);

      alert(
        error?.message || "Não foi possível encerrar o contato.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
   * RENDER
   * =======================================================*/

  return (
    <div className="space-y-8">
      <WaitingListHeader total={items.length} />

      <WaitingListDashboard items={items} />

      <WaitingListFilters
        categories={categories}
        filters={filters}
        onChange={setFilters}
        onClear={() =>
          setFilters({ ...INITIAL_WAITING_LIST_FILTERS })
        }
      />

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center text-neutral-500">
          Carregando lista de interesse...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center text-neutral-500">
          Nenhum contato encontrado.
        </div>
      ) : (
        <div className="space-y-10">
          {groupedItems.map((group) => (
            <WaitingListSection
              key={group.key}
              group={group}
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {actionContact && (
        <ContactActionModal
          contact={actionContact}
          type={actionType}
          saving={saving}
          onClose={closeAction}
          onSave={handleCloseWaitingList}
        />
      )}

      {qualificationContact && (
        <WaitingListQualificationModal
          contact={qualificationContact}
          categories={categories}
          saving={saving}
          onClose={() => setQualificationContact(null)}
          onSave={handleSaveQualification}
        />
      )}
    </div>
  );
}
