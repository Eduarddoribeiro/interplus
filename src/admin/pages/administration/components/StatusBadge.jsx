export default function StatusBadge({
  active,
}) {
  return active ? (
    <span className="rounded-full bg-ok-soft px-3 py-1 text-xs font-medium text-ok">
      Ativo
    </span>
  ) : (
    <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600">
      Inativo
    </span>
  );
}