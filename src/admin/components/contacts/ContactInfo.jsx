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
      <p className="text-sm font-medium text-muted">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-ink">
        {hasValue ? value : fallback}
      </p>
    </div>
  );
}