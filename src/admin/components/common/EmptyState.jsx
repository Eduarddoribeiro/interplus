export default function EmptyState({
  title,
  description
}) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">

      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-neutral-500">
        {description}
      </p>

    </div>
  )
}