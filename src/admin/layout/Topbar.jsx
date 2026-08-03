import { Plus } from "lucide-react";

export default function Topbar({
  onNewContact,
}) {
  return (
    <header
      className="
        flex
        min-h-20
        items-center
        justify-between
        gap-4
        border-b
        border-neutral-200
        bg-white
        px-6
        py-4
        lg:px-8
      "
    >
      {/* SAUDAÇÃO */}

      <div className="min-w-0">
        <h2 className="text-xl font-bold text-neutral-900 lg:text-2xl">
          Bom dia, Eduardo 👋
        </h2>

        <p className="mt-1 hidden text-sm text-neutral-500 sm:block">
          Gestão de contatos e oportunidades.
        </p>
      </div>

      {/* AÇÕES */}

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onNewContact}
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-inter-red
            px-4
            py-3
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-[#a80e24]
          "
        >
          <Plus size={18} />

          <span className="hidden sm:inline">
            Novo contato
          </span>

          <span className="sm:hidden">
            Contato
          </span>
        </button>

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-full
            bg-inter-red
            font-bold
            text-white
          "
        >
          E
        </div>
      </div>
    </header>
  );
}