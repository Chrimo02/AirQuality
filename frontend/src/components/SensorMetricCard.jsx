const RATING_COLORS = {
  "SEHR GUT": "bg-emerald-500/15 text-emerald-700 border-emerald-400/60",
  "GUT": "bg-green-500/15 text-green-700 border-green-400/60",
  "MAESSIG": "bg-amber-500/20 text-amber-700 border-amber-400/60",
  "SCHLECHT": "bg-orange-500/25 text-orange-700 border-orange-400/60",
  "SEHR SCHLECHT": "bg-red-500/25 text-red-700 border-red-400/60"
};

export default function SensorMetricCard({ label, value, unit, rating }) {
  const ratingCls = rating ? (RATING_COLORS[rating] || "bg-gray-300 text-gray-700 border-gray-400") : "";
  return (
    <div className="aq-card flex flex-col gap-1 min-w-[140px]">
      <div className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </div>
      <div className="text-lg font-semibold text-slate-800">
        {value == null ? '--' : value}{value != null && unit ? <span className="text-sm font-normal ml-1">{unit}</span> : null}
      </div>
      {rating && (
        <span className={`badge mt-auto border text-[10px] font-bold tracking-wide ${ratingCls}`}>
          {rating}
        </span>
      )}
    </div>
  );
}
