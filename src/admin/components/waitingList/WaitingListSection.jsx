import WaitingListList from "./WaitingListList";

export default function WaitingListSection({
  group,
  onAction,
}) {
  if (!group?.items?.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4 border-b border-neutral-200 pb-3">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            {group.title}
          </h2>

          {group.description && (
            <p className="mt-1 text-sm text-neutral-500">
              {group.description}
            </p>
          )}
        </div>

        <span className="shrink-0 text-sm font-semibold text-neutral-500">
          {group.items.length}
        </span>
      </div>

      <WaitingListList
        items={group.items}
        onAction={onAction}
      />
    </section>
  );
}