import WaitingListCard from "../followUps/WaitingListCard";

export default function WaitingListList({
  items,
  onAction,
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <WaitingListCard
          key={item.id}
          item={item}
          onAction={onAction}
        />
      ))}
    </div>
  );
}