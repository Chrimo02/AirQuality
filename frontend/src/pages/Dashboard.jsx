// src/pages/Dashboard.jsx
import { useEffect, useState, useRef } from 'react';
import {
  fetchCurrentSessionInfo,
  fetchSessions,
  startSession,
  endSession,
  fetchSessionData
} from '../services/api';
import { useLiveStream } from '../hooks/useLiveStream';
import { useSessionDelta } from '../hooks/useSessionDelta';

import AirQualitySummary    from '../components/AirQualitySummary';
import SessionManager       from '../components/SessionManager';
import SensorMetricCard     from '../components/SensorMetricCard';
import ParticleChartCard    from '../components/ParticleChartCard';
import HistoryChart         from '../components/HistoryChart';
import DeviceControlPanel   from '../components/DeviceControlPanel';

const METRIC_LABELS = [
  { key: 'TEMP',  label: 'Temperatur',     unit: '°C'  },
  { key: 'HUMID', label: 'Feuchte',        unit: '%'   },
  { key: 'CO2eq', label: 'CO₂-Äquivalent', unit: 'ppm' },
  { key: 'PM2.5', label: 'PM2.5',          unit: 'µg/m³' },
  { key: 'VOCAQI',label: 'VOC-Index',      unit: ''    },
  { key: 'bVOCeq',label: 'bVOCeq',         unit: ''    },
  { key: 'GASest',label: 'GASest',         unit: ''    }
];

