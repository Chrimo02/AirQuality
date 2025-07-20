// src/services/api.js
import axios from 'axios';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 8000
});

/* Hilfsfunktionen */
const rand = (min, max, d = 0) =>
  parseFloat((min + Math.random() * (max - min)).toFixed(d));

const mockRating = () => {
  const keys = ["SEHR GUT","GUT","MAESSIG","SCHLECHT","SEHR SCHLECHT"];
  return keys[Math.floor(Math.random() * keys.length)];
};

/* Mock-Erzeugung – inklusive Partikel-Anzahl */
const mockLive = () => {
  const now = new Date().toISOString();
  const measurements = {
    TEMP: rand(18,26,1),
    HUMID: rand(30,60,0),
    CO2eq: rand(500,1400,0),
    "PM2.5": rand(2,35,1),
    "PM1.0": rand(1,20,1),
    "PM10": rand(5,80,1),
    VOCAQI: rand(10,180,0),
    bVOCeq: rand(0.3,1.2,2),
    GASest: rand(0.3,1.2,2),

    // Partikel-Anzahl (PC – fiktive Werte)
    "PC0.3": rand(1000,6000),
    "PC0.5": rand(800,3500),
    "PC1.0": rand(400,2000),
    "PC2.5": rand(100,900),
    "PC5.0": rand(20,300),
    "PC10": rand(10,150)
  };

  const ratingWrap = (k,val) => ({ value: val, rating: mockRating() });

  return {
    timestamp: now,
    measurements,
    air_quality_rating: {
      TEMP: ratingWrap("TEMP", measurements.TEMP),
      HUMID: ratingWrap("HUMID", measurements.HUMID),
      CO2eq: ratingWrap("CO2eq", measurements.CO2eq),
      "PM2.5": ratingWrap("PM2.5", measurements["PM2.5"]),
      VOCAQI: ratingWrap("VOCAQI", measurements.VOCAQI),
      bVOCeq: ratingWrap("bVOCeq", measurements.bVOCeq),
      GASest: ratingWrap("GASest", measurements.GASest)
    },
    overall_quality: mockRating(),
    session_type: "indoor"
  };
};

/* ---- API Funktionen ---- */
export async function fetchLiveData() {
  if (USE_MOCK) return mockLive();
  const { data } = await http.get('/live-data');
  return data;
}

export async function fetchSessions() {
  if (USE_MOCK) {
    return [
      {
        id: 1,
        name: "Mock Indoor",
        location: "Wohnzimmer",
        start_time: new Date(Date.now() - 1000*60*25).toISOString(),
        end_time: null,
        is_active: true,
        session_type: "indoor"
      }
    ];
  }
  const { data } = await http.get('/sessions');
  return data;
}

export async function startSession({ name, location, session_type }) {
  if (USE_MOCK) {
    return {
      id: Date.now(),
      name,
      location: location || null,
      start_time: new Date().toISOString(),
      end_time: null,
      is_active: true,
      session_type
    };
  }
  const { data } = await http.post('/sessions', { name, location, session_type });
  return data;
}

export async function endSession(sessionId) {
  if (USE_MOCK) return { message: "Mock beendet" };
  const { data } = await http.put(`/sessions/${sessionId}/end`);
  return data;
}

export async function fetchSessionData(sessionId, limit = 500) {
  if (USE_MOCK) {
    const base = Date.now();
    return Array.from({ length: 120 }).map((_, i) => {
      const ts = new Date(base - (119 - i) * 60000).toISOString();
      return {
        timestamp: ts,
        TEMP: rand(18,26,1),
        HUMID: rand(30,60,0),
        CO2eq: rand(500,1400,0),
        "PM2.5": rand(2,35,1),
        "PM1.0": rand(1,20,1),
        "PM10": rand(5,80,1),
        "PC2.5": rand(80,900),
        VOCAQI: rand(10,180,0)
      };
    });
  }
  const { data } = await http.get(`/sessions/${sessionId}/data?limit=${limit}`);
  // Mapping aus API → flache Struktur
  return data.map(row => {
    const p = row.parsed_data || {};
    return {
      timestamp: row.timestamp,
      TEMP: p.TEMP,
      HUMID: p.HUMID,
      CO2eq: p.CO2eq,
      "PM2.5": p["PM2.5"],
      "PM1.0": p["PM1.0"],
      "PM10": p["PM10"],
      "PC2.5": p["PC2.5"],
      VOCAQI: p.VOCAQI
    };
  });
}

/* Geräte */
export async function fetchDeviceStatus() {
  if (USE_MOCK) {
    return {
      ventilator: { name: "Ventilator", status: Math.random() > 0.5 ? "on" : "off", ip: "mock" },
      diffusor: { name: "Diffusor", status: Math.random() > 0.5 ? "on" : "off", ip: "mock" }
    };
  }
  const { data } = await http.get('/devices/status');
  return data;
}

export async function controlVentilator(action) {
  if (USE_MOCK) return { message: "Mock", status: action };
  const { data } = await http.put('/devices/ventilator/control', { action });
  return data;
}

export async function controlDiffusor(action) {
  if (USE_MOCK) return { message: "Mock", status: action };
  const { data } = await http.put('/devices/diffusor/control', { action });
  return data;
}

/* WebSocket */
let ws;
export function connectLive(onData, onStateChange) {
  if (USE_MOCK) {
    const id = setInterval(() => onData(mockLive()), 3000);
    onStateChange && onStateChange('MOCK');
    return () => clearInterval(id);
  }
  const url = BASE_URL.replace(/^http/, 'ws') + '/ws/live-data';
  ws = new WebSocket(url);
  ws.onopen = () => onStateChange?.('OPEN');
  ws.onclose = () => onStateChange?.('CLOSED');
  ws.onerror = () => onStateChange?.('ERROR');
  ws.onmessage = e => {
    try {
      const data = JSON.parse(e.data);
      onData(data);
    } catch (err) {
      console.error('WS parse error', err);
    }
  };
  return () => ws && ws.close(1000, 'Client close');
}
