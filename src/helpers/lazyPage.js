import { lazy } from "react";

/*
 * Igual ao lazy() do React, mas recarrega a página quando a tela não
 * pode ser baixada.
 *
 * Isso acontece quando um deploy novo sai enquanto alguém está com o
 * site aberto: os arquivos da versão antiga deixam de existir e a
 * próxima troca de tela falha ("Failed to fetch dynamically imported
 * module"). Recarregando, a pessoa recebe a versão nova.
 *
 * Só recarrega uma vez a cada 10 s, para não entrar em loop quando o
 * problema é outro (sem internet, por exemplo); aí o erro segue.
 */
const RELOAD_KEY = "lazy-page-reloaded-at";
const RELOAD_WINDOW_MS = 10_000;

export function lazyPage(load) {
  return lazy(() =>
    load().catch((err) => {
      if (reloadedRecently()) throw err;

      markReload();
      window.location.reload();

      // A página vai recarregar; não renderiza nada até lá
      return new Promise(() => {});
    })
  );
}

function reloadedRecently() {
  try {
    const at = Number(sessionStorage.getItem(RELOAD_KEY));

    return Date.now() - at < RELOAD_WINDOW_MS;
  } catch {
    // Sem sessionStorage não dá para lembrar do recarregamento:
    // melhor não recarregar do que arriscar um loop
    return true;
  }
}

function markReload() {
  try {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Já tratado em reloadedRecently()
  }
}
