import { useEffect, useState } from "react";
import { Pencil, Power } from "lucide-react";

import CrudPage from "../components/CrudPage";
import CrudTable from "../components/CrudTable";
import CrudModal from "../components/CrudModal";
import FormField from "../components/FormField";
import StatusBadge from "../components/StatusBadge";

import {
  createModality,
  getModalities,
  toggleModality,
  updateModality,
} from "../../../../services/administration/modalities";
import { toast } from "../../../components/common/Toaster";
import { Button, inputClass } from "../../../ui";

const EMPTY_FORM = { name: "", active: true };

export default function ModalitiesPage() {
  const [modalities, setModalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    loadModalities();
  }, []);

  async function loadModalities() {
    try {
      setLoading(true);
      setModalities(await getModalities());
    } catch (err) {
      console.error(err);
      toast("Não foi possível carregar as modalidades. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function handleEdit(modality) {
    setEditing(modality);
    setForm({ name: modality.name ?? "", active: modality.active });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast("Informe o nome da modalidade.");
      return;
    }

    try {
      const payload = { name: form.name.trim(), active: form.active };

      if (editing) await updateModality(editing.id, payload);
      else await createModality(payload);

      setOpen(false);
      await loadModalities();
    } catch (err) {
      console.error(err);
      toast("Não foi possível salvar a modalidade. Tente de novo.");
    }
  }

  async function handleToggle(modality) {
    try {
      await toggleModality(modality.id, !modality.active);
      await loadModalities();
    } catch (err) {
      console.error(err);
      toast("Não foi possível mudar a situação da modalidade.");
    }
  }

  return (
    <>
      <CrudPage title="Modalidades" createLabel="Nova modalidade" onCreate={handleCreate}>
        <CrudTable
          columns={["Nome", "Situação", ""]}
          emptyMessage={loading ? "Carregando modalidades…" : "Nenhuma modalidade cadastrada."}
        >
          {modalities.length
            ? modalities.map((modality) => (
                <tr key={modality.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{modality.name}</td>

                  <td className="px-4 py-3">
                    <StatusBadge active={modality.active} />
                  </td>

                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="quiet" onClick={() => handleEdit(modality)}>
                        <Pencil size={15} aria-hidden="true" />
                        Editar
                      </Button>

                      <Button size="sm" variant="quiet" onClick={() => handleToggle(modality)}>
                        <Power size={15} aria-hidden="true" />
                        {modality.active ? "Desativar" : "Reativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            : null}
        </CrudTable>
      </CrudPage>

      <CrudModal
        open={open}
        title={editing ? "Editar modalidade" : "Nova modalidade"}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      >
        <FormField label="Nome">
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Ex.: Futsal"
            className={inputClass}
            data-autofocus
          />
        </FormField>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm({ ...form, active: event.target.checked })}
            className="h-4 w-4 accent-ink"
          />
          Modalidade ativa
        </label>
      </CrudModal>
    </>
  );
}
