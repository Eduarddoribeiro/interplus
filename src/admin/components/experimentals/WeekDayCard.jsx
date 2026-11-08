
import { formatDayMonth, getWeekdayShort, getWeekdayLong } from "../../../helpers/experimentalDates";

export default function WeekDayCard({
  day,
  today,
  active,
  onClick,
}) {
  const isToday = day.date === today;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${getWeekdayLong(day.date)}, ${formatDayMonth(day.date)}: ${day.total} ${day.total === 1 ? "aula" : "aulas"}${day.pending ? `, ${day.pending} a confirmar` : ""}`}
      className={`flex flex-col items-center rounded-lg px-1 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${
        active ? "bg-ink text-white" : "hover:bg-canvas"
      }`}
    >
      <span className={`text-xs ${active ? "text-white/80" : isToday ? "font-semibold text-ink" : "text-muted"}`}>
        {isToday ? "Hoje" : getWeekdayShort(day.date)}
      </span>

      <span className="text-sm tabular-nums">{formatDayMonth(day.date)}</span>

      <span
        className={`mt-1 font-display text-2xl font-semibold leading-none tabular-nums ${
          active ? "text-white" : day.total ? "text-ink" : "font-normal text-muted"
        }`}
      >
        {day.total}
      </span>

      {day.pending > 0 && (
        <span className={`mt-1 h-1 w-6 rounded-full ${active ? "bg-white/70" : "bg-attention"}`} aria-hidden="true" />
      )}
    </button>
  );
}
