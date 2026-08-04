// src/admin/pages/WaitingList.jsx

import { useEffect, useMemo, useState } from "react";

import WaitingListCard from "../components/followUps/WaitingListCard";
import WaitingListFilters from "../components/followUps/WaitingListFilters";

import { getFollowUpCenter } from "../../services/contacts";
import { getCategories } from "../../services/categories";

export default function WaitingList() {
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState([]);

  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({
    category: "",
    shift: "",
    qualification: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
  try {
    setLoading(true);

    const [data, categoryList] =
      await Promise.all([
        getFollowUpCenter(),
        getCategories(),
      ]);

    setItems(data.waitingList || []);
    setCategories(categoryList || []);
  } catch (error) {
    console.error(
      "Erro ao carregar lista de interesse:",
      error,
    );
  } finally {
    setLoading(false);
  }
}

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (
        filters.category &&
        String(item.interest_category_id) !==
          String(filters.category)
      ) {
        return false;
      }

      if (
        filters.shift &&
        item.preferred_shift !== filters.shift
      ) {
        return false;
      }

      if (
        filters.qualification &&
        item.qualification_status !==
          filters.qualification
      ) {
        return false;
      }

      return true;
    });
  }, [items, filters]);

  function handleAction(contact, action) {
    console.log(contact, action);

    // vamos implementar na próxima etapa
  }

  return (
    <div className="space-y-8">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div>
        <h1 className="text-3xl font-bold text-neutral-900">
          Lista de Interesse
        </h1>

        <p className="mt-2 text-neutral-500">
          Gerencie famílias aguardando vagas,
          novas turmas e futuras oportunidades.
        </p>
      </div>

      {/* ================================================= */}
      {/* FILTROS */}
      {/* ================================================= */}

      <WaitingListFilters
        categories={categories}
        filters={filters}
        onChange={setFilters}
      />

      {/* ================================================= */}
      {/* LISTA */}
      {/* ================================================= */}

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center text-neutral-500">
          Carregando lista de interesse...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center text-neutral-500">
          Nenhum contato encontrado.
        </div>
      ) : (
        <div className="space-y-5">
          {filteredItems.map((item) => (
            <WaitingListCard
              key={item.id}
              item={item}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}