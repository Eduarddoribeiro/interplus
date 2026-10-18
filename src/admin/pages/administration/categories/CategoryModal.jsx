import CrudModal from "../components/CrudModal";
import FormField from "../components/FormField";

import { birthYearsOf, currentYear } from "../../../../helpers/categoryAge";

export default function CategoryModal({
  open,
  editing,
  form,
  onChange,
  onClose,
  onSave,
}) {
  const years =
    form.min_age !== "" && form.max_age !== ""
      ? birthYearsOf({ min_age: Number(form.min_age), max_age: Number(form.max_age) })
      : null;

  return (
    <CrudModal
      open={open}
      title={
        editing
          ? "Editar Categoria"
          : "Nova Categoria"
      }
      onClose={onClose}
      onSave={onSave}
    >
      <FormField label="Nome">
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-5">

        <FormField label="Idade no ano: de">
          <input
            type="number"
            min="0"
            name="min_age"
            value={form.min_age}
            onChange={onChange}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />
        </FormField>

        <FormField label="até">
          <input
            type="number"
            min="0"
            name="max_age"
            value={form.max_age}
            onChange={onChange}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />
        </FormField>

      </div>

      <p className="-mt-2 text-sm text-neutral-500">
        Idade que o atleta completa no ano (ex.: Sub-09 = 8 a 9).
        {years && (
          <>
            {" "}Em {currentYear()}: nascidos em{" "}
            <strong>
              {years.from === years.to ? years.from : `${years.from} a ${years.to}`}
            </strong>
            . Muda sozinho na virada do ano.
          </>
        )}
      </p>

      <FormField label="Ordem">
        <input
          type="number"
          min="0"
          name="order_index"
          value={form.order_index}
          onChange={onChange}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3"
        />
      </FormField>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="active"
          checked={form.active}
          onChange={onChange}
        />

        <span>Categoria ativa</span>
      </label>
    </CrudModal>
  );
}
