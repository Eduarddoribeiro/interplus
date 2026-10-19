import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { getDashboardData } from "../../services/dashboard";

// Não busca de novo antes disso ao trocar de tela
const MIN_INTERVAL_MS = 60 * 1000;

/*
 * Pendências mostradas no menu (mesma conta da Visão geral).
 * Atualiza ao abrir o painel, ao voltar para a aba do navegador,
 * ao trocar de tela (no máximo 1x por minuto) e quando `version`
 * muda (contato criado).
 */
export default function usePendingCounts(version) {
  const [pending, setPending] = useState(null);
  const lastLoad = useRef(0);
  const location = useLocation();

  const load = useCallback(async (force = false) => {
    if (!force && Date.now() - lastLoad.current < MIN_INTERVAL_MS) return;

    lastLoad.current = Date.now();

    try {
      const data = await getDashboardData();
      setPending(data.pending);
    } catch (err) {
      // O menu funciona sem os números
      console.error("Erro ao carregar pendências do menu:", err);
    }
  }, []);

  useEffect(() => {
    load(true);
  }, [load, version]);

  useEffect(() => {
    load();
  }, [load, location.pathname]);

  useEffect(() => {
    function handleFocus() {
      if (document.visibilityState === "visible") load();
    }

    document.addEventListener("visibilitychange", handleFocus);
    return () => document.removeEventListener("visibilitychange", handleFocus);
  }, [load]);

  return pending;
}
