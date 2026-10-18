const STEPS = ["Atleta", "Horário", "Responsável", "Revisão"];

export default function ProgressBar({ current, total }) {
  const progress = ((current - 1) / (total - 1)) * 100;

  return (
    <div className="pb-5 sm:pb-7">
      <div className="flex items-center justify-between text-xs font-semibold sm:text-sm">
        <span className="text-red-600">
          Etapa {current} de {total}
        </span>

        <span className="text-neutral-500">{STEPS[current - 1]}</span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-red-600 transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(progress, 6)}%` }}
        />
      </div>
    </div>
  );
}
