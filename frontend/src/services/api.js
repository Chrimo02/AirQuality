// src/services/api.js
import axios from 'axios';

// Basis-URL aus .env (VITE_API_URL) oder fallback auf localhost
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Erzeuge einen Axios-Client für alle /api-Aufrufe
const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 5000,
});

// Holt das aktuellste Sensordaten-Objekt vom Backend
export const fetchLatestSensor = async () => {
  const res = await apiClient.get('/sensor/latest');
  return res.data;
};

// Holt die Historie als Array von Sensordaten-Objekten
export const fetchSensorHistory = async () => {
  const res = await apiClient.get('/sensor/history');
  return res.data;
};

// Öffnet eine WebSocket-Verbindung für Live-Updates
export function createWebSocket(onMessageCallback) {
  // baue ws://…/ws URL aus der BASE_URL
  const wsUrl = BASE_URL.replace(/^http/, 'ws') + '/ws';
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => console.log('WebSocket verbunden');
  socket.onmessage = (evt) => {
    const data = JSON.parse(evt.data);
    onMessageCallback(data);
  };
  socket.onerror = (err) => console.error('WebSocket-Fehler', err);
  socket.onclose = () => console.log('WebSocket geschlossen');

  return socket;
}