const HISTORY_EXTRA_KEYS = [
  'PM1.0','PM2.5','PM10',
  'PC0.3','PC0.5','PC1.0','PC2.5','PC5.0','PC10',
  'bVOCeq','GASest'
];

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function Dashboard() {
  // global error state (dismissible)
  const [error, setError] = useState(null);

  // sessions
  const [sessions, setSessions]           = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  // live
  const viewingHistorical = !!selectedSession && !selectedSession.is_active;
  const liveEnabled       = !viewingHistorical;
  const { live, wsState } = useLiveStream(liveEnabled);

  // history vs delta
  const [historyData, setHistoryData] = useState([]);
  const historyRef                    = useRef([]);
  const deltaEnabled = !!selectedSession?.is_active;
  const { rows: sessionRows } = useSessionDelta(
    selectedSession?.id,
    deltaEnabled,
    15000
  );

  // snapshots
  const [displaySnapshot, setDisplaySnapshot] = useState(null);
  const [frozenSnapshot,  setFrozenSnapshot]  = useState(null);

  
  const sessionReqId = useRef(0);

  /** INITIAL LOAD **/
  useEffect(() => {
    (async () => {
      try {
        const info = await fetchCurrentSessionInfo();
        const list = await fetchSessions();
        setSessions(list);

        if (info.session_id) {
          const act = list.find(s => s.id === info.session_id);
          setActiveSession(act);
          setSelectedSession(act);

          const req = ++sessionReqId.current;
          const hist = await fetchSessionData(act.id);
          if (req === sessionReqId.current) {
            historyRef.current = hist;
            setHistoryData(hist);
            if (hist.length) {
              setDisplaySnapshot({ type: 'session', entry: hist[hist.length - 1] });
            }
          }
        }
      } catch (e) {
        console.error(e);
        setError('Fehler beim Laden der Sessions');
      }
    })();
  }, []);

  /** DELTA UPDATE **/
  useEffect(() => {
    if (!deltaEnabled) return;
    historyRef.current = sessionRows;
    setHistoryData(sessionRows);
    if (sessionRows.length) {
      setDisplaySnapshot({ type: 'session', entry: sessionRows[sessionRows.length - 1] });
    }
  }, [sessionRows, deltaEnabled]);

  /** LIVE ROLLING HISTORY **/
  useEffect(() => {
    if (!live || viewingHistorical || deltaEnabled || selectedSession) return;
    const entry = buildHistoryEntryFromLive(live);
    historyRef.current = [...historyRef.current.slice(-239), entry];
    setHistoryData([...historyRef.current]);
    setDisplaySnapshot({ type: 'live', entry: live });
  }, [live, viewingHistorical, deltaEnabled, selectedSession]);

  /** HELPERS **/
  function buildHistoryEntryFromLive(data) {
    const e = {
      timestamp:      data.timestamp,
      TEMP:           data.measurements?.TEMP,
      HUMID:          data.measurements?.HUMID,
      CO2eq:          data.measurements?.CO2eq,
      'PM2.5':        data.measurements?.['PM2.5'],
      VOCAQI:         data.measurements?.VOCAQI,
      overall_quality:data.overall_quality
    };
    HISTORY_EXTRA_KEYS.forEach(k => {
      if (data.measurements?.[k] != null) e[k] = data.measurements[k];
    });
    return e;
  }

  async function handleStartSession({ name, location, session_type }) {
    try {
      const newS = await startSession({ name, location, session_type });
      setSessions(s => [newS, ...s.map(x => ({ ...x, is_active: false }))]);
      setActiveSession(newS);
      setSelectedSession(newS);
      historyRef.current = [];
      setHistoryData([]);
      setDisplaySnapshot(null);
      setFrozenSnapshot(null);
    } catch {
      setError('Session starten fehlgeschlagen');
    }
  }

  async function handleEndSession(id) {
    try {
      await endSession(id);
      setSessions(s => s.map(x =>
        x.id === id ? { ...x, is_active: false, end_time: new Date().toISOString() } : x
      ));
      if (selectedSession?.id === id) {
        setSelectedSession(prev => prev ? { ...prev, is_active: false } : prev);
      }
      setActiveSession(null);
    } catch {
      setError('Session beenden fehlgeschlagen');
    }
  }

  async function handleSelectSession(session) {
    if (session.id === selectedSession?.id) {
      if (!session.is_active && activeSession) await switchToActiveSession(activeSession);
      return;
    }
    setSelectedSession(session);
    const req = ++sessionReqId.current;
    try {
      const hist = await fetchSessionData(session.id);
      if (req === sessionReqId.current) {
        historyRef.current = hist;
        setHistoryData(hist);
        if (session.is_active) {
          setFrozenSnapshot(null);
          setDisplaySnapshot({ type: 'session', entry: hist[hist.length - 1] });
        } else {
          buildFrozenFromHistory(hist);
        }
      }
    } catch {
      setError('Laden der historischen Daten fehlgeschlagen');
    }
  }

  async function switchToActiveSession(active) {
    setSelectedSession(active);
    const hist = await fetchSessionData(active.id);
    historyRef.current = hist;
    setHistoryData(hist);
    setFrozenSnapshot(null);
    setDisplaySnapshot({ type: 'session', entry: hist[hist.length - 1] });
  }

  function buildFrozenFromHistory(hist) {
    if (!hist.length) {
      setFrozenSnapshot(null);
      setDisplaySnapshot(null);
      return;
    }
    const last = hist[hist.length - 1];
    const measurements = { ...last };
    delete measurements.timestamp;
    delete measurements.overall_quality;
    const frozenRatings = {};
    METRIC_LABELS.forEach(m => {
      if (measurements[m.key] != null) frozenRatings[m.key] = { rating: 'FREEZE', value: measurements[m.key] };
    });
    setFrozenSnapshot({
      type: 'history-freeze',
      measurements,
      air_quality_rating: frozenRatings,
      overall_quality: null,
      timestamp: last.timestamp
    });
    setDisplaySnapshot({ type: 'history-freeze', entry: last });
  }

  async function revertToLive() {
    if (activeSession) {
      await switchToActiveSession(activeSession);
    } else {
      setSelectedSession(null);
      setFrozenSnapshot(null);
      historyRef.current = [];
      setHistoryData([]);
      if (live) setDisplaySnapshot({ type: 'live', entry: live });
      else setDisplaySnapshot(null);
    }
  }

  /** DETERMINE DISPLAY **/
  let display = null;
  if (viewingHistorical && frozenSnapshot) display = frozenSnapshot;
  else if (displaySnapshot) {
    display = displaySnapshot.entry?.measurements
      ? displaySnapshot.entry
      : { measurements: { ...displaySnapshot.entry }, air_quality_rating: live?.air_quality_rating || {} };
  } else if (live) display = live;

  const lastUpdate = live?.timestamp ? new Date(live.timestamp).toLocaleTimeString() : '--:--:--';
  const overall    = viewingHistorical ? null : live?.overall_quality;

  /** EXPORT HELPERS **/
  function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
  }
  function exportJSON() {
    if (!historyData.length) return;
    const payload = { generated_at: new Date().toISOString(), selected_session: selectedSession || null, history_rows: historyData };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    triggerDownload(url, `air_quality_${selectedSession?.name||'live'}_${Date.now()}.json`);
  }
  function exportCSV() {
    if (!historyData.length) return;
    const cols = Object.keys(historyData[0]);
    const lines = [cols.join(';'), ...historyData.map(r => cols.map(c => r[c] ?? '').join(';'))];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    triggerDownload(url, `air_quality_${selectedSession?.name||'live'}_${Date.now()}.csv`);
  }
  async function exportPDF() {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF }       = await import('jspdf');
      const root = document.querySelector('#root');
      const canvas = await html2canvas(root, { scale: 2, backgroundColor: '#fff' });
      const img    = canvas.toDataURL('image/png');
      const pdf    = new jsPDF('l','pt','a4');
      const pw     = pdf.internal.pageSize.getWidth();
      const ph     = pdf.internal.pageSize.getHeight();
      const ratio  = Math.min(pw/canvas.width, ph/canvas.height);
      const iw     = canvas.width*ratio;
      const ih     = canvas.height*ratio;
      pdf.addImage(img,'PNG',(pw-iw)/2,20,iw,ih-40);
      pdf.save(`air_quality_${selectedSession?.name||'live'}_${Date.now()}.pdf`);
    } catch {
      alert('PDF-Export benötigt html2canvas & jspdf (npm install html2canvas jspdf)');
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6 space-y-6">
      {error && (
        <div className="flex justify-between items-center bg-red-100 text-red-600 p-2 rounded">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Air Quality Monitor</h1>
            <div className="text-xs text-slate-600 flex items-center gap-3 mt-1 flex-wrap">
              Letztes Update: <span className="font-medium text-slate-800">{lastUpdate}</span>
              <span className="px-2 py-0.5 text-[10px] bg-slate-200 border border-slate-300 rounded tracking-wide">
                WS: {wsState} {IS_MOCK && '· MOCK'}
              </span>
              {selectedSession && (
                <span className={`px-2 py-0.5 text-[10px] rounded border tracking-wide ${
                  viewingHistorical
                    ? 'bg-indigo-200 border-indigo-300 text-indigo-800'
                    : 'bg-emerald-200 border-emerald-300 text-emerald-800'
                }`}>
                  {viewingHistorical ? 'Historische Session' : 'Aktive Session'}
                </span>
              )}
              {viewingHistorical && (
                <button onClick={revertToLive}
                  className="px-2 py-0.5 text-[10px] bg-white border border-slate-300 rounded hover:bg-slate-100">
                  Zurück zu Live
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportCSV} disabled={!historyData.length}
              className="px-3 py-1.5 text-xs font-semibold border border-cyan-500 text-cyan-600 rounded hover:bg-cyan-50 disabled:opacity-30">
              Export CSV
            </button>
            <button onClick={exportJSON} disabled={!historyData.length}
              className="px-3 py-1.5 text-xs font-semibold border border-cyan-500 text-cyan-600 rounded hover:bg-cyan-50 disabled:opacity-30">
              Export JSON
            </button>
            <button onClick={exportPDF}
              className="px-3 py-1.5 text-xs font-semibold border border-indigo-500 text-indigo-600 rounded hover:bg-indigo-50">
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <AirQualitySummary overall={overall} history={historyData} frozen={viewingHistorical && !!frozenSnapshot} />
        <SessionManager
          activeSession={activeSession}
          selectedSession={selectedSession}
          sessions={sessions}
          onStart={handleStartSession}
          onEnd={handleEndSession}
          onSelect={handleSelectSession}
        />
        <DeviceControlPanel />
      </div>

      <section className="grid xl:grid-cols-7 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-4">
        {METRIC_LABELS.map(m => {
          const val    = display?.measurements?.[m.key];
          const rating = viewingHistorical && frozenSnapshot
            ? frozenSnapshot.air_quality_rating?.[m.key]?.rating || null
            : live?.air_quality_rating?.[m.key]?.rating || null;
          return (
            <SensorMetricCard
              key={m.key}
              label={m.label}
              unit={m.unit}
              value={val != null ? String(val) : null}
              rating={rating}
              frozen={viewingHistorical}
            />
          );
        })}
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HistoryChart data={historyData} metrics={['TEMP','HUMID','CO2eq','PM2.5','VOCAQI']} frozen={viewingHistorical} />
        </div>
        <div className="flex flex-col gap-6">
          <ParticleChartCard measurements={viewingHistorical ? frozenSnapshot?.measurements : live?.measurements} type="PM"  frozen={viewingHistorical} />
          <ParticleChartCard measurements={viewingHistorical ? frozenSnapshot?.measurements : live?.measurements} type="PC"  frozen={viewingHistorical} />
        </div>
      </div>
    </div>
  );
}
