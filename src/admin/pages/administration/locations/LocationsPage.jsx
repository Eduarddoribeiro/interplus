import { useEffect, useState } from "react";

import CrudPage from "../components/CrudPage";
import CrudTable from "../components/CrudTable";
import CrudModal from "../components/CrudModal";
import FormField from "../components/FormField";
import StatusBadge from "../components/StatusBadge";

import {
  getLocations,
  createLocation,
  updateLocation,
} from "../../../../services/administration/locations";
import { getUnits } from "../../../../services/administration/units";
import { Button, inputClass } from "../../../ui";

const EMPTY_FORM = {
  unit_id: "",
  name: "",
  address: "",
  active: true,
};

/*
 * Locais = ginásios e arenas onde acontecem os treinos.
 * Cada local pertence a uma unidade (cidade) e aparece para os
 * pais no formulário público, junto com o endereço.
 */
export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [units, setUnits] = useState([]);

  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [locationsData, unitsData] = await Promise.all([
        getLocations(),
        getUnits(),
      ]);

      setLocations(locationsData);
      setUnits(unitsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setEditing(null);
    setError("");

    setForm({
      ...EMPTY_FORM,
      unit_id: units.length === 1 ? units[0].id : "",
    });

    setOpen(true);
  }

  function handleEdit(location) {
    setEditing(location);
    setError("");

    setForm({
      unit_id: location.unit_id ?? "",
      name: location.name ?? "",
      address: location.address ?? "",
      active: location.active,
    });

    setOpen(true);
  }

  async function handleSave() {
    if (!form.unit_id || !form.name.trim()) {
      setError("Informe a unidade e o nome do local.");
      return;
    }

    const payload = {
      unit_id: form.unit_id,
      name: form.name.trim(),
      address: form.address.trim() || null,
      active: form.active,
    };

    try {
      if (editing) {
        await updateLocation(editing.id, payload);
      } else {
        await createLocation(payload);
      }

      setOpen(false);

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Não foi possível salvar o local.");
    }
  }

  return (
    <>
      <CrudPage
        title="Locais"
        createLabel="Novo local"
        onCreate={handleCreate}
      >
        <CrudTable
          columns={[
            "Local",
            "Unidade",
            "Endereço",
            "Situação",
            "",
          ]}
          emptyMessage={
            loading
              ? "Carregando…"
              : "Nenhum local cadastrado."
          }
        >
          {locations.map((location) => (
            <tr
              key={location.id}
              className="border-t border-line"
            >
              <td className="px-4 py-3 font-medium">
                {location.name}
              </td>

              <td className="px-4 py-3">
                {location.unit?.name}
              </td>

              <td className="px-4 py-3">
                {location.address || (
                  <span className="text-muted">Sem endereço</span>
                )}
              </td>

              <td className="px-4 py-3">
                <StatusBadge active={location.active} />
              </td>

              <td className="px-4 py-2 text-right">
                <Button size="sm" variant="quiet" onClick={() => handleEdit(location)}>
                  Editar
                </Button>
              </td>
            </tr>
          ))}
        </CrudTable>
      </CrudPage>

      <CrudModal
        open={open}
        title={editing ? "Editar local" : "Novo local"}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      >
        <FormField label="Unidade">
          <select
            value={form.unit_id}
            onChange={(e) =>
              setForm({ ...form, unit_id: e.target.value })
            }
            className={inputClass}
          >
            <option value="">Selecione...</option>

            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Nome">
          <input
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            placeholder="Ex.: Ginásio do Krahe"
            className={inputClass}
          />
        </FormField>

        <FormField label="Endereço">
          <input
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
            placeholder="Rua, número, bairro"
            className={inputClass}
          />
        </FormField>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 accent-ink"
            checked={form.active}
            onChange={(e) =>
              setForm({ ...form, active: e.target.checked })
            }
          />

          <span>Local ativo</span>
        </label>

        {error && (
          <p className="text-sm font-medium text-alert-text">{error}</p>
        )}
      </CrudModal>
    </>
  );
}
