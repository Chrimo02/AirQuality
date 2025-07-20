import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export default function ParticleChartCard({ measurements, type = 'PM' }) {
  const label = type === 'PM' ? 'Partikel-Masse' : 'Partikel-Anzahl';

  if (!measurements) {
    return (
      <div className="aq-card flex flex-col gap-2">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-slate-500">Lade {label}…</div>
      </div>
    );
  }

  const sizes = type === 'PM'
    ? ['1.0', '2.5', '10']
    : ['0.3','0.5','1.0','2.5','5.0','10'];

  const data = sizes.map(s => {
    const key = `${type}${s}`;
    return { size: s, value: measurements[key] ?? null };
  });

  const hasValues = data.some(d => d.value != null);

  return (
    <div className="aq-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
      </div>
      <div className="w-full h-52">
        {hasValues ? (
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4}/>
              <XAxis dataKey="size" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip
                wrapperStyle={{ zIndex: 1000 }}
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.7rem'
                }}
                labelStyle={{ color: '#334155' }}
                formatter={(v) => [v, type]}
              />
              <Bar dataKey="value" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            Keine Werte
          </div>
        )}
      </div>
    </div>
  );
}
