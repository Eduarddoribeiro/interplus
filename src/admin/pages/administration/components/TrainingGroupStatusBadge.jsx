import { TRAINING_GROUP_STATUS_BY_VALUE } from "../../../../constants/trainingGroupStatus";

export default function TrainingGroupStatusBadge({ status }) {
  const option = TRAINING_GROUP_STATUS_BY_VALUE[status];

  if (!option) return <span>-</span>;

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${option.badge}`}
    >
      {option.label}
    </span>
  );
}
