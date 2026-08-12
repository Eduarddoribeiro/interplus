export default function ConversationItem() {
  return (
    <button className="flex w-full items-start gap-4 border-b border-neutral-100 p-4 text-left transition hover:bg-neutral-50">

      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 font-bold text-white">
        J
      </div>

      <div className="min-w-0 flex-1">

        <div className="flex items-center justify-between">

          <h3 className="truncate font-semibold">
            João Pedro
          </h3>

          <span className="text-xs text-neutral-400">
            09:15
          </span>

        </div>

        <p className="text-sm text-neutral-500">
          Carlos (pai)
        </p>

        <p className="mt-1 truncate text-sm text-neutral-600">
          Boa tarde, gostaria de saber...
        </p>

        <div className="mt-3 flex items-center justify-between">

          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
            Novo contato
          </span>

          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white">
            2
          </span>

        </div>

      </div>

    </button>
  );
}