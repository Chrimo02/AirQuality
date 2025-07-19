// src/services/api.js
import axios from 'axios';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 8000
});

/**
 * Hilfsfunktion: Backend-Live-Payload => flaches Objekt wie deine alte Struktur.
 * Backend liefert:
 * {
 *   timestamp,
 *   measurements: { TEMP, HUMID, ... },
 *   air_quality_rating: { ... },
 *   overall_quality,
 *   ...
 * }
 */
function mapLivePayload(payload) {
  if (!payload || typeof payload !== 'object') return {};
  const {
    timestamp,
    measurements = {},
    overall_quality,
    overall_color,
    air_quality_rating,
    session_type
  } = payload;

  return {
    ...measurements,          // TEMP, HUMID, CO2eq usw.
    timestamp,
    overall_quality,
    overall_color,
    session_type,
    air_quality_rating
  };
}

// ---------- MOCK HILFSFUNKTION ----------
const randBetween = (min, max, decimals = 0) =>
  parseFloat((min + Math.random() * (max - min)).toFixed(decimals));

// ---------- LIVE / LATEST ----------
export async function fetchLatestSensor() {
  if (USE_MOCK) {
    const now = new Date().toISOString();
    return {
      TEMP: randBetween(18, 26, 1),
      HUMID: Math.round(randBetween(30, 70)),
      ATM: randBetween(980, 1020, 1),
      VOCAQI: randBetween(20, 100, 1),
      bVOCeq: randBetween(0.1, 1.1, 2),
      GASest: randBetween(0.1, 1.1, 2),
      CO2eq: Math.round(randBetween(400, 2000)),
      timestamp: now
    };
  }
  const res = await apiClient.get('/live-data');
  return mapLivePayload(res.data);
}

/**
 * History:
 * Dein Backend hat (noch) keine /sensor/history Route.
 * Wir liefern leer zurück. Die laufende History pflegst du weiterhin im Dashboard
 * durch Append der Live-Frames (wie bisher).
 */
export async function fetchSensorHistory() {
  if (USE_MOCK) {
    const now = Date.now();
    return Array.from({ length: 12 }).map((_, i) => ({
      timestamp: new Date(now - (11 - i) * 5 * 60 * 1000).toISOString(),
      TEMP: randBetween(18, 26, 1),
      HUMID: Math.round(randBetween(30, 70)),
      CO2eq: Math.round(randBetween(400, 2000))
    }));
  }
  return []; // placeholder – echte History erzeugst du client-seitig
}

// ---------- WEBSOCKET ----------
export function createWebSocket(onMessageCallback) {
  if (USE_MOCK) {
    // Simulierter Stream
    fetchLatestSensor().then(onMessageCallback);
    const iv = setInterval(async () => {
      onMessageCallback(await fetchLatestSensor());
    }, 5000);
    return { close: () => clearInterval(iv) };
  }

  const wsUrl = BASE_URL.replace(/^http/, 'ws') + '/ws/live-data';
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => console.log('[WS] Verbunden:', wsUrl);
  socket.onmessage = evt => {
    try {
      const raw = JSON.parse(evt.data);
      onMessageCallback(mapLivePayload(raw));
    } catch (e) {
      console.error('[WS] Parse-Fehler', e);
    }
  };
  socket.onerror = err => console.error('[WS] Fehler', err);
  socket.onclose = ev =>
    console.log('[WS] Geschlossen', ev.code, ev.reason || '');

  return socket;
}

// ---------- ENVIRONMENTS (Dummy) ----------
/**
 * Dein Frontend erwartet Environments, Backend hat dieses Konzept nicht.
 * Wir liefern einfach einen statischen Default.
 */
export async function fetchEnvironments() {
  if (USE_MOCK) {
    return [
      { id: 'default', name: 'Standard-Raum' }
    ];
  }
  return [{ id: 'default', name: 'Standard-Raum' }];
}

export async function createEnvironment(name) {
  // Nur lokal „anlegen“
  return { id: `env-${Date.now()}`, name: name || 'Neuer Raum' };
}

// ---------- SESSIONS ----------
export async function fetchSessions(/* envId ignoriert */) {
  if (USE_MOCK) {
    const now = Date.now();
    return [
      {
        id: 1,
        name: 'Mock Session',
        start_time: new Date(now - 3_600_000).toISOString(),
        end_time: null,
        is_active: true
      }
    ];
  }
  const res = await apiClient.get('/sessions');
  return res.data;
}

export async function startSession(/* envId */) {
  if (USE_MOCK) {
    return {
      id: Date.now(),
      name: 'Mock Session',
      start_time: new Date().toISOString(),
      end_time: null,
      is_active: true
    };
  }
  // Dein Backend erwartet name + session_type mindestens.
  const payload = {
    name: 'Neue Session',
    session_type: 'indoor'
  };
  const res = await apiClient.post('/sessions', payload);
  return res.data;
}

export async function stopSession(sessionId) {
  if (USE_MOCK) {
    return { message: 'Session beendet (mock)' };
  }
  const res = await apiClient.put(`/sessions/${sessionId}/end`);
  return res.data;
}

// ---------- SESSION DATA ----------
/**
 * Holt Messpunkte einer Session und mappt numerische Felder aus parsed_data
 * in die flache Ebene (TEMP, HUMID, CO2eq, PM2.5, ... falls vorhanden).
 */
export async function fetchSessionData(sessionId, /* agg ignoriert */) {
  if (USE_MOCK) {
    return Array.from({ length: 20 }).map((_, i) => {
      const t = Date.now() - (19 - i) * 60_000;
      return {
        timestamp: new Date(t).toISOString(),
        TEMP: randBetween(20, 24, 1),
        HUMID: Math.round(randBetween(40, 55)),
        CO2eq: Math.round(randBetween(450, 1200))
      };
    });
  }
  const res = await apiClient.get(`/sessions/${sessionId}/data?limit=500`);
  const rows = res.data || [];
  return rows
    .map(row => {
      const base = { timestamp: row.timestamp };
      const parsed = row.parsed_data || {};
      // Füge alle numerischen Felder (float/int) hinzu
      Object.entries(parsed).forEach(([k, v]) => {
        if (typeof v === 'number' && !Number.isNaN(v)) {
          base[k] = v;
        }
      });
      return base;
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// ---------- DEVICES (Stub / Optional) ----------
/**
 * Wenn du später echte Device-Endpunkte anbinden willst:
 *  - GET /devices/status
 *  - PUT /devices/ventilator/control {action:"on"|...}
 *  - PUT /devices/diffusor/control {action:"on"|...}
 * Momentan bleiben deine vorhandenen mocks in services/devices.js.
 */

