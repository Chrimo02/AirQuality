import React, { useState, useEffect } from 'react';
import SensorDataCard from '../components/SensorDataCard';
import ChartSection   from '../components/ChartSection';
import ControlPanel   from '../components/ControlPanel';
import {
  fetchLatestSensor,
  fetchSensorHistory,
  createWebSocket
} from '../services/api';

export default function Dashboard() {
  const [sensorData, setSensorData] = useState({
    TEMP:      0,
    HUMID:     0,
    ATM:       0,
    VOCAQI:    0,
    bVOCeq:    0,
    GASest:    0,
    CO2eq:     0,
    timestamp: ''
  });
  const [historyData, setHistoryData] = useState([]);

  // Initial Load
  useEffect(() => {
    (async () => {
      try {
        const latest  = await fetchLatestSensor();
        const history = await fetchSensorHistory();
        setSensorData(latest);
        setHistoryData(history);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // WebSocket Live
  useEffect(() => {
    const ws = createWebSocket(newData => {
      setSensorData(newData);
      setHistoryData(prev => [...prev.slice(-49), newData]);
    });
    return () => ws.close();
  }, []);

  const labels = [
    'Temperatur',
    'Feuchte',
    'Luftdruck',
    'VOC-Index',
    'bVOCeq',
    'GASest',
    'CO₂-Äquivalent'
  ];
  const keyFor = l =>
    l === 'CO₂-Äquivalent' ? 'CO2eq'
    : l === 'VOC-Index'      ? 'VOCAQI'
    : l;

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Grid der Sensor-Karten */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-5">
        {labels.map(label => (
          <SensorDataCard
            key={label}
            label={label}
            value={sensorData[keyFor(label)]}
            unit={
              label === 'Temperatur'   ? '°C' :
              label === 'Feuchte'       ? '%'  :
              label === 'Luftdruck'     ? 'hPa': 'ppm'
            }
            timestamp={sensorData.timestamp}
          />
        ))}
      </section>

      {/* Chart & Control */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSection historyData={historyData} />
        </div>
        <div>
          <ControlPanel />
        </div>
      </section>
    </main>
  );
}
