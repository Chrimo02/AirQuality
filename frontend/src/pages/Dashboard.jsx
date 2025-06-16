// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import SensorDataCard from '../components/SensorDataCard';
import ChartSection from '../components/ChartSection';
import ControlPanel from '../components/ControlPanel';
import { fetchLatestSensor, fetchSensorHistory, createWebSocket } from '../services/api';

export default function Dashboard() {
  const [sensorData, setSensorData] = useState({ co2:0, temp:0, pm25:0, humidity:0 });
  const [historyData, setHistoryData] = useState([]);

  // Initialdaten laden
  useEffect(() => {
    (async () => {
      setSensorData(await fetchLatestSensor());
      setHistoryData(await fetchSensorHistory());
    })();
  }, []);

  // WebSocket für Live-Updates
  useEffect(() => {
    const ws = createWebSocket(newData => {
      setSensorData(newData);
      setHistoryData(prev => {
        const arr = [...prev, newData];
        return arr.length > 50 ? arr.slice(-50) : arr;
      });
    });
    return () => ws.close();
  }, []);

  return (
    <div className="container">
      <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
        <SensorDataCard label="CO₂" value={sensorData.co2} unit="ppm" />
        <SensorDataCard label="Temp." value={sensorData.temp} unit="°C" />
        <SensorDataCard label="PM2.5" value={sensorData.pm25} unit="µg/m³" />
        <SensorDataCard label="Feuchte" value={sensorData.humidity} unit="%" />
      </div>

      <ChartSection historyData={historyData} />

      <div style={{ marginTop: '2rem' }}>
        <ControlPanel />
      </div>
    </div>
  );
}
