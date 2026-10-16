export default function StatusBadge({
  active,
}) {
  return active ? (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
      Ativo
    </span>
  ) : (
    <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600">
      Inativo
    </span>
  );
}