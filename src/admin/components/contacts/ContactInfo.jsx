// src/admin/components/contacts/ContactInfo.jsx

export default function ContactInfo({
  label,
  value,
  fallback = null,
  className = "",
}) {
  const hasValue =
    value !== null &&
    value !== undefined &&
    value !== "";

  if (!hasValue && !fallback) {
    return null;
  }

  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-neutral-900">
        {hasValue ? value : fallback}
      </p>
    </div>
  );
}