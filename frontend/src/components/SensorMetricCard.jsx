const RATING_COLORS = {
  "SEHR GUT": "bg-emerald-600/20 text-emerald-300 border-emerald-600/50",
  "GUT": "bg-green-600/20 text-green-300 border-green-600/50",
  "MAESSIG": "bg-amber-600/20 text-amber-300 border-amber-600/50",
  "SCHLECHT": "bg-orange-600/20 text-orange-300 border-orange-600/50",
  "SEHR SCHLECHT": "bg-red-600/20 text-red-300 border-red-600/50",
  "FREEZE": "bg-slate-500/20 text-slate-300 border-slate-500/50"
};

export default function SensorMetricCard({ label, value, unit, rating, frozen }) {
  const ratingCls = rating ? (RATING_COLORS[rating] || RATING_COLORS["FREEZE"]) : "";
  return (
    <div className={`aq-card flex flex-col gap-1 min-w-[140px] ${frozen ? 'opacity-70' : ''}`}>
      <div className="text-sm font-medium text-slate-300 flex items-center gap-2">
        {label}
        {frozen && <span className="text-[9px] px-1 py-0.5 rounded bg-slate-600/40 border border-slate-500">Freeze</span>}
      </div>
      <div className="text-xl font-semibold">
        {value == null ? '--' : value} {unit}
      </div>
      {rating && (
        <span className={`badge mt-auto border ${ratingCls}`}>
          {rating === 'FREEZE' ? '—' : rating}
        </span>
      )}
    </div>
  );
}
