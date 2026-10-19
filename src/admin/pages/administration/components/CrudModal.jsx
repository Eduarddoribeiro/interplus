import { X } from "lucide-react";

export default function CrudModal({
  open,
  title,
  children,
  onClose,
  onSave,
}) {

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">

        <div className="flex items-center justify-between border-b border-line p-6">

          <h2 className="text-xl font-bold">
            {title}
          </h2>

          <button onClick={onClose}>

            <X size={20}/>

          </button>

        </div>

        <div className="space-y-5 p-6">

          {children}

        </div>

        <div className="flex justify-end gap-3 border-t border-line p-6">

          <button
            onClick={onClose}
            className="rounded-xl border border-neutral-300 px-5 py-2"
          >
            Cancelar
          </button>

          <button
            onClick={onSave}
            className="rounded-xl bg-inter-red px-5 py-2 text-white"
          >
            Salvar
          </button>

        </div>

      </div>

    </div>
  );
}