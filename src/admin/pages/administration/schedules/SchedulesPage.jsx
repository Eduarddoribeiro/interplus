import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import SectionTitle from "../../../../components/common/SectionTitle";

export default function SchedulesPage() {
  const navigate = useNavigate();

  const [schedules] = useState([]);

  return (
    <div className="space-y-8">

      <button
        onClick={() => navigate("/admin/administration")}
        className="flex items-center gap-2 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={18} />
        Administração
      </button>

      <div className="flex items-center justify-between">

        <SectionTitle
          title="Horários"
          subtitle="Gerencie os horários de cada turma."
        />

        <button className="flex items-center gap-2 rounded-xl bg-inter-red px-5 py-3 font-medium text-white hover:bg-inter-red-dark">
          <Plus size={18} />
          Novo horário
        </button>

      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white">

        <table className="min-w-full">

          <thead className="border-b border-line bg-canvas">

            <tr>

              <th className="px-6 py-4 text-left">Turma</th>

              <th className="px-6 py-4 text-left">Dia</th>

              <th className="px-6 py-4 text-left">Início</th>

              <th className="px-6 py-4 text-left">Fim</th>

              <th className="px-6 py-4 text-left">Experimental</th>

              <th className="px-6 py-4 text-left">Status</th>

              <th className="px-6 py-4 text-right">Ações</th>

            </tr>

          </thead>

          <tbody>

            {schedules.length === 0 ? (

              <tr>

                <td
                  colSpan={7}
                  className="px-6 py-16 text-center text-muted"
                >
                  Nenhum horário cadastrado.
                </td>

              </tr>

            ) : null}

          </tbody>

        </table>

      </div>

    </div>
  );
}