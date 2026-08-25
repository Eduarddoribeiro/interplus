import CrudModal from "../components/CrudModal";
import FormField from "../components/FormField";

export default function CategoryModal({
  open,
  editing,
  form,
  onChange,
  onClose,
  onSave,
}) {
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

        <FormField label="Data mínima de nascimento">
          <input
            type="date"
            name="min_birth_date"
            value={form.min_birth_date}
            onChange={onChange}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />
        </FormField>

        <FormField label="Data máxima de nascimento">
          <input
            type="date"
            name="max_birth_date"
            value={form.max_birth_date}
            onChange={onChange}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />
        </FormField>

      </div>

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
