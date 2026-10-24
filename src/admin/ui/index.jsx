import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

/*
 * Peças visuais comuns do painel.
 *
 * Regras (plano visual aprovado):
 * - Vermelho do Inter só na ação principal da tela (Button "primary").
 * - Selecionado = tinta (ink); nada de vermelho em filtros e abas.
 * - Urgência pela faixa lateral: vermelho = atrasado, âmbar = atenção,
 *   sempre com o texto dizendo o motivo.
 * - Cantos: 8px em controles, 12px em painéis. Sem sombra.
 */

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const BUTTON_VARIANTS = {
  primary: "bg-inter-red text-white hover:bg-inter-red-dark",
  // Ação principal quando a tela já tem o vermelho da marca (login)
  ink: "bg-ink text-white hover:bg-neutral-800",
  secondary: "border border-line bg-white text-ink hover:border-neutral-400",
  quiet: "text-muted hover:bg-neutral-100 hover:text-ink",
  whatsapp: "border border-line bg-white text-whatsapp hover:border-whatsapp",
};

export function buttonClass(variant = "secondary", size = "md") {
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
  };

  return `inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS} ${sizes[size]} ${BUTTON_VARIANTS[variant]}`;
}

export function Button({ variant = "secondary", size = "md", className = "", to, ...props }) {
  const classes = `${buttonClass(variant, size)} ${className}`;

  if (to) return <Link to={to} className={classes} {...props} />;

  return <button type="button" className={classes} {...props} />;
}

/*
 * Abas com contador. items: [{ value, label, count, urgency }]
 * urgency ("alert" | "attention") pinta só o contador.
 */
export function Tabs({ items, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const selected = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.value)}
            className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${FOCUS} ${
              selected ? "bg-ink text-white" : "text-muted hover:bg-neutral-100 hover:text-ink"
            }`}
          >
            {item.label}
            {item.count != null && (
              <Count value={item.count} urgency={item.urgency} inverted={selected} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Número pequeno ao lado de um rótulo (abas, menu)
export function Count({ value, urgency, inverted = false }) {
  const tone = inverted
    ? "bg-white/15 text-white"
    : urgency === "alert"
      ? "bg-alert-soft text-alert-text"
      : urgency === "attention"
        ? "bg-attention-soft text-attention-text"
        : "bg-neutral-100 text-muted";

  return (
    <span className={`min-w-6 rounded-md px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums ${tone}`}>
      {value}
    </span>
  );
}

export function Panel({ as: Tag = "section", className = "", ...props }) {
  return <Tag className={`rounded-xl border border-line bg-white ${className}`} {...props} />;
}

// Faixa lateral de urgência (aplicar na linha/linha de lista)
export function urgencyRail(urgency) {
  if (urgency === "alert") return "border-l-[3px] border-l-alert";
  if (urgency === "attention") return "border-l-[3px] border-l-attention";

  return "border-l-[3px] border-l-transparent";
}

// Texto de urgência que acompanha a faixa ("Atrasado há 3 dias")
export function urgencyText(urgency) {
  if (urgency === "alert") return "text-alert-text";
  if (urgency === "attention") return "text-attention-text";

  return "text-muted";
}

// Campos de formulário (input, select, textarea)
export const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-neutral-500 transition-colors focus:border-ink focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:bg-canvas disabled:text-muted";

const DIALOG_SIZES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/*
 * Janela sobre a tela. Título diz a ação ("Agendar experimental");
 * description traz de quem/o quê. Esc e clique fora fecham, exceto
 * com busy (salvando). O foco fica preso na janela e volta para
 * onde estava ao fechar.
 */
export function Dialog({ open, onClose, title, description, size = "md", busy = false, footer, children }) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  const titleId = useId();
  const descriptionId = useId();

  closeRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    if (!open) return undefined;

    const previous = document.activeElement;
    const panel = panelRef.current;
    const overflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const first = panel?.querySelector("[data-autofocus]") || panel?.querySelector(FOCUSABLE);
    (first || panel)?.focus();

    function handleKey(event) {
      if (event.key === "Escape" && !busyRef.current) {
        event.stopPropagation();
        closeRef.current?.();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((item) => item.offsetParent !== null);
      if (!items.length) return;

      const firstItem = items[0];
      const lastItem = items[items.length - 1];

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`flex max-h-[92dvh] w-full ${DIALOG_SIZES[size]} flex-col overflow-hidden rounded-t-xl bg-white shadow-[0_12px_40px_rgba(28,31,36,0.18)] outline-none sm:rounded-xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-[1.75rem] font-semibold leading-none">
              {title}
            </h2>

            {description ? (
              <p id={descriptionId} className="mt-1.5 text-sm text-muted">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Fechar"
            className={`-mr-2 -mt-1 rounded-lg p-2 text-muted transition-colors hover:bg-neutral-100 hover:text-ink disabled:opacity-50 ${FOCUS}`}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>

        {footer ? <div className="border-t border-line px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

// Botões do rodapé de uma janela: cancelar à esquerda da ação
export function DialogActions({ children, className = "" }) {
  return (
    <div className={`flex flex-col-reverse gap-2 sm:flex-row sm:justify-end ${className}`}>
      {children}
    </div>
  );
}
