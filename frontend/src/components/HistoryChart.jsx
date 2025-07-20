import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLOR_POOL = ['#0ea5e9','#10b981','#f59e0b','#6366f1','#ef4444','#14b8a6','#8b5cf6','#f97316','#22c55e','#0d9488'];
const CORE = ['TEMP','HUMID','CO2eq','PM2.5','VOCAQI'];
const EXTRA = ['PM1.0','PM10','PC0.3','PC0.5','PC1.0','PC2.5','PC5.0','PC10'];

export default function HistoryChart({ data, metrics = CORE }) {
  const [selected, setSelected] = useState(metrics);

  const toggle = m =>
    setSelected(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const mapped = (data || []).map(d => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
  }));

  const activeLines = useMemo(
    () => selected.filter(m => mapped.some(row => row[m] != null)),
    [selected, mapped]
  );

  const allKeys = [...CORE, ...EXTRA];

  const selectAll = () => setSelected(allKeys);
  const selectNone = () => setSelected([]);
  const selectCore = () => setSelected(CORE);

  return (
    <div className="aq-card h-full flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-sm text-slate-700 m-0">Verlauf</h3>
        <div className="flex gap-1">
          <button
            onClick={selectCore}
            className="px-2 py-0.5 rounded text-[10px] font-semibold border border-cyan-500 text-cyan-600 bg-white hover:bg-cyan-50"
          >Core</button>
          <button
            onClick={selectAll}
            className="px-2 py-0.5 rounded text-[10px] font-semibold border border-cyan-500 text-cyan-600 bg-white hover:bg-cyan-50"
          >Alle</button>
            <button
            onClick={selectNone}
            className="px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-400 text-slate-600 bg-white hover:bg-slate-100"
          >Keine</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {allKeys.map(m => {
          const active = selected.includes(m);
          return (
            <button
              key={m}
              onClick={() => toggle(m)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium border transition
                ${active
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-white text-cyan-600 border-cyan-400 hover:bg-cyan-50'
                }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-[300px]">
        {mapped.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Keine Daten
          </div>
        ) : (
          <ResponsiveContainer>
            <LineChart data={mapped} margin={{ top:6, right:16, left:0, bottom:6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4}/>
              <XAxis dataKey="time" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip
                contentStyle={{ background:'#ffffff', border:'1px solid #e2e8f0', fontSize:'0.7rem' }}
                labelStyle={{ color:'#334155' }}
              />
              <Legend wrapperStyle={{ fontSize:'0.65rem' }} />
              {activeLines.map((m,i) => (
                <Line
                  key={m}
                  type="monotone"
                  dataKey={m}
                  stroke={COLOR_POOL[i % COLOR_POOL.length]}
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
