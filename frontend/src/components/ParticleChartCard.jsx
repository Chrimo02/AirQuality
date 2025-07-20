import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export default function ParticleChartCard({ measurements, type='PM', frozen }) {
  const title = type === 'PM' ? 'Partikel-Masse' : 'Partikel-Anzahl';

  if (!measurements) {
    return (
      <div className={`aq-card flex flex-col gap-2 ${frozen ? 'opacity-70' : ''}`}>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-slate-400">
          {frozen ? 'Historische Session (keine Daten gespeichert)' : 'Lade Partikel-Daten…'}
        </div>
      </div>
    );
  }

  const sizes = type === 'PM'
    ? ['1.0','2.5','10']
    : ['0.3','0.5','1.0','2.5','5.0','10'];

  const data = sizes.map(s => {
    const key = `${type}${s}`;
    return {
      size: s,
      value: measurements[key] ?? 0
    };
  });

  return (
    <div className={`aq-card flex flex-col gap-3 ${frozen ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {title}
        </h3>
        {frozen && <span className="text-[9px] px-1 py-0.5 rounded bg-slate-600/40 border border-slate-500">Freeze</span>}
      </div>
      <div className="w-full h-48">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top:4, right:8, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="size" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ background:'#1e293b', border:'1px solid #334155', fontSize:'0.7rem' }}
              labelStyle={{ color:'#e2e8f0' }}
              formatter={(v) => [v, type]}
            />
            <Bar dataKey="value" fill="#0ea5e9" isAnimationActive={!frozen}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
