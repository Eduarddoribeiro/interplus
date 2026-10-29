import { Children } from "react";

/*
 * Tabela dos cadastros. Rola para o lado em telas estreitas em vez
 * de cortar colunas.
 */
export const cellClass = "px-4 py-3 align-top";

export default function CrudTable({
  columns = [],
  children,
  emptyMessage = "Nenhum registro encontrado.",
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="min-w-full text-sm">
        <thead className="border-b border-line">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Children.toArray(children).length ? children : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-muted">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
