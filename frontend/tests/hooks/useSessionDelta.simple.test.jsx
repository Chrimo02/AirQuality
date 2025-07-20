import { renderHook, act } from '@testing-library/react';

jest.mock('../../src/services/api', () => ({
  fetchSessionData: jest.fn(async () => ([
    { timestamp: '2025-01-01T00:00:00Z', TEMP: 21 },
    { timestamp: '2025-01-01T00:01:00Z', TEMP: 22 }
  ])),
  fetchSessionDataSince: jest.fn(async () => ([
    { timestamp: '2025-01-01T00:02:00Z', TEMP: 23 }
  ]))
}));

import { useSessionDelta } from '../../src/hooks/useSessionDelta';

describe('useSessionDelta – simpel', () => {
  test('initial + delta', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useSessionDelta(1, true, 500));
    await act(async () => {}); // initial
    expect(result.current.rows.length).toBe(2);
    await act(async () => { jest.advanceTimersByTime(600); });
    expect(result.current.rows.length).toBe(3);
    jest.useRealTimers();
  });
});
