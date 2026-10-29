import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import CrudPage from "../components/CrudPage";
import { getTrainingGroups } from "../../../../services/administration/trainingGroups";
import { TRAINING_GROUP_STATUS } from "../../../../constants/trainingGroupStatus";
import { Tabs } from "../../../ui";

import TrainingGroupsTable from "./TrainingGroupsTable";

export default function TrainingGroupsPage() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("current");

  // Inativas ficam guardadas numa aba à parte, fora da lista do dia a dia
  const { current, inactive } = useMemo(
    () => ({
      current: groups.filter((group) => group.status !== TRAINING_GROUP_STATUS.INACTIVE),
      inactive: groups.filter((group) => group.status === TRAINING_GROUP_STATUS.INACTIVE),
    }),
    [groups],
  );

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
    <CrudPage
      title="Turmas"
      createLabel="Nova turma"
      onCreate={() => navigate("/admin/administration/training-groups/new")}
    >
      <Tabs
        label="Turmas"
        value={view}
        onChange={setView}
        items={[
          { value: "current", label: "Em uso", count: current.length },
          { value: "inactive", label: "Inativas", count: inactive.length },
        ]}
      />

      <TrainingGroupsTable
        groups={view === "inactive" ? inactive : current}
        loading={loading}
        emptyMessage={
          view === "inactive"
            ? "Nenhuma turma inativa."
            : "Nenhuma turma em uso. Cadastre uma em Nova turma."
        }
      />
    </CrudPage>
  );
}
