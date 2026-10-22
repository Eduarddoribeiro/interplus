import { TRAINING_GROUP_STATUS_BY_VALUE } from "../../../../constants/trainingGroupStatus";

export default function TrainingGroupStatusBadge({ status }) {
  const option = TRAINING_GROUP_STATUS_BY_VALUE[status];

  if (!option) return <span className="text-muted">—</span>;

  return <span className={`font-medium ${option.tone}`}>{option.label}</span>;
}
