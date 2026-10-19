import { Link } from "react-router-dom";

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
