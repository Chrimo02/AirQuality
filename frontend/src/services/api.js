import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const apiClient = axios.create({ baseURL: `${BASE_URL}/api`, timeout: 5000 });

export const fetchLatestSensor = async () => {
  const res = await apiClient.get('/sensor/latest');
  return res.data;
};

export const fetchSensorHistory = async () => {
  const res = await apiClient.get('/sensor/history');
  return res.data;
};

export function createWebSocket(onMessageCallback) {
  const wsUrl = BASE_URL.replace(/^http/, 'ws') + '/ws';
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => console.log('WebSocket verbunden');
  socket.onmessage = evt => onMessageCallback(JSON.parse(evt.data));
  socket.onerror = err => console.error('WebSocket-Fehler', err);
  socket.onclose = () => console.log('WebSocket geschlossen');

  return socket;
}