import { resetDemoData } from "./client";

/*
 * Faixa no topo do painel de demonstração: deixa claro que os dados
 * são fictícios e permite voltar ao estado inicial.
 */
export default function DemoBanner() {
  function handleReset() {
    resetDemoData();
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-ink px-4 py-2 text-center text-sm text-white">
      <span>
        <strong className="font-semibold">Demonstração</strong> com dados fictícios. O que você
        mudar fica só neste navegador.
      </span>

      <button
        type="button"
        onClick={handleReset}
        className="rounded-md px-2 py-0.5 font-semibold underline underline-offset-4 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        Restaurar dados
      </button>
    </div>
  );
}
