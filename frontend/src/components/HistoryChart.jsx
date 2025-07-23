 import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLOR_POOL = ['#0ea5e9','#10b981','#f59e0b','#6366f1','#ef4444','#14b8a6','#8b5cf6','#f97316','#22c55e','#0d9488'];
const CORE = ['TEMP','HUMID','CO2eq','PM2.5','VOCAQI'];
const EXTRA = ['PM1.0','PM10','PC0.3','PC0.5','PC1.0','PC2.5','PC5.0','PC10'];

export default function HistoryChart({ data, metrics = CORE }) {
  const [selected, setSelected] = useState(metrics);

  const toggle = m =>
    setSelected(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const mapped = (data || []).map(d => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
  }));

  const activeLines = useMemo(
    () => selected.filter(m => mapped.some(row => row[m] != null)),
    [selected, mapped]
  );

  const allKeys = [...CORE, ...EXTRA];

  const selectAll = () => setSelected(allKeys);
  const selectNone = () => setSelected([]);
  const selectCore = () => setSelected(CORE);

  return (
    <div className="aq-card h-full flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-sm text-slate-700 m-0">Verlauf</h3>
        <div className="flex gap-1">
          <button
            onClick={selectCore}
            className="px-2 py-0.5 rounded text-[10px] font-semibold border border-cyan-500 text-cyan-600 bg-white hover:bg-cyan-50"
          >Core</button>
          <button
            onClick={selectAll}
            className="px-2 py-0.5 rounded text-[10px] font-semibold border border-cyan-500 text-cyan-600 bg-white hover:bg-cyan-50"
          >Alle</button>
            <button
            onClick={selectNone}
            className="px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-400 text-slate-600 bg-white hover:bg-slate-100"
          >Keine</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {allKeys.map(m => {
          const active = selected.includes(m);
          return (
            <button
              key={m}
              onClick={() => toggle(m)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium border transition
                ${active
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-white text-cyan-600 border-cyan-400 hover:bg-cyan-50'
                }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-[300px]">
        {mapped.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Keine Daten
          </div>
        ) : (
          <ResponsiveContainer>
            <LineChart data={mapped} margin={{ top:6, right:16, left:0, bottom:6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4}/>
              <XAxis dataKey="time" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip
                contentStyle={{ background:'#ffffff', border:'1px solid #e2e8f0', fontSize:'0.7rem' }}
                labelStyle={{ color:'#334155' }}
              />
              <Legend wrapperStyle={{ fontSize:'0.65rem' }} />
              {activeLines.map((m,i) => (
                <Line
                  key={m}
                  type="monotone"
                  dataKey={m}
                  stroke={COLOR_POOL[i % COLOR_POOL.length]}
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
} ;; // src/services/api.js
import axios from 'axios';
import axiosRetry from 'axios-retry';

/* ---------- ENV ---------- */
export const USE_MOCK  = import.meta.env?.VITE_USE_MOCK === 'true';
export const BASE_URL  = import.meta.env?.VITE_API_URL || 'http://localhost:8000';
const   WS_BASE_URL    = import.meta.env.VITE_WS_URL    || 'ws://localhost:8000';

/* ---------- Axios Client + Retry + Interceptor ---------- */
export const http = axios.create({
  baseURL: BASE_URL,
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

/* ---------- Session‑Info Endpoint ---------- */
export async function fetchCurrentSessionInfo() {
  if (USE_MOCK) {
    return { session_id: null, session_type: 'indoor' };
  }
  const { data } = await http.get('/current-session-info');
  return data;
}

/* ---------- Helpers ---------- */
const rand = (min, max, d = 0) =>
  parseFloat((min + Math.random() * (max - min)).toFixed(d));
function safeParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
const KEY_ALIAS = { PM2_5: 'PM2.5', PM1: 'PM1.0', PM10_0: 'PM10' };
function normalizeMeasurementKeys(obj = {}) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[KEY_ALIAS[k] || k] = v;
  return out;
}
function normalizeLivePayload(raw) {
  if (!raw) return raw;
  return { ...raw, measurements: normalizeMeasurementKeys(raw.measurements || {}) };
}

/* ---------- Mock Live Data ---------- */
let mockVentStatus = 'off';
let mockDiffStatus = 'off';
let mockVentAuto   = false;
let mockDiffAuto   = false;

const mockRating = () => {
  const keys = ['SEHR GUT','GUT','MAESSIG','SCHLECHT','SEHR SCHLECHT'];
  return keys[Math.floor(Math.random()*keys.length)];
};
const mockLive = () => {
  const now = new Date().toISOString();
  const measurements = {
    TEMP: rand(18,26,1),
    HUMID: rand(30,60,0),
    CO2eq: rand(500,1400,0),
    'PM2.5': rand(2,35,1),
    'PM1.0': rand(1,20,1),
    'PM10': rand(5,80,1),
    VOCAQI: rand(10,180,0),
    bVOCeq: rand(0.3,1.2,2),
    GASest: rand(0.3,1.2,2),
    'PC0.3': rand(1000,6000),
    'PC0.5': rand(800,3500),
    'PC1.0': rand(400,2000),
    'PC2.5': rand(100,900),
    'PC5.0': rand(20,300),
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
    session_type: 'indoor',
    // --- Geräteinfos für Live-UI ---
    ventilator_state: mockVentStatus,
    ventilator_auto:  mockVentAuto,
    diffusor_state:   mockDiffStatus,
    diffusor_auto:    mockDiffAuto
  };
};

/* ---------- Live Data (HTTP) ---------- */
export async function fetchLiveData() {
  if (USE_MOCK) return mockLive();
  const { data } = await http.get('/live-data');
  return normalizeLivePayload(data);
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
      name,
      location,
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
  if (USE_MOCK) return { message: 'Mock beendet' };
  const { data } = await http.put(`/sessions/${sessionId}/end`);
  return data;
}

/* ---------- Verlauf ---------- */
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
      TEMP:     p.TEMP,
      HUMID:    p.HUMID,
      CO2eq:    p.CO2eq,
      'PM2.5':  p['PM2.5'],
      'PM1.0':  p['PM1.0'],
      'PM10':   p['PM10'],
      'PC2.5':  p['PC2.5'],
      VOCAQI:   p.VOCAQI,
      bVOCeq:   p.bVOCeq,
      GASest:   p.GASest
    };
  });
}

/* ---------- Session‑Daten seit Timestamp ---------- */
export async function fetchSessionDataSince(sessionId, isoTimestamp) {
  if (USE_MOCK) return [];
  const { data } = await http.get(
    `/sessions/${sessionId}/data/since/${encodeURIComponent(isoTimestamp)}`
  );
  return data.map(row => {
    const p = row.parsed_data || {};
    return {
      timestamp: row.timestamp,
      TEMP:     p.TEMP,
      HUMID:    p.HUMID,
      CO2eq:    p.CO2eq,
      'PM2.5':  p['PM2.5'],
      'PM1.0':  p['PM1.0'],
      'PM10':   p['PM10'],
      'PC0.3':  p['PC0.3'],
      'PC0.5':  p['PC0.5'],
      'PC1.0':  p['PC1.0'],
      'PC2.5':  p['PC2.5'],
      'PC5.0':  p['PC5.0'],
      'PC10':   p['PC10'],
      VOCAQI:   p.VOCAQI,
      bVOCeq:   p.bVOCeq,
      GASest:   p.GASest
    };
  });
}

/* ---------- Devices ---------- */
export async function fetchDeviceStatus() {
  if (USE_MOCK) {
    return {
      ventilator: { name: 'Ventilator', status: mockVentStatus, auto: mockVentAuto, ip: 'mock' },
      diffusor:   { name: 'Diffusor',   status: mockDiffStatus,  auto: mockDiffAuto,  ip: 'mock' }
    };
  }
  const { data } = await http.get('/devices/status');
  return data;
}

export async function controlVentilator(action) {
  if (USE_MOCK) {
    if (action === 'auto') {
      mockVentAuto = true;
    } else {
      mockVentAuto = false;
      mockVentStatus = action; // 'on' | 'off'
    }
    return { status: mockVentStatus, auto: mockVentAuto };
  }
  const { data } = await http.put('/devices/ventilator/control', { action });
  return data;
}

export async function controlDiffusor(action) {
  if (USE_MOCK) {
    if (action === 'auto') {
      mockDiffAuto = true;
    } else {
      mockDiffAuto = false;
      mockDiffStatus = action;
    }
    return { status: mockDiffStatus, auto: mockDiffAuto };
  }
  const { data } = await http.put('/devices/diffusor/control', { action });
  return data;
}

/* ---------- WebSocket Live ---------- */
let ws;
export function connectLive(onData, onStateChange) {
  console.log('[connectLive] called, USE_MOCK=', USE_MOCK);
  if (USE_MOCK) {
    const id = setInterval(() => {
      const mock = mockLive();
      onData(mock);
    }, 3000);
    onStateChange?.('MOCK');
    return () => clearInterval(id);
  }

  const url = `${WS_BASE_URL}/ws/live-data`;
  function _connect(attempt = 1) {
    ws = new WebSocket(url);
    ws.onopen = () => {
      onStateChange?.('OPEN');
    };
    ws.onmessage = e => {
      const json = safeParseJSON(e.data);
      if (json) onData(normalizeLivePayload(json));
    };
    ws.onerror = err => {
      console.error('[WS] onerror', err);
      onStateChange?.('ERROR');
    };
    ws.onclose = ev => {
      const next = attempt + 1;
      onStateChange?.(ev.code === 1000 ? 'CLOSED' : `RETRY_${next}`);
      if (ev.code !== 1000 && next <= 6) {
        setTimeout(() => _connect(next), 5000);
      }
    };
  }
  _connect();
  return () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close(1000, 'Client close');
    }
  };
}
 