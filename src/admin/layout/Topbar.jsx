import { Menu } from "lucide-react";

/*
 * Barra do topo só no celular: abre o menu. No computador o menu
 * fica fixo e cada página tem o próprio cabeçalho.
 */
export default function Topbar({ onOpenMenu }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white px-3 lg:hidden">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-lg p-2.5 text-ink hover:bg-neutral-100"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      <img
        src="/logo-vermelho.png"
        alt="Escola Oficial do Inter"
        width={104}
        height={40}
        className="h-10 w-[104px] object-cover"
      />
    </header>
  );
}
