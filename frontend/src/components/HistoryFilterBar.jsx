import { useState, useEffect } from 'react';

export default function HistoryFilterBar({ availableMetrics, defaultSelected = [], onChange, onReset }) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState(new Set(defaultSelected));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    onChange({
      metrics: Array.from(selected),
      from: from ? new Date(from) : null,
      to: to ? new Date(to) : null
    });
  }, [selected, from, to]);

  const toggleMetric = (m) => {
    setSelected(s => {
      const n = new Set(s);
      if (n.has(m)) n.delete(m); else n.add(m);
      return n;
    });
  };
  const selectAll = () => setSelected(new Set(availableMetrics));
  const selectNone = () => setSelected(new Set());
  const reset = () => {
    setSelected(new Set(defaultSelected));
    setFrom('');
    setTo('');
    onReset?.();
  };

  return (
    <div className="aq-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          Verlauf Filter
        </h3>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-[10px] px-2 py-1 rounded border border-slate-600 text-slate-300 hover:bg-slate-600/30"
        >
          {open ? '–' : '+'}
        </button>
      </div>

      {open && (
        <>
          <div className="flex flex-wrap gap-2">
            {availableMetrics.map(m => {
              const active = selected.has(m);
              return (
                <button
                  key={m}
                  onClick={() => toggleMetric(m)}
                  className={`text-[10px] px-2 py-1 rounded border transition
                    ${active
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                      : 'border-slate-600 bg-slate-700/40 text-slate-300 hover:border-cyan-500 hover:text-cyan-300'}`}
                >
                  {m}
                </button>
              );
            })}
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              type="datetime-local"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="px-2 py-1 text-xs rounded bg-gray-700/60 border border-gray-600 focus:outline-none focus:ring focus:ring-cyan-500/40"
            />
            <input
              type="datetime-local"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="px-2 py-1 text-xs rounded bg-gray-700/60 border border-gray-600 focus:outline-none focus:ring focus:ring-cyan-500/40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-1 text-[10px] rounded border border-cyan-500 text-cyan-300 hover:bg-cyan-500/10"
            >Alle</button>
            <button
              onClick={selectNone}
              className="px-3 py-1 text-[10px] rounded border border-slate-500 text-slate-300 hover:bg-slate-600/30"
            >Keine</button>
            <button
              onClick={reset}
              className="px-3 py-1 text-[10px] rounded border border-amber-500 text-amber-300 hover:bg-amber-500/10"
            >Reset</button>
          </div>
        </>
      )}
    </div>
  );
}
