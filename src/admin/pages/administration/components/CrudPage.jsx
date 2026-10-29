import { ArrowLeft, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import SectionTitle from "../../../components/common/SectionTitle";
import { Button } from "../../../ui";

// Volta para a lista de cadastros (link: abre em nova aba se quiser)
export function BackLink({ to = "/admin/administration", label = "Administração" }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 rounded text-sm text-muted hover:text-ink">
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </Link>
  );
}

export default function CrudPage({
  title,
  createLabel,
  onCreate,
  children,
}) {
  return (
    <div className="space-y-4">
      <BackLink />

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
