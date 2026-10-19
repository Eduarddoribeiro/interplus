/*
 * Quadro de demanda da lista de interesse.
 *
 * Linhas = categorias, colunas = locais (+ "qualquer local").
 * Cada célula mostra quantas famílias querem aquela combinação;
 * célula verde = turma aberta com vaga agora. Clicar numa célula
 * filtra a lista abaixo.
 */
export default function WaitingListDemandMatrix({
  matrix,
  selected,
  onSelect,
}) {
  const { columns, rows } = matrix;

  if (!rows.length) return null;

  function isSelected(rowKey, columnKey) {
    return selected?.rowKey === rowKey && selected?.columnKey === columnKey;
  }

  return (
    <section aria-labelledby="demanda" className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="demanda" className="font-semibold">
          Quantas famílias querem cada idade e local
        </h2>

        <p className="flex items-center gap-2 text-sm text-muted">
          <span aria-hidden="true" className="h-3 w-5 rounded bg-ok-soft ring-1 ring-ok/40" />
          Tem turma com vaga agora
        </p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th scope="col" className="py-2 pr-3 font-medium">Categoria</th>

              {columns.map((column) => (
                <th key={column.key} scope="col" className="px-2 py-2 text-center font-medium">
                  {column.name}
                </th>
              ))}

              <th scope="col" className="px-2 py-2 text-center font-medium">Total</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-line">
                <th scope="row" className="py-1.5 pr-3 text-left font-semibold">
                  {row.name}
                </th>

                {columns.map((column) => {
                  const count = row.cells[column.key] ?? 0;
                  const vacancy = row.hasVacancy[column.key];
                  const active = isSelected(row.key, column.key);

                  if (!count) {
                    return <td key={column.key} className="px-1 py-1" />;
                  }

                  return (
                    <td key={column.key} className="px-1 py-1 text-center">
                      <button
                        type="button"
                        aria-pressed={active}
                        aria-label={`${row.name}, ${column.name}: ${count} famílias${vacancy ? ", tem turma com vaga agora" : ""}`}
                        onClick={() =>
                          onSelect(
                            active ? null : { rowKey: row.key, columnKey: column.key },
                          )
                        }
                        className={`h-9 w-full min-w-[56px] rounded-lg font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${
                          active
                            ? "bg-ink text-white"
                            : vacancy
                              ? "bg-ok-soft text-ok ring-1 ring-ok/40 hover:bg-ok/15"
                              : "bg-canvas hover:bg-neutral-200"
                        }`}
                      >
                        {count}
                      </button>
                    </td>
                  );
                })}

                <td className="px-2 py-1.5 text-center tabular-nums text-muted">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
