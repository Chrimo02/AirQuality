import React, { useState, useEffect } from 'react';
import SensorDataCard  from '../components/SensorDataCard';
import ChartSection    from '../components/ChartSection';
import ControlPanel    from '../components/ControlPanel';
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

  useEffect(() => {
    const ws = createWebSocket(newData => {
      setSensorData(newData);
      setHistoryData(prev => {
        const next = [...prev, newData];
        return next.length > 50 ? next.slice(-50) : next;
      });
    });
    return () => ws.close();
  }, []);

  return (
    <div className="container">
      <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
        <SensorDataCard label="Temperatur"    value={sensorData.TEMP}    unit="°C"   timestamp={sensorData.timestamp} />
        <SensorDataCard label="Feuchte"        value={sensorData.HUMID}   unit="%"    timestamp={sensorData.timestamp} />
        <SensorDataCard label="Luftdruck"      value={sensorData.ATM}     unit="hPa"  timestamp={sensorData.timestamp} />
        <SensorDataCard label="VOC-Index"      value={sensorData.VOCAQI}  unit=""     timestamp={sensorData.timestamp} />
        <SensorDataCard label="bVOCeq"         value={sensorData.bVOCeq}  unit="ppm"  timestamp={sensorData.timestamp} />
        <SensorDataCard label="GASest"         value={sensorData.GASest}  unit="ppm"  timestamp={sensorData.timestamp} />
        <SensorDataCard label="CO₂-Äquivalent" value={sensorData.CO2eq}   unit="ppm"  timestamp={sensorData.timestamp} />
      </div>
      <ChartSection historyData={historyData} />
      <div style={{ marginTop: '2rem' }}>
        <ControlPanel />
      </div>
    </div>
  );
}