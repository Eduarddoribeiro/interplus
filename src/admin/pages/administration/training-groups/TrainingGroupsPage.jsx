import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CrudPage from "../components/CrudPage";
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
    <CrudPage
      title="Turmas"
      createLabel="Nova turma"
      onCreate={() => navigate("/admin/administration/training-groups/new")}
    >
      <TrainingGroupsTable groups={groups} loading={loading} />
    </CrudPage>
  );
}
