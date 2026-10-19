import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import SectionTitle from "../../../components/common/SectionTitle";
import { Button } from "../../../ui";

export default function CrudPage({
  title,
  createLabel,
  onCreate,
  children,
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate("/admin/administration")}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Administração
      </button>

      <SectionTitle
        title={title}
        actions={
          <Button variant="primary" onClick={onCreate}>
            <Plus size={18} aria-hidden="true" />
            {createLabel}
          </Button>
        }
      />

      {children}
    </div>
  );
}
