import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import SectionTitle from "../../../components/common/SectionTitle";


export default function ModalitiesPage() {

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  function reload() {
    setReloadKey((v) => v + 1);
  }

  return (
    <div className="space-y-8">

      <button
        onClick={() => navigate("/admin/administration")}
        className="flex items-center gap-2 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={18} />

        Administração
      </button>

      <div className="flex items-center justify-between">

        <SectionTitle
          title="Modalidades"
          subtitle="Gerencie as modalidades esportivas."
        />

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-inter-red px-5 py-3 text-white hover:bg-inter-red-dark"
        >
          <Plus size={18} />

          Nova modalidade
        </button>

      </div>

      <ModalitiesTable reloadKey={reloadKey} />

      <ModalityModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => {
          reload();
          setOpen(false);
        }}
      />

    </div>
  );
}