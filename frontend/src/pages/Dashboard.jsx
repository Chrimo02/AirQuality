// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import SensorDataCard    from '../components/SensorDataCard';
import ParticleChartCard from '../components/ParticleChartCard';
import ChartSection      from '../components/ChartSection';
import ControlPanel      from '../components/ControlPanel';
import SessionDetail     from '../components/SessionDetail';
import {
  fetchLatestSensor,
  fetchSensorHistory,
  createWebSocket,
  fetchSessions,
  startSession,
  stopSession
} from '../services/api';

export default function Dashboard({ envId }) {
  // Live-Data
  const [sensorData, setSensorData]   = useState({});
  const [historyData, setHistoryData] = useState([]);

  // Session-State
  const [sessions, setSessions]             = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  // Load Sessions
  useEffect(() => {
    if (!envId) return;
    fetchSessions(envId).then(setSessions);
    setCurrentSession(null);
  }, [envId]);

  // Initial Fetch
  useEffect(() => {
    (async () => {
      const latest  = await fetchLatestSensor();
      const history = await fetchSensorHistory();
      setSensorData(latest);
      setHistoryData(history);
    })();
  }, []);

  // WebSocket
  useEffect(() => {
    const ws = createWebSocket(data => {
      setSensorData(data);
      setHistoryData(prev => [...prev.slice(-49), data]);
    });
    return () => ws.close();
  }, []);

  const handleStart = () => {
    if (!envId) return;
    startSession(envId).then(newS => {
      setSessions(s => [newS, ...s]);
      setCurrentSession(newS.id);
    });
  };
  const handleStop = () => {
    if (!currentSession) return;
    stopSession(currentSession).then(() => {
      setSessions(s => s.map(x =>
        x.id === currentSession ? { ...x, status: 'ended' } : x
      ));
      setCurrentSession(null);
    });
  };

  const labels = ['Temperatur','Feuchte','Luftdruck','VOC-Index','bVOCeq','GASest','CO₂-Äquivalent'];
  const keyFor = lbl => ({
    'Temperatur':'TEMP','Feuchte':'HUMID','Luftdruck':'ATM',
    'VOC-Index':'VOCAQI','bVOCeq':'bVOCeq','GASest':'GASest','CO₂-Äquivalent':'CO2eq'
  })[lbl] || '';

  const lastUpdate = sensorData.timestamp
    ? new Date(sensorData.timestamp).toLocaleTimeString([], {
        hour:'2-digit',minute:'2-digit',second:'2-digit'
      })
    : '--:--:--';

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-8">
      <h2 className="text-xl font-semibold">Dashboard – Raum: {envId}</h2>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleStart}
          className="bg-cyan-400 text-white rounded-full px-4 py-2 shadow hover:bg-cyan-500 transition"
        >
          + Neue Session
        </button>
        {sessions.map(s => (
          <button
            key={s.id}
            onClick={() => setCurrentSession(s.id)}
            className={`rounded-full px-4 py-2 shadow transition ${
              currentSession===s.id
                ? 'bg-cyan-500 text-white'
                : 'bg-white text-cyan-600 border border-cyan-600'
            }`}
          >
            {new Date(s.start_time).toLocaleTimeString()}
          </button>
        ))}
        {currentSession && (
          <button
            onClick={handleStop}
            className="bg-red-400 text-white rounded-full px-4 py-2 shadow hover:bg-red-500 transition"
          >
            Session beenden
          </button>
        )}
      </div>

      <div className="text-center text-sm text-gray-400">
        Aktualisiert: {lastUpdate}
      </div>

      {currentSession
        ? <SessionDetail sessionId={currentSession} />
        : <>
            <section className="sensor-grid">
              {labels.map(lbl=>(
                <SensorDataCard
                  key={lbl}
                  label={lbl}
                  value={sensorData[keyFor(lbl)]}
                  unit={ lbl==='Temperatur'?'°C': lbl==='Feuchte'?'%': lbl==='Luftdruck'?'hPa':'ppm' }
                />
              ))}
            </section>

            <section className="sensor-grid">
              <ParticleChartCard data={sensorData} type="PC" />
              <ParticleChartCard data={sensorData} type="PM" />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ChartSection historyData={historyData} />
              </div>
              <ControlPanel />
            </section>
          </>
      }
    </main>
  );
}
