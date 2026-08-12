import LeadHeader from "./LeadHeader";
import LeadInfo from "./LeadInfo";
import LeadHistory from "./LeadHistory";
import LeadExperimental from "./LeadExperimental";
import LeadActions from "./LeadActions";

export default function LeadPanel() {
  return (
    <aside className="flex h-full flex-col gap-4 overflow-hidden">

      <LeadHeader />

      <div className="flex-1 space-y-4 overflow-y-auto">

        <LeadInfo />

        <LeadHistory />

        <LeadExperimental />

      </div>

      <LeadActions />

    </aside>
  );
}