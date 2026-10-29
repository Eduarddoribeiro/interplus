import {
  PREFERRED_DAY_OPTIONS,
} from "../../../constants/preferredDays";

export default function DaySelector({
  value = [],
  onChange,
  disabled = false,
}) {
  function toggleDay(day) {
    if (disabled) return;

    const current = Array.isArray(value) ? value : [];

    const exists = current.includes(day);

    const next = exists
      ? current.filter((item) => item !== day)
      : [...current, day];

    onChange?.(next.length ? next : null);
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700">
        Dias preferidos
      </label>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {PREFERRED_DAY_OPTIONS.map((day) => {
          const selected =
            Array.isArray(value) &&
            value.includes(day.value);

          return (
            <button
              key={day.value}
              type="button"
              disabled={disabled}
              onClick={() => toggleDay(day.value)}
              className={`
                rounded-xl
                border
                px-4
                py-3
                text-sm
                font-medium
                transition-all
                ${
                  selected
                    ? "border-inter-red bg-inter-red text-white"
                    : "border-line bg-white text-neutral-700 hover:border-inter-red"
                }
                ${
                  disabled
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }
              `}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}