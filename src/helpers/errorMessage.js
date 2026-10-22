/*
 * Texto de erro para mostrar na tela.
 *
 * Os serviços lançam `new Error("...")` com mensagens em português
 * (validações); essas aparecem como estão. Erros do Supabase/rede
 * trazem `code` ou `details` em inglês técnico, então usamos o texto
 * de reserva, que diz o que falhou e o que fazer.
 */
export function errorMessage(err, fallback) {
  const isOwnMessage =
    err instanceof Error &&
    !("code" in err) &&
    !("details" in err) &&
    !/fetch|network|jwt|violates|duplicate key|permission|row-level/i.test(err.message);

  return isOwnMessage && err.message ? err.message : fallback;
}
