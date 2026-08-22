import { useEffect, useState } from "react";

import { Pencil } from "lucide-react";

import { getCategories } from "../../../../services/categories";

export default function CategoriesTable() {

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await getCategories();

      setCategories(data);

    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">

      <table className="w-full">

        <thead className="bg-neutral-50">

          <tr>

            <th className="px-6 py-4 text-left">
              Categoria
            </th>

            <th className="px-6 py-4 text-left">
              Dia
            </th>

            <th className="px-6 py-4 text-left">
              Horário
            </th>

            <th className="px-6 py-4 text-center">
              Experimentais
            </th>

            <th className="px-6 py-4 text-center">
              Status
            </th>

            <th className="px-6 py-4 text-right">
            </th>

          </tr>

        </thead>

        <tbody>

          {categories.map((category) => (

            <tr
              key={category.id}
              className="border-t"
            >

              <td className="px-6 py-5 font-medium">
                {category.name}
              </td>

              <td className="px-6 py-5">
                {category.weekday}
              </td>

              <td className="px-6 py-5">
                {category.start_time} - {category.end_time}
              </td>

              <td className="px-6 py-5 text-center">
                {category.experimental_limit}
              </td>

              <td className="px-6 py-5 text-center">

                <span
                  className={`
                    rounded-full
                    px-3
                    py-1
                    text-xs
                    font-semibold

                    ${
                      category.trial_status === "open"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  `}
                >
                  {category.trial_status}
                </span>

              </td>

              <td className="px-6 py-5 text-right">

                <button
                  className="rounded-xl p-2 transition hover:bg-neutral-100"
                >
                  <Pencil size={18} />
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}