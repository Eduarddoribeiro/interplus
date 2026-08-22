import { useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import SectionTitle from "../../../components/common/SectionTitle";

import { getTrainingGroups } from "../../../../services/administration/trainingGroups";

import TrainingGroupsTable from "./TrainingGroupsTable";

export default function TrainingGroupsPage() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      const data = await getTrainingGroups();
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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
          title="Turmas"
          subtitle="Gerencie as turmas e seus horários."
        />

        <button
          onClick={() =>
            navigate("/admin/administration/training-groups/new")
          }
          className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700"
        >
          <Plus size={18} />
          Nova Turma
        </button>

      </div>

      <TrainingGroupsTable
        groups={groups}
        loading={loading}
        onReload={loadGroups}
      />

    </div>
  );
}