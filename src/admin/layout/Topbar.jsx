import { Menu, Plus } from "lucide-react";

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";

  return "Boa noite";
}

export default function Topbar({
  onNewContact,
  onOpenMenu,
}) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:min-h-20 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {/* Menu no celular */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-xl border border-neutral-200 p-2.5 text-neutral-700 hover:bg-neutral-50 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-neutral-900 sm:text-xl lg:text-2xl">
            {greeting()}, Eduardo 👋
          </h2>

          <p className="mt-1 hidden text-sm text-neutral-500 sm:block">
            Gestão de contatos e oportunidades.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onNewContact}
          className="flex items-center justify-center gap-2 rounded-xl bg-inter-red px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a80e24]"
        >
          <Plus size={18} />

          <span className="hidden sm:inline">Novo contato</span>
          <span className="sm:hidden">Contato</span>
        </button>

        <div className="hidden h-11 w-11 items-center justify-center rounded-full bg-inter-red font-bold text-white sm:flex">
          E
        </div>
      </div>
    </header>
  );
}
