export default function CrudTable({
  columns = [],
  children,
  emptyMessage = "Nenhum registro encontrado.",
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">

      <table className="min-w-full">

        <thead className="border-b border-neutral-200 bg-neutral-50">

          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="px-6 py-4 text-left text-sm font-semibold"
              >
                {column}
              </th>
            ))}
          </tr>

        </thead>

        <tbody>

          {children || (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-16 text-center text-neutral-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}

        </tbody>

      </table>

    </div>
  );
}