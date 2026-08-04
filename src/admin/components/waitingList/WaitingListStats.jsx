export default function WaitingListStats({
  total = 0,
  qualified = 0,
  incomplete = 0,
  morning = 0,
  night = 0,
  future = 0,
}) {
  const stats = [
    {
      label: "Famílias",
      value: total,
    },
    {
      label: "Cadastros qualificados",
      value: qualified,
    },
    {
      label: "Cadastros incompletos",
      value: incomplete,
    },
    {
      label: "Preferência manhã",
      value: morning,
    },
    {
      label: "Preferência noite",
      value: night,
    },
    {
      label: "Leads futuros",
      value: future,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="
            rounded-2xl
            border
            border-neutral-200
            bg-white
            p-5
          "
        >
          <p className="text-sm text-neutral-500">
            {stat.label}
          </p>

          <p className="mt-2 text-3xl font-bold text-neutral-900">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}