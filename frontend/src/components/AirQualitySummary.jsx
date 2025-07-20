// Mapping Qualitätsstufen (für Sparkline)
const QUALITY_NUM = {
  "SEHR GUT": 5,
  "GUT": 4,
  "MAESSIG": 3,
  "SCHLECHT": 2,
  "SEHR SCHLECHT": 1
};

const COLOR_MAP = {
  "SEHR GUT": "bg-emerald-400",
  "GUT": "bg-green-400",
  "MAESSIG": "bg-amber-400",
  "SCHLECHT": "bg-orange-500",
  "SEHR SCHLECHT": "bg-red-500"
};

export default function AirQualitySummary({ overall, history, frozen }) {
  // Sparkline: letzte 30 overall_quality aus History (falls vorhanden)
  const points = (history || [])
    .filter(r => r.overall_quality)
    .slice(-30);
  const values = points.map(p => QUALITY_NUM[p.overall_quality] || 0);

  const max = 5; // fest
  const width = 140;
  const height = 32;
  const step = points.length > 1 ? (width / (points.length - 1)) : width;
  const path = values.length
    ? values.map((v, i) => {
        const x = i * step;
        const y = height - (v / max) * height;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      }).join(' ')
    : '';

  if (frozen) {
    return (
      <div className="aq-card flex flex-col gap-3 items-start justify-center opacity-60">
        <div className="text-sm uppercase tracking-wide text-slate-500">
          Gesamtluftqualität (Freeze)
        </div>
        <div className="text-xs text-slate-500">
          Historische Session – Live-Bewertung pausiert
        </div>
        {values.length ? (
          <div className="mt-2">
            <svg width={width} height={height} className="overflow-visible">
              <path d={path} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="text-[10px] text-slate-400 mt-1">Verlauf (historisch)</div>
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 mt-1">Kein Verlauf</div>
        )}
      </div>
    );
  }

  if (!overall) {
    return (
      <div className="aq-card flex flex-col gap-2">
        <div className="text-sm uppercase tracking-wide text-slate-400">
          Gesamtluftqualität
        </div>
        <div className="h-10 flex items-center text-slate-400 text-sm">Lade...</div>
      </div>
    );
  }

  const cls = COLOR_MAP[overall] || "bg-gray-400";

  return (
    <div className="aq-card flex flex-col gap-3 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-cyan-300 via-white to-indigo-300 pointer-events-none" />
      <div className="text-sm uppercase tracking-wide text-slate-600 relative">
        Gesamtluftqualität
      </div>
      <div className={`relative px-4 py-3 rounded text-base font-semibold tracking-wide text-slate-900 shadow-inner ${cls}`}>
        {overall}
      </div>

      <div className="relative mt-1">
        {values.length ? (
          <svg width={width} height={height} className="overflow-visible">
            <path d={path} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
            {values.map((v,i) => {
              const x = i * step;
              const y = height - (v / max) * height;
              return <circle key={i} cx={x} cy={y} r="2" fill="#0ea5e9" />;
            })}
          </svg>
        ) : (
          <div className="text-[10px] text-slate-400">Noch kein Verlauf</div>
        )}
      </div>
      <div className="text-[10px] text-slate-500 tracking-wide">
        Verlauf (letzte {points.length || 0})
      </div>
    </div>
  );
}
