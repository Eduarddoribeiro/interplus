import { useEffect, useState } from "react";

import CrudPage from "../components/CrudPage";
import CrudTable from "../components/CrudTable";
import CrudModal from "../components/CrudModal";
import FormField from "../components/FormField";
import StatusBadge from "../components/StatusBadge";

import {
  getUnits,
  createUnit,
  updateUnit,
} from "../../../../services/administration/units";
import { Button, inputClass } from "../../../ui";

export default function UnitsPage() {
  const [units, setUnits] = useState([]);

  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);

  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: "",
    city: "",
    active: true,
  });

  useEffect(() => {
    loadUnits();
  }, []);

  async function loadUnits() {
    try {
      setLoading(true);

      const data = await getUnits();

      setUnits(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setEditing(null);

    setForm({
      name: "",
      city: "",
      active: true,
    });

    setOpen(true);
  }

  function handleEdit(unit) {
    setEditing(unit);

    setForm({
      name: unit.name,
      city: unit.city ?? "",
      active: unit.active,
    });

    setOpen(true);
  }

  async function handleSave() {
    try {
      if (editing) {
        await updateUnit(editing.id, form);
      } else {
        await createUnit(form);
      }

      setOpen(false);

      await loadUnits();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <CrudPage
        title="Unidades"
        createLabel="Nova unidade"
        onCreate={handleCreate}
      >
        <CrudTable
          columns={[
            "Nome",
            "Cidade",
            "Situação",
            "",
          ]}
          emptyMessage={
            loading
              ? "Carregando…"
              : "Nenhuma unidade cadastrada."
          }
        >
          {units.map((unit) => (
            <tr
              key={unit.id}
              className="border-t border-line"
            >
              <td className="px-4 py-3">
                {unit.name}
              </td>

              <td className="px-4 py-3">
                {unit.city}
              </td>

              <td className="px-4 py-3">
                <StatusBadge active={unit.active} />
              </td>

              <td className="px-4 py-2 text-right">
                <Button size="sm" variant="quiet" onClick={() => handleEdit(unit)}>
                  Editar
                </Button>
              </td>
            </tr>
          ))}
        </CrudTable>
      </CrudPage>

      <CrudModal
        open={open}
        title={
          editing
            ? "Editar unidade"
            : "Nova unidade"
        }
        onClose={() => setOpen(false)}
        onSave={handleSave}
      >
        <FormField label="Nome">
          <input
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            className={inputClass}
          />
        </FormField>

        <FormField label="Cidade">
          <input
            value={form.city}
            onChange={(e) =>
              setForm({
                ...form,
                city: e.target.value,
              })
            }
            className={inputClass}
          />
        </FormField>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 accent-ink"
            checked={form.active}
            onChange={(e) =>
              setForm({
                ...form,
                active: e.target.checked,
              })
            }
          />

          <span>Unidade ativa</span>
        </label>
      </CrudModal>
    </>
  );
}