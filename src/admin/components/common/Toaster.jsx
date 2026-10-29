import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

/*
 * Avisos rápidos do painel (substitui o alert() do navegador).
 *
 *   import { toast } from ".../common/Toaster";
 *   toast("Não foi possível salvar.");            // erro (padrão)
 *   toast("Retorno salvo.", { type: "success" });
 *   toast("Marcado como veio.", {
 *     type: "success",
 *     action: { label: "Desfazer", onClick: () => ... },
 *   });
 *
 * Com ação, o aviso fica mais tempo (10 s). Passar o mouse ou o
 * foco por cima segura o aviso na tela.
 * O <Toaster /> fica uma vez só no Layout do painel.
 */

const EVENT = "admin-toast";

export function toast(message, { type = "error", action } = {}) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, type, action } }));
}

export default function Toaster() {
  const [items, setItems] = useState([]);

  function remove(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  useEffect(() => {
    function handle(event) {
      const id = `${Date.now()}-${Math.random()}`;

      setItems((current) => [...current, { id, ...event.detail }]);
    }

    window.addEventListener(EVENT, handle);

    return () => window.removeEventListener(EVENT, handle);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
      {items.map((item) => (
        <ToastItem key={item.id} item={item} onDone={() => remove(item.id)} />
      ))}
    </div>
  );
}

function ToastItem({ item, onDone }) {
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const remaining = useRef(item.action ? 10000 : 5000);
  const started = useRef(Date.now());
  const doneRef = useRef(onDone);

  doneRef.current = onDone;

  useEffect(() => {
    if (paused) return undefined;

    started.current = Date.now();
    const timer = window.setTimeout(() => doneRef.current(), remaining.current);

    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - started.current;
    };
  }, [paused]);

  async function handleAction() {
    setBusy(true);

    try {
      await item.action.onClick();
    } finally {
      onDone();
    }
  }

  const success = item.type === "success";

  return (
    <div
      role={success ? "status" : "alert"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-[0_12px_40px_rgba(28,31,36,0.25)]"
    >
      {success ? (
        <CheckCircle2 size={18} aria-hidden="true" className="shrink-0 text-green-400" />
      ) : (
        <AlertCircle size={18} aria-hidden="true" className="shrink-0 text-red-400" />
      )}

      <p className="flex-1">{item.message}</p>

      {item.action ? (
        <button
          type="button"
          onClick={handleAction}
          disabled={busy}
          className="shrink-0 rounded-md px-2 py-1 font-semibold text-white underline underline-offset-4 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-60"
        >
          {busy ? "Desfazendo…" : item.action.label}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onDone}
        className="shrink-0 rounded-md p-1 text-neutral-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        aria-label="Fechar aviso"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
