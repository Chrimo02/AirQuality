// src/services/api.js
import axios from 'axios';

// Im Test-Umfeld liest Jest process.env, in Vite ersetzt Vite process.env.VITE_*
const USE_MOCK = process.env.VITE_USE_MOCK === 'true';
const BASE_URL  = process.env.VITE_API_URL   || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 5000
});

// Hilfsfunktion für Zufallswerte
const randBetween = (min, max, decimals = 0) =>
  parseFloat((min + Math.random() * (max - min)).toFixed(decimals));

export const fetchLatestSensor = async () => {
  if (USE_MOCK) {
    const now = new Date().toISOString();
    return {
      TEMP:   randBetween(18, 26, 1),
      HUMID:  Math.round(randBetween(30, 70)),
      ATM:    randBetween(980, 1020, 1),
      VOCAQI: randBetween(20, 100, 1),
      bVOCeq: randBetween(0.1, 1.1, 2),
      GASest: randBetween(0.1, 1.1, 2),
      CO2eq:  Math.round(randBetween(400, 2000)),
      timestamp: now,
      // Partikel-Counts (PC)
      'PC0.1': Math.round(randBetween(1000, 20000)),
      'PC0.3': Math.round(randBetween(500, 15000)),
      'PC0.5': Math.round(randBetween(200, 10000)),
      'PC1.0': Math.round(randBetween(50, 5000)),
      'PC2.5': Math.round(randBetween(10, 2000)),
      'PC5.0': Math.round(randBetween(1, 500)),
      'PC10':  Math.round(randBetween(0, 100)),
      // Partikel-Massen (PM)
      'PM0.1': randBetween(0.1, 5.0, 2),
      'PM0.3': randBetween(0.1, 4.0, 2),
      'PM0.5': randBetween(0.1, 3.0, 2),
      'PM1.0': randBetween(0.1, 2.0, 2),
      'PM2.5': randBetween(0.1, 1.5, 2),
      'PM5.0': randBetween(0.1, 1.0, 2),
      'PM10':  randBetween(0.1, 0.5, 2)
    };
  }
  const res = await apiClient.get('/sensor/latest');
  return res.data;
};

export const fetchSensorHistory = async () => {
  if (USE_MOCK) {
    const now = Date.now();
    return Array.from({ length: 12 }).map((_, i) => {
      const timestamp = new Date(now - (11 - i) * 5 * 60 * 1000).toISOString();
      return {
        timestamp,
        TEMP:   randBetween(18, 26, 1),
        HUMID:  Math.round(randBetween(30, 70)),
        ATM:    randBetween(980, 1020, 1),
        VOCAQI: randBetween(20, 100, 1),
        bVOCeq: randBetween(0.1, 1.1, 2),
        GASest: randBetween(0.1, 1.1, 2),
        CO2eq:  Math.round(randBetween(400, 2000)),
        'PC0.1': Math.round(randBetween(1000, 20000)),
        'PC0.3': Math.round(randBetween(500, 15000)),
        'PC0.5': Math.round(randBetween(200, 10000)),
        'PC1.0': Math.round(randBetween(50, 5000)),
        'PC2.5': Math.round(randBetween(10, 2000)),
        'PC5.0': Math.round(randBetween(1, 500)),
        'PC10':  Math.round(randBetween(0, 100)),
        'PM0.1': randBetween(0.1, 5.0, 2),
        'PM0.3': randBetween(0.1, 4.0, 2),
        'PM0.5': randBetween(0.1, 3.0, 2),
        'PM1.0': randBetween(0.1, 2.0, 2),
        'PM2.5': randBetween(0.1, 1.5, 2),
        'PM5.0': randBetween(0.1, 1.0, 2),
        'PM10':  randBetween(0.1, 0.5, 2)
      };
    });
  }
  const res = await apiClient.get('/sensor/history');
  return res.data;
};

export function createWebSocket(onMessageCallback) {
  if (USE_MOCK) {
    fetchLatestSensor().then(onMessageCallback);
    const iv = setInterval(async () => {
      const data = await fetchLatestSensor();
      onMessageCallback(data);
    }, 5000);
    return { close: () => clearInterval(iv) };
  }
  const ws = new WebSocket(BASE_URL.replace(/^http/, 'ws') + '/ws');
  ws.onopen    = () => console.log('WebSocket verbunden');
  ws.onmessage = e => onMessageCallback(JSON.parse(e.data));
  ws.onerror   = err => console.error('WebSocket-Fehler', err);
  ws.onclose   = () => console.log('WebSocket geschlossen');
  return ws;
}

// … fetchEnvironments, fetchSessions, startSession, stopSession, fetchSessionData analog …
