/*
 * Quadro de demanda da lista de interesse.
 *
 * Linhas = categorias, colunas = locais (+ "qualquer local").
 * Cada célula mostra quantas famílias querem aquela combinação;
 * o ponto verde indica turma aberta com vaga agora. Clicar numa
 * célula filtra a lista abaixo.
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
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
            Quadro de demanda
          </p>

          <h2 className="mt-1 text-lg font-bold text-neutral-900">
            Quantas famílias querem cada idade e local
          </h2>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-neutral-500">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          turma aberta com vaga agora
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="py-2 pr-3 font-semibold">Categoria</th>

              {columns.map((column) => (
                <th key={column.key} className="px-2 py-2 text-center font-semibold">
                  {column.name}
                </th>
              ))}

              <th className="px-2 py-2 text-center font-semibold">Total</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-neutral-100">
                <td className="py-1.5 pr-3 font-semibold text-neutral-800">
                  {row.name}
                </td>

                {columns.map((column) => {
                  const count = row.cells[column.key] ?? 0;
                  const vacancy = row.hasVacancy[column.key];
                  const active = isSelected(row.key, column.key);

                  return (
                    <td key={column.key} className="px-1 py-1 text-center">
                      <button
                        type="button"
                        disabled={!count}
                        onClick={() =>
                          onSelect(
                            active ? null : { rowKey: row.key, columnKey: column.key },
                          )
                        }
                        className={`relative w-full min-w-[56px] rounded-lg px-2 py-2 font-bold transition ${
                          active
                            ? "bg-red-600 text-white"
                            : count
                              ? "bg-neutral-100 text-neutral-900 hover:bg-red-50"
                              : "cursor-default text-neutral-300"
                        }`}
                      >
                        {count || "–"}

                        {vacancy && (
                          <span
                            title="Turma aberta com vaga agora"
                            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-green-500"
                          />
                        )}
                      </button>
                    </td>
                  );
                })}

                <td className="px-2 py-1.5 text-center font-semibold text-neutral-500">
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
