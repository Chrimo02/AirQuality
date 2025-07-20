import { useState } from 'react';
import { fetchSessionData } from '../services/api';

export default function SessionManager({ activeSession, sessions, onStart, onEnd }) {
  const [name, setName] = useState('');
  const [loc, setLoc] = useState('');
  const [type, setType] = useState('indoor');
  const [exporting, setExporting] = useState(false);

  async function exportData(format) {
    if (!activeSession) return;
    try {
      setExporting(true);
      const rows = await fetchSessionData(activeSession.id, 2000);

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `session_${activeSession.id}.json`);
      } else {
        const headers = ['timestamp','TEMP','HUMID','CO2eq','PM1.0','PM2.5','PM10','PC2.5','VOCAQI'];
        const lines = [headers.join(';')];
        rows.forEach(r => {
          lines.push(headers.map(h => (r[h] != null ? r[h] : '')).join(';'));
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `session_${activeSession.id}.csv`);
      }
    } catch (e) {
      console.error('Export fehlgeschlagen', e);
    } finally {
      setExporting(false);
    }
  }

  function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  return (
    <div className="aq-card flex flex-col gap-4">
      <h3 className="font-semibold text-sm tracking-wide text-slate-700">
        Session Verwaltung
      </h3>

      {activeSession ? (
        <div className="text-xs text-green-600 leading-snug">
          Aktiv: {activeSession.name} ({activeSession.session_type})<br />
          Start: {new Date(activeSession.start_time).toLocaleTimeString()}
        </div>
      ) : (
        <div className="text-xs text-slate-500">Keine aktive Session</div>
      )}

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
        {!activeSession && (
          <button
            onClick={() => {
              if (!name.trim()) return;
              onStart({ name: name.trim(), location: loc.trim() || null, session_type: type });
              setName(''); setLoc('');
            }}
            className="btn btn-primary"
          >Start</button>
        )}
        {activeSession && (
          <button
            onClick={() => onEnd(activeSession.id)}
            className="btn btn-danger"
          >Beenden</button>
        )}
        {activeSession && (
          <>
            <button
              disabled={exporting}
              onClick={() => exportData('csv')}
              className="btn btn-neutral disabled:opacity-50"
            >{exporting ? '…' : 'Export CSV'}</button>
            <button
              disabled={exporting}
              onClick={() => exportData('json')}
              className="btn btn-neutral disabled:opacity-50"
            >{exporting ? '…' : 'Export JSON'}</button>
          </>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold mb-2 text-slate-600 uppercase tracking-wide">
          Sessions
        </h4>
        {sessions.length === 0 && (
          <div className="text-[10px] text-slate-400">Keine Sessions</div>
        )}
        <div className="flex flex-wrap gap-2">
          {sessions.map(s => (
            <span
              key={s.id}
              className={`text-[10px] px-2 py-1 rounded border cursor-default ${
                s.is_active
                  ? 'border-cyan-600 text-cyan-700 bg-cyan-100'
                  : 'border-slate-300 text-slate-500 bg-slate-100'
              }`}
              title={s.location || ''}
            >
              {s.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
