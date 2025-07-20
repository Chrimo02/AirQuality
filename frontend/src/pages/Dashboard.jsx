import { useEffect, useState, useRef } from 'react';
import {
  fetchLiveData,
  connectLive,
  fetchSessions,
  startSession,
  endSession,
  fetchSessionData
} from '../services/api';

import AirQualitySummary from '../components/AirQualitySummary';
import SessionManager from '../components/SessionManager';
import SensorMetricCard from '../components/SensorMetricCard';
import ParticleChartCard from '../components/ParticleChartCard';
import HistoryChart from '../components/HistoryChart';
import DeviceControlPanel from '../components/DeviceControlPanel';

const METRIC_LABELS = [
  { key: 'TEMP',  label: 'Temperatur',       unit: '°C' },
  { key: 'HUMID', label: 'Feuchte',          unit: '%' },
  { key: 'CO2eq', label: 'CO₂-Äquivalent',   unit: 'ppm' },
  { key: 'PM2.5', label: 'PM2.5',            unit: 'µg/m³' },
  { key: 'VOCAQI', label: 'VOC-Index',       unit: '' },
  { key: 'bVOCeq', label: 'bVOCeq',          unit: '' },
  { key: 'GASest', label: 'GASest',          unit: '' }
];

// Welche Felder wir für History zusätzlich versuchen mitzunehmen (sofern vorhanden)
const HISTORY_EXTRA_KEYS = [
  'PM1.0','PM2.5','PM10',
  'PC0.3','PC0.5','PC1.0','PC2.5','PC5.0','PC10',
  'bVOCeq','GASest'
];

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function Dashboard() {
  const [live, setLive] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [wsState, setWsState] = useState('CLOSED');
  const historyRef = useRef([]);

  /** Sessions + evtl. Aktive laden */
  useEffect(() => {
    (async () => {
      try {
        const s = await fetchSessions();
        setSessions(s);
        const active = s.find(x => x.is_active);
        if (active) {
          setActiveSession(active);
          const hist = await fetchSessionData(active.id);
            // hist enthält bereits normalisierte Werte (TEMP,...)
          historyRef.current = hist;
          setHistoryData(hist);
        }
      } catch (e) {
        console.warn('Sessions konnten nicht geladen werden', e);
      }
    })();
  }, []);

  /** Live + WebSocket/Mock Verbindung */
  useEffect(() => {
    let cleanup;
    (async () => {
      try {
        const first = await fetchLiveData();
        setLive(first);
      } catch (e) {
        console.warn('Erste Live-Daten fehlgeschlagen', e);
      }
      cleanup = connectLive(
        data => {
          setLive(data);
          // Nur eigenen Rolling-Verlauf führen, wenn keine aktive Session (sonst DB-History)
          if (!activeSession) {
            const entry = {
              timestamp: data.timestamp,
              TEMP: data.measurements?.TEMP,
              HUMID: data.measurements?.HUMID,
              CO2eq: data.measurements?.CO2eq,
              'PM2.5': data.measurements?.['PM2.5'],
              VOCAQI: data.measurements?.VOCAQI
            };
            // Zusätzliche Keys dynamisch mappen
            HISTORY_EXTRA_KEYS.forEach(k => {
              if (data.measurements?.[k] != null) entry[k] = data.measurements[k];
            });

            historyRef.current = [
              ...historyRef.current.slice(-239),
              entry
            ];
            setHistoryData([...historyRef.current]);
          }
        },
        state => setWsState(state)
      );
    })();
    return () => cleanup && cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id]);

  async function handleStartSession({ name, location, session_type }) {
    const newS = await startSession({ name, location, session_type });
    setSessions(s => [newS, ...s.map(x => ({ ...x, is_active: false }))]);
    setActiveSession(newS);
    historyRef.current = [];
    setHistoryData([]);
  }

  async function handleEndSession(id) {
    await endSession(id);
    setSessions(s => s.map(x =>
      x.id === id ? { ...x, is_active: false, end_time: new Date().toISOString() } : x
    ));
    setActiveSession(null);
    historyRef.current = [];
    setHistoryData([]);
  }

  const lastUpdate = live?.timestamp
    ? new Date(live.timestamp).toLocaleTimeString()
    : '--:--:--';
  const overall = live?.overall_quality;

  /** ---- Export Funktionen ---- */
  function exportJSON() {
    const payload = {
      generated_at: new Date().toISOString(),
      active_session: activeSession || null,
      history_rows: historyData
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `air_quality_${activeSession?.name || 'live'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    if (!historyData.length) return;
    const cols = Object.keys(historyData[0]);
    const lines = [
      cols.join(';'),
      ...historyData.map(row =>
        cols.map(c => (row[c] == null ? '' : row[c])).join(';')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `air_quality_${activeSession?.name || 'live'}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    // html2canvas + jspdf müssen installiert sein (optional)
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      const root = document.querySelector('#root');
      const canvas = await html2canvas(root, { scale: 2, backgroundColor: '#ffffff' });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'pt', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;
      pdf.addImage(img, 'PNG', (pageW - imgW)/2, 20, imgW, imgH - 40);
      pdf.save(`air_quality_${activeSession?.name || 'live'}_${Date.now()}.pdf`);
    } catch (e) {
      alert('PDF Export benötigt html2canvas & jspdf (npm install html2canvas jspdf)');
      console.error(e);
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6 space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide text-slate-800">
              Air Quality Monitor
            </h1>
            <div className="text-xs text-slate-600 flex items-center gap-3 mt-1">
              Letztes Update:
              <span className="text-slate-800 font-medium">{lastUpdate}</span>
              <span className="px-2 py-0.5 rounded bg-slate-200 border border-slate-300 text-[10px] tracking-wide">
                WS: {wsState}{IS_MOCK && ' · MOCK'}
              </span>
              {activeSession && (
                <span className="px-2 py-0.5 rounded bg-emerald-200 border border-emerald-300 text-[10px] tracking-wide text-emerald-800">
                  Session aktiv
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={exportCSV}
              className="px-3 py-1.5 text-xs font-semibold rounded border border-cyan-500 text-cyan-600 bg-white hover:bg-cyan-50"
              disabled={!historyData.length}
            >
              Export CSV
            </button>
            <button
              onClick={exportJSON}
              className="px-3 py-1.5 text-xs font-semibold rounded border border-cyan-500 text-cyan-600 bg-white hover:bg-cyan-50"
              disabled={!historyData.length}
            >
              Export JSON
            </button>
            <button
              onClick={exportPDF}
              className="px-3 py-1.5 text-xs font-semibold rounded border border-indigo-500 text-indigo-600 bg-white hover:bg-indigo-50"
            >
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <AirQualitySummary overall={overall} history={historyData} />
        <SessionManager
          activeSession={activeSession}
          sessions={sessions}
          onStart={handleStartSession}
          onEnd={handleEndSession}
        />
        <DeviceControlPanel />
      </div>

      <section className="grid xl:grid-cols-7 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-4">
        {METRIC_LABELS.map(m => (
          <SensorMetricCard
            key={m.key}
            label={m.label}
            unit={m.unit}
            value={
              live?.measurements?.[m.key] != null
                ? (typeof live.measurements[m.key] === 'number'
                    ? live.measurements[m.key].toString()
                    : live.measurements[m.key])
                : null
            }
            rating={live?.air_quality_rating?.[m.key]?.rating}
          />
        ))}
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HistoryChart
            data={historyData}
            metrics={['TEMP','HUMID','CO2eq','PM2.5','VOCAQI']}
          />
        </div>
        <div className="flex flex-col gap-6">
          <ParticleChartCard measurements={live?.measurements} type="PM" />
          <ParticleChartCard measurements={live?.measurements} type="PC" />
        </div>
      </div>
    </div>
  );
}
