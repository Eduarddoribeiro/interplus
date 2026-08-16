import LeadHeader from "./LeadHeader";
import LeadInfo from "./LeadInfo";
import LeadSummary from "./LeadSummary";
import LeadExperimental from "./LeadExperimental";

export default function LeadSidebar({
  conversation,
}) {
  if (!conversation) return null;

  return (
    <aside className="flex h-full flex-col gap-5 overflow-y-auto">

      <LeadHeader
        conversation={conversation}
      />

      <LeadInfo
        conversation={conversation}
      />

      <LeadSummary
        conversation={conversation}
      />

      <LeadExperimental
        conversation={conversation}
      />

    </aside>
  );
}