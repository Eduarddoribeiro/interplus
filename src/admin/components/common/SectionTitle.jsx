/*
 * Cabeçalho das páginas do painel: título em Teko (sem caixa alta)
 * e, opcionalmente, um resumo de uma linha e as ações à direita.
 *
 * `description` (texto explicativo antigo) não é mais exibido:
 * quem usa o painel todo dia já sabe o que a tela faz. Use
 * `summary` para um resumo curto com dados ("7 nesta semana").
 */
export default function SectionTitle({ title, summary, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[2.6rem] font-semibold leading-[0.9] text-ink">
          {title}
        </h1>

        {summary && <p className="mt-1 text-sm text-muted">{summary}</p>}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
