import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import SectionTitle from "../../../components/common/SectionTitle";

export default function LocationsPage() {
  const navigate = useNavigate();

  const [locations] = useState([]);

  return (
    <div className="space-y-8">

      <button
        onClick={() => navigate("/admin/administration")}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={18} />
        Voltar para Administração
      </button>

      <div className="flex items-center justify-between">

        <SectionTitle
          title="Localizações"
          subtitle="Gerencie as quadras e ginásios onde acontecem os treinamentos."
        />

        <button
          className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-700"
        >
          <Plus size={18} />
          Nova Localização
        </button>

      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">

        <table className="min-w-full">

          <thead className="border-b border-neutral-200 bg-neutral-50">

            <tr>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Unidade
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Localização
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Endereço
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Status
              </th>

              <th className="px-6 py-4 text-right text-sm font-semibold">
                Ações
              </th>

            </tr>

          </thead>

          <tbody>

            {locations.length === 0 ? (

              <tr>

                <td
                  colSpan={5}
                  className="px-6 py-16 text-center text-neutral-500"
                >
                  Nenhuma localização cadastrada.
                </td>

              </tr>

            ) : (

              locations.map((location) => (
                <tr
                  key={location.id}
                  className="border-b border-neutral-100"
                >

                  <td className="px-6 py-4">
                    {location.unit?.name}
                  </td>

                  <td className="px-6 py-4">
                    {location.name}
                  </td>

                  <td className="px-6 py-4">
                    {location.address}
                  </td>

                  <td className="px-6 py-4">
                    {location.active ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        Ativa
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600">
                        Inativa
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">

                    <button className="rounded-lg border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-100">
                      Editar
                    </button>

                  </td>

                </tr>
              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}