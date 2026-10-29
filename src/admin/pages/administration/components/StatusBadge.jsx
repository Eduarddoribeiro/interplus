// Situação de um cadastro: texto colorido, sem pílula
export default function StatusBadge({ active }) {
  return active ? (
    <span className="font-medium text-ok">Ativo</span>
  ) : (
    <span className="text-muted">Inativo</span>
  );
}
