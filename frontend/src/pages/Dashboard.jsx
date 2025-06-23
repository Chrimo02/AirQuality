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
        console.error('Fehler beim Laden der Sensordaten:', err);
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
  const keyFor = label =>
    label === 'CO₂-Äquivalent' ? 'CO2eq'
  : label === 'VOC-Index'      ? 'VOCAQI'
  : label;

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Sensor-Karten im CSS-Grid */}
      <section className="sensor-grid">
        {labels.map(label => (
          <SensorDataCard
            key={label}
            label={label}
            value={sensorData[keyFor(label)]}
            unit={
              label === 'Temperatur' ? '°C' :
              label === 'Feuchte'     ? '%'  :
              label === 'Luftdruck'   ? 'hPa': 'ppm'
            }
            timestamp={sensorData.timestamp}
          />
        ))}
      </section>

      {/* Verlauf und Steuerung */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSection historyData={historyData} />
        </div>
        <ControlPanel />
      </section>
    </main>
  );
}