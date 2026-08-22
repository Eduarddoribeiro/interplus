import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import SectionTitle from "../../../components/common/SectionTitle";

export default function CrudPage({
  title,
  subtitle,
  createLabel,
  onCreate,
  children,
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">

      <button
        onClick={() => navigate("/admin/administration")}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      <div className="flex items-center justify-between">

        <SectionTitle
          title={title}
          subtitle={subtitle}
        />

        <button
          onClick={onCreate}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700"
        >
          <Plus size={18}/>
          {createLabel}
        </button>

      </div>

      {children}

    </div>
  );
}