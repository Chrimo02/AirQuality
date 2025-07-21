// src/services/api.js
import axios from 'axios';
import axiosRetry from 'axios-retry';

/* ---------- ENV ---------- */
// wir ignorieren hier VITE_API_URL, damit wir immer relativ zum aktuellen Host/Port anfragen
export const USE_MOCK = import.meta.env?.VITE_USE_MOCK === 'true';

/* ---------- Axios Client + Retry + Interceptor ---------- */
export const http = axios.create({
  baseURL: '',   // relative Requests! -> gleicher Host & Port wie App
  timeout: 8000
});
axiosRetry(http, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: err =>
    axiosRetry.isNetworkError(err) || err.code === 'ECONNABORTED'
});
http.interceptors.response.use(
  res => res,
  err => {
    console.warn('[HTTP INTERCEPTOR] Fehler:', err.config?.url, err.message);
    return Promise.reject(err);
  }
);

/* ---------- Live Data (HTTP) ---------- */
const rand = (min, max, d = 0) =>
  parseFloat((min + Math.random() * (max - min)).toFixed(d));
const mockRating = () => {
  const keys = ['SEHR GUT','GUT','MAESSIG','SCHLECHT','SEHR SCHLECHT'];
  return keys[Math.floor(Math.random()*keys.length)];
};
const mockLive = () => {
  const now = new Date().toISOString();
  const measurements = {
    TEMP: rand(18,26,1), HUMID: rand(30,60,0),
    CO2eq: rand(500,1400,0), 'PM2.5': rand(2,35,1),
    'PM1.0': rand(1,20,1), 'PM10': rand(5,80,1),
    VOCAQI: rand(10,180,0), bVOCeq: rand(0.3,1.2,2),
    GASest: rand(0.3,1.2,2), 'PC0.3': rand(1000,6000),
    'PC0.5': rand(800,3500), 'PC1.0': rand(400,2000),
    'PC2.5': rand(100,900), 'PC5.0': rand(20,300),
    'PC10': rand(10,150)
  };
  const wrap = v => ({ value: v, rating: mockRating() });
  return {
    timestamp: now,
    measurements,
    air_quality_rating: {
      TEMP: wrap(measurements.TEMP),
      HUMID: wrap(measurements.HUMID),
      CO2eq: wrap(measurements.CO2eq),
      'PM2.5': wrap(measurements['PM2.5']),
      VOCAQI: wrap(measurements.VOCAQI),
      bVOCeq: wrap(measurements.bVOCeq),
      GASest: wrap(measurements.GASest)
    },
    overall_quality: mockRating(),
    session_type: 'indoor'
  };
};

export async function fetchLiveData() {
  if (USE_MOCK) return mockLive();
  const { data } = await http.get('/live-data');
  return data;
}

/* ---------- Sessions ---------- */
export async function fetchSessions() {
  if (USE_MOCK) {
    return [{
      id: 1,
      name: 'Mock',
      location: '',
      start_time: new Date().toISOString(),
      end_time: null,
      is_active: true,
      session_type: 'indoor'
    }];
  }
  const { data } = await http.get('/sessions');
  return data;
}

export async function startSession({ name, location, session_type }) {
  if (USE_MOCK) {
    return {
      id: Date.now(),
      name, location, start_time:new Date().toISOString(),
      end_time:null, is_active:true, session_type
    };
  }
  const { data } = await http.post('/sessions', { name, location, session_type });
  return data;
}

export async function endSession(sessionId) {
  if (USE_MOCK) return { message: 'Mock beendet' };
  const { data } = await http.put(`/sessions/${sessionId}/end`);
  return data;
}

export async function fetchSessionData(sessionId, limit = 500) {
  if (USE_MOCK) {
    const base = Date.now();
    return Array.from({ length: 60 }).map((_, i) => {
      const ts = new Date(base - (59 - i) * 60000).toISOString();
      return {
        timestamp: ts,
        TEMP: rand(18,26,1),
        HUMID: rand(30,60,0),
        CO2eq: rand(500,1400,0),
        'PM2.5': rand(2,35,1),
        'PM1.0': rand(1,20,1),
        'PM10': rand(5,80,1),
        'PC2.5': rand(80,900),
        VOCAQI: rand(10,180,0)
      };
    });
  }
  const { data } = await http.get(`/sessions/${sessionId}/data?limit=${limit}`);
  return data.map(row => {
    const p = row.parsed_data || {};
    return {
      timestamp: row.timestamp,
      TEMP: p.TEMP,
      HUMID: p.HUMID,
      CO2eq: p.CO2eq,
      'PM2.5': p['PM2.5'],
      'PM1.0': p['PM1.0'],
      'PM10': p['PM10'],
      'PC2.5': p['PC2.5'],
      VOCAQI: p.VOCAQI,
      bVOCeq: p.bVOCeq,
      GASest: p.GASest
    };
  });
}

/* ---------- Devices ---------- */
let mockVentStatus = 'off';
let mockDiffStatus = 'off';

export async function fetchDeviceStatus() {
  if (USE_MOCK) {
    return {
      ventilator: { name: 'Ventilator', status: mockVentStatus, ip: 'mock' },
      diffusor:   { name: 'Diffusor',   status: mockDiffStatus,   ip: 'mock' }
    };
  }
  const { data } = await http.get('/devices/status');
  return data;
}

export async function controlVentilator(action) {
  if (USE_MOCK) { mockVentStatus = action; return { status: mockVentStatus }; }
  const { data } = await http.put('/devices/ventilator/control', { action });
  return data;
}

export async function controlDiffusor(action) {
  if (USE_MOCK) { mockDiffStatus = action; return { status: mockDiffStatus }; }
  const { data } = await http.put('/devices/diffusor/control', { action });
  return data;
}

/* ---------- WebSocket Live ---------- */
let ws;
export function connectLive(onData, onStateChange, opts = {}) {
  if (USE_MOCK) {
    const id = setInterval(() => onData(mockLive()), 3000);
    onStateChange?.('MOCK');
    return () => clearInterval(id);
  }

  // statt BASE_URL hier: immer an gleichen Host/Port wie App
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url      = `${protocol}//${window.location.host}/ws/live-data`;

  let retries = 0, heartbeatTimer;

  function scheduleHeartbeat() {
    clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ type:'PING', ts:Date.now() })); } catch {}
      }
    }, opts.heartbeatInterval || 25000);
  }

  function connect() {
    ws = new WebSocket(url);
    ws.onopen    = () => { onStateChange?.('OPEN'); retries = 0; scheduleHeartbeat(); };
    ws.onmessage = e => {
      try { onData(JSON.parse(e.data)); }
      catch {}
    };
    ws.onerror   = () => onStateChange?.('ERROR');
    ws.onclose   = ev => {
      clearInterval(heartbeatTimer);
      if (ev.code === 1000) return onStateChange?.('CLOSED');
      if (retries < (opts.maxRetries||6)) {
        retries++;
        onStateChange?.(`RETRY_${retries}`);
        setTimeout(connect, (opts.baseDelay||500) * Math.pow(opts.backoffFactor||1.8, retries));
      } else {
        onStateChange?.('FAILED');
      }
    };
  }

  connect();
  return () => {
    clearInterval(heartbeatTimer);
    ws?.close(1000, 'Client close');
  };
}
