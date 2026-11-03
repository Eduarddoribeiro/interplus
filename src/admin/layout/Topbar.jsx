import { Menu } from "lucide-react";

/*
 * Barra do topo só no celular: abre o menu (com um ponto quando
 * algum item do menu tem contador). No computador o menu
 * fica fixo e cada página tem o próprio cabeçalho.
 */
export default function Topbar({ onOpenMenu, alert }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white px-3 lg:hidden">
      <button
        type="button"
        onClick={onOpenMenu}
        className="relative rounded-lg p-2.5 text-ink hover:bg-neutral-100"
        aria-label={alert ? "Abrir menu, há pendências" : "Abrir menu"}
      >
        <Menu size={20} />
        {/* Com o menu fechado, o ponto avisa que há algo a fazer lá dentro */}
        {alert && (
          <span
            aria-hidden="true"
            className={`absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
              alert.urgency === "alert" ? "bg-alert" : "bg-attention"
            }`}
          />
        )}
      </button>

      <img
        src="/logo-recorte-vermelho.svg"
        alt="Escola Oficial do Inter"
        width={92}
        height={37}
        className="h-auto w-[92px]"
      />
    </header>
  );
}
