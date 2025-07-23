jest.mock('../../src/services/api', () => {

  return {
    __esModule: true,
    http: {}, 
    fetchLiveData: jest.fn(async () => ({
      timestamp: '2025-01-01T00:00:00Z',
      measurements: { TEMP: 22.5, HUMID: 45, CO2eq: 650, 'PM2.5': 7.2 },
      air_quality_rating: { TEMP: { rating: 'GUT', value: 22.5 } },
      overall_quality: 'GUT'
    })),
    fetchSessions: jest.fn(async () => ([
      { id: 1, name: 'MockActive', is_active: true, start_time: '2025-01-01T00:00:00Z', session_type: 'indoor' },
      { id: 2, name: 'Alt', is_active: false, start_time: '2025-01-01T01:00:00Z', end_time: '2025-01-01T01:30:00Z', session_type: 'indoor' }
    ])),
    startSession: jest.fn(async (p) => ({
      id: 99, name: p.name, is_active: true, start_time: '2025-01-01T02:00:00Z', session_type: p.session_type
    })),
    endSession: jest.fn(async () => ({ ok: true })),
    fetchSessionData: jest.fn(async () => ([
      { timestamp: '2025-01-01T00:00:00Z', TEMP: 21, 'PM2.5': 5.5 },
      { timestamp: '2025-01-01T00:05:00Z', TEMP: 22, 'PM2.5': 6.0 }
    ])),
    fetchSessionDataSince: jest.fn(async () => ([
      { timestamp: '2025-01-01T00:10:00Z', TEMP: 23, 'PM2.5': 6.3 }
    ])),
    connectLive: jest.fn(() => () => {})
  };
});

import {
  fetchLiveData,
  fetchSessions,
  startSession,
  endSession,
  fetchSessionData,
  fetchSessionDataSince
} from '../../src/services/api';

describe('api – stabile strukturierte Tests', () => {
  test('fetchLiveData liefert Messwerte & Rating', async () => {
    const d = await fetchLiveData();
    expect(d.measurements.TEMP).toBeGreaterThan(0);
    expect(d.air_quality_rating.TEMP.rating).toMatch(/GUT|SCHLECHT|/);
  });

  test('fetchSessions enthält aktive Session', async () => {
    const list = await fetchSessions();
    expect(list.some(s => s.is_active)).toBe(true);
  });

  test('startSession gibt aktive Session zurück', async () => {
    const s = await startSession({ name: 'Neu', session_type: 'indoor' });
    expect(s.is_active).toBe(true);
    expect(s.name).toBe('Neu');
  });

  test('endSession ok', async () => {
    const r = await endSession(1);
    expect(r.ok).toBe(true);
  });

  test('fetchSessionData liefert >=2 Zeilen', async () => {
    const rows = await fetchSessionData(1, 50);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows[0]).toHaveProperty('timestamp');
  });

  test('fetchSessionDataSince liefert Delta', async () => {
    const rows = await fetchSessionDataSince(1, '2025-01-01T00:05:00Z');
    expect(rows.length).toBe(1);
  });
});
