import { useState, useMemo } from 'react';

export default function SessionManager({
  activeSession,
  selectedSession,
  sessions,
  onStart,
  onEnd,
  onSelect
}) {
  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filter sessions by search term
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return sessions;
    const lower = searchTerm.toLowerCase();
    return sessions.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      (s.location || '').toLowerCase().includes(lower)
    );
  }, [sessions, searchTerm]);

  // Compute pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  // New session form state
  const [name, setName] = useState('');
  const [loc, setLoc]   = useState('');
  const [type, setType] = useState('indoor');

  return (
    <div className="aq-card flex flex-col gap-4">
      <h3 className="font-semibold text-sm tracking-wide text-slate-700">
        Session Verwaltung
      </h3>

      {/* Active Session Info */}
      {activeSession ? (
        <div className="text-xs text-green-600 leading-snug">
          Aktiv: {activeSession.name} ({activeSession.session_type})<br />
          Start: {new Date(activeSession.start_time).toLocaleTimeString()}
        </div>
      ) : (
        <div className="text-xs text-slate-500">Keine aktive Session</div>
      )}

      {/* New Session Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name"
          className="px-3 py-2 rounded bg-white border border-slate-300 focus:outline-none focus:ring focus:ring-cyan-400/50 text-sm"
        />
        <input
          value={loc}
          onChange={e => setLoc(e.target.value)}
          placeholder="Ort (optional)"
          className="px-3 py-2 rounded bg-white border border-slate-300 focus:outline-none focus:ring focus:ring-cyan-400/50 text-sm"
        />
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="px-3 py-2 rounded bg-white border border-slate-300 focus:outline-none focus:ring focus:ring-cyan-400/50 text-sm"
        >
          <option value="indoor">Indoor</option>
          <option value="outdoor">Outdoor</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {!activeSession ? (
          <button
            onClick={() => {
              if (!name.trim()) return;
              onStart({ name: name.trim(), location: loc.trim() || null, session_type: type });
              setName(''); setLoc('');
            }}
            className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition"
          >Start</button>
        ) : (
          <button
            onClick={() => onEnd(activeSession.id)}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-sm font-medium text-white transition"
          >Beenden</button>
        )}
      </div>

      {/* Search & Pagination Controls */}
      <div className="flex items-center justify-between">
        <input
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
          placeholder="Filter Sessions..."
          className="px-2 py-1 text-xs rounded bg-white border border-slate-300 focus:outline-none focus:ring focus:ring-cyan-400/50"
        />
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-2 py-1 rounded border border-slate-400"
          >‹ Prev</button>
          <span>Seite {page}/{totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-2 py-1 rounded border border-slate-400"
          >Next ›</button>
        </div>
      </div>

      {/* Session List */}
      <div className="max-h-56 overflow-y-auto grid grid-cols-1 gap-2">
        {current.length === 0 ? (
          <div className="text-[10px] text-slate-400">Keine Sessions gefunden</div>
        ) : current.map(s => {
          const isSel = selectedSession?.id === s.id;
          const isAct = s.is_active;
          return (
            <button
              key={s.id}
              onClick={() => onSelect && onSelect(s)}
              className={`text-[10px] px-2 py-1 rounded border transition w-full text-left
                ${isSel
                  ? 'border-indigo-600 bg-indigo-100 text-indigo-700'
                  : isAct
                    ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                    : 'border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              title={`${s.name}${s.location ? ' @ ' + s.location : ''}`}
            >
              {s.name} {s.location ? `@ ${s.location}` : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
