import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

/*
 * Avisos rápidos do painel (substitui o alert() do navegador).
 *
 *   import { toast } from ".../common/Toaster";
 *   toast("Não foi possível salvar.");            // erro (padrão)
 *   toast("Retorno salvo.", { type: "success" });
 *
 * O <Toaster /> fica uma vez só no Layout do painel.
 */

const EVENT = "admin-toast";

export function toast(message, { type = "error" } = {}) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, type } }));
}

export default function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    function handle(event) {
      const id = `${Date.now()}-${Math.random()}`;

      setItems((current) => [...current, { id, ...event.detail }]);

      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 5000);
    }

    window.addEventListener(EVENT, handle);

    return () => window.removeEventListener(EVENT, handle);
  }, []);

  if (!items.length) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
      {items.map((item) => (
        <div
          key={item.id}
          role="alert"
          className="flex w-full max-w-md items-start gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-2xl"
        >
          {item.type === "success" ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-400" />
          ) : (
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
          )}

          <p className="flex-1">{item.message}</p>

          <button
            type="button"
            onClick={() =>
              setItems((current) => current.filter((other) => other.id !== item.id))
            }
            className="text-muted hover:text-white"
            aria-label="Fechar aviso"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
