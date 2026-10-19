import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}) {

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

      <div className="w-full max-w-md rounded-xl bg-white p-8">

        <div className="flex justify-center">

          <AlertTriangle
            className="text-red-500"
            size={40}
          />

        </div>

        <h2 className="mt-4 text-center text-xl font-bold">
          {title}
        </h2>

        <p className="mt-2 text-center text-muted">
          {description}
        </p>

        <div className="mt-8 flex justify-end gap-3">

          <button
            onClick={onCancel}
            className="rounded-xl border border-neutral-300 px-5 py-2"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="rounded-xl bg-inter-red px-5 py-2 text-white"
          >
            Confirmar
          </button>

        </div>

      </div>

    </div>
  );
}