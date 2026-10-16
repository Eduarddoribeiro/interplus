export default function FormField({
  label,
  children,
}) {
  return (
    <div className="space-y-2">

      <label className="text-sm font-medium text-neutral-700">
        {label}
      </label>

      {children}

    </div>
  );
}