import { ArrowLeft, Plus } from "lucide-react";

import { useNavigate } from "react-router-dom";

import SectionTitle from "../../../components/common/SectionTitle";

import CategoriesTable from "./CategoriesTable";

export default function CategoriesPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">

      <button
        onClick={() => navigate("/admin/administration")}
        className="flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-900"
      >
        <ArrowLeft size={18} />

        Voltar para Administração
      </button>

      <div className="flex items-center justify-between">

        <SectionTitle
          title="Categorias"
          subtitle="Gerencie todas as categorias da escola."
        />

        <button
          className="
            flex
            items-center
            gap-2
            rounded-xl
            bg-red-600
            px-5
            py-3
            font-medium
            text-white
            transition
            hover:bg-red-700
          "
        >
          <Plus size={18} />

          Nova Categoria
        </button>

      </div>

      <CategoriesTable />

    </div>
  );
}