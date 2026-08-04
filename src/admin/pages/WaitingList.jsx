// src/admin/pages/WaitingList.jsx

import { useEffect, useMemo, useState } from "react";

import WaitingListFilters from "../components/waitingList/WaitingListFilters";
import WaitingListHeader from "../components/waitingList/WaitingListHeader";
import WaitingListDashboard from "../components/waitingList/WaitingListDashboard";
import WaitingListSection from "../components/waitingList/WaitingListSection";

import { getFollowUpCenter } from "../../services/contacts";
import { getWaitingListPriority } from "../../helpers/waitingListPriority";
import { filterWaitingList } from "../../helpers/waitingListFilters";
import { getInterestCategory } from "../../helpers/waitingListRules";
import { INITIAL_WAITING_LIST_FILTERS } from "../../constants/waitingListFilters";

export default function WaitingList() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const [filters, setFilters] = useState(
    INITIAL_WAITING_LIST_FILTERS,
  );

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
    console.log(contact, action);

    // As ações serão conectadas na próxima etapa.
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
    </div>
  );
}
